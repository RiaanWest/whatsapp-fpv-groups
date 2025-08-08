# WhatsApp FPV Groups

A web application for monitoring WhatsApp groups for FPV (First Person View) drone items and sales.

## Features

- **WhatsApp Integration**: Connect to WhatsApp Web to monitor groups
- **Group Management**: Select which groups to monitor for FPV items
- **Item Detection**: Automatically detect FPV-related items in group messages
- **7-Day History**: View items from the last 7 days
- **Persistent Sessions**: Maintain WhatsApp connection across app restarts

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- WhatsApp account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whatsapp-fpv-groups
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:8081`

## WhatsApp Session Management

The app now supports persistent WhatsApp sessions, meaning you won't need to re-scan the QR code every time you restart the app.

### How to Use Persistent Sessions

#### **Normal Operation (Session Preserved):**
```bash
# Start app
yarn dev

# Connect WhatsApp (should auto-restore if session exists)
curl -X POST http://localhost:8081/api/whatsapp/connect

# Check status
curl http://localhost:8081/api/whatsapp/status
```

#### **Troubleshooting:**
```bash
# Check session status
node scripts/manage-session.js check

# Clear cache only (fix browser issues)
node scripts/manage-session.js clear-cache

# Force re-authentication (clear everything)
node scripts/manage-session.js clear
```

### Session Management Script

The app includes a session management script to help troubleshoot connection issues:

```bash
# Check current session status
node scripts/manage-session.js check

# Clear cache only (preserves authentication)
node scripts/manage-session.js clear-cache

# Clear everything (forces re-authentication)
node scripts/manage-session.js clear
```

### Session Storage

- **Session Data**: Stored in `./.wwebjs_auth/`
- **Cache Data**: Stored in `./.wwebjs_cache/`
- **Chrome Data**: Managed automatically by LocalAuth

### Why Sessions Are Preserved

The app now uses:
- **Explicit Data Path**: `dataPath: "./.wwebjs_auth"` for consistent session storage
- **Automatic Chrome Management**: LocalAuth handles Chrome user data automatically
- **Session Checking**: Automatic detection of existing sessions
- **Improved Browser Configuration**: Better Chrome arguments for stability

### API Endpoints

#### WhatsApp Management
- `GET /api/whatsapp/status` - Check connection status
- `POST /api/whatsapp/connect` - Connect to WhatsApp
- `POST /api/whatsapp/disconnect` - Disconnect (preserves session)
- `POST /api/whatsapp/force-disconnect` - Force disconnect (clears session)
- `GET /api/whatsapp/qr` - Get QR code for scanning

#### Group Management
- `GET /api/whatsapp/groups` - Get all WhatsApp groups
- `PUT /api/whatsapp/groups/:groupId` - Update group monitoring status
- `POST /api/whatsapp/sync` - Force sync groups

#### Item Retrieval
- `GET /api/whatsapp/items` - Get all detected items
- `GET /api/whatsapp/items/sold` - Get sold items
- `GET /api/whatsapp/items/14days` - Get items from last 14 days (optimized with caching)
- `GET /api/whatsapp/items/sold/14days` - Get sold items from last 14 days (optimized with caching)

## Development

### Project Structure

```
whatsapp-fpv-groups/
├── client/                 # React frontend
│   ├── components/        # React components
│   ├── pages/            # Page components
│   └── hooks/            # Custom React hooks
├── server/                # Express backend
│   ├── routes/           # API route handlers
│   └── services/         # Business logic
├── scripts/               # Utility scripts
│   └── manage-session.js # Session management
└── shared/                # Shared types and utilities
```

### Key Technologies

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express, Node.js, TypeScript
- **WhatsApp**: whatsapp-web.js, Puppeteer
- **Authentication**: LocalAuth for session persistence

### Enhanced Item Detection

The app uses intelligent detection logic to identify FPV items for sale:

#### **Detection Criteria**
- **FPV Keywords**: Core terms (drone, quad, fpv, goggles, controller, motor, esc, battery, lipo, transmitter, receiver, camera, vtx, antenna, bundle, setup, charger)
- **Brand Keywords**: Specific brands (crossfire, taranis, betaflight, clracing, speedix, pyrodrone, foxeer, dji, o4, o4 pro, smooth operater, yeti, gnb, samsung)
- **Technical Specs**: Specifications (mah, kv, s, xt30, xt60, 4s, 6s, 3s, inch, 2207, 1103)
- **Component Types**: Parts (pack, packs, module, mount, case, board, checker, bag)
- **Radio/Protocol**: Radio terms (radio, elrs, expresslrs, pocket, pudo, included, shipping)

#### **Sale Indicators**
- **Explicit**: "for sale", "selling", "fs:", price symbols ($, £, €)
- **Implicit**: "dm for", "excluding shipping", "shipping on buyer", "based in", "pickup", "collection"
- **Shipping**: "included", "pudo", "shipping", "delivery", "postage"
- **Price Patterns**: R3000, $100, 550 rand, etc.
- **Condition**: "brand new", "new", "mint condition", "good condition"

#### **Detection Logic**
1. **Primary**: FPV keyword + (sale keyword OR price indicator OR brand new indicator)
2. **Secondary**: Sale keyword + price indicator + longer message (>20 chars)
3. **Tertiary**: Multiple FPV keywords (≥3) in longer message (>50 chars)

### Performance Optimizations

The 14-day endpoints have been optimized for better performance:

#### **Caching System**
- **5-minute cache**: Results are cached for 5 minutes to avoid repeated processing
- **Automatic refresh**: Cache is cleared when groups are synced
- **Memory efficient**: Only stores the last 50 items to prevent memory bloat

#### **Processing Optimizations**
- **Reduced message limit**: Fetches 200 messages per group instead of 1000
- **Early termination**: Stops processing once 50 items are found
- **Quick keyword matching**: Uses simple string matching instead of complex regex
- **Progress logging**: Shows real-time progress during scanning

#### **Performance Metrics**
- **First call**: ~2-5 seconds (depending on group activity)
- **Cached calls**: ~50-100ms
- **Memory usage**: Minimal, with automatic cleanup

### Troubleshooting

#### Common Issues

1. **"Failed to launch browser process"**
   - Clear cache: `node scripts/manage-session.js clear-cache`
   - Kill processes: `pkill -f "chrome" && pkill -f "chromium"`

2. **"LocalAuth is not compatible with userDataDir"**
   - **Error**: `LocalAuth is not compatible with a user-supplied userDataDir`
   - **Cause**: The Puppeteer configuration includes a custom `userDataDir` which conflicts with LocalAuth
   - **Solution**: Remove the `userDataDir` setting from the Puppeteer configuration
   - **Fix**: The configuration has been updated to work with LocalAuth automatically

3. **"Session closed" errors**
   - The app automatically detects and handles session closures
   - Check connection status: `curl http://localhost:8081/api/whatsapp/status`

#### Session Management Tips

- **Use "clear-cache"** to fix browser issues while keeping your session
- **Use "clear"** only if you want to force re-authentication
- **Check session status** before troubleshooting: `node scripts/manage-session.js check`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here] 