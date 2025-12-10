# Migrate Data from "test" to "crystalbowl" Database

## Option 1: Use MongoDB Compass (GUI - Easiest)

### Step 1: Export Collections from "test" Database
1. Open MongoDB Compass
2. Connect to your cluster
3. Select "test" database
4. For each collection (administrators, products, orders, users, etc.):
   - Right-click collection → Export Collection
   - Choose JSON format
   - Save to a folder (e.g., `mongodb-backup/`)

### Step 2: Import to "crystalbowl" Database
1. In Compass, select "crystalbowl" database (it will be created)
2. For each exported JSON file:
   - Click "Create Collection" (use same name)
   - Click "Add Data" → Import File
   - Select the JSON file
   - Click Import

---

## Option 2: Use mongodump/mongorestore (Command Line)

### Prerequisites
```powershell
# Install MongoDB Database Tools
# Download from: https://www.mongodb.com/try/download/database-tools
```

### Export from "test" Database
```powershell
mongodump --uri="mongodb+srv://dev_db_user:tx1LpWcIYLc0XQFa@cluster0.mqsjchn.mongodb.net/test" --out="./backup"
```

### Import to "crystalbowl" Database
```powershell
mongorestore --uri="mongodb+srv://dev_db_user:tx1LpWcIYLc0XQFa@cluster0.mqsjchn.mongodb.net/crystalbowl" --dir="./backup/test"
```

---

## Option 3: Switch Back to "test" Database (Temporary)

If you want to keep using your existing data:

### Update `.env.local`
```env
MONGODB_URI=mongodb+srv://dev_db_user:tx1LpWcIYLc0XQFa@cluster0.mqsjchn.mongodb.net/test?appName=Cluster0
```

Then migrate later when convenient.

---

## Option 4: Start Fresh (Simplest)

1. Keep the new "crystalbowl" database
2. Run seed scripts:
   ```powershell
   # Seed admin
   curl http://localhost:3000/api/seed/admin
   
   # Seed products
   curl http://localhost:3000/api/seed/products
   ```
3. Create new test data as needed
4. Old "test" database remains as backup

---

## Recommended Approach

**For Development:**
→ **Option 4 (Start Fresh)** - Fastest and cleanest

**For Production (with real customer data):**
→ **Option 1 (MongoDB Compass)** - Visual and safe

---

## Clean Up Old "test" Database (Optional)

After successful migration:

1. In MongoDB Compass
2. Select "test" database
3. Click trash icon → Drop Database
4. Confirm deletion

**Only do this after verifying all data is in "crystalbowl"!**

