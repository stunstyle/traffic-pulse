"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { FlyToInterpolator } from '@deck.gl/core'; 
import { Map as MapLibre } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// ==========================================
// CONSTANTS & DICTIONARIES
// ==========================================

const BASEMAP_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = { 
  longitude: 25.4858, 
  latitude: 42.7339, 
  zoom: 6.5, 
  pitch: 35, 
  bearing: 0 
};

const SCP_ROAD_OVERRIDES: Record<string, string> = {
  '2082': '88', '4099': '99', '4074': '8', '2070': '1',
  '4033': '2', '1020': '18', '1047': '15', '2056': '1'
};

const ROAD_DIRECTIONS: Record<string, { d1: string, d2: string }> = {
  'A1': { d1: 'Burgas', d2: 'Sofia' }, 'A2': { d1: 'Varna', d2: 'Sofia' },
  'A3': { d1: 'Kulata (GR)', d2: 'Sofia' }, 'A4': { d1: 'Kap. Andreevo (TR)', d2: 'A1 (Chirpan)' },
  'A5': { d1: 'Burgas', d2: 'Varna' }, 'A6': { d1: 'Kalotina (SRB)', d2: 'Sofia' },
  '1': { d1: 'Kulata (GR)', d2: 'Vidin (RO)' }, '2': { d1: 'Varna', d2: 'Ruse (RO)' }, 
  '3': { d1: 'Botevgrad', d2: 'Byala' }, '4': { d1: 'Shumen', d2: 'Koritna' }, 
  '5': { d1: 'Makaza (GR)', d2: 'Ruse (RO)' }, '6': { d1: 'Burgas', d2: 'Gyueshevo (MKD)' }, 
  '7': { d1: 'Lesovo (TR)', d2: 'Silistra (RO)' }, '8': { d1: 'Kap. Andreevo (TR)', d2: 'Kalotina (SRB)' },
  '9': { d1: 'Malko Tarnovo (TR)', d2: 'Durankulak (RO)' }, '11': { d1: 'Nikopol', d2: 'Vidin' },
  '12': { d1: 'Bregovo (SRB)', d2: 'Vidin' }, '13': { d1: 'Dolni Dabnik', d2: 'Montana' },
  '14': { d1: 'Vrashka Chuka (SRB)', d2: 'Vidin' }, '15': { d1: 'Oryahovo', d2: 'Vratsa' }, 
  '16': { d1: 'Sofia', d2: 'Mezdra' }, '17': { d1: 'A2 (Hemus)', d2: 'Botevgrad' },
  '18': { d1: 'Ring Road (CW)', d2: 'Ring Road (CCW)' }, '19': { d1: 'Ilinden (GR)', d2: 'Simitli' },
  '21': { d1: 'Silistra', d2: 'Ruse' }, '23': { d1: 'Dulovo', d2: 'Ruse' },
  '27': { d1: 'Balchik', d2: 'Novi Pazar' }, '29': { d1: 'Gen. Toshevo (RO)', d2: 'Varna' },
  '34': { d1: 'Nikopol', d2: 'Pleven' }, '35': { d1: 'Karnare', d2: 'Pleven' },
  '37': { d1: 'Barutin', d2: 'Yablanitsa' }, '49': { d1: 'Tutrakan', d2: 'Targovishte' },
  '51': { d1: 'Shumen', d2: 'Byala' }, '52': { d1: 'Nikopol', d2: 'Byala' },
  '53': { d1: 'Sredets', d2: 'Polikraishte' }, '55': { d1: 'Svilengrad', d2: 'Debelets' },
  '56': { d1: 'Asenovgrad', d2: 'Shipka' }, '57': { d1: 'Novoselets', d2: 'Stara Zagora' },
  '59': { d1: 'Ivaylovgrad (GR)', d2: 'Momchilgrad' }, '62': { d1: 'Samokov', d2: 'Kyustendil' },
  '63': { d1: 'Strezimirovtsi (SRB)', d2: 'Pernik' }, '64': { d1: 'Plovdiv', d2: 'Karlovo' },
  '66': { d1: 'Popovitsa', d2: 'Sliven' }, '71': { d1: 'Obrochishte', d2: 'Silistra' },
  '73': { d1: 'Karnobat', d2: 'Shumen' }, '74': { d1: 'Dralfa', d2: 'Preslav' },
  '79': { d1: 'Burgas', d2: 'Elhovo' }, '81': { d1: 'Lom', d2: 'Sofia' },
  '82': { d1: 'Sofia', d2: 'Kostenets' }, '84': { d1: 'Razlog', d2: 'Pazardzhik' },
  '86': { d1: 'Rudozem (GR)', d2: 'Plovdiv' }, '88': { d1: 'Kap. Petko Voyvoda (GR)', d2: 'Svilengrad' },
  '99': { d1: 'Malko Tarnovo (TR)', d2: 'Burgas' }, '101': { d1: 'Kozloduy', d2: 'Vratsa' },
  '102': { d1: 'Montana', d2: 'Dimovo' }, '106': { d1: 'Stanke Lisichkovo (MKD)', d2: 'Blagoevgrad' },
  '107': { d1: 'Rila Monastery', d2: 'Kocherinovo' }, '118': { d1: 'Pleven', d2: 'Gulyantsi' },
  '121': { d1: 'Kula', d2: 'Inovo' }, '197': { d1: 'Devin', d2: 'Gotse Delchev' },
  '198': { d1: 'Petrich (MKD)', d2: 'Gotse Delchev' }, '204': { d1: 'Omurtag', d2: 'Razgrad' },
  '205': { d1: 'Tutrakan', d2: 'Razgrad' }, '208': { d1: 'Aytos', d2: 'Provadiya' },
  '301': { d1: 'Lovech', d2: 'Kozar Belene' }, '303': { d1: 'Dryanovo', d2: 'Bulgarene' },
  '305': { d1: 'Glozhene', d2: 'Pleven' }, '306': { d1: 'Oryahovo', d2: 'Lukovit' },
  '407': { d1: 'Tsarevets', d2: 'Moravitsa' }, '503': { d1: 'Simeonovgrad', d2: 'Sredets' },
  '507': { d1: 'Manastir', d2: 'Kardzhali' }, '536': { d1: 'Polski Gradets', d2: 'Yambol' },
  '554': { d1: 'Harmanli', d2: 'Nova Zagora' }, '555': { d1: 'Yambol', d2: 'Omarchevo' },
  '601': { d1: 'Dolno Uyno (SRB)', d2: 'Kyustendil' }, '707': { d1: 'Golyamo Krushevo', d2: 'Zimnitsa' },
  '822': { d1: 'Ihtiman', d2: 'Samokov' }, '842': { d1: 'Belovo', d2: 'Yundola' },
  '866': { d1: 'Stamboliyski', d2: 'Smolyan' }, '902': { d1: 'Varna', d2: 'Obrochishte' },
  '906': { d1: 'Burgas', d2: 'Dyulino' }, '3002': { d1: 'Svishtov', d2: 'Bulgarene' },
  '6009': { d1: 'Aheloy', d2: 'Mirolyubovo' }, '7004': { d1: 'Shumen', d2: 'Timarevo' },
  '8652': { d1: 'Zlatograd', d2: 'Byal Izvor' },
  '1;15': { d1: 'Kulata (GR)', d2: 'Vidin (RO)' }, '5;6': { d1: 'Makaza (GR)', d2: 'Ruse (RO)' },
  '2;7': { d1: 'Varna', d2: 'Ruse (RO)' },
  'SOF1034': { d1: 'Sofia Region (End)', d2: 'Sofia Region (Start)' },
  'VRC1038': { d1: 'Vratsa Region (End)', d2: 'Vratsa Region (Start)' },
  'PDV1191': { d1: 'Plovdiv Region (End)', d2: 'Plovdiv Region (Start)' },
  'PDV1003': { d1: 'Plovdiv Region (End)', d2: 'Plovdiv Region (Start)' },
  'GAB3144': { d1: 'Gabrovo Region (End)', d2: 'Gabrovo Region (Start)' },
  'SZR1173': { d1: 'Stara Zagora Region (End)', d2: 'Stara Zagora Region (Start)' },
  'SZR1138': { d1: 'Stara Zagora Region (End)', d2: 'Stara Zagora Region (Start)' },
  'BLG1157': { d1: 'Blagoevgrad Region (End)', d2: 'Blagoevgrad Region (Start)' },
  'PVN1186': { d1: 'Pleven Region (End)', d2: 'Pleven Region (Start)' },
  'Unknown': { d1: 'Primary Flow', d2: 'Opposing Flow' },
};

// ==========================================
// HELPERS
// ==========================================

const getCenteredCurvedPath = (cameraLon: number, cameraLat: number, osmPath: number[][]) => {
  if (!osmPath || osmPath.length < 2) return { path: osmPath, snappedCenter: [cameraLon, cameraLat] };
  const TARGET_DISTANCE = 0.12; 
  let closestIdx = 0;
  
  let minDistSq = Infinity;
  osmPath.forEach((pt, i) => {
    const dSq = Math.pow(pt[0] - cameraLon, 2) + Math.pow(pt[1] - cameraLat, 2);
    if (dSq < minDistSq) { minDistSq = dSq; closestIdx = i; }
  });
  
  const snappedCenter = osmPath[closestIdx];
  let newPath = [snappedCenter];
  
  let distBack = 0;
  for (let i = closestIdx; i > 0 && distBack < TARGET_DISTANCE; i--) {
    newPath.unshift(osmPath[i-1]);
    distBack += Math.sqrt(Math.pow(osmPath[i][0] - osmPath[i-1][0], 2) + Math.pow(osmPath[i][1] - osmPath[i-1][1], 2));
  }
  let distForward = 0;
  for (let i = closestIdx; i < osmPath.length - 1 && distForward < TARGET_DISTANCE; i++) {
    newPath.push(osmPath[i+1]);
    distForward += Math.sqrt(Math.pow(osmPath[i+1][0] - osmPath[i][0], 2) + Math.pow(osmPath[i+1][1] - osmPath[i][1], 2));
  }
  return { path: newPath, snappedCenter };
};

const getTimestamps = (pathArray: number[][]) => {
  let dist = 0;
  const timestamps = [0];
  for (let i = 1; i < pathArray.length; i++) {
    const dx = pathArray[i][0] - pathArray[i-1][0];
    const dy = pathArray[i][1] - pathArray[i-1][1];
    dist += Math.sqrt(dx * dx + dy * dy);
    timestamps.push(dist * 100000); 
  }
  return timestamps;
};

const getRoadClass = (roadNum: string) => {
  if (!roadNum) return 'other';
  if (String(roadNum).toUpperCase().startsWith('A')) return 'motorway';
  return 'other';
};

// UPDATED TO CIVIC-TECH TERMINOLOGY
const getTrafficStatus = (count: number, roadClass: string) => {
  const threshold = roadClass === 'motorway' ? { med: 250, high: 500 } : { med: 80, high: 180 };
  if (count < threshold.med) return 'CLEAR';
  if (count < threshold.high) return 'HEAVY';
  return 'SEVERE';
};

const getTrafficColor = (status: string): [number, number, number] => {
  if (status === 'CLEAR') return [0, 255, 150];   
  if (status === 'HEAVY') return [255, 220, 0];  
  return [255, 0, 85];                              
};

// ==========================================
// MAIN COMPONENT
// ==========================================

function TrafficMap() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [time, setTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL'); 
  const GLOBAL_LOOP = 35000;

const [viewState, setViewState] = useState<Record<string, any>>(INITIAL_VIEW_STATE);
  // Set Page Title
  useEffect(() => {
    document.title = "Traffic Pulse | Bulgaria Road Network";
  }, []);

  const goToCamera = useCallback((lon: number, lat: number) => {
    setViewState(prev => ({
      ...prev,
      longitude: lon,
      latitude: lat,
      zoom: 12.5, 
      pitch: 50,  
      transitionDuration: 2500, 
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 })
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewState(prev => ({
      ...INITIAL_VIEW_STATE,
      transitionDuration: 2500, 
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 })
    }));
  }, []);

  useEffect(() => {
    fetch('/cameras_with_paths.json').then(res => res.json()).then(setCameras);
  }, []);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const res = await fetch('/api/traffic');
        const data = await res.json();
        setTrafficData(data);
      } catch (err) { console.error("Sync Error:", err); }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setTime(t => (t + 60) % GLOBAL_LOOP); 
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  const metrics = useMemo(() => {
    if (!cameras.length || !trafficData.length) return null;
    
    const trafficMap = new Map();
    let totalThroughput = 0;
    let total1HrThroughput = 0;
    
    // UPDATED STATUS DICTIONARY
    const statusCounts = { CLEAR: 0, HEAVY: 0, SEVERE: 0 };
    const nodeStats: any[] = [];

    trafficData.forEach(row => {
      trafficMap.set(String(row.scp).trim(), row);
    });

    const wireLanes: any[] = [];
    const tripLanes: any[] = [];
    const points: any[] = [];

    cameras.forEach((cam, index) => {
      const actualRoad = SCP_ROAD_OVERRIDES[cam.baseScp] || cam.roadNum;
      const dirs = ROAD_DIRECTIONS[actualRoad];
      
      const d1 = trafficMap.get(cam.baseScp + '1');
      const d2 = trafficMap.get(cam.baseScp + '2');
      
      const d1C = Number(d1?.count15min || 0);
      const d2C = Number(d2?.count15min || 0);
      const nodeTotalFlow = d1C + d2C;
      
      const d1Hr = Number(d1?.count1Hour || 0); 
      const d2Hr = Number(d2?.count1Hour || 0);
      const node1HrFlow = d1Hr + d2Hr;

      totalThroughput += nodeTotalFlow;
      total1HrThroughput += node1HrFlow;

      const roadClass = getRoadClass(actualRoad);
      const nodeStatus = getTrafficStatus(Math.max(d1C, d2C), roadClass);
      
      if (nodeTotalFlow > 0) {
        statusCounts[nodeStatus]++;
        const expected15mFlow = node1HrFlow / 4;
        const surge = nodeTotalFlow - expected15mFlow;
        const trendPct = expected15mFlow > 0 ? (surge / expected15mFlow) * 100 : 0;
        
        nodeStats.push({ 
          name: cam.nameENG, 
          flow: nodeTotalFlow, 
          status: nodeStatus,
          surge, 
          trendPct,
          lon: cam.lon,
          lat: cam.lat 
        });
      }

      const { path, snappedCenter } = getCenteredCurvedPath(cam.lon, cam.lat, cam.path);
      const start = path[0];
      const end = path[path.length - 1];
      const displacement = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
      const timestampsD1 = getTimestamps(path);
      const maxTimeD1 = timestampsD1[timestampsD1.length - 1];
      
      const windingFactor = Math.max(1, (maxTimeD1 / 100000) / displacement);

      const shared = { 
        name: cam.nameENG, 
        d1Count: d1C, d2Count: d2C, totalTraffic: nodeTotalFlow, 
        d1Label: dirs?.d1 || 'Direction 1', d2Label: dirs?.d2 || 'Direction 2',
        windingFactor
      };

      if (d1C > 0) {
        const statusD1 = getTrafficStatus(d1C, roadClass);
        wireLanes.push({ path, traffic: d1C, roadClass, status: statusD1, direction: 1, ...shared });
        const interval = maxTimeD1 + 2000; 
        const numPackets = Math.max(1, Math.ceil(GLOBAL_LOOP / interval));
        for (let i = 0; i < numPackets; i++) {
          tripLanes.push({ path, timestamps: timestampsD1.map(t => t + (i * interval)), traffic: d1C, roadClass, status: statusD1, name: cam.nameENG });
        }
      }

      if (d2C > 0) {
        const statusD2 = getTrafficStatus(d2C, roadClass);
        const revPath = [...path].reverse();
        const timestampsD2 = getTimestamps(revPath);
        const maxTimeD2 = timestampsD2[timestampsD2.length - 1];
        wireLanes.push({ path: revPath, traffic: d2C, roadClass, status: statusD2, direction: 2, ...shared });
        const interval = maxTimeD2 + 2000; 
        const numPackets = Math.max(1, Math.ceil(GLOBAL_LOOP / interval));
        for (let i = 0; i < numPackets; i++) {
          tripLanes.push({ path: revPath, timestamps: timestampsD2.map(t => t + (i * interval) + 3000), traffic: d2C, roadClass, status: statusD2, name: cam.nameENG });
        }
      }

      points.push({ ...cam, lon: snappedCenter[0], lat: snappedCenter[1], status: nodeStatus, roadClass, ...shared });
    });

    const globalExpected = total1HrThroughput / 4;
    const globalTrendPct = globalExpected > 0 ? ((totalThroughput - globalExpected) / globalExpected) * 100 : 0;

    const hitList = nodeStats
      .filter(n => n.flow > 50) 
      .sort((a, b) => b.surge - a.surge)
      .slice(0, 3);

    return { wireLanes, tripLanes, points, update: trafficData[0]?.time, totalThroughput, globalTrendPct, statusCounts, hitList };
  }, [cameras, trafficData]);

  const filteredData = useMemo(() => {
    if (!metrics) return null;
    const filterFn = (d: any) => activeFilter === 'ALL' || d.status === activeFilter;
    return {
      wireLanes: metrics.wireLanes.filter(filterFn),
      tripLanes: metrics.tripLanes.filter(filterFn),
      points: metrics.points.filter(filterFn)
    };
  }, [metrics, activeFilter]);

  const DashboardUI = useMemo(() => {
    if (!metrics) return null;
    
    return (
      <div className="absolute top-8 left-8 z-10 bg-[#0a0f18]/80 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 text-white shadow-2xl max-w-sm flex flex-col gap-6 select-none">
        
        {/* Header Block with added Subtitle */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00ff96] shadow-[0_0_15px_#00ff96] animate-pulse"></div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Traffic Pulse</h1>
            
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={resetView}
                className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/20 hover:text-white text-white/50 transition-all cursor-pointer"
              >
                Reset Map
              </button>
              <span className="text-[9px] font-mono text-[#00ff96] border border-[#00ff96]/30 bg-[#00ff96]/10 px-2 py-1 rounded-full">LIVE</span>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/40 mt-1.5 ml-6 block">Bulgaria Road Network</span>
        </div>
          
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${metrics.globalTrendPct > 5 ? 'bg-[#ff0050]/10' : 'bg-[#00ff96]/10'}`}></div>
          
          <div className="flex justify-between items-start mb-1">
            {/* UPDATED: Network Throughput -> Active Vehicle Volume */}
            <span className="text-[10px] opacity-50 font-black tracking-widest uppercase">Active Vehicle Volume</span>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${metrics.globalTrendPct > 0 ? 'bg-[#ff0050]/20 text-[#ff0050] border-[#ff0050]/30' : 'bg-[#00ff96]/20 text-[#00ff96] border-[#00ff96]/30'}`}>
              {metrics.globalTrendPct > 0 ? '▲' : '▼'} {Math.abs(metrics.globalTrendPct).toFixed(1)}%
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{metrics.totalThroughput.toLocaleString()}</span>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Veh / 15m</span>
          </div>
          {metrics.update && <span className="text-[9px] font-mono text-white/40 block mt-2">SYNC: {new Date(metrics.update).toLocaleTimeString('bg-BG')} EET</span>}
        </div>

        {/* UPDATED: Health Filters -> Filter by Condition */}
        <div>
          <span className="text-[9px] font-black tracking-widest uppercase opacity-40 mb-2 block">Filter by Condition</span>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'CLEAR', 'HEAVY', 'SEVERE'].map(filter => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${activeFilter === filter ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-white/50 border-white/10 hover:bg-white/5 hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* UPDATED: Live Histogram -> Traffic State Breakdown */}
        <div>
          <span className="text-[9px] font-black tracking-widest uppercase opacity-40 mb-2 block">Traffic State Breakdown</span>
          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <div className="flex items-center gap-2 text-[#00ff96]"><div className="w-2 h-2 rounded-full bg-[#00ff96]"></div>CLEAR</div>
              <span className="font-mono text-white/80">{metrics.statusCounts.CLEAR}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <div className="flex items-center gap-2 text-[#ffe600]"><div className="w-2 h-2 rounded-full bg-[#ffe600]"></div>HEAVY</div>
              <span className="font-mono text-white/80">{metrics.statusCounts.HEAVY}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <div className="flex items-center gap-2 text-[#ff0050]"><div className="w-2 h-2 rounded-full bg-[#ff0050]"></div>SEVERE</div>
              <span className="font-mono text-white/80">{metrics.statusCounts.SEVERE}</span>
            </div>
          </div>
        </div>

        {/* UPDATED: Surge List -> Active Bottlenecks */}
        <div>
          <span className="text-[9px] font-black tracking-widest uppercase text-[#ff0050] mb-2 flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            Active Bottlenecks
          </span>
          <div className="space-y-1.5">
            {metrics.hitList.length > 0 ? metrics.hitList.map((node, i) => (
              <div 
                key={i} 
                onClick={() => goToCamera(node.lon, node.lat)}
                className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <span className="text-[10px] font-bold text-white/80 truncate w-32 group-hover:text-white transition-colors">{i+1}. {node.name}</span>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-black text-white">{node.flow}</span>
                  </div>
                  <div className={`text-[9px] font-bold w-12 text-right ${node.trendPct > 0 ? 'text-[#ff0050]' : 'text-[#00ff96]'}`}>
                    {node.trendPct > 0 ? '+' : ''}{node.trendPct.toFixed(0)}%
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-[10px] text-white/30 italic p-2">Network flow stable.</div>
            )}
          </div>
        </div>

      </div>
    );
  }, [metrics, activeFilter, goToCamera, resetView]);

  if (!metrics || !filteredData) {
    return (
      <div className="w-full h-screen bg-[#06090f] flex items-center justify-center text-[#00ff96] font-mono text-xs opacity-50">
        ESTABLISHING TELEMETRY UPLINK...
      </div>
    );
  }

  // 3. Render Layers
  const layers = [
    new PathLayer({
      id: 'road-wire-base',
      data: filteredData.wireLanes,
      getPath: (d: any) => d.path,
      getColor: (d: any) => [...getTrafficColor(d.status), (40 / d.windingFactor)], 
      widthUnits: 'pixels', 
      widthMinPixels: 1, 
      getWidth: (d: any) => (d.traffic / 150) * (d.roadClass === 'motorway' ? 2 : 1),
      getOffset: 1.5, 
      extensions: [new PathStyleExtension({ offset: true })],
      pickable: true, 
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
    }),

    new TripsLayer({
      id: 'traffic-telemetry-packets',
      data: filteredData.tripLanes,
      getPath: (d: any) => d.path,
      getTimestamps: (d: any) => d.timestamps,
      getColor: (d: any) => getTrafficColor(d.status),
      widthUnits: 'pixels',
      widthMinPixels: 2.5, 
      getWidth: (d: any) => {
        const hwBonus = (d.roadClass === 'motorway' && viewState.zoom < 9) ? 2.5 : 1;
        return Math.max(2, (d.traffic / 100)) * hwBonus;
      },
      getOffset: 1.5,
      extensions: [new PathStyleExtension({ offset: true })],
      opacity: (viewState.zoom < 9) ? 0.9 : 0.8,
      trailLength: 10000, 
      currentTime: time, 
      pickable: false, 
    }),

    new ScatterplotLayer({
      id: 'camera-nodes',
      data: filteredData.points,
      getPosition: (d: any) => [d.lon, d.lat],
      getFillColor: [6, 9, 15, 255], 
      getLineColor: (d: any) => [...getTrafficColor(d.status), 180], 
      stroked: true,
      filled: true,
      radiusUnits: 'pixels',
      radiusMinPixels: 2.5, 
      radiusMaxPixels: 8,
      lineWidthMinPixels: 1.5,
      pickable: true,
    })
  ];

  return (
    <div className="w-full h-screen relative bg-[#06090f] overflow-hidden font-sans">
      <DeckGL 
        viewState={viewState} 
        onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)} 
        controller={true} 
        layers={layers}
        getTooltip={({object}: any) => {
          if (!object) return null;
          const isD1 = object.direction === 1;
          const isD2 = object.direction === 2;
          return {
            html: `
              <div class="p-4 font-sans min-w-[220px]">
                <div class="font-black text-white text-lg border-b border-white/20 pb-2 mb-3 tracking-tighter italic uppercase">${object.name}</div>
                <div class="flex justify-between items-center mb-1.5 p-2 rounded-lg transition-all ${isD1 ? 'bg-white/10 border border-white/20' : (object.direction ? 'opacity-30' : '')}">
                  <span class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">${object.d1Label}</span>
                  <span class="text-lg font-black ${object.d1Count > 0 ? 'text-[#00ff96]' : 'text-gray-600'}">${object.d1Count}</span>
                </div>
                <div class="flex justify-between items-center mb-3 p-2 rounded-lg transition-all ${isD2 ? 'bg-white/10 border border-white/20' : (object.direction ? 'opacity-30' : '')}">
                  <span class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">${object.d2Label}</span>
                  <span class="text-lg font-black ${object.d2Count > 0 ? 'text-[#00ff96]' : 'text-gray-600'}">${object.d2Count}</span>
                </div>
                <div class="flex justify-between items-center bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
                  <span class="text-[9px] text-blue-300 uppercase font-black">Total Node Flow</span>
                  <span class="font-black text-xl text-[#00e6ff]">${object.totalTraffic}</span>
                </div>
              </div>
            `,
            style: { backgroundColor: '#0b0f17', borderRadius: '16px', border: '1px solid #ffffff15', color: '#fff' }
          };
        }}
      >
        <MapLibre mapStyle={BASEMAP_URL} />
      </DeckGL>
      
      {DashboardUI}
    </div>
  );
}

export default dynamic(() => Promise.resolve(TrafficMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#06090f] flex items-center justify-center text-[#00ff96] font-mono text-sm opacity-50 tracking-widest">
      ESTABLISHING SATELLITE UPLINK...
    </div>
  )
});