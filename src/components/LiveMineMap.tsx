import { useState } from 'react';
import { Vehicle, Zone } from '../types';
import { MapPin, ShieldAlert, Navigation2, Activity } from 'lucide-react';

interface LiveMineMapProps {
  vehicles: Vehicle[];
  zones: Zone[];
  selectedVehicleId?: string;
  onSelectVehicle?: (v: Vehicle) => void;
  weatherCondition: 'clear' | 'dusty' | 'rainy' | 'foggy';
  isHeatmapMode?: boolean;
}

export default function LiveMineMap({
  vehicles,
  zones,
  selectedVehicleId,
  onSelectVehicle,
  weatherCondition,
  isHeatmapMode = false,
}: LiveMineMapProps) {
  const [hoveredVehicle, setHoveredVehicle] = useState<Vehicle | null>(null);

  // Simulated heatmap hazard spots
  const heatspots = [
    { x: 30, y: 40, weight: 'high', label: 'Pit Entrance Slope (Steep)' },
    { x: 60, y: 55, weight: 'medium', label: 'Haul Intersection C' },
    { x: 80, y: 35, weight: 'high', label: 'Stockpile Offramp' },
    { x: 45, y: 25, weight: 'low', label: 'Dumping Apron 4' },
  ];

  return (
    <div id="live-mine-map" className="relative w-full aspect-[16/10] bg-[#F9F9F6] rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-80" />

      {/* Map Decorative Accents / Zones */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Draw Mine Zones */}
        <rect x="10%" y="15%" width="22%" height="25%" fill="rgba(192, 90, 62, 0.02)" stroke="rgba(192, 90, 62, 0.2)" strokeDasharray="4 4" rx="8" />
        <text x="11%" y="20%" className="text-[10px] fill-[#C05A3E]/70 font-mono font-semibold">JHARIA PIT EXCAVATION (HIGH RISK)</text>

        <rect x="50%" y="10%" width="38%" height="18%" fill="rgba(245, 158, 11, 0.02)" stroke="rgba(245, 158, 11, 0.25)" strokeDasharray="4 4" rx="8" />
        <text x="51%" y="15%" className="text-[10px] fill-amber-700/70 font-mono font-semibold">GODAVARI STOCKPILE NORTH (LOW RISK)</text>

        <rect x="15%" y="60%" width="35%" height="30%" fill="rgba(59, 130, 246, 0.01)" stroke="rgba(59, 130, 246, 0.2)" strokeDasharray="4 4" rx="8" />
        <text x="16%" y="65%" className="text-[10px] fill-blue-600/60 font-mono font-semibold">NEYVELI LIGNITE DUMP ZONE</text>

        {/* Main Haul Road Layout */}
        <path d="M 20 40 Q 50 50 80 35 T 45 75" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 20 40 Q 50 50 80 35 T 45 75" fill="none" stroke="rgba(192, 90, 62, 0.2)" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="42%" y="46%" className="text-[9px] fill-slate-400/70 font-mono font-medium transform rotate-3">DHANBAD HAUL ROAD ALPHA</text>
      </svg>

      {/* Heatmap Overlay */}
      {isHeatmapMode && (
        <div className="absolute inset-0 pointer-events-none">
          {heatspots.map((spot, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl animate-pulse"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: spot.weight === 'high' ? '120px' : spot.weight === 'medium' ? '80px' : '50px',
                height: spot.weight === 'high' ? '120px' : spot.weight === 'medium' ? '80px' : '50px',
                backgroundColor: spot.weight === 'high' ? 'rgba(192, 90, 62, 0.35)' : spot.weight === 'medium' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.25)',
              }}
            />
          ))}
          {/* Heatmap Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200/80 p-3.5 rounded-xl text-[11px] font-sans text-slate-600 shadow-md">
            <div className="font-bold mb-2 text-slate-800 tracking-tight uppercase">HISTORICAL RISK HEATSPOTS</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#C05A3E] blur-[1px]" /> High Hazard Occurrence</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 blur-[1px]" /> Moderate Risk Zone</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 blur-[1px]" /> Safe Transit Anchor</div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Overlay Effects */}
      {weatherCondition === 'foggy' && (
        <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-[1px] pointer-events-none transition-all duration-1000 ease-in-out">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(240,240,240,0.5)_100%)]" />
          <div className="absolute top-2 right-4 text-slate-700 text-[10px] font-mono bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/80 animate-pulse shadow-sm font-semibold">
            ⚠️ VISIBILITY CRITICAL: {weatherCondition.toUpperCase()}
          </div>
        </div>
      )}
      {weatherCondition === 'rainy' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900/[0.02] transition-all duration-1000">
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(170deg,transparent_45%,rgba(14,165,233,0.2)_50%,transparent_55%)] bg-[size:40px_80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(0,0,0,0.02)_2px,transparent_2px)] bg-[size:30px_50px]" />
        </div>
      )}
      {weatherCondition === 'dusty' && (
        <div className="absolute inset-0 bg-amber-700/[0.04] pointer-events-none transition-all duration-1000 ease-in-out">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(120,53,4,0.08)_100%)]" />
        </div>
      )}

      {/* Static Labels */}
      <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 select-none font-medium">
        GPS COORDINATES GRID [0,0] TO [100,100]
      </div>

      {/* Vehicle Pins */}
      {vehicles.map((vehicle) => {
        const isSelected = selectedVehicleId === vehicle.id;
        const hasWarning = vehicle.speed > 50 || vehicle.sensors.lidar === 'offline' || vehicle.sensors.radar === 'offline';
        const hasCritical = vehicle.sensors.telemetryLink === 'offline' || vehicle.speed > 60;
        
        let markerColor = 'bg-emerald-500';
        let ringColor = 'ring-emerald-400/30';
        let textColor = 'text-emerald-400';
        
        if (vehicle.status === 'offline') {
          markerColor = 'bg-slate-500';
          ringColor = 'ring-slate-400/20';
          textColor = 'text-slate-400';
        } else if (hasCritical) {
          markerColor = 'bg-red-500';
          ringColor = 'ring-red-400/40 animate-ping';
          textColor = 'text-red-400';
        } else if (hasWarning) {
          markerColor = 'bg-amber-500';
          ringColor = 'ring-amber-400/30 animate-pulse';
          textColor = 'text-amber-400';
        }

        return (
          <div
            key={vehicle.id}
            id={`vehicle-pin-${vehicle.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-500"
            style={{ left: `${vehicle.coordinates.x}%`, top: `${vehicle.coordinates.y}%` }}
            onClick={() => onSelectVehicle?.(vehicle)}
            onMouseEnter={() => setHoveredVehicle(vehicle)}
            onMouseLeave={() => setHoveredVehicle(null)}
          >
            {/* Pulsing Outer Ring */}
            <div className={`absolute -inset-3 rounded-full ring-2 ${ringColor} transition-all duration-300 ${isSelected ? 'ring-4 scale-125' : 'scale-100'}`} />

            {/* Core Pin Dot */}
            <div className={`relative w-4 h-4 rounded-full ${markerColor} border-2 border-white flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-transform duration-300 ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
              {/* Direction Indicator */}
              {vehicle.status === 'active' && (
                <Navigation2
                  size={9}
                  className="text-white fill-white transition-transform"
                  style={{ transform: `rotate(${vehicle.heading}deg)` }}
                />
              )}
            </div>

            {/* Label Badge */}
            <div className={`absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-sm border px-2 py-0.5 rounded-lg text-[9px] font-sans font-bold tracking-tight transition-all duration-300 shadow-sm ${isSelected ? 'border-[#C05A3E] text-[#C05A3E] z-30 scale-105 shadow-md' : 'border-slate-200 text-slate-700'}`}>
              <div className="flex items-center gap-1">
                <span>{vehicle.name}</span>
                {vehicle.status === 'active' && <span className="opacity-80 text-[8px]">({vehicle.speed} km/h)</span>}
              </div>
            </div>

            {/* Interactive Tooltip Details */}
            {(hoveredVehicle?.id === vehicle.id || isSelected) && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-52 bg-white/98 backdrop-blur-md border border-slate-200/90 p-3 rounded-xl shadow-lg z-40 text-slate-700 pointer-events-none text-[11px] font-sans">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <span className="font-bold text-slate-900">{vehicle.name}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-extrabold tracking-wider ${
                    vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>{vehicle.status}</span>
                </div>
                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between"><span>Operator:</span> <span className="text-slate-900 font-medium">{vehicle.operatorName}</span></div>
                  <div className="flex justify-between"><span>Speed:</span> <span className="text-[#C05A3E] font-semibold">{vehicle.speed} km/h</span></div>
                  <div className="flex justify-between"><span>Bearing:</span> <span>{vehicle.heading}°</span></div>
                  <div className="flex justify-between"><span>Grid position:</span> <span>X:{vehicle.coordinates.x} Y:{vehicle.coordinates.y}</span></div>
                  <div className="border-t border-slate-100 pt-2 mt-2">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-1">Onboard Systems</span>
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${vehicle.sensors.radar === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-slate-500">RADAR</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${vehicle.sensors.lidar === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-slate-500">LiDAR</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${vehicle.sensors.gps === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-slate-500">GPS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${vehicle.sensors.telemetryLink === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-slate-500">LINK</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
