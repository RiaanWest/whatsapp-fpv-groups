import { RequestHandler } from "express";
import { whatsappService } from "../services/whatsappService";

export interface WhatsAppGroup {
  id: string;
  name: string;
  memberCount: number;
  isActive: boolean;
  lastActivity: string;
  description?: string;
  messagesPerDay?: number;
  itemsFound?: number;
}

export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  phoneNumber?: string;
  lastSync?: string;
  isConnecting?: boolean;
}

// Get WhatsApp connection status
export const getConnectionStatus: RequestHandler = (req, res) => {
  const status = whatsappService.getConnectionStatus();
  res.json(status);
};

// Connect to WhatsApp
export const connectWhatsApp: RequestHandler = async (req, res) => {
  try {
    await whatsappService.initialize();
    res.json({ message: "Connection initiated - scan QR code" });
  } catch (error) {
    console.error('Connection failed:', error);
    res.status(500).json({ error: "Failed to initialize WhatsApp connection" });
  }
};

// Disconnect from WhatsApp
export const disconnectWhatsApp: RequestHandler = async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ message: "Disconnected successfully" });
  } catch (error) {
    console.error('Disconnect failed:', error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
};

// Force disconnect and clear session
export const forceDisconnect: RequestHandler = async (req, res) => {
  try {
    await whatsappService.forceDisconnect();
    res.json({ message: "Force disconnected and session cleared" });
  } catch (error) {
    console.error('Force disconnect failed:', error);
    res.status(500).json({ error: "Failed to force disconnect" });
  }
};

// Get QR code for scanning
export const getQRCode: RequestHandler = (req, res) => {
  const qrCode = whatsappService.getQRCode();
  if (qrCode) {
    res.json({ qrCode });
  } else {
    res.status(404).json({ error: "QR code not available" });
  }
};

// Get all WhatsApp groups
export const getGroups: RequestHandler = async (req, res) => {
  try {
    const groups = await whatsappService.getGroups();
    res.json(groups);
  } catch (error) {
    console.error('Failed to get groups:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get groups" });
  }
};

// Update group monitoring status
export const updateGroupStatus: RequestHandler = (req, res) => {
  const { groupId } = req.params;
  const { isActive } = req.body;
  
  if (!whatsappService.getConnectionStatus().isConnected) {
    return res.status(400).json({ error: "WhatsApp not connected" });
  }
  
  try {
    whatsappService.setGroupActive(groupId, isActive);
    res.json({ success: true, groupId, isActive });
  } catch (error) {
    console.error('Failed to update group status:', error);
    res.status(500).json({ error: "Failed to update group status" });
  }
};

// Force sync groups
export const syncGroups: RequestHandler = async (req, res) => {
  try {
    const stats = await whatsappService.forceSync();
    res.json({ 
      message: "Sync completed",
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(400).json({ error: "WhatsApp not connected or sync failed" });
  }
};

// Get detected FPV items
export const getDetectedItems: RequestHandler = (req, res) => {
  const items = whatsappService.getDetectedItems();
  res.json(items);
};

// Get sold items
export const getSoldItems: RequestHandler = (req, res) => {
  const items = whatsappService.getSoldItems();
  res.json(items);
};

// Get items from last 14 days
export const getItemsFromLast14Days: RequestHandler = async (req, res) => {
  try {
    const items = await whatsappService.getItemsFromLast14Days();
    res.json(items);
  } catch (error) {
    console.error('Failed to get items from last 14 days:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get items from last 14 days" });
  }
};

// Get sold items from last 14 days
export const getSoldItemsFromLast14Days: RequestHandler = async (req, res) => {
  try {
    const allItems = await whatsappService.getItemsFromLast14Days();
    const soldItems = allItems.filter(item => item.isSold);
    res.json(soldItems);
  } catch (error) {
    console.error('Failed to get sold items from last 14 days:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get sold items from last 14 days" });
  }
};
