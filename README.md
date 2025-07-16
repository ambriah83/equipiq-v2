# EquipIQ v2

An AI-powered equipment management assistant built with React, Supabase, and Google Gemini.

## Features

- AI chat interface for equipment troubleshooting
- Authentication with Supabase
- Dark/light theme support
- File upload support for equipment images
- Ticket creation system
- Settings management

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Supabase (Auth & Edge Functions)
- Google Gemini AI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Add your Supabase URL and anon key in `src/App.jsx`
   - Configure Gemini API key in Supabase Edge Function

3. Deploy the Edge Function:
```bash
supabase functions deploy ask-equip-iq
```

4. Set the GEMINI_API_KEY secret:
```bash
supabase secrets set GEMINI_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
equipiq-v2/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind CSS imports
├── supabase/
│   └── functions/
│       └── ask-equip-iq/  # Edge Function for AI responses
└── index.html           # HTML template
```