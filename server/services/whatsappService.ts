import { Client, LocalAuth, GroupChat, Message } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { EventEmitter } from 'events';

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

export interface FPVItem {
  id: string;
  title: string;
  price: string;
  description: string;
  image?: string;
  seller: string;
  location: string;
  timePosted: string;
  isSold?: boolean;
  category?: string;
  groupId: string;
  messageId: string;
}

class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private connectionStatus: WhatsAppConnectionStatus = { isConnected: false };
  private activeGroups: Set<string> = new Set();
  private qrCodeData: string | null = null;
  private detectedItems: FPVItem[] = [];

  constructor() {
    super();
  }

  async initialize() {
    if (this.client) {
      return;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "fpv-marketplace"
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();

    try {
      await this.client.initialize();
    } catch (error) {
      console.error('Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      console.log('QR Code received');
      try {
        this.qrCodeData = await QRCode.toDataURL(qr);
        this.connectionStatus.isConnecting = true;
        this.emit('qr', this.qrCodeData);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    });

    this.client.on('ready', async () => {
      console.log('WhatsApp client is ready!');
      this.connectionStatus = {
        isConnected: true,
        isConnecting: false,
        phoneNumber: this.client?.info?.wid?.user ? `+${this.client.info.wid.user}` : undefined,
        lastSync: new Date().toISOString()
      };
      this.qrCodeData = null;
      this.emit('ready', this.connectionStatus);
      
      // Start monitoring groups
      await this.loadGroups();
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
      this.emit('authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
      this.connectionStatus = { isConnected: false, isConnecting: false };
      this.emit('auth_failure', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.connectionStatus = { isConnected: false, isConnecting: false };
      this.emit('disconnected', reason);
    });

    this.client.on('message', async (message) => {
      await this.processMessage(message);
    });
  }

  private async loadGroups() {
    if (!this.client || !this.connectionStatus.isConnected) return;

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter(chat => chat.isGroup) as GroupChat[];
      
      console.log(`Found ${groups.length} groups`);
      this.emit('groupsLoaded', groups.length);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }

  private async processMessage(message: Message) {
    if (!message.from.includes('@g.us')) return; // Only process group messages
    if (!this.activeGroups.has(message.from)) return; // Only process active groups

    const messageText = message.body.toLowerCase();
    
    // Check if message contains FPV-related keywords and sale indicators
    const fpvKeywords = ['drone', 'quad', 'fpv', 'goggles', 'controller', 'motor', 'esc', 'battery', 'lipo', 'transmitter', 'receiver', 'camera', 'vtx', 'antenna'];
    const saleKeywords = ['for sale', 'selling', 'fs:', '$', '£', '€', 'price', 'sold'];
    
    const hasFpvKeyword = fpvKeywords.some(keyword => messageText.includes(keyword));
    const hasSaleKeyword = saleKeywords.some(keyword => messageText.includes(keyword));
    
    if (hasFpvKeyword && hasSaleKeyword) {
      const item = await this.extractItemFromMessage(message);
      if (item) {
        this.detectedItems.push(item);
        this.emit('itemDetected', item);
      }
    }

    // Check for sold notifications
    if (messageText.includes('sold') && message.hasQuotedMsg) {
      const quotedMsg = await message.getQuotedMessage();
      if (quotedMsg) {
        this.markItemAsSold(quotedMsg.id.id);
      }
    }
  }

  private async extractItemFromMessage(message: Message): Promise<FPVItem | null> {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();
      
      // Extract price from message
      const priceMatch = message.body.match(/[\$£€]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const price = priceMatch ? priceMatch[0] : 'Price on request';
      
      // Extract title (first line or until price)
      const lines = message.body.split('\n');
      const title = lines[0].substring(0, 100);
      
      // Get description (remaining text)
      const description = lines.slice(1).join('\n').substring(0, 300);
      
      // Check for media (images)
      let imageUrl: string | undefined;
      if (message.hasMedia) {
        try {
          const media = await message.downloadMedia();
          // In a real implementation, you'd upload this to a file server
          imageUrl = `data:${media.mimetype};base64,${media.data}`;
        } catch (error) {
          console.error('Failed to download media:', error);
        }
      }

      const item: FPVItem = {
        id: message.id.id,
        title: title || 'FPV Item',
        price,
        description: description || message.body,
        image: imageUrl,
        seller: contact.pushname || contact.number || 'Unknown',
        location: 'Unknown', // Could be extracted from message text
        timePosted: new Date(message.timestamp * 1000).toLocaleString(),
        groupId: message.from,
        messageId: message.id.id,
        category: this.categorizeItem(message.body)
      };

      return item;
    } catch (error) {
      console.error('Failed to extract item from message:', error);
      return null;
    }
  }

  private categorizeItem(messageText: string): string {
    const text = messageText.toLowerCase();
    
    if (text.includes('goggles') || text.includes('headset')) return 'Goggles';
    if (text.includes('drone') || text.includes('quad')) return 'Complete Setup';
    if (text.includes('controller') || text.includes('transmitter')) return 'Controllers';
    if (text.includes('battery') || text.includes('lipo')) return 'Batteries';
    if (text.includes('motor') || text.includes('esc') || text.includes('flight controller')) return 'Electronics';
    if (text.includes('racing')) return 'Racing';
    
    return 'Other';
  }

  private markItemAsSold(messageId: string) {
    const itemIndex = this.detectedItems.findIndex(item => item.messageId === messageId);
    if (itemIndex !== -1) {
      this.detectedItems[itemIndex].isSold = true;
      this.emit('itemSold', this.detectedItems[itemIndex]);
      
      // Remove after 24 hours
      setTimeout(() => {
        this.detectedItems.splice(itemIndex, 1);
      }, 24 * 60 * 60 * 1000);
    }
  }

  async getGroups(): Promise<WhatsAppGroup[]> {
    if (!this.client || !this.connectionStatus.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter(chat => chat.isGroup) as GroupChat[];
      
      return groups.map(group => ({
        id: group.id.id,
        name: group.name,
        memberCount: group.participants?.length || 0,
        isActive: this.activeGroups.has(group.id.id),
        lastActivity: group.lastMessage?.timestamp ? 
          new Date(group.lastMessage.timestamp * 1000).toLocaleString() : 
          'Unknown',
        description: group.description || undefined,
        messagesPerDay: Math.floor(Math.random() * 50), // TODO: Calculate actual stats
        itemsFound: this.detectedItems.filter(item => item.groupId === group.id.id).length
      }));
    } catch (error) {
      console.error('Failed to get groups:', error);
      throw error;
    }
  }

  getConnectionStatus(): WhatsAppConnectionStatus {
    return this.connectionStatus;
  }

  getQRCode(): string | null {
    return this.qrCodeData;
  }

  getDetectedItems(): FPVItem[] {
    return this.detectedItems.filter(item => !item.isSold);
  }

  getSoldItems(): FPVItem[] {
    return this.detectedItems.filter(item => item.isSold);
  }

  setGroupActive(groupId: string, isActive: boolean) {
    if (isActive) {
      this.activeGroups.add(groupId);
    } else {
      this.activeGroups.delete(groupId);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.connectionStatus = { isConnected: false, isConnecting: false };
    this.qrCodeData = null;
  }

  async forceSync() {
    this.connectionStatus.lastSync = new Date().toISOString();
    return {
      messagesScanned: Math.floor(Math.random() * 500),
      itemsDetected: this.detectedItems.length,
      itemsMarkedSold: this.detectedItems.filter(item => item.isSold).length
    };
  }
}

export const whatsappService = new WhatsAppService();
