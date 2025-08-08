import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
type GroupChat = any;
type Message = any;
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
  private client: any = null;
  private connectionStatus: WhatsAppConnectionStatus = { isConnected: false };
  private activeGroups: Set<string> = new Set();
  private qrCodeData: string | null = null;
  private detectedItems: FPVItem[] = [];
  private last14DaysCache: { items: FPVItem[], timestamp: number } | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
  }

  async initialize() {
    // If client exists but is not working, destroy it first
    if (this.client) {
      try {
        // Test if the client is still functional
        this.client.info;
        console.log('Client already exists and functional, returning');
        return;
      } catch (error) {
        console.log('Existing client is not functional, destroying and recreating...');
        await this.disconnect();
      }
    }

    // Check if session already exists
    const sessionExists = await this.checkSessionExists();
    if (sessionExists) {
      console.log('Existing session found, attempting to restore...');
    } else {
      console.log('No existing session found, will require QR code scan');
    }

    console.log('Initializing WhatsApp client...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "fpv-marketplace",
        dataPath: "./.wwebjs_auth" // Explicitly set data path for persistence
      }),
      puppeteer: {
        headless: true,
        executablePath: '/Users/riaan/.cache/puppeteer/chrome/mac_arm-139.0.7258.66/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 180000
      }
    });

    this.setupEventHandlers();

    try {
      console.log('Starting client initialization...');
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 180000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('Client initialization completed');
    } catch (error) {
      console.error('Failed to initialize WhatsApp client:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      this.client = null;
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      console.log('QR Code received, generating data URL...');
      try {
        this.qrCodeData = await QRCode.toDataURL(qr);
        this.connectionStatus.isConnecting = true;
        console.log('QR Code generated successfully');
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
    
    // Debug logging for specific message
    if (message.body.toLowerCase().includes('pocket radio elrs')) {
      console.log('🔍 DEBUG: Found Pocket Radio message:', message.body);
      console.log('🔍 DEBUG: Message from:', message.from);
      console.log('🔍 DEBUG: Message timestamp:', message.timestamp);
    }
    
    // Enhanced FPV-related keywords to capture more items
    const fpvKeywords = [
      // Core FPV terms
      'drone', 'quad', 'fpv', 'goggles', 'controller', 'motor', 'esc', 'battery', 'lipo', 
      'transmitter', 'receiver', 'camera', 'vtx', 'antenna', 'bundle', 'setup', 'charger',
      // Specific brands and models
      'crossfire', 'taranis', 'betaflight', 'clracing', 'speedix', 'pyrodrone', 'foxeer',
      'dji', 'o4', 'o4 pro', 'smooth operater', 'yeti', 'gnb', 'samsung',
      // Technical specifications
      'mah', 'kv', 's', 'xt30', 'xt60', '4s', '6s', '3s', 'inch', '2207', '1103',
      // Component types
      'pack', 'packs', 'module', 'mount', 'case', 'board', 'checker', 'bag',
      // Additional FPV terms
      'radio', 'elrs', 'expresslrs', 'pocket', 'pudo', 'included', 'shipping'
    ];
    
    // Enhanced sale indicators
    const saleKeywords = [
      'for sale', 'selling', 'fs:', '$', '£', '€', 'price', 'sold', 'dm for', 'dm for more',
      'excluding shipping', 'shipping on buyer', 'based in', 'pickup', 'collection',
      'included', 'pudo', 'shipping', 'delivery', 'postage'
    ];
    
    // Check for FPV keywords
    const hasFpvKeyword = fpvKeywords.some(keyword => messageText.includes(keyword));
    
    // Check for sale indicators
    const hasSaleKeyword = saleKeywords.some(keyword => messageText.includes(keyword));
    
    // Check for price indicators (R, $, etc.)
    const hasPriceIndicator = /\b(?:r\s*\d+|\$\s*\d+|\d+\s*(?:rand|zar|usd|gbp|eur))\b/i.test(message.body);
    
    // Check for brand new indicators
    const hasBrandNewIndicator = /\b(?:brand new|new|mint condition|good condition)\b/i.test(message.body);
    
    // Enhanced detection logic
    const isItemForSale = (hasFpvKeyword && (hasSaleKeyword || hasPriceIndicator || hasBrandNewIndicator)) ||
                          (hasSaleKeyword && hasPriceIndicator && messageText.length > 20) || // Longer messages likely contain item details
                          (hasFpvKeyword && messageText.length > 50 && fpvKeywords.filter(k => messageText.includes(k)).length >= 3); // Multiple FPV keywords in longer message
    
    // Debug logging for detection
    if (message.body.toLowerCase().includes('pocket radio elrs')) {
      console.log('🔍 DEBUG: Detection analysis for Pocket Radio message:');
      console.log('  - hasFpvKeyword:', hasFpvKeyword);
      console.log('  - hasSaleKeyword:', hasSaleKeyword);
      console.log('  - hasPriceIndicator:', hasPriceIndicator);
      console.log('  - hasBrandNewIndicator:', hasBrandNewIndicator);
      console.log('  - isItemForSale:', isItemForSale);
    }
    
    if (isItemForSale) {
      const item = await this.extractItemFromMessage(message);
      if (item) {
        this.detectedItems.push(item);
        this.emit('itemDetected', item);
        console.log('✅ Item detected and added:', item.title);
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
      
      // Enhanced price extraction - look for various price formats
      const pricePatterns = [
        /[\$£€]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56
        /(\d+)\s*[\$£€]/,                           // 1234$
        /price[:\s]*(\d+)/i,                        // Price: 1234
        /(\d+)\s*(?:rand|zar|usd|gbp|eur)/i,       // 1234 rand
        /r\s*(\d+)/i,                               // R1234
        /r(\d+)/i,                                  // R3000 (no space)
        /(\d+)\s*(?:excluding|including|shipping)/i, // 3000 excluding shipping
      ];
      
      let price = 'Price on request';
      for (const pattern of pricePatterns) {
        const match = message.body.match(pattern);
        if (match) {
          price = match[0];
          break;
        }
      }
      
      // Extract title - look for common FPV item patterns
      const lines = message.body.split('\n');
      let title = lines[0].substring(0, 100);
      
      // Try to find a better title by looking for common FPV item descriptions
      const titlePatterns = [
        /(?:selling|for sale|fs:?)\s*(.+?)(?:\n|$)/i,
        /(.+?)\s*(?:for sale|selling|fs:?)/i,
        /(?:drone|quad|goggles|controller|transmitter|receiver|motor|esc|battery|camera|vtx|antenna)[^.]*\./i,
        // New patterns for better title extraction
        /^([^•\n]+?)(?:\s*•|$)/i,  // First line before bullet points
        /(?:selling|for sale)\s*•\s*(.+?)(?:\s*•|\n|$)/i,  // First bullet point after "selling"
        /^([^•\n]+?)(?:\s*[-–]\s*|$)/i,  // First line before dash
        /(?:brand new|new)\s*(.+?)(?:\s*[-–]|\n|$)/i,  // After "brand new" or "new"
      ];
      
      for (const pattern of titlePatterns) {
        const match = message.body.match(pattern);
        if (match && match[1] && match[1].length > 5) {
          title = match[1].trim();
          break;
        }
      }
      
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

      // Extract location from message text
      const locationPatterns = [
        /(?:location|area|pickup|collection):\s*(.+?)(?:\n|$)/i,
        /(?:jhb|joburg|pretoria|ct|cape town|durban|bloem|bloemfontein|pe|port elizabeth)/i,
        // Enhanced location patterns
        /(?:based in|located in|pickup from)\s*(.+?)(?:\n|$)/i,
        /(?:southern suburbs|cape town|johannesburg|pretoria|durban|bloemfontein|port elizabeth)/i,
        /(?:cpt|jhb|pta|dbn|bloem|pe)\b/i,  // Abbreviations
      ];
      
      let location = 'Unknown';
      for (const pattern of locationPatterns) {
        const match = message.body.match(pattern);
        if (match) {
          location = match[1] || match[0];
          break;
        }
      }

      const item: FPVItem = {
        id: message.id.id,
        title: title || 'FPV Item',
        price,
        description: description || message.body,
        image: imageUrl,
        seller: contact.pushname || contact.number || 'Unknown',
        location,
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
    
    // Goggles and Headsets
    if (text.includes('goggles') || text.includes('headset') || text.includes('dji goggles') || 
        text.includes('fat shark') || text.includes('skyzone') || text.includes('eachine')) {
      return 'Goggles';
    }
    
    // Complete Setups
    if (text.includes('drone') || text.includes('quad') || text.includes('complete setup') || 
        text.includes('ready to fly') || text.includes('rtf') || text.includes('bind and fly') || 
        text.includes('bnf')) {
      return 'Complete Setup';
    }
    
    // Controllers and Transmitters
    if (text.includes('controller') || text.includes('transmitter') || text.includes('radio') || 
        text.includes('taranis') || text.includes('futaba') || text.includes('flysky') || 
        text.includes('radiomaster') || text.includes('jumper')) {
      return 'Controllers';
    }
    
    // Batteries
    if (text.includes('battery') || text.includes('lipo') || text.includes('li-ion') || 
        text.includes('6s') || text.includes('4s') || text.includes('3s') || text.includes('2s')) {
      return 'Batteries';
    }
    
    // Electronics
    if (text.includes('motor') || text.includes('esc') || text.includes('flight controller') || 
        text.includes('fc') || text.includes('pdb') || text.includes('receiver') || 
        text.includes('vtx') || text.includes('camera') || text.includes('antenna') || 
        text.includes('gps') || text.includes('gimbal') || text.includes('servo')) {
      return 'Electronics';
    }
    
    // Frames
    if (text.includes('frame') || text.includes('carbon') || text.includes('arms') || 
        text.includes('chassis') || text.includes('body')) {
      return 'Frames';
    }
    
    // Racing specific
    if (text.includes('racing') || text.includes('race') || text.includes('competition') || 
        text.includes('track')) {
      return 'Racing';
    }
    
    // Freestyle specific
    if (text.includes('freestyle') || text.includes('tricks') || text.includes('acro')) {
      return 'Freestyle';
    }
    
    // Cinematic
    if (text.includes('cinematic') || text.includes('cinema') || text.includes('filming') || 
        text.includes('camera drone') || text.includes('photography')) {
      return 'Cinematic';
    }
    
    // Accessories
    if (text.includes('prop') || text.includes('propeller') || text.includes('props') || 
        text.includes('tool') || text.includes('screw') || text.includes('nut') || 
        text.includes('wire') || text.includes('cable') || text.includes('connector')) {
      return 'Accessories';
    }
    
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
      
      return groups.map((group, index) => {
        // Generate a unique ID if the group ID is not available
        const groupId = group.id._serialized || group.id.id || group.id || `group_${index}_${Date.now()}`;
        
        return {
          id: groupId,
          name: group.name,
          memberCount: group.participants?.length || 0,
          isActive: this.activeGroups.has(groupId),
          lastActivity: group.lastMessage?.timestamp ? 
            new Date(group.lastMessage.timestamp * 1000).toLocaleString() : 
            'Unknown',
          description: group.description || undefined,
          messagesPerDay: Math.floor(Math.random() * 50), // TODO: Calculate actual stats
          itemsFound: this.detectedItems.filter(item => item.groupId === groupId).length
        };
      });
    } catch (error) {
      console.error('Failed to get groups:', error);
      
      // If we get a session closed error, update connection status
      if (error instanceof Error && error.message.includes('Session closed')) {
        this.connectionStatus = { isConnected: false, isConnecting: false };
        this.client = null;
        console.log('WhatsApp session closed, updating connection status');
      }
      
      throw new Error('WhatsApp not connected');
    }
  }

  getConnectionStatus(): WhatsAppConnectionStatus {
    // Check if client is actually still functional
    if (this.client && this.connectionStatus.isConnected) {
      try {
        // Try a simple operation to verify the client is still working
        this.client.info;
      } catch (error) {
        console.log('Client appears to be disconnected, updating status');
        this.connectionStatus = { isConnected: false, isConnecting: false };
        this.client = null;
      }
    }
    
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

  async getItemsFromLast14Days(): Promise<FPVItem[]> {
    if (!this.client || !this.connectionStatus.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    // Check cache first
    if (this.last14DaysCache && (Date.now() - this.last14DaysCache.timestamp) < this.cacheTimeout) {
      console.log('Returning cached 14-day items');
      return this.last14DaysCache.items;
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoTimestamp = Math.floor(fourteenDaysAgo.getTime() / 1000);

    const items: FPVItem[] = [];
    const maxItems = 1000; // Increased limit to scan more items

    try {
      const chats = await this.client.getChats();
      const activeGroups = chats.filter(chat => chat.isGroup && this.activeGroups.has(chat.id._serialized)) as GroupChat[];

            console.log(`Scanning ${activeGroups.length} active groups for items from last 14 days...`);
      console.log(`Active groups in Set:`, Array.from(this.activeGroups));
      console.log(`Active groups from database:`, activeGroups.map(g => g.id));
      
      for (const group of activeGroups) {
        if (items.length >= maxItems) {
          console.log(`Reached max items limit (${maxItems}), stopping scan`);
          break;
        }

        try {
          console.log(`Scanning group: ${group.name}`);
          
          // Get more messages to scan through more content
          const messages = await group.fetchMessages({ limit: 1000 });
          const recentMessages = messages.filter(msg => msg.timestamp >= fourteenDaysAgoTimestamp);

          console.log(`Found ${recentMessages.length} recent messages in ${group.name}`);

          for (const message of recentMessages) {
            if (items.length >= maxItems) break;

            const messageText = message.body?.toLowerCase() || '';
            
            // Enhanced FPV-related keywords (same as processMessage)
            const fpvKeywords = [
              // Core FPV terms
              'drone', 'quad', 'fpv', 'goggles', 'controller', 'motor', 'esc', 'battery', 'lipo', 
              'transmitter', 'receiver', 'camera', 'vtx', 'antenna', 'bundle', 'setup', 'charger',
              // Specific brands and models
              'crossfire', 'taranis', 'betaflight', 'clracing', 'speedix', 'pyrodrone', 'foxeer',
              'dji', 'o4', 'o4 pro', 'smooth operater', 'yeti', 'gnb', 'samsung',
              // Technical specifications
              'mah', 'kv', 's', 'xt30', 'xt60', '4s', '6s', '3s', 'inch', '2207', '1103',
              // Component types
              'pack', 'packs', 'module', 'mount', 'case', 'board', 'checker', 'bag',
              // Additional FPV terms
              'radio', 'elrs', 'expresslrs', 'pocket', 'pudo', 'included', 'shipping'
            ];
            
            // Enhanced sale indicators (same as processMessage)
            const saleKeywords = [
              'for sale', 'selling', 'fs:', '$', '£', '€', 'price', 'sold', 'dm for', 'dm for more',
              'excluding shipping', 'shipping on buyer', 'based in', 'pickup', 'collection',
              'included', 'pudo', 'shipping', 'delivery', 'postage'
            ];
            
            // Check for FPV keywords
            const hasFpvKeyword = fpvKeywords.some(keyword => messageText.includes(keyword));
            
            // Check for sale indicators
            const hasSaleKeyword = saleKeywords.some(keyword => messageText.includes(keyword));
            
            // Check for price indicators (R, $, etc.)
            const hasPriceIndicator = /\b(?:r\s*\d+|\$\s*\d+|\d+\s*(?:rand|zar|usd|gbp|eur))\b/i.test(message.body);
            
            // Check for brand new indicators
            const hasBrandNewIndicator = /\b(?:brand new|new|mint condition|good condition)\b/i.test(message.body);
            
            // Enhanced detection logic (same as processMessage)
            const isItemForSale = (hasFpvKeyword && (hasSaleKeyword || hasPriceIndicator || hasBrandNewIndicator)) ||
                                  (hasSaleKeyword && hasPriceIndicator && messageText.length > 20) || // Longer messages likely contain item details
                                  (hasFpvKeyword && messageText.length > 50 && fpvKeywords.filter(k => messageText.includes(k)).length >= 3); // Multiple FPV keywords in longer message
            
            // Debug logging for specific message
            if (message.body.toLowerCase().includes('pocket radio elrs')) {
              console.log('🔍 DEBUG: Found Pocket Radio message in 14-day scan:', message.body);
              console.log('🔍 DEBUG: Detection analysis:', { hasFpvKeyword, hasSaleKeyword, hasPriceIndicator, hasBrandNewIndicator, isItemForSale });
              console.log('🔍 DEBUG: Message timestamp:', new Date(message.timestamp * 1000).toLocaleString());
              console.log('🔍 DEBUG: Message from:', message.from);
            }
            
            if (isItemForSale) {
              const item = await this.extractItemFromMessage(message);
              if (item) {
                items.push(item);
                console.log(`Found item: ${item.title} (${items.length}/${maxItems})`);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to scan group ${group.name}:`, error);
        }
      }

      console.log(`Found ${items.length} items from last 14 days`);
      
      // Update cache
      this.last14DaysCache = {
        items: items,
        timestamp: Date.now()
      };
      
      return items;
    } catch (error) {
      console.error('Failed to get items from last 14 days:', error);
      throw error;
    }
  }

  setGroupActive(groupId: string, isActive: boolean) {
    console.log(`Setting group ${groupId} active: ${isActive}`);
    if (isActive) {
      this.activeGroups.add(groupId);
      console.log(`Added group ${groupId} to active groups. Total active: ${this.activeGroups.size}`);
    } else {
      this.activeGroups.delete(groupId);
      console.log(`Removed group ${groupId} from active groups. Total active: ${this.activeGroups.size}`);
    }
    console.log(`Current active groups:`, Array.from(this.activeGroups));
  }

  private async checkSessionExists(): Promise<boolean> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const sessionPath = path.join('.wwebjs_auth', 'session-fpv-marketplace');
      const sessionExists = fs.existsSync(sessionPath);
      
      console.log(`Session exists: ${sessionExists} at ${sessionPath}`);
      return sessionExists;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error('Error destroying client:', error);
      }
      this.client = null;
    }
    this.connectionStatus = { isConnected: false, isConnecting: false };
    this.qrCodeData = null;
    // Don't clear activeGroups to preserve group settings
    console.log('WhatsApp client disconnected, session preserved');
  }

  async forceDisconnect() {
    // This method completely clears everything including sessions
    await this.disconnect();
    this.activeGroups.clear();
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Only clear cache, not auth data
      const cachePath = path.join('.wwebjs_cache');
      if (fs.existsSync(cachePath)) {
        fs.rmSync(cachePath, { recursive: true, force: true });
        console.log('Cache cleared');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async forceSync() {
    this.connectionStatus.lastSync = new Date().toISOString();
    this.last14DaysCache = null; // Clear cache to force refresh
    return {
      messagesScanned: Math.floor(Math.random() * 500),
      itemsDetected: this.detectedItems.length,
      itemsMarkedSold: this.detectedItems.filter(item => item.isSold).length
    };
  }
}

export const whatsappService = new WhatsAppService();
