# EquipIQ v2

An AI-powered equipment management assistant that helps frontline staff diagnose and resolve equipment issues instantly.

🌐 **Live at**: [www.equipiq.io](https://www.equipiq.io)

## Overview

EquipIQ transforms reactive equipment maintenance into proactive, AI-guided self-service. Built for multi-location businesses, it empowers any staff member to troubleshoot equipment issues without waiting for specialized technicians.

## Features

- 🤖 **AI Diagnostic Assistant** - Chat interface powered by Google Gemini
- 📸 **Multi-Modal Input** - Support for text, images, and voice
- 🎫 **Smart Ticket Creation** - Seamless escalation to maintenance teams
- 🌓 **Dark/Light Mode** - Beautiful, Apple-inspired design
- 🔐 **Multi-Tenant Architecture** - Secure isolation between companies
- 📱 **Mobile Responsive** - Works on any device

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini API
- **Hosting**: Netlify (Frontend) + Supabase (Backend)
- **Design**: Apple-inspired UI with Inter font

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

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
├── docs/                # Project documentation
└── index.html           # HTML template
```

## Documentation

- [Project Status](PROJECT_STATUS.md) - Current status and next steps
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - How to deploy
- [Product Requirements](Product%20Requirements%20Document%20EquipIQ%20V2.txt) - Full PRD

## Contributing

This project uses automated deployment:
1. Push to `main` branch
2. Netlify auto-deploys frontend
3. Supabase auto-deploys Edge Functions

---

**Mission**: Achieve >30% First Contact Resolution Rate for equipment issues