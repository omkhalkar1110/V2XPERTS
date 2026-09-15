import { useState, useEffect, useRef } from 'react';
import { Vehicle, Zone, Alert, MineSite } from '../types';
import { Activity, ShieldAlert, Cloud, AlertTriangle, Play, CheckCircle, RefreshCw, Radio } from 'lucide-react';
import LiveMineMap from './LiveMineMap';

interface EmergencyResponsePortalProps {
  sites: MineSite[];
  zones: Zone[];
  vehicles: Vehicle[];
  alerts: Alert[];
  weatherCondition: 'clear' | 'dusty' | 'rainy' | 'foggy';
  onResolveAlert: (id: string, notes: string) => Promise<void>;
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onUpdateWeather: (weather: { condition: 'clear' | 'dusty' | 'rainy' | 'foggy'; visibility: number; windSpeed: number; temperature: number }) => Promise<void>;
  streamLogs: string[];
}

export default function EmergencyResponsePortal({
  sites,
  zones,
  vehicles,
  alerts,
  weatherCondition,
  onResolveAlert,
  onAcknowledgeAlert,
  onUpdateWeather,
  streamLogs,
}: EmergencyResponsePortalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('db-01');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dispatchSiren, setDispatchSiren] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamLogs]);

  const filteredVehicles = vehicles.filter(v => v.siteId === selectedSiteId);
  const activeAlerts = alerts.filter(a => a.status !== 'resolved' && a.siteId === selectedSiteId);
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.siteId === selectedSiteId);

  // Handle weather override
  const changeWeather = async (condition: 'clear' | 'dusty' | 'rainy' | 'foggy') => {
    let visibility = 850;
    let windSpeed = 14;
    let temperature = 28;

    if (condition === 'foggy') {
      visibility = 90;
      windSpeed = 5;
    } else if (condition === 'rainy') {
      visibility = 400;
      windSpeed = 22;
      temperature = 18;
    } else if (condition === 'dusty') {
      visibility = 250;
      windSpeed = 35;
      temperature = 34;
    }

    await onUpdateWeather({ condition, visibility, windSpeed, temperature });
  };

  // Resolve Alert action
  const handleResolve = async (id: string) => {
    if (!resolutionNotes.trim()) return;
    await onResolveAlert(id, resolutionNotes);
    setResolutionNotes('');
    setSelectedAlertId(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left Column: Alerts & Live Stream Logs (4 cols) */}
      <div className="xl:col-span-4 space-y-6 flex flex-col justify-between">
        {/* Active Alarms Panel */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 flex-1 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={18} />
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">ACTIVE ALARM DESPATCH</h3>
            </div>
            <span className="text-[10px] font-sans font-bold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-lg animate-pulse shadow-3xs">
              {activeAlerts.length} ALARMS ACTIVE
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/60 shadow-3xs">
                <p className="text-xs font-sans font-medium text-slate-400">All regional fleet sectors operating normally. Zero active alarms.</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border font-sans text-xs cursor-pointer transition-all ${
                    selectedAlertId === alert.id
                      ? 'bg-red-50/50 border-red-300 text-slate-800 shadow-sm scale-[1.01]'
                      : alert.severity === 'critical'
                      ? 'bg-red-50/10 border-red-100 text-red-700 hover:bg-slate-50/50'
                      : 'bg-amber-50/20 border-amber-100 text-amber-700 hover:bg-slate-50/50'
                  }`}
                  onClick={() => setSelectedAlertId(alert.id)}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <span>🚨</span> <span className="text-slate-800">{alert.type.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium mb-2.5">
                    {alert.message}
                  </p>
                  <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2.5 mt-2.5">
                    <span className="text-slate-500 font-bold">{alert.vehicleName}</span>
                    <span className="uppercase text-[9px] px-2 py-0.5 rounded-lg font-bold bg-slate-100 text-slate-500 border border-slate-200/60">
                      {alert.status}
                    </span>
                  </div>

                  {selectedAlertId === alert.id && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          disabled={alert.status === 'acknowledged'}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-sans font-bold py-2 px-2.5 rounded-xl text-[10px] transition-all shadow-3xs disabled:opacity-50"
                        >
                          Acknowledge Alert
                        </button>
                        <button
                          onClick={() => setDispatchSiren(!dispatchSiren)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all shadow-3xs ${
                            dispatchSiren ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-white border-slate-200/80 text-slate-500'
                          }`}
                        >
                          Siren
                        </button>
                      </div>

                      <div className="space-y-2 pt-1">
                        <textarea
                          placeholder="Type resolution clearance notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-[11px] text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-[#C05A3E] h-16 transition-all"
                        />
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold py-2 px-2.5 rounded-xl text-[10px] transition-all shadow-3xs"
                        >
                          Mark Resolved & Clear Alarm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Event Stream Logs */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 mt-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="text-emerald-500 animate-pulse" size={16} />
              <h3 className="font-sans font-bold text-slate-900 text-xs uppercase">LIVE EVENTSTREAM (SSE PIPELINE)</h3>
            </div>
            <span className="text-[9px] font-sans font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg shadow-3xs">
              STREAMING ACTIVE
            </span>
          </div>

          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 h-44 overflow-y-auto text-[10px] font-mono space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 shadow-2xs">
            {streamLogs.map((log, idx) => (
              <div key={idx} className="text-slate-600 border-b border-slate-100 pb-1.5 flex items-start gap-1 font-medium">
                <span className="text-emerald-600 shrink-0">❯</span>
                <span>{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Right Column: Live map control & Environment dials (8 cols) */}
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">LIVE OPERATIONAL MONITORING MAP</h3>
              <p className="text-[11px] text-slate-400 font-sans font-medium">Continuous oversight of active vehicle tracking & sensor statuses</p>
            </div>

            {/* Select Mine Site Complex */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-semibold text-slate-500">Mine Facility:</span>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-slate-50 text-slate-800 border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs font-sans font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Render Map */}
          <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs">
            <LiveMineMap
              vehicles={filteredVehicles}
              zones={zones}
              selectedVehicleId={selectedVehicle?.id}
              onSelectVehicle={setSelectedVehicle}
              weatherCondition={weatherCondition}
            />
          </div>
        </div>

        {/* Environmental Station Weather controls */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cloud className="text-blue-500" size={16} />
            <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">CONTROL ROOM WEATHER & ATMOSPHERIC EMULATOR</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans text-xs">
            {(['clear', 'dusty', 'rainy', 'foggy'] as const).map((cond) => {
              const isCurrent = weatherCondition === cond;
              const details = 
                cond === 'clear' ? 'Visibility: 850m' :
                cond === 'dusty' ? 'Visibility: 250m' :
                cond === 'rainy' ? 'Visibility: 400m' : 'Visibility: 90m';
              return (
                <button
                  key={cond}
                  onClick={() => changeWeather(cond)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-200 text-slate-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="font-bold uppercase tracking-wider text-[11px] mb-1">{cond}</div>
                  <div className="text-[9px] text-slate-400 font-semibold">{details}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
