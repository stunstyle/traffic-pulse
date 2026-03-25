"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    import('@/components/MapComponent').then((mod) => {
      // Extract the original component if it was double-wrapped by dynamic
      const ComponentToRender = mod.default;
      setMapComponent(() => ComponentToRender);
    }).catch(console.error);
  }, []);

  if (!MapComponent) {
    return (
      <main className="w-full h-screen overflow-hidden bg-[#06090f] flex items-center justify-center text-[#00ff96] font-mono text-sm opacity-50 tracking-widest">
        ESTABLISHING SATELLITE UPLINK...
      </main>
    );
  }

  return (
    <main className="w-full h-screen overflow-hidden">
      <MapComponent />
    </main>
  );
}