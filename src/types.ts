export type Role = 'driver' | 'site_admin' | 'fleet_manager' | 'emergency_response';

export interface MineSite {
  id: string;
  name: string;
  region: string;
  status: 'operational' | 'restricted' | 'suspended';
}

export interface Zone {
  id: string;
  siteId: string;
  name: string;
  type: 'haul_road' | 'pit' | 'stockpile' | 'dump' | 'maintenance';
  riskLevel: 'low' | 'medium' | 'high';
  speedLimit: number; // km/h
}

export interface Vehicle {
  id: string;
  siteId: string;
  name: string; // e.g. "Cat 797F #04"
  type: 'haul_truck' | 'excavator' | 'loader' | 'dozer' | 'support';
  operatorName: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  speed: number; // km/h
  heading: number; // degrees
  coordinates: { x: number; y: number }; // Percentage 0-100 on the grid
  sensors: {
    radar: 'online' | 'offline' | 'error';
    lidar: 'online' | 'offline' | 'error';
    gps: 'online' | 'offline' | 'error';
    telemetryLink: 'online' | 'offline' | 'error';
  };
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  siteId: string;
  zoneId?: string;
  type: 'overspeed' | 'tailgating' | 'low_visibility' | 'sensor_offline' | 'collision_risk';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string; // ISO string
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface PredictiveRiskReport {
  riskScore: number; // 0-100
  collisionProbability: number; // 0-100
  recommendedSpeed: number; // km/h
  explanation: string;
  inputs: {
    radar: string;
    lidar: string;
    gps: string;
    weather: string;
  };
}

export interface IncidentReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  operatorName: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status: 'investigating' | 'closed';
}

export interface SensorLog {
  id: string;
  timestamp: string;
  vehicleId: string;
  vehicleName: string;
  source: 'radar' | 'lidar' | 'gps' | 'telemetry';
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface MineState {
  sites: MineSite[];
  zones: Zone[];
  vehicles: Vehicle[];
  alerts: Alert[];
  incidents: IncidentReport[];
  sensorLogs: SensorLog[];
  weather: {
    condition: 'clear' | 'dusty' | 'rainy' | 'foggy';
    visibility: number; // meters (e.g. 10-1000)
    windSpeed: number; // km/h
    temperature: number; // Celsius
  };
}
