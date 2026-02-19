# Rockman Logistics - Supabase-Only Setup

## Current Status
✅ Django project initialized with DRF  
✅ Logistics models created (Customer, Shipment, Receipt, ReceiptItem)  
✅ **SQLite completely removed - Supabase PostgreSQL only**  
⚠️ **Supabase connection required to run the application**

## Database Configuration
This project is configured to use **Supabase PostgreSQL ONLY**. SQLite has been completely removed.

## How to Connect to Supabase

### Step 1: Get Your Supabase Connection String
1. Go to your Supabase Dashboard
2. Navigate to Settings → Database
3. Copy the **Connection string** (URI format)
4. Format should be: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 2: Update Your .env File
1. Edit the `.env` file in the backend directory
2. Replace the placeholder with your actual connection string:
   ```
   SUPABASE_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
   ```

### Step 3: Test Your Connection
```cmd
RockmanChinaEnv\Scripts\activate && python test_db_connection.py
```

### Step 4: Run Migrations on Supabase
```cmd
RockmanChinaEnv\Scripts\activate && python manage.py migrate
```

## Important Notes
- **No SQLite fallback** - The application will NOT start without a valid Supabase connection
- Environment variable `SUPABASE_DATABASE_URL` is **required**
- Make sure your Supabase project is in **Europe (London)** region for optimal performance
- Ensure your Supabase project allows connections from your IP address

## Troubleshooting
- **Error: SUPABASE_DATABASE_URL environment variable is required**
  - Update your `.env` file with the correct Supabase connection string
  
- **Error parsing Supabase URL**
  - Verify your connection string format is correct
  - Check for any special characters that need URL encoding
  
- **Connection timeout**
  - Check your Supabase project settings
  - Ensure your IP is allowed in Supabase settings

## Next Steps
1. Configure your `.env` file with Supabase credentials
2. Test the connection
3. Run migrations on Supabase
4. Start the Django development server: `python manage.py runserver`
