import { useState } from 'react';
import { MineSite, Zone, Vehicle, IncidentReport, Alert } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { Landmark, TrendingUp, AlertTriangle, CloudRain, Clock, Percent, ShieldCheck } from 'lucide-react';
import LiveMineMap from './LiveMineMap';

interface FleetManagerPortalProps {
  sites: MineSite[];
  zones: Zone[];
  vehicles: Vehicle[];
  alerts: Alert[];
  incidents: IncidentReport[];
  weatherCondition: 'clear' | 'dusty' | 'rainy' | 'foggy';
}

export default function FleetManagerPortal({
  sites,
  zones,
  vehicles,
  alerts,
  incidents,
  weatherCondition,
}: FleetManagerPortalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'heatmaps' | 'performance'>('kpis');

  // Filter based on selected site
  const filteredVehicles = vehicles.filter(v => selectedSiteId === 'all' || v.siteId === selectedSiteId);
  const filteredAlerts = alerts.filter(a => selectedSiteId === 'all' || a.siteId === selectedSiteId);

  // Compute stats
  const totalVehicles = filteredVehicles.length;
  const activeVehicles = filteredVehicles.filter(v => v.status === 'active').length;
  const totalActiveAlerts = filteredAlerts.filter(a => a.status !== 'resolved').length;
  const incidentCount = incidents.length;

  // Mock fleet KPI metrics
  const utilizationRate = selectedSiteId === 'all' ? 84.5 : selectedSiteId === 'db-01' ? 89.2 : 75.1;
  const avgHaulCycleMins = selectedSiteId === 'all' ? 24.8 : selectedSiteId === 'db-01' ? 22.1 : 29.5;
  const avgIdleTimePercent = selectedSiteId === 'all' ? 12.4 : selectedSiteId === 'db-01' ? 10.1 : 16.2;
  const fogDowntimeHrs = selectedSiteId === 'all' ? 18.5 : selectedSiteId === 'db-01' ? 4.5 : 14.0;

  // Chart 1: Site comparison data
  const siteComparisonData = [
    { name: 'Dhanbad Coalfields', 'Safety Rating': 94, 'Fleet Active': 3, 'Critical Alerts': 0 },
    { name: 'Singareni Open Cast', 'Safety Rating': 78, 'Fleet Active': 1, 'Critical Alerts': 1 },
  ];

  // Chart 2: Historical Safety Patterns / Hazards Over Time
  const historicalSafetyData = [
    { day: 'Mon', 'Overspeed Warnings': 4, 'Sensor Faults': 2, 'Near Misses': 1 },
    { day: 'Tue', 'Overspeed Warnings': 5, 'Sensor Faults': 1, 'Near Misses': 0 },
    { day: 'Wed', 'Overspeed Warnings': 3, 'Sensor Faults': 3, 'Near Misses': 2 },
    { day: 'Thu', 'Overspeed Warnings': 8, 'Sensor Faults': 0, 'Near Misses': 1 },
    { day: 'Fri', 'Overspeed Warnings': 2, 'Sensor Faults': 1, 'Near Misses': 0 },
    { day: 'Sat', 'Overspeed Warnings': 6, 'Sensor Faults': 4, 'Near Misses': 3 },
    { day: 'Sun', 'Overspeed Warnings': 1, 'Sensor Faults': 2, 'Near Misses': 1 },
  ];

  // Chart 3: Haul Cycle Times distribution by Shift
  const haulCycleData = [
    { shift: 'Morning', 'Dhanbad Target': 20, 'Actual Dhanbad': 22, 'Singareni Actual': 28 },
    { shift: 'Day', 'Dhanbad Target': 20, 'Actual Dhanbad': 21, 'Singareni Actual': 30 },
    { shift: 'Night', 'Dhanbad Target': 20, 'Actual Dhanbad': 24, 'Singareni Actual': 31 },
  ];

  return (
    <div className="space-y-6">
      {/* Site Filters & Controls */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Landmark className="text-[#C05A3E]" size={18} />
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-sm tracking-tight uppercase">PLATFORM-WIDE FLEET COMMAND PORTAL</h3>
            <p className="text-[10px] text-slate-400 font-sans font-medium">Exercises multi-site administrative control and regional KPI analytics</p>
          </div>
        </div>

        {/* Site dropdown */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-sans font-semibold text-slate-500">Regional Filter:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-200/60 px-3.5 py-1.5 rounded-xl text-xs font-sans font-medium focus:outline-none focus:border-[#C05A3E] transition-all"
          >
            <option value="all">Global (All Regional Sites)</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['kpis', 'heatmaps', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4.5 py-2 rounded-xl font-sans text-xs font-bold border transition-all ${
              activeSubTab === tab
                ? 'bg-[#C05A3E] border-transparent text-white shadow-xs'
                : 'bg-white border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 shadow-3xs'
            }`}
          >
            {tab === 'kpis' && 'High-Level Analytics & KPIs'}
            {tab === 'heatmaps' && 'Predictive Hotspot Heatmaps'}
            {tab === 'performance' && 'Fleet Operations & Downtime'}
          </button>
        ))}
      </div>

      {activeSubTab === 'kpis' && (
        <div className="space-y-6">
          {/* Super Admin Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Fleet Utilization</span>
                <Percent size={14} className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{utilizationRate}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Fleet Active Time vs Scheduled Limit</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Avg Haul Cycle</span>
                <Clock size={14} className="text-[#C05A3E]" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{avgHaulCycleMins} mins</div>
              <div className="text-[10px] text-slate-400 font-medium">Average complete circuit duration</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Idle Losses %</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{avgIdleTimePercent}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Safe operating efficiency margin</div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Fog / Weather Downtime</span>
                <CloudRain size={14} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{fogDowntimeHrs} hrs</div>
              <div className="text-[10px] text-slate-400 font-medium">Monthly weather-related idle count</div>
            </div>
          </div>

          {/* KPI Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Multi-Site Comparisons */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
              <h4 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#C05A3E]" />
                Regional Site Safety Performance Comparisons
              </h4>

              <div className="h-64 font-sans text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={siteComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontFamily: 'sans-serif', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                    <Legend />
                    <Bar dataKey="Safety Rating" fill="#55A380" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Critical Alerts" fill="#D97063" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Safety Patterns (Phase 4) */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
              <h4 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#C05A3E]" />
                Hazard Frequency Patterns (Weekly Rolling Audit)
              </h4>

              <div className="h-64 font-sans text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalSafetyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontFamily: 'sans-serif', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="Overspeed Warnings" stroke="#E0A05A" fill="rgba(224, 160, 90, 0.05)" />
                    <Area type="monotone" dataKey="Near Misses" stroke="#D97063" fill="rgba(217, 112, 99, 0.05)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Hotspot Heatmaps Tab */}
      {activeSubTab === 'heatmaps' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-sans font-bold text-slate-800">ACTIVE HAZARD HOTSPOTS (MINE-WIDE ANALYSIS)</h4>
                <p className="text-[11px] text-slate-400 font-sans font-medium">Visualizes cumulative near-miss locations and speed infractions</p>
              </div>
              <span className="self-start sm:self-auto text-[9px] font-sans bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold uppercase shadow-3xs">
                Predictive Risk Hotspots Enabled
              </span>
            </div>

            {/* Live Mine map embedded in heatmap overlay mode */}
            <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs">
              <LiveMineMap
                vehicles={filteredVehicles}
                zones={zones}
                weatherCondition={weatherCondition}
                isHeatmapMode={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance & Continuity Tab */}
      {activeSubTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
            <h4 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">Haul Cycle Operations by Shift</h4>
            <div className="h-64 font-sans text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={haulCycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shift" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontFamily: 'sans-serif', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="Actual Dhanbad" stroke="#C05A3E" strokeWidth={2} />
                  <Line type="monotone" dataKey="Singareni Actual" stroke="#4A5568" strokeWidth={2} />
                  <Line type="monotone" dataKey="Dhanbad Target" stroke="#cbd5e1" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operational Continuity Summary Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <h4 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">Operational Continuity Insights</h4>
              <p className="text-[11px] text-slate-500 font-sans font-medium leading-relaxed">
                Super Admin diagnostics indicate atmospheric fog/dust conditions represent the highest contributor to haul circuit delay. 
                Integrating collision-avoidance telemetry mitigates speed limits constraints under foggy segments.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 font-sans text-xs">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span className="text-slate-400 font-normal">Unrestricted circuit flow:</span>
                <span className="text-emerald-600 font-bold">94.2%</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span className="text-slate-400 font-normal">Fleet efficiency losses:</span>
                <span className="text-amber-600 font-bold">5.8%</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span className="text-slate-400 font-normal">Preventable collisions:</span>
                <span className="text-emerald-600 font-bold">0.0% (Cleared)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
