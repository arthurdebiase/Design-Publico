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

### Deployment Steps

1. **Push to GitHub**
   ```bash
   # From your local machine after downloading from Replit
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/designpublico.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Log in to Netlify (https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Set Environment Variables**
   - In Netlify, go to Site settings > Build & deploy > Environment > Environment variables
   - Add the required environment variables (see below)
   - Trigger a new deploy after setting the variables

### Environment Variables

The following environment variables need to be set in Netlify:

| Variable | Description | Required |
|----------|-------------|----------|
| `AIRTABLE_API_KEY` | Your Airtable API key | Yes |
| `AIRTABLE_BASE_ID` | Your Airtable base ID | Yes |
| `DATABASE_URL` | PostgreSQL database connection string | No |
| `SENDGRID_API_KEY` | SendGrid API key for email functionality | No |
| `MAILER_FROM_EMAIL` | Email address to send from | No |
| `MAILERLITE_API_KEY` | MailerLite API key for newsletter | No |

### Image Proxy Configuration

The application includes a specialized image proxy to handle Airtable images in production:

- All Airtable image URLs are automatically routed through a serverless function
- Images are optimized based on browser capabilities (WebP/AVIF support)
- Cache headers are properly set for improved performance

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