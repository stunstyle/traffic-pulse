addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

addEventListener("scheduled", (event) => {
  event.waitUntil(handleScheduled(event));
});

async function handleScheduled() {
  // Use the public URL of your Vercel deployment
  const VERCEL_URL = "https://traffic-pulse-peach.vercel.app/api/traffic/snapshot";
  
  // NOTE: You should add CRON_SECRET to your Cloudflare Worker environment variables
  // via the Cloudflare Dashboard (Settings > Variables).
  // If you don't use variables, you can hardcode it here (not recommended for public repos).
  const response = await fetch(VERCEL_URL, {
    headers: {
      "Authorization": `Bearer kur123` // Defaulting to the one you used locally
    }
  });
  
  console.log(`Cron Triggered: ${response.status}`);
}

async function handleRequest(request) {
  const targetUrl = "https://bgtoll.bg/index.php/traffic_passes/data";

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "bg-BG,bg;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://bgtoll.bg/",
        "Connection": "keep-alive"
      }
    });

    const results = await response.text();
    return new Response(results, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  }
}