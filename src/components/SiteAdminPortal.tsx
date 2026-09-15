import { useState, FormEvent } from 'react';
import { MineSite, Zone, Vehicle, SensorLog, IncidentReport } from '../types';
import { MapPin, Plus, Sliders, ShieldCheck, ClipboardList, HardDrive, AlertTriangle } from 'lucide-react';

interface SiteAdminPortalProps {
  sites: MineSite[];
  zones: Zone[];
  vehicles: Vehicle[];
  incidents: IncidentReport[];
  sensorLogs: SensorLog[];
  onCreateZone: (zone: Omit<Zone, 'id'>) => Promise<void>;
  onCreateVehicle: (vehicle: Omit<Vehicle, 'id' | 'speed' | 'heading' | 'coordinates' | 'sensors'>) => Promise<void>;
}

export default function SiteAdminPortal({
  sites,
  zones,
  vehicles,
  incidents,
  sensorLogs,
  onCreateZone,
  onCreateVehicle,
}: SiteAdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'fleets' | 'auditing'>('infrastructure');

  // Zone Form State
  const [zoneSiteId, setZoneSiteId] = useState<string>(sites[0]?.id || '');
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneType, setZoneType] = useState<'haul_road' | 'pit' | 'stockpile' | 'dump' | 'maintenance'>('haul_road');
  const [zoneRisk, setZoneRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [zoneSpeedLimit, setZoneSpeedLimit] = useState<number>(40);
  const [isSubmittingZone, setIsSubmittingZone] = useState<boolean>(false);

  // Vehicle Form State
  const [vehSiteId, setVehSiteId] = useState<string>(sites[0]?.id || '');
  const [vehName, setVehName] = useState<string>('');
  const [vehType, setVehType] = useState<'haul_truck' | 'excavator' | 'loader' | 'dozer' | 'support'>('haul_truck');
  const [vehOperator, setVehOperator] = useState<string>('');
  const [isSubmittingVeh, setIsSubmittingVeh] = useState<boolean>(false);

  // Handle Zone Submit
  const handleZoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    setIsSubmittingZone(true);
    try {
      await onCreateZone({
        siteId: zoneSiteId,
        name: zoneName,
        type: zoneType,
        riskLevel: zoneRisk,
        speedLimit: Number(zoneSpeedLimit)
      });
      setZoneName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingZone(false);
    }
  };

  // Handle Vehicle Submit
  const handleVehicleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehName.trim() || !vehOperator.trim()) return;
    setIsSubmittingVeh(true);
    try {
      await onCreateVehicle({
        siteId: vehSiteId,
        name: vehName,
        type: vehType,
        operatorName: vehOperator,
        status: 'active'
      });
      setVehName('');
      setVehOperator('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVeh(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`px-5 py-3 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'infrastructure'
              ? 'border-[#C05A3E] text-[#C05A3E] bg-[#C05A3E]/5'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapPin size={14} />
          <span>Zone & Infrastructure Admin</span>
        </button>
        <button
          onClick={() => setActiveTab('fleets')}
          className={`px-5 py-3 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fleets'
              ? 'border-[#C05A3E] text-[#C05A3E] bg-[#C05A3E]/5'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <HardDrive size={14} />
          <span>Hardware & Fleet Config</span>
        </button>
        <button
          onClick={() => setActiveTab('auditing')}
          className={`px-5 py-3 text-xs font-sans font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'auditing'
              ? 'border-[#C05A3E] text-[#C05A3E] bg-[#C05A3E]/5'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={14} />
          <span>Historical Audits & Logs</span>
        </button>
      </div>

      {/* Infrastructure Tab */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Zone Form */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <Plus className="text-[#C05A3E]" size={16} />
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">PROVISION NEW MINE ZONE</h3>
            </div>

            <form onSubmit={handleZoneSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Deploy to Mine Site:</label>
                <select
                  value={zoneSiteId}
                  onChange={(e) => setZoneSiteId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Zone Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Stockpile Exit B"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#C05A3E] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Zone Category:</label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                >
                  <option value="haul_road">Haul Road (Main Link)</option>
                  <option value="pit">Excavation Pit (High Risk Area)</option>
                  <option value="stockpile">Stockpile (Staging Point)</option>
                  <option value="dump">Dumping Apron</option>
                  <option value="maintenance">Maintenance Workshop Siding</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold block">Risk Matrix:</label>
                  <select
                    value={zoneRisk}
                    onChange={(e) => setZoneRisk(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold block">Speed Limit (km/h):</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={zoneSpeedLimit}
                    onChange={(e) => setZoneSpeedLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingZone}
                className="w-full mt-4 bg-[#C05A3E] text-white hover:bg-[#B04E33] font-sans font-bold py-2.5 px-4 rounded-xl shadow-2xs transition-all disabled:opacity-50"
              >
                {isSubmittingZone ? 'Provisioning...' : 'Provision Infrastructure Zone'}
              </button>
            </form>
          </div>

          {/* Zones Inventory List */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
              <h3 className="font-sans font-bold text-slate-900 text-sm">PROVISIONED SITE GEOMETRY (ZONES)</h3>
              <span className="text-[10px] font-sans font-bold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-3xs">
                Active Count: {zones.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-sans text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Zone Name</th>
                    <th className="py-3 px-3">Site Complex</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Risk Assessment</th>
                    <th className="py-3 px-3">Speed Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((z) => (
                    <tr key={z.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-slate-800">{z.name}</td>
                      <td className="py-3.5 px-3 text-slate-500">{sites.find(s => s.id === z.siteId)?.name || z.siteId}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-slate-50 border border-slate-200/60 text-slate-500 shadow-3xs">
                          {z.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                          z.riskLevel === 'high' ? 'bg-red-50 text-red-600 border-red-100' : z.riskLevel === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {z.riskLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#C05A3E]">{z.speedLimit} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fleets config Tab */}
      {activeTab === 'fleets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register Vehicle Form */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <Plus className="text-[#C05A3E]" size={16} />
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">COMMISSION HEAVY VEHICLE</h3>
            </div>

            <form onSubmit={handleVehicleSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Deploy to Mine Site:</label>
                <select
                  value={vehSiteId}
                  onChange={(e) => setVehSiteId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Vehicle Name/ID:</label>
                <input
                  type="text"
                  placeholder="e.g. Cat 797F #25"
                  value={vehName}
                  onChange={(e) => setVehName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#C05A3E] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Vehicle Category:</label>
                <select
                  value={vehType}
                  onChange={(e) => setVehType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
                >
                  <option value="haul_truck">Heavy Haul Truck</option>
                  <option value="excavator">Excavator / Shovel</option>
                  <option value="loader">Wheel Loader</option>
                  <option value="dozer">Track Bulldozer</option>
                  <option value="support">Safety / Support Utility</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold block">Operator License Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Mercer"
                  value={vehOperator}
                  onChange={(e) => setVehOperator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#C05A3E] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingVeh}
                className="w-full mt-4 bg-[#C05A3E] text-white hover:bg-[#B04E33] font-sans font-bold py-2.5 px-4 rounded-xl shadow-2xs transition-all disabled:opacity-50"
              >
                {isSubmittingVeh ? 'Commissioning...' : 'Commission Fleet Vehicle'}
              </button>
            </form>
          </div>

          {/* Heavy Vehicles Hardware Fleet Grid */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
              <h3 className="font-sans font-bold text-slate-900 text-sm">COMMISSIONED HEAVY FLEET HARDWARE</h3>
              <span className="text-[10px] font-sans font-bold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-3xs">
                Active Fleet: {vehicles.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-slate-50/40 border border-slate-150 p-4 rounded-xl space-y-3.5 font-sans text-xs">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{v.type.replace('_', ' ')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                      v.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operator:</span>
                      <span className="text-slate-700 font-bold">{v.operatorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Site deployment:</span>
                      <span className="text-slate-700">{sites.find(s => s.id === v.siteId)?.name || v.siteId}</span>
                    </div>
                  </div>

                  {/* Hardware / Sensor Array */}
                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">Sensor Bus Diagnostics</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                      {(Object.entries(v.sensors) as [keyof typeof v.sensors, string][]).map(([sensor, state]) => (
                        <div key={sensor} className="flex items-center gap-1.5 justify-between bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg shadow-3xs">
                          <span className="text-slate-500 uppercase text-[8px] font-bold">{sensor.substring(0, 10)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                            state === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>{state.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historical Auditing Tab */}
      {activeTab === 'auditing' && (
        <div className="space-y-6">
          {/* Incidents auditing */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <AlertTriangle className="text-red-500" size={16} />
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">HISTORICAL INCIDENT & NEAR-MISS DATABASE</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-sans text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Vehicle / Operator</th>
                    <th className="py-3 px-3">Anomaly Type</th>
                    <th className="py-3 px-3">Log Summary Description</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3 text-[11px] text-slate-400 font-mono">{new Date(inc.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block">{inc.vehicleName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{inc.operatorName}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{inc.type}</td>
                      <td className="py-3.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={inc.description}>{inc.description}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                          inc.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : inc.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          inc.status === 'closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{inc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw diagnostic log streams */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <Sliders className="text-slate-400" size={16} />
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase">RAW TELEMETRY & SENSOR BUS AUDIT LOGS</h3>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-96 overflow-y-auto space-y-2 shadow-2xs">
              {sensorLogs.map((log) => (
                <div key={log.id} className="font-mono text-[11px] flex items-start gap-3 border-b border-slate-200/40 pb-2.5">
                  <span className="text-slate-400 shrink-0 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-[#C05A3E] shrink-0 uppercase font-bold">[{log.vehicleName}]</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase shrink-0 border ${
                    log.level === 'error' ? 'bg-red-50 text-red-600 border-red-100' : log.level === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{log.source}</span>
                  <span className="text-slate-700 font-medium">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
