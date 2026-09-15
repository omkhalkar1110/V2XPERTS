import { useState, useEffect } from 'react';
import { Role, MineSite, Zone, Vehicle, Alert, IncidentReport, SensorLog } from './types';
import SiteAdminPortal from './components/SiteAdminPortal';
import FleetManagerPortal from './components/FleetManagerPortal';
import EmergencyResponsePortal from './components/EmergencyResponsePortal';
import DriverCockpit from './components/DriverCockpit';
import { Sliders, ShieldAlert, Cpu, HardDrive, Landmark, Radio, Hammer, UserCheck, AlertOctagon, HelpCircle, Truck } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<Role>('driver');

  // Core Mine States
  const [sites, setSites] = useState<MineSite[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([]);
  const [weather, setWeather] = useState<{ condition: 'clear' | 'dusty' | 'rainy' | 'foggy'; visibility: number; windSpeed: number; temperature: number }>({
    condition: 'clear',
    visibility: 850,
    windSpeed: 14,
    temperature: 28,
  });

  // Client-side scrolling terminal messages
  const [streamLogs, setStreamLogs] = useState<string[]>([
    "System Init: Mining Safety telemetry network initialized.",
    "Pipeline Status: Subscribed to Node.js broadcast channel."
  ]);

  const addStreamLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setStreamLogs(prev => [...prev.slice(-19), `[${timestamp}] ${msg}`]);
  };

  // Connect to SSE Pipeline streaming from Node.js
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.addEventListener('init', (event: any) => {
      const data = JSON.parse(event.data);
      setSites(data.sites);
      setZones(data.zones);
      setVehicles(data.vehicles);
      setAlerts(data.alerts);
      setIncidents(data.incidents);
      setSensorLogs(data.sensorLogs);
      setWeather(data.weather);
      addStreamLog("State Synchronized: Telemetry baseline pulled.");
    });

    eventSource.addEventListener('tick', (event: any) => {
      const data = JSON.parse(event.data);
      setVehicles(data.vehicles);
      setWeather(data.weather);
      addStreamLog(`Streaming telemetry: Position and bearings synced for ${data.vehicles.length} vehicles.`);
    });

    eventSource.addEventListener('alert', (event: any) => {
      const newAlert = JSON.parse(event.data) as Alert;
      setAlerts(prev => [newAlert, ...prev]);
      addStreamLog(`🛑 WARNING ACTIVE: ${newAlert.type.toUpperCase()} on vehicle [${newAlert.vehicleName}]`);
      
      // Also add alert to sensor logs
      setSensorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        vehicleId: newAlert.vehicleId,
        vehicleName: newAlert.vehicleName,
        source: 'telemetry',
        level: 'warning',
        message: newAlert.message
      }, ...prev]);
    });

    eventSource.addEventListener('alert_resolved', (event: any) => {
      const resolvedAlert = JSON.parse(event.data) as Alert;
      setAlerts(prev => prev.map(a => a.id === resolvedAlert.id ? resolvedAlert : a));
      addStreamLog(`✅ ALARM CLEARED: Resolved ${resolvedAlert.type.toUpperCase()} alert for [${resolvedAlert.vehicleName}]`);
    });

    eventSource.addEventListener('alert_acknowledged', (event: any) => {
      const updatedAlert = JSON.parse(event.data) as Alert;
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
      addStreamLog(`⚠️ ALARM ACKNOWLEDGED: operator reviewed warning for [${updatedAlert.vehicleName}]`);
    });

    eventSource.addEventListener('zone_created', (event: any) => {
      const newZone = JSON.parse(event.data) as Zone;
      setZones(prev => [...prev, newZone]);
      addStreamLog(`🧱 INFRASTRUCTURE UPDATE: New Zone [${newZone.name}] added.`);
    });

    eventSource.addEventListener('vehicle_created', (event: any) => {
      const newVehicle = JSON.parse(event.data) as Vehicle;
      setVehicles(prev => [...prev, newVehicle]);
      addStreamLog(`🚜 FLEET EXPANSION: Heavy fleet [${newVehicle.name}] commissioned.`);
    });

    eventSource.addEventListener('weather_changed', (event: any) => {
      const newWeather = JSON.parse(event.data);
      setWeather(newWeather);
      addStreamLog(`🌦️ METEREOLOGICAL UPDATE: Sky conditions shifted to ${newWeather.condition.toUpperCase()}`);
    });

    eventSource.addEventListener('vehicle_updated', (event: any) => {
      const updatedVehicle = JSON.parse(event.data) as Vehicle;
      setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Post Actions
  const handleCreateZone = async (zoneData: Omit<Zone, 'id'>) => {
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });
      if (!res.ok) throw new Error("Failed to provision zone");
    } catch (err) {
      console.error(err);
      addStreamLog("Failed to sync new zone creation with Node.js backend");
    }
  };

  const handleCreateVehicle = async (vehData: Omit<Vehicle, 'id' | 'speed' | 'heading' | 'coordinates' | 'sensors'>) => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehData)
      });
      if (!res.ok) throw new Error("Failed to commission vehicle");
    } catch (err) {
      console.error(err);
      addStreamLog("Failed to sync new vehicle commission with Node.js backend");
    }
  };

  const handleResolveAlert = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, resolvedBy: 'Control Room Operator' })
      });
      if (!res.ok) throw new Error("Failed to resolve alert");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error("Failed to acknowledge alert");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWeather = async (weatherData: typeof weather) => {
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weatherData)
      });
      if (!res.ok) throw new Error("Failed to update weather");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTelemetry = async (id: string, telemetry: Partial<Vehicle>) => {
    try {
      const res = await fetch(`/api/vehicles/${id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
      if (!res.ok) throw new Error("Failed to update telemetry overrides");
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSensorFailure = async (id: string, sensor: 'radar' | 'lidar' | 'gps' | 'telemetryLink') => {
    try {
      const res = await fetch(`/api/vehicles/${id}/trigger-sensor-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor })
      });
      if (!res.ok) throw new Error("Failed to trigger sensor failure simulation");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col font-sans antialiased">
      {/* Universal Top Branding Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#C05A3E]/10 text-[#C05A3E] rounded-xl border border-[#C05A3E]/20">
            <Radio className="animate-pulse" size={18} />
          </div>
          <div>
            <h1 className="text-base font-sans font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
              <span>Onyx Mine Safety &amp; Operations Platform</span>
              <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-800 text-[9px] font-sans px-2 py-0.5 rounded border border-orange-500/20 font-bold uppercase tracking-wide">
                🇮🇳 India Division
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-800 text-[9px] font-sans px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wide">
                DGMS Compliant
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              DGMS TELEMETRY COMPLIANCE PORTAL • JHARIA &amp; SINGARENI COALFIELDS
            </p>
          </div>
        </div>

        {/* Portal Switching Panel */}
        <div className="flex flex-wrap bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setRole('driver')}
            className={`px-3.5 py-2 text-xs font-sans font-semibold tracking-wide rounded-lg transition-all flex items-center gap-1.5 ${
              role === 'driver'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck size={13} />
            <span>Driver Portal</span>
          </button>
          <button
            onClick={() => setRole('site_admin')}
            className={`px-3.5 py-2 text-xs font-sans font-semibold tracking-wide rounded-lg transition-all flex items-center gap-1.5 ${
              role === 'site_admin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders size={13} />
            <span>Site Admins</span>
          </button>
          <button
            onClick={() => setRole('fleet_manager')}
            className={`px-3.5 py-2 text-xs font-sans font-semibold tracking-wide rounded-lg transition-all flex items-center gap-1.5 ${
              role === 'fleet_manager'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark size={13} />
            <span>Fleet Managers</span>
          </button>
          <button
            onClick={() => setRole('emergency_response')}
            className={`px-3.5 py-2 text-xs font-sans font-semibold tracking-wide rounded-lg transition-all flex items-center gap-1.5 ${
              role === 'emergency_response'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert size={13} />
            <span>Emergency Response</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Active Portal Views */}
        {role === 'driver' && (
          <DriverCockpit
            vehicles={vehicles}
            weatherCondition={weather.condition}
            onUpdateTelemetry={handleUpdateTelemetry}
            triggerSensorFailure={triggerSensorFailure}
          />
        )}

        {role === 'site_admin' && (
          <SiteAdminPortal
            sites={sites}
            zones={zones}
            vehicles={vehicles}
            incidents={incidents}
            sensorLogs={sensorLogs}
            onCreateZone={handleCreateZone}
            onCreateVehicle={handleCreateVehicle}
          />
        )}

        {role === 'fleet_manager' && (
          <FleetManagerPortal
            sites={sites}
            zones={zones}
            vehicles={vehicles}
            alerts={alerts}
            incidents={incidents}
            weatherCondition={weather.condition}
          />
        )}

        {role === 'emergency_response' && (
          <EmergencyResponsePortal
            sites={sites}
            zones={zones}
            vehicles={vehicles}
            alerts={alerts}
            weatherCondition={weather.condition}
            onResolveAlert={handleResolveAlert}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onUpdateWeather={handleUpdateWeather}
            streamLogs={streamLogs}
          />
        )}
      </main>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 shrink-0 text-center text-[10px] font-mono text-slate-400 tracking-wider">
        ONYX DECISION SYSTEMS • LICENSED FOR DEEP-MINE FLEET INTEGRATION • SYSTEM HEALTH: EXCELLENT
      </footer>
    </div>
  );
}
