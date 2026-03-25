import fs from 'fs';
import path from 'path';

// This script uses Nominatim (OpenStreetMap) to reverse geocode camera coordinates 
// and add a 'region' field to each camera in public/cameras_with_paths.json.

const FILE_PATH = path.join(process.cwd(), 'public/cameras_with_paths.json');
const OUTPUT_PATH = path.join(process.cwd(), 'public/cameras_with_paths.json');

async function updateRegions() {
  const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  console.log(`Processing ${data.length} cameras...`);

  for (let i = 0; i < data.length; i++) {
    const cam = data[i];
    if (cam.region) continue; // Skip if already has region

    try {
      // Respect Nominatim's usage policy (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${cam.lat}&lon=${cam.lon}&zoom=8&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TrafficPulse/1.0 (Portfolio Project)' }
      });
      const geo = await res.json();

      // In Bulgaria, 'state' or 'county' or 'province' often corresponds to 'Oblast' (Region)
      const region = geo.address?.state || geo.address?.county || geo.address?.province || 'Unknown';
      
      // Clean up common Bulgarian suffixes if any (though usually it's just 'Sofia-Grad', etc.)
      cam.region = region.replace(' област', '').replace(' Oblast', '');
      
      console.log(`[${i+1}/${data.length}] ${cam.nameENG} -> ${cam.region}`);
    } catch (err) {
      console.error(`Failed to geocode ${cam.nameENG}:`, err);
    }

    // Save progressively every 10 cameras to avoid data loss
    if (i % 10 === 0) {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log("Finished updating regions!");
}

updateRegions();
