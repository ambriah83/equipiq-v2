# LIMBLE CMMS INTEGRATION REFERENCE
> Last Updated: 2025-07-13
> Client: Glo Tanning
> Status: API Successfully Tested ✅

## 🔐 AUTHENTICATION

### Credentials
```javascript
const LIMBLE_CONFIG = {
  client_id: 'W9J69W1YXPZCDGGIIWVG6JVKY78HVF',
  client_secret: process.env.LIMBLE_CLIENT_SECRET, // Store in .env
  base_url: 'https://api.limblecmms.com',
  auth_type: 'Basic Auth',
  test_account: 'maintenance@glotanning.com'
};
```

### Implementation
```javascript
// Basic Auth Header
const authHeader = {
  'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

## 📊 API ENDPOINTS

### Verified Working
- `GET /v2/assets` - All equipment/assets (348 items retrieved)
- Returns comprehensive asset data with images, metadata, and work request URLs

### To Be Tested
- `GET /v2/tasks` - Work orders and maintenance tasks
- `GET /v2/locations` - Facility locations
- `GET /v2/users` - User management
- `GET /v2/parts` - Parts inventory
- `GET /v2/assets/fields/?assets={id}` - Custom fields per asset
- `GET /v2/work-orders` - Work order history
- `GET /v2/purchase-orders` - Purchase order data

### Webhook Endpoints (To Configure)
- `/v2/webhooks/tasks` - Real-time task updates
- `/v2/webhooks/assets` - Asset changes
- `/v2/webhooks/purchase-orders` - PO updates

## 🏗️ DATA STRUCTURES

### Asset Object
```typescript
interface LimbleAsset {
  assetID: number;
  name: string;
  startedOn: number; // Unix timestamp
  lastEdited: number; // Unix timestamp
  parentAssetID: number; // 0 if top-level
  locationID: number;
  geoLocation: null | {
    lat: number;
    lng: number;
  };
  hoursPerWeek: number;
  meta: {
    fields: string; // URL to custom fields
    tasks: string;  // URL to asset tasks
  };
  workRequestPortal: string; // Direct work request URL
  image: Array<{
    fileName: string;
    link: string; // Time-limited signed URL
  }>;
}
```

### Location Mapping
```javascript
const GLO_LOCATIONS = {
  23600: 'ALL', // Main/All locations
  23597: 'DC',  // Washington DC
  23592: 'ES',  // Eastern Shore
  23596: 'NW',  // Northwest
  27108: 'WH'   // Warehouse/Storage
};
```

## 🔧 IMPLEMENTATION REQUIREMENTS

### Environment Variables
```bash
# .env file
LIMBLE_CLIENT_ID=W9J69W1YXPZCDGGIIWVG6JVKY78HVF
LIMBLE_CLIENT_SECRET=your_secret_here
LIMBLE_BASE_URL=https://api.limblecmms.com
LIMBLE_WEBHOOK_SECRET=generate_this
```

### Database Schema Updates
```sql
-- Add to equipment table
ALTER TABLE equipment ADD COLUMN limble_asset_id INTEGER UNIQUE;
ALTER TABLE equipment ADD COLUMN limble_location_id INTEGER;
ALTER TABLE equipment ADD COLUMN limble_parent_id INTEGER;
ALTER TABLE equipment ADD COLUMN work_request_url TEXT;
ALTER TABLE equipment ADD COLUMN last_limble_sync TIMESTAMP;

-- Add sync log table
CREATE TABLE limble_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  records_synced INTEGER,
  errors TEXT[],
  status VARCHAR(20)
);
```

### Service Implementation
```typescript
// src/services/limble.service.ts
export class LimbleService {
  private headers: Headers;
  
  constructor() {
    this.headers = new Headers({
      'Authorization': this.getBasicAuth(),
      'Content-Type': 'application/json'
    });
  }

  async syncAssets(): Promise<SyncResult> {
    // 1. Fetch all assets
    // 2. Transform to EquipIQ format
    // 3. Upsert to database
    // 4. Log sync results
  }

  async syncWorkOrders(since?: Date): Promise<SyncResult> {
    // Implement incremental sync
  }
}
```

## 🚨 GOTCHAS & CONSIDERATIONS

1. **Authentication**: Uses Basic Auth despite having OAuth-style credentials
2. **Rate Limits**: Unknown - implement exponential backoff
3. **Data Limits**: 36-month historical data limit
4. **Image URLs**: Expire after ~24 hours - must cache locally
5. **Regions**: Different base URLs for different regions:
   - US: `api.limblecmms.com`
   - Canada: `ca-api.limblecmms.com`
   - Australia: `au-api.limblecmms.com`
   - Europe: `eu-api.limblecmms.com`

## 📈 GLO TANNING INSIGHTS

### Equipment Summary
- **Total Assets**: 348
- **Equipment Types**:
  - Tanning beds (P90, Magic 636, Sun Angel, etc.)
  - Spray tan booths (Norvell Auto Rev, VersaSpa Pro)
  - Red light therapy (Cocoon, Skin Wellness, Beauty Angel)
  - Stand-up units (Sunrise 480, KBL models)
  
### Hierarchical Structure
- Top level: Location rooms
- Child level: Equipment within rooms
- Naming convention: `[Equipment Model] #[Room Number] [Location Code]`

## 🎯 INTEGRATION ROADMAP

### Phase 1: Basic Sync (Week 1)
- [x] Test API authentication
- [x] Retrieve asset data
- [ ] Implement asset sync service
- [ ] Create sync monitoring
- [ ] Handle errors gracefully

### Phase 2: Work Orders (Week 2)
- [ ] Test work order endpoints
- [ ] Map Limble tasks to EquipIQ tickets
- [ ] Implement incremental sync
- [ ] Set up webhook handlers

### Phase 3: Real-time Updates (Week 3)
- [ ] Configure webhooks in Limble
- [ ] Implement webhook endpoints
- [ ] Add real-time notifications
- [ ] Test bi-directional sync

### Phase 4: Advanced Features (Week 4)
- [ ] Parts inventory sync
- [ ] Purchase order integration
- [ ] Custom field mapping
- [ ] Multi-tenant support

## 📝 NOTES FOR CLAUDE CODE

1. **Start Simple**: Focus on asset sync first
2. **Error Handling**: Expect 401/403 errors during development
3. **Logging**: Log all API calls for debugging
4. **Testing**: Create mock data from real responses
5. **Security**: Never log the client_secret

## 🚀 QUICK START COMMANDS

```bash
# Test connection
curl -u "W9J69W1YXPZCDGGIIWVG6JVKY78HVF:YOUR_SECRET" \
  https://api.limblecmms.com/v2/assets

# In TypeScript
const response = await fetch(`${LIMBLE_CONFIG.base_url}/v2/assets`, {
  headers: authHeader
});
```

---

**REMEMBER**: This integration is critical for EquipIQ's success. Glo Tanning is our first customer - make it smooth, make it reliable, make it impressive! 🏰