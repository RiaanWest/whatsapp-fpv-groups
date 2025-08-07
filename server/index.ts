import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { 
  getConnectionStatus, 
  connectWhatsApp, 
  disconnectWhatsApp, 
  getQRCode,
  getGroups, 
  updateGroupStatus, 
  syncGroups,
  getDetectedItems,
  getSoldItems
} from "./routes/whatsapp";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // WhatsApp API routes
  app.get("/api/whatsapp/status", getConnectionStatus);
  app.post("/api/whatsapp/connect", connectWhatsApp);
  app.post("/api/whatsapp/disconnect", disconnectWhatsApp);
  app.get("/api/whatsapp/qr", getQRCode);
  app.get("/api/whatsapp/groups", getGroups);
  app.put("/api/whatsapp/groups/:groupId", updateGroupStatus);
  app.post("/api/whatsapp/sync", syncGroups);
  app.get("/api/whatsapp/items", getDetectedItems);
  app.get("/api/whatsapp/items/sold", getSoldItems);

  return app;
}
