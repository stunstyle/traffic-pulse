import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cameraId = searchParams.get('camera_id');

  if (!cameraId) {
    return NextResponse.json({ error: "camera_id is required" }, { status: 400 });
  }

  try {
    // Fetch last 24 hours of data for this camera
    const result = await sql`
      SELECT count_15min, captured_at 
      FROM traffic_snapshots 
      WHERE camera_id = ${cameraId} 
      AND captured_at > NOW() - INTERVAL '24 hours'
      ORDER BY captured_at ASC;
    `;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("History Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
