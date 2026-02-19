@echo off
echo Setting up Supabase environment variable for Rockman Logistics
echo.
echo Please replace the placeholder values with your actual Supabase credentials:
echo.
echo Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
echo.
set /p SUPABASE_URL="Enter your Supabase PostgreSQL connection string: "
setx SUPABASE_DATABASE_URL "%SUPABASE_URL%"
echo.
echo Environment variable set! You may need to restart your terminal for changes to take effect.
echo.
echo Testing connection...
cd /d "%~dp0"
RockmanChinaEnv\Scripts\activate && python manage.py check
pause
