import { NextResponse } from 'next/server';
import { sql, initSchema } from '@/lib/db';

export async function GET(request: Request) {
  // Simple auth check for Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Ensure table exists
    await initSchema();

    // 2. Fetch fresh data from our proxy
    const PROXY_URL = process.env.TRAFFIC_PROXY_URL || 'https://bg-traffic-proxy.stunstyle.workers.dev/';
    console.log(`[Snapshot] Fetching from proxy: ${PROXY_URL}`);
    
    const response = await fetch(PROXY_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[Snapshot] Proxy returned error ${response.status}`);
      throw new Error(`Scraper failed: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid data format from scraper");

    // 3. Insert snapshots
    // We use captured_at from the data to avoid duplicates
    let inserted = 0;
    
    for (const row of data) {
      if (!row.scp || !row.count15min || !row.time) continue;
      
      const scp = String(row.scp).trim();
      const count15 = parseInt(row.count15min);
      const count1hr = parseInt(row.count1Hour || 0);
      const time = new Date(row.time);

      try {
        await sql`
          INSERT INTO traffic_snapshots (camera_id, count_15min, count_1hour, captured_at)
          VALUES (${scp}, ${count15}, ${count1hr}, ${time.toISOString()})
          ON CONFLICT (camera_id, captured_at) DO NOTHING;
        `;
        inserted++;
      } catch (err) {
        // Log individual errors but continue
        console.error(`Failed to insert ${scp}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: data.length, 
      inserted,
      timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error("Snapshot Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
