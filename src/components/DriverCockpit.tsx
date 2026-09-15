import { useState, useEffect } from 'react';
import { Vehicle, PredictiveRiskReport } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Truck,
  Compass,
  Thermometer,
  Wind,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DriverCockpitProps {
  vehicles: Vehicle[];
  weatherCondition: 'clear' | 'dusty' | 'rainy' | 'foggy';
  onUpdateTelemetry: (id: string, data: Partial<Vehicle>) => void;
  triggerSensorFailure: (id: string, sensor: 'radar' | 'lidar' | 'gps' | 'telemetryLink') => void;
}

export default function DriverCockpit({
  vehicles,
  weatherCondition,
  onUpdateTelemetry,
  triggerSensorFailure,
}: DriverCockpitProps) {
  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [speed, setSpeed] = useState<number>(30);
  const [isRequestingMl, setIsRequestingMl] = useState<boolean>(false);
  const [mlReport, setMlReport] = useState<PredictiveRiskReport | null>(null);

  // Auto-select first active vehicle once data is loaded asynchronously from server
  useEffect(() => {
    if (activeVehicles.length > 0 && (!selectedVehicleId || !activeVehicles.some(v => v.id === selectedVehicleId))) {
      setSelectedVehicleId(activeVehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  const vehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Sync internal speed slider when external simulated speed changes
  useEffect(() => {
    if (vehicle) {
      setSpeed(vehicle.speed);
    }
  }, [selectedVehicleId, vehicle?.speed]);

  // Telemetry updates
  const handleSpeedSliderChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (selectedVehicleId) {
      onUpdateTelemetry(selectedVehicleId, { speed: newSpeed });
    }
  };

  const handleHeadingChange = (newHeading: number) => {
    if (selectedVehicleId) {
      onUpdateTelemetry(selectedVehicleId, { heading: newHeading });
    }
  };

  const toggleSensor = (sensor: 'radar' | 'lidar' | 'gps' | 'telemetryLink') => {
    if (!vehicle) return;
    if (vehicle.sensors[sensor] === 'online') {
      triggerSensorFailure(vehicle.id, sensor);
    } else {
      const updatedSensors = { ...vehicle.sensors, [sensor]: 'online' as const };
      onUpdateTelemetry(vehicle.id, { sensors: updatedSensors });
    }
  };

  // Fetch ML predictive risk reports using Gemini-driven server endpoint
  const requestPredictiveRisk = async () => {
    if (!vehicle) return;
    setIsRequestingMl(true);
    try {
      const response = await fetch('/api/predictive-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radarStatus: vehicle.sensors.radar,
          lidarStatus: vehicle.sensors.lidar,
          gpsStatus: vehicle.sensors.gps,
          speed: speed,
          weather: weatherCondition,
          zoneType: vehicle.type === 'haul_truck' ? 'haul_road' : 'pit'
        })
      });
      const data = await response.json();
      setMlReport({
        riskScore: data.riskScore,
        collisionProbability: data.collisionProbability,
        recommendedSpeed: data.recommendedSpeed,
        explanation: data.explanation,
        inputs: {
          radar: vehicle.sensors.radar,
          lidar: vehicle.sensors.lidar,
          gps: vehicle.sensors.gps,
          weather: weatherCondition
        }
      });
    } catch (error) {
      console.error("Failed to fetch safety report:", error);
    } finally {
      setIsRequestingMl(false);
    }
  };

  // Auto update predictive guidance when vehicle, speed, or weather shifts
  useEffect(() => {
    if (vehicle) {
      requestPredictiveRisk();
    }
  }, [selectedVehicleId, weatherCondition, vehicle?.sensors.lidar, vehicle?.sensors.radar, vehicle?.sensors.gps]);

  if (!vehicle) {
    return (
      <div className="bg-white border border-slate-200/80 p-8 rounded-2xl text-center text-slate-500 font-sans text-xs max-w-lg mx-auto my-12 shadow-sm">
        <Info className="mx-auto mb-3 text-slate-400" size={24} />
        No active heavy vehicles available for driver console. Ensure vehicles are active in Site Admin.
      </div>
    );
  }

  // Active vehicle safety flags
  const hasSensorOffline = Object.values(vehicle.sensors).some(s => s !== 'online');
  const speedLimit = vehicle.siteId === 'qld-02' ? 25 : 50;
  const isOverspeeding = speed > speedLimit;

  // Weather descriptions for HUD
  const weatherSpecs = {
    clear: { visibility: '850m', wind: '14 km/h', temp: '28°C' },
    dusty: { visibility: '250m', wind: '35 km/h', temp: '34°C' },
    rainy: { visibility: '400m', wind: '22 km/h', temp: '18°C' },
    foggy: { visibility: '90m', wind: '5 km/h', temp: '14°C' },
  }[weatherCondition];

  return (
    <div id="driver-cockpit" className="space-y-6">
      {/* Premium Top Navigation HUD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#C05A3E]/10 text-[#C05A3E] rounded-xl border border-[#C05A3E]/15">
            <Truck size={20} />
          </div>
          <div>
            <h2 className="font-sans font-bold text-slate-900 text-sm tracking-tight uppercase">
              Heavy Vehicle Driver HUD Cockpit
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              REAL-TIME MISSION DIAGNOSTICS • ACTIVE OPERATOR: {vehicle.operatorName.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Active Machinery Selection */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="text-[10px] uppercase font-sans text-slate-400 font-bold tracking-wider">Active Machine:</span>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-transparent text-slate-800 text-xs font-sans font-bold focus:outline-none cursor-pointer"
          >
            {activeVehicles.map(v => (
              <option key={v.id} value={v.id} className="bg-white text-slate-800">
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Live HUD Gauges & Alarms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Visual Gauge Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
            <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
              Primary HUD Instrument
            </h3>

            {/* Combined Speedometer Circle HUD */}
            <div className="relative flex flex-col items-center justify-center py-5 bg-slate-50/50 rounded-xl border border-slate-100 shadow-2xs">
              {/* Outer Speed Status Indicator */}
              <div className="text-center">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">Velocity</span>
                <span className={`text-5xl font-mono font-extrabold tracking-tight block my-1 ${isOverspeeding ? 'text-red-500 animate-pulse' : 'text-[#C05A3E]'}`}>
                  {speed}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">KM/H</span>
              </div>

              {/* Status bar */}
              <div className="w-4/5 bg-slate-200 h-1 rounded-full overflow-hidden mt-4">
                <div 
                  className={`h-full transition-all duration-200 ${isOverspeeding ? 'bg-red-500' : 'bg-[#C05A3E]'}`}
                  style={{ width: `${Math.min((speed / 75) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between w-4/5 text-[9px] font-mono text-slate-400 mt-2">
                <span>0 km/h</span>
                <span>Limit: {speedLimit}</span>
                <span>Max 75</span>
              </div>
            </div>

            {/* Heading HUD Panel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <Compass className="text-[#C05A3E] shrink-0" size={16} />
                <div>
                  <span className="text-[9px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Heading</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{vehicle.heading}° bearing</span>
                </div>
              </div>

              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <Truck className="text-blue-500 shrink-0" size={16} />
                <div>
                  <span className="text-[9px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Model Class</span>
                  <span className="text-xs font-mono font-bold text-slate-800 capitalize">{vehicle.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Meteorological Station HUD */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">ATMOSPHERIC HUD</span>
                <span className="text-[9px] font-sans text-[#C05A3E] bg-[#C05A3E]/10 px-2.5 py-0.5 rounded-lg border border-[#C05A3E]/10 uppercase font-bold tracking-wide">
                  {weatherCondition}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                  <Eye className="mx-auto text-blue-500 mb-1" size={14} />
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Visibility</span>
                  <span className="font-mono font-bold text-[11px] text-slate-700">{weatherSpecs.visibility}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                  <Wind className="mx-auto text-sky-500 mb-1" size={14} />
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Wind Speed</span>
                  <span className="font-mono font-bold text-[11px] text-slate-700">{weatherSpecs.wind}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                  <Thermometer className="mx-auto text-rose-500 mb-1" size={14} />
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Temp</span>
                  <span className="font-mono font-bold text-[11px] text-slate-700">{weatherSpecs.temp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Controls & Sim overrides (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Control Override Dashboard */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
            <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
              Vehicle Telemetry Overrides
            </h3>

            {/* Slider 1: Speed */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="text-slate-500 font-semibold">Target Speed:</span>
                <span className={`font-mono font-bold ${isOverspeeding ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                  {speed} km/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                value={speed}
                onChange={(e) => handleSpeedSliderChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C05A3E]"
              />
              <p className="text-[10px] font-sans text-slate-400 text-center font-medium">
                Zone Speed Target Limit: <span className="font-bold text-slate-500">{speedLimit} km/h</span>
              </p>
            </div>

            {/* Slider 2: Bearing */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="text-slate-500 font-semibold">Steering Bearing:</span>
                <span className="text-[#C05A3E] font-mono font-bold">{vehicle.heading}° North</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={vehicle.heading}
                onChange={(e) => handleHeadingChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C05A3E]"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0° N</span>
                <span>90° E</span>
                <span>180° S</span>
                <span>270° W</span>
              </div>
            </div>

            {/* Hardware Injectors */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Onboard Hardware Failures</span>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed font-medium">
                Toggle offline switches to inject raw telemetry faults into the active pipeline.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['radar', 'lidar', 'gps', 'telemetryLink'] as const).map((sensor) => {
                  const status = vehicle.sensors[sensor];
                  const label = sensor === 'telemetryLink' ? 'TELEMETRY' : sensor.toUpperCase();
                  return (
                    <button
                      key={sensor}
                      onClick={() => toggleSensor(sensor)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border font-sans font-bold text-[11px] transition-all ${
                        status === 'online'
                          ? 'bg-white border-slate-200 text-slate-600 hover:border-[#C05A3E]/40 hover:text-[#C05A3E] shadow-3xs'
                          : 'bg-red-50 border-red-200 text-red-600 hover:bg-white shadow-3xs'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Predictive Safety Guidance & Rule Engine (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 flex flex-col justify-between h-full shadow-xs">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="text-[#C05A3E] animate-pulse" size={16} />
                  <h3 className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wider">
                    Predictive Guidance
                  </h3>
                </div>
                <button
                  onClick={requestPredictiveRisk}
                  disabled={isRequestingMl}
                  className="flex items-center gap-1.5 text-[10px] font-sans font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-lg text-slate-600 transition-colors disabled:opacity-50 shadow-3xs"
                >
                  <RefreshCw size={11} className={isRequestingMl ? 'animate-spin' : ''} />
                  <span>{isRequestingMl ? 'Computing...' : 'Recalculate'}</span>
                </button>
              </div>

              {/* Safety metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Risk Score</span>
                  <span className={`text-lg font-mono font-bold block mt-1 ${
                    mlReport && mlReport.riskScore > 70 ? 'text-red-500 font-extrabold' : mlReport && mlReport.riskScore > 35 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {mlReport ? `${mlReport.riskScore}/100` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Collision Prob</span>
                  <span className={`text-lg font-mono font-bold block mt-1 ${
                    mlReport && mlReport.collisionProbability > 50 ? 'text-red-500 animate-pulse font-extrabold' : mlReport && mlReport.collisionProbability > 20 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {mlReport ? `${mlReport.collisionProbability}%` : '--'}
                  </span>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] font-sans text-slate-400 uppercase font-bold tracking-wider block">Advice Speed</span>
                  <span className="text-lg font-mono font-bold text-blue-500 block mt-1">
                    {mlReport ? `${mlReport.recommendedSpeed}k` : '--'}
                  </span>
                </div>
              </div>

              {/* AI Narrative */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 min-h-[120px] flex flex-col justify-center">
                {isRequestingMl ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-4/5 animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-5/6 animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                  </div>
                ) : mlReport ? (
                  <div className="space-y-3">
                    <p className="text-[11px] font-sans text-slate-600 leading-relaxed font-medium">
                      {mlReport.explanation}
                    </p>
                    <div className="flex items-center justify-between text-[8px] font-sans text-slate-400 font-bold border-t border-slate-100 pt-2 tracking-wider">
                      <span>COPILOT SYSTEM: ACTIVE</span>
                      <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                        AI Verified
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] font-sans text-slate-400 text-center font-medium">
                    Awaiting telemetry coordinates to perform live safety risk calculation...
                  </p>
                )}
              </div>
            </div>

            {/* Rule Engine HUD warning */}
            <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 font-sans transition-colors ${
              isOverspeeding || hasSensorOffline
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-150 text-emerald-700'
            }`}>
              {isOverspeeding || hasSensorOffline ? (
                <>
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 animate-bounce text-red-500" />
                  <div className="text-[11px]">
                    <span className="font-extrabold uppercase block text-red-800 tracking-wider">CRITICAL SAFETY BREACH</span>
                    <p className="text-red-700 font-medium leading-relaxed mt-0.5">
                      {isOverspeeding ? 'Overspeeding is currently active on this vessel. ' : ''}
                      {hasSensorOffline ? 'Onboard sensor diagnostics report fault status. ' : ''}
                      Operator alert is currently flagged in regional telemetry system.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div className="text-[11px]">
                    <span className="font-extrabold uppercase block text-emerald-800 tracking-wider">STATUS CLEAR</span>
                    <p className="text-emerald-600 font-medium leading-relaxed mt-0.5">
                      All sensory systems verified. Operating velocities remain safely below limit threshold.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
