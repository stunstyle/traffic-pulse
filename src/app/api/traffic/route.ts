import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://bgtoll.bg/index.php/traffic_passes/data', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'bg-BG,bg;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://bgtoll.bg/', 
        'Connection': 'keep-alive'
      },
      next: { revalidate: 60 } 
    });

    if (!response.ok) {
      throw new Error(`BG Toll API responded with ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error: unknown) {
    // TYPE GUARD: Tell TypeScript how to handle the 'unknown' error
    let errorMessage = "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Fetch Error:", errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}