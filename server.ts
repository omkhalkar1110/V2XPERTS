import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { MineState, Vehicle, Alert, Zone, MineSite, IncidentReport, SensorLog } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Global In-Memory Mine State
const initialSites: MineSite[] = [
  { id: "db-01", name: "Dhanbad Coalfields Complex", region: "Jharkhand, India", status: "operational" },
  { id: "sc-02", name: "Singareni Open Cast Project", region: "Telangana, India", status: "restricted" },
];

const initialZones: Zone[] = [
  { id: "zone-1", siteId: "db-01", name: "Jharia Pit Excavation", type: "pit", riskLevel: "high", speedLimit: 30 },
  { id: "zone-2", siteId: "db-01", name: "Dhanbad Haul Road Alpha", type: "haul_road", riskLevel: "medium", speedLimit: 50 },
  { id: "zone-3", siteId: "db-01", name: "Godavari Stockpile North", type: "stockpile", riskLevel: "low", speedLimit: 20 },
  { id: "zone-4", siteId: "db-01", name: "Neyveli Lignite Dump Zone", type: "dump", riskLevel: "medium", speedLimit: 40 },
  { id: "zone-5", siteId: "sc-02", name: "Singareni South Pit", type: "pit", riskLevel: "high", speedLimit: 25 },
];

const initialVehicles: Vehicle[] = [
  {
    id: "v-1",
    siteId: "db-01",
    name: "Tata Prima HEMM #04",
    type: "haul_truck",
    operatorName: "Rajesh Kumar",
    status: "active",
    speed: 42,
    heading: 120,
    coordinates: { x: 35, y: 45 },
    sensors: { radar: "online", lidar: "online", gps: "online", telemetryLink: "online" }
  },
  {
    id: "v-2",
    siteId: "db-01",
    name: "BEML BG605 Dump Truck #12",
    type: "haul_truck",
    operatorName: "Amit Sharma",
    status: "active",
    speed: 48, // Close to 50 speed limit
    heading: 90,
    coordinates: { x: 55, y: 50 },
    sensors: { radar: "online", lidar: "online", gps: "online", telemetryLink: "online" }
  },
  {
    id: "v-3",
    siteId: "db-01",
    name: "BEML Excavator BE1600 #01",
    type: "excavator",
    operatorName: "Vikram Patel",
    status: "idle",
    speed: 0,
    heading: 270,
    coordinates: { x: 20, y: 30 },
    sensors: { radar: "online", lidar: "online", gps: "online", telemetryLink: "online" }
  },
  {
    id: "v-4",
    siteId: "sc-02",
    name: "Komatsu HD785 #07",
    type: "haul_truck",
    operatorName: "Priya Nair",
    status: "active",
    speed: 28, // Over Singareni limit (25)
    heading: 15,
    coordinates: { x: 40, y: 75 },
    sensors: { radar: "online", lidar: "offline", gps: "online", telemetryLink: "online" } // Lidar offline!
  }
];

const initialAlerts: Alert[] = [
  {
    id: "alert-1",
    vehicleId: "v-4",
    vehicleName: "Komatsu HD785 #07",
    siteId: "sc-02",
    type: "sensor_offline",
    severity: "warning",
    message: "DGMS Safety Alert: Onboard sensor [LiDAR] offline/unresponsive on Komatsu HD785 #07.",
    timestamp: new Date().toISOString(),
    status: "active"
  }
];

const initialIncidents: IncidentReport[] = [
  {
    id: "inc-1",
    vehicleId: "v-2",
    vehicleName: "BEML BG605 Dump Truck #12",
    operatorName: "Amit Sharma",
    type: "Near-Miss collision warning",
    description: "Vehicle exceeded recommended passing envelope on Dhanbad Haul Road Alpha during low visibility sweep. Incident flagged for DGMS compliance audit.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    severity: "medium",
    status: "investigating"
  }
];

const initialSensorLogs: SensorLog[] = [
  { id: "log-1", timestamp: new Date(Date.now() - 10000).toISOString(), vehicleId: "v-1", vehicleName: "Tata Prima HEMM #04", source: "gps", level: "info", message: "GPS lock stabilized: 12 satellites locked." },
  { id: "log-2", timestamp: new Date(Date.now() - 9000).toISOString(), vehicleId: "v-2", vehicleName: "BEML BG605 Dump Truck #12", source: "radar", level: "info", message: "Forward radar scanning: Obstacles cleared at 150m." },
  { id: "log-3", timestamp: new Date(Date.now() - 8000).toISOString(), vehicleId: "v-4", vehicleName: "Komatsu HD785 #07", source: "lidar", level: "error", message: "DGMS Telemetry Loss: LiDAR connection timed out on bus address 0x3F." },
];

let mineState: MineState = {
  sites: initialSites,
  zones: initialZones,
  vehicles: initialVehicles,
  alerts: initialAlerts,
  incidents: initialIncidents,
  sensorLogs: initialSensorLogs,
  weather: {
    condition: "clear",
    visibility: 850, // meters
    windSpeed: 14,
    temperature: 28,
  }
};

// Store active SSE clients
let sseClients: any[] = [];

function broadcastStateUpdate(event: string, data: any) {
  sseClients.forEach(client => {
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Auto-Simulation Tick (every 3 seconds)
setInterval(() => {
  // Move vehicles slightly to simulate live tracking
  mineState.vehicles = mineState.vehicles.map(v => {
    if (v.status !== "active") return v;
    
    // Simulate minor movement on coordinate plane (bounded 5% to 95%)
    let dx = Math.sin(v.heading * Math.PI / 180) * 1.5;
    let dy = Math.cos(v.heading * Math.PI / 180) * 1.5;
    
    let newX = Math.min(95, Math.max(5, v.coordinates.x + dx));
    let newY = Math.min(95, Math.max(5, v.coordinates.y + dy));
    
    // If we hit boundary, change direction
    let newHeading = v.heading;
    if (newX <= 5 || newX >= 95 || newY <= 5 || newY >= 95) {
      newHeading = (v.heading + 140) % 360;
    }

    // Slightly fluctuate speed
    let speedDelta = (Math.random() - 0.5) * 4;
    let newSpeed = Math.max(10, Math.min(65, Math.round(v.speed + speedDelta)));

    return {
      ...v,
      coordinates: { x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) },
      heading: Math.round(newHeading),
      speed: newSpeed
    };
  });

  // Evaluate Rule Engine for active vehicles
  mineState.vehicles.forEach(v => {
    if (v.status !== "active") return;

    // Rule 1: Overspeed Alert
    // Find vehicle's current zone ( Dhanbad / Singareni active zones )
    const zone = mineState.zones.find(z => z.siteId === v.siteId && 
      Math.abs(v.coordinates.x - 50) < 35 && Math.abs(v.coordinates.y - 50) < 35 // Mock occupancy
    );
    const speedLimit = zone ? zone.speedLimit : 40;

    const existingOverspeed = mineState.alerts.find(a => a.vehicleId === v.id && a.type === "overspeed" && a.status === "active");

    if (v.speed > speedLimit && !existingOverspeed) {
      const newAlert: Alert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vehicleId: v.id,
        vehicleName: v.name,
        siteId: v.siteId,
        type: "overspeed",
        severity: "warning",
        message: `Overspeed Warning: Traveling at ${v.speed} km/h (Limit: ${speedLimit} km/h).`,
        timestamp: new Date().toISOString(),
        status: "active"
      };
      mineState.alerts.unshift(newAlert);
      
      // Log it
      mineState.sensorLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        vehicleId: v.id,
        vehicleName: v.name,
        source: "telemetry",
        level: "warning",
        message: `Overspeed alert triggered: ${v.speed} km/h.`
      });

      broadcastStateUpdate("alert", newAlert);
    }

    // Rule 2: Unsafe proximity/tailgating simulation (10% chance for active vehicle when in proximity)
    const existingTailgating = mineState.alerts.find(a => a.vehicleId === v.id && a.type === "tailgating" && a.status === "active");
    if (Math.random() < 0.05 && !existingTailgating) {
      const newAlert: Alert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vehicleId: v.id,
        vehicleName: v.name,
        siteId: v.siteId,
        type: "tailgating",
        severity: "critical",
        message: "Critical following distance breached. Unsafe proximity detected.",
        timestamp: new Date().toISOString(),
        status: "active"
      };
      mineState.alerts.unshift(newAlert);

      mineState.sensorLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        vehicleId: v.id,
        vehicleName: v.name,
        source: "radar",
        level: "error",
        message: "Radar proximity sensor warning: Forward distance < 12 meters."
      });

      broadcastStateUpdate("alert", newAlert);
    }

    // Rule 3: Low visibility hazard
    const existingVisibility = mineState.alerts.find(a => a.vehicleId === v.id && a.type === "low_visibility" && a.status === "active");
    if (mineState.weather.visibility < 150 && !existingVisibility) {
      const newAlert: Alert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vehicleId: v.id,
        vehicleName: v.name,
        siteId: v.siteId,
        type: "low_visibility",
        severity: "warning",
        message: `Extremely low visibility warning (${mineState.weather.visibility}m). Reduce speeds immediately.`,
        timestamp: new Date().toISOString(),
        status: "active"
      };
      mineState.alerts.unshift(newAlert);
      broadcastStateUpdate("alert", newAlert);
    }
  });

  // Keep logs list readable (max 100 entries)
  if (mineState.sensorLogs.length > 100) {
    mineState.sensorLogs = mineState.sensorLogs.slice(0, 100);
  }

  // Stream active state tick
  broadcastStateUpdate("tick", {
    vehicles: mineState.vehicles,
    weather: mineState.weather
  });
}, 3000);

// API Endpoints
app.get("/api/state", (req, res) => {
  res.json(mineState);
});

// SSE Route for Real-Time Streaming Pipeline
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Send initial state immediately
  res.write(`event: init\n`);
  res.write(`data: ${JSON.stringify(mineState)}\n\n`);

  const client = res;
  sseClients.push(client);

  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== client);
  });
});

// Resolve Alert
app.post("/api/alerts/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { notes, resolvedBy } = req.body;

  let alertFound = false;
  mineState.alerts = mineState.alerts.map(a => {
    if (a.id === id) {
      alertFound = true;
      return {
        ...a,
        status: "resolved",
        resolvedBy: resolvedBy || "Operator Room",
        resolutionNotes: notes || "Cleared by Control Room operator after manual inspection."
      };
    }
    return a;
  });

  if (alertFound) {
    const resolvedAlert = mineState.alerts.find(a => a.id === id);
    broadcastStateUpdate("alert_resolved", resolvedAlert);
    res.json({ success: true, alert: resolvedAlert });
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// Trigger Acknowledge
app.post("/api/alerts/:id/acknowledge", (req, res) => {
  const { id } = req.params;
  let alertFound = false;
  mineState.alerts = mineState.alerts.map(a => {
    if (a.id === id) {
      alertFound = true;
      return { ...a, status: "acknowledged" };
    }
    return a;
  });

  if (alertFound) {
    const updatedAlert = mineState.alerts.find(a => a.id === id);
    broadcastStateUpdate("alert_acknowledged", updatedAlert);
    res.json({ success: true, alert: updatedAlert });
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// Create Zone (Site Admin config)
app.post("/api/zones", (req, res) => {
  const { siteId, name, type, riskLevel, speedLimit } = req.body;
  if (!siteId || !name || !type || !riskLevel || !speedLimit) {
    return res.status(400).json({ error: "Missing required zone fields." });
  }

  const newZone: Zone = {
    id: `zone-${Date.now()}`,
    siteId,
    name,
    type,
    riskLevel,
    speedLimit: Number(speedLimit)
  };

  mineState.zones.push(newZone);
  broadcastStateUpdate("zone_created", newZone);
  
  // Log configuration activity
  mineState.sensorLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    vehicleId: "system",
    vehicleName: "Site Admin Interface",
    source: "telemetry",
    level: "info",
    message: `New Zone added: [${name}] in Mine ${siteId}. Speed Limit: ${speedLimit} km/h.`
  });

  res.json({ success: true, zone: newZone });
});

// Create / Register Vehicle (Site Admin config)
app.post("/api/vehicles", (req, res) => {
  const { siteId, name, type, operatorName, status } = req.body;
  if (!siteId || !name || !type || !operatorName) {
    return res.status(400).json({ error: "Missing vehicle registration fields." });
  }

  const newVehicle: Vehicle = {
    id: `v-${Date.now()}`,
    siteId,
    name,
    type,
    operatorName,
    status: status || "active",
    speed: status === "active" ? 30 : 0,
    heading: 0,
    coordinates: { x: 50, y: 50 },
    sensors: { radar: "online", lidar: "online", gps: "online", telemetryLink: "online" }
  };

  mineState.vehicles.push(newVehicle);
  broadcastStateUpdate("vehicle_created", newVehicle);

  mineState.sensorLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    vehicleId: newVehicle.id,
    vehicleName: name,
    source: "telemetry",
    level: "info",
    message: `Registered new heavy fleet vehicle: [${name}] with Operator ${operatorName}.`
  });

  res.json({ success: true, vehicle: newVehicle });
});

// Update Weather (ERT / Site Admin simulation tool)
app.post("/api/weather", (req, res) => {
  const { condition, visibility, windSpeed, temperature } = req.body;
  
  mineState.weather = {
    condition: condition || mineState.weather.condition,
    visibility: Number(visibility) ?? mineState.weather.visibility,
    windSpeed: Number(windSpeed) ?? mineState.weather.windSpeed,
    temperature: Number(temperature) ?? mineState.weather.temperature,
  };

  broadcastStateUpdate("weather_changed", mineState.weather);
  
  mineState.sensorLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    vehicleId: "system",
    vehicleName: "Weather Station",
    source: "telemetry",
    level: "info",
    message: `Environmental state shifted: ${mineState.weather.condition.toUpperCase()}. Visibility at ${mineState.weather.visibility}m.`
  });

  res.json({ success: true, weather: mineState.weather });
});

// Trigger manual anomaly or sensor failure for active driver view / demo
app.post("/api/vehicles/:id/trigger-sensor-failure", (req, res) => {
  const { id } = req.params;
  const { sensor } = req.body; // e.g. 'lidar', 'radar', 'gps'

  let vehicleFound = false;
  mineState.vehicles = mineState.vehicles.map(v => {
    if (v.id === id) {
      vehicleFound = true;
      const updatedSensors = { ...v.sensors };
      updatedSensors[sensor as keyof typeof v.sensors] = "offline";
      return { ...v, sensors: updatedSensors };
    }
    return v;
  });

  if (vehicleFound) {
    const updatedV = mineState.vehicles.find(v => v.id === id)!;
    
    // Immediately trigger Equipment Failure alert
    const newAlert: Alert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vehicleId: updatedV.id,
      vehicleName: updatedV.name,
      siteId: updatedV.siteId,
      type: "sensor_offline",
      severity: "critical",
      message: `CRITICAL: Onboard ${sensor.toUpperCase()} sensor on vehicle [${updatedV.name}] went offline.`,
      timestamp: new Date().toISOString(),
      status: "active"
    };

    mineState.alerts.unshift(newAlert);
    broadcastStateUpdate("alert", newAlert);

    mineState.sensorLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      vehicleId: updatedV.id,
      vehicleName: updatedV.name,
      source: sensor,
      level: "error",
      message: `${sensor.toUpperCase()} telemetry link lost or device disconnected.`
    });

    res.json({ success: true, vehicle: updatedV });
  } else {
    res.status(404).json({ error: "Vehicle not found" });
  }
});

// Update vehicle telemetry (e.g. from the interactive operator/driver view)
app.post("/api/vehicles/:id/telemetry", (req, res) => {
  const { id } = req.params;
  const { speed, heading, coordinates, sensors } = req.body;

  let vehicleFound = false;
  mineState.vehicles = mineState.vehicles.map(v => {
    if (v.id === id) {
      vehicleFound = true;
      return {
        ...v,
        speed: speed !== undefined ? Number(speed) : v.speed,
        heading: heading !== undefined ? Number(heading) : v.heading,
        coordinates: coordinates ? { x: Number(coordinates.x), y: Number(coordinates.y) } : v.coordinates,
        sensors: sensors ? { ...v.sensors, ...sensors } : v.sensors,
      };
    }
    return v;
  });

  if (vehicleFound) {
    const updatedV = mineState.vehicles.find(v => v.id === id)!;
    broadcastStateUpdate("vehicle_updated", updatedV);
    res.json({ success: true, vehicle: updatedV });
  } else {
    res.status(404).json({ error: "Vehicle not found" });
  }
});

// Helper to compute local heuristic fallback safety data when Gemini API is unavailable or busy
function computeLocalHeuristic(
  radarStatus: string,
  lidarStatus: string,
  gpsStatus: string,
  speed: number,
  weather: string
) {
  let riskScore = 15;
  let collisionProb = 5;
  let recommendedSpeed = 45;
  let explanation = "Optimal trajectory: Standard haul profile, dry surfaces, and normal speed values. DGMS safe tracking envelope is fully nominal. Speed advisory is 45 km/h.";

  if (weather === "foggy" || weather === "rainy") {
    riskScore = 75;
    collisionProb = 45;
    recommendedSpeed = 20;
    explanation = `DGMS Monsoon Advisory: Elevated track moisture (weather: ${weather}) restricts optical range. HEMM safety guidelines demand speed caps of 20 km/h. Maintain a 30m distance envelope from leading vehicles.`;
  } else if (lidarStatus === "offline" || radarStatus === "offline") {
    riskScore = 85;
    collisionProb = 65;
    recommendedSpeed = 15;
    explanation = `DGMS Telemetry Violation: Onboard ${lidarStatus === "offline" ? "LiDAR" : "Radar"} cluster is unresponsive on CAN-bus 2. Anti-collision systems compromised. Proceed immediately to maintenance siding at <15 km/h.`;
  } else if (Number(speed) > 40) {
    riskScore = 45;
    collisionProb = 20;
    recommendedSpeed = 35;
    explanation = `DGMS Speed Advisory: Approaching maximum operating limit of 40 km/h on active haul road. Radars indicate normal stopping distances, but thermal tire load suggests minor braking delays. Cap travel speed at 35 km/h.`;
  }

  return {
    riskScore,
    collisionProbability: collisionProb,
    recommendedSpeed,
    explanation,
    isMock: true
  };
}

// Gemini-Powered Predictive Safety Guidance Route
app.post("/api/predictive-safety", async (req, res) => {
  const { radarStatus, lidarStatus, gpsStatus, speed, weather, zoneType } = req.body;
  
  const client = getGeminiClient();

  if (!client) {
    const fallbackData = computeLocalHeuristic(radarStatus, lidarStatus, gpsStatus, Number(speed), weather);
    return res.json(fallbackData);
  }

  try {
    const prompt = `You are a real-time mining safety ML copilot. Evaluate safety risk for a mining vehicle complying with DGMS (Directorate General of Mines Safety, India) guidelines:
    - Vehicle speed: ${speed} km/h
    - Onboard sensors: Radar (${radarStatus}), LiDAR (${lidarStatus}), GPS (${gpsStatus})
    - Weather / Environmental condition: ${weather} (could involve high humidity, monsoon downpours, or heavy coal dust storms)
    - Mine Zone category: ${zoneType}
    
    Calculate or predict the following 4 fields conforming to DGMS HEMM (Heavy Earth Moving Machinery) rules:
    1. riskScore (integer, 0 to 100, where 0 is perfect safety and 100 is immediate collision catastrophe)
    2. collisionProbability (integer, 0 to 100, probability of collision in next 60 seconds)
    3. recommendedSpeed (integer, in km/h)
    4. explanation (string, highly concise, objective, analytical safety explanation of about 2-3 sentences based on radar/LiDAR/weather safety parameters and referencing DGMS safety protocols)

    Your reply MUST be a strictly valid JSON object matching this schema:
    {
      "riskScore": number,
      "collisionProbability": number,
      "recommendedSpeed": number,
      "explanation": "string"
    }
    Ensure no additional markdown formatting outside the JSON object block itself. Just return the JSON content.`;

    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["riskScore", "collisionProbability", "recommendedSpeed", "explanation"],
          properties: {
            riskScore: { type: Type.INTEGER },
            collisionProbability: { type: Type.INTEGER },
            recommendedSpeed: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text.trim());
    return res.json({ ...data, isMock: false });
  } catch (error: any) {
    // Return precise dynamic fallback safety data silently without printing alarmist error stack traces
    const fallbackData = computeLocalHeuristic(radarStatus, lidarStatus, gpsStatus, Number(speed), weather);
    return res.json(fallbackData);
  }
});

// Vite Middleware & Production static asset handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mine Safety Platform Server running on http://localhost:${PORT}`);
  });
}

startServer();
