# Design Público

Design Público is a dynamic web-based design gallery platform that provides intelligent visual references and collaborative tools for designers and developers. The platform offers advanced content management with smart screen exploration and contextual design insights.

## Features

- Advanced multi-select filtering
- Cloud-based Airtable content integration
- Responsive modal interactions
- Internationalization (i18n) support
- Micro-interaction animations
- Component-based filtering
- Optimized image and resource loading
- Accessibility-enhanced interactions
- Skeleton loading states
- Incremental screen loading (50 screens per batch)
- Dynamic screen counter with filtering support

## Technology Stack

- Frontend: TypeScript/React, Tailwind CSS
- Backend: Node.js/Express
- Database: PostgreSQL
- Content Management: Airtable API

## Deployment

This project is configured for deployment on Netlify:

1. The frontend static files are built using Vite
2. Backend APIs are served via Netlify Functions
3. Database connections use environment variables for configuration

## Environment Variables

The following environment variables need to be set in Netlify:

- `AIRTABLE_API_KEY`: Your Airtable API key
- `AIRTABLE_BASE_ID`: Your Airtable base ID
- `DATABASE_URL` (optional): PostgreSQL database connection string

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT