# Rockman Logistics - Frontend

## Next.js 14 + Tailwind CSS Setup

### Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Open in Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Home page
├── components/          # Reusable components
└── lib/                # Utility functions
```

### Features

- ✅ Next.js 14 with App Router
- ✅ Tailwind CSS for styling
- ✅ TypeScript support
- ✅ ESLint configuration
- ✅ Responsive design

### Next Steps

1. Create API integration with Django backend
2. Add authentication components
3. Implement customer management pages
4. Add shipment tracking interface
5. Create receipt management system

### Backend Integration

The frontend is ready to connect to your Django backend at:
- API Base URL: `http://localhost:8000/api/`
- Authentication: Token-based
- Database: Supabase PostgreSQL
