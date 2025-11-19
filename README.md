# AutoModly Landing Page

A beautiful, modern landing page for AutoModly - an AI-powered social media comment moderation app for Facebook and Instagram.

## Features

- 🎨 Modern, responsive design with Tailwind CSS
- 📱 Interactive phone mockup showing real-time comment moderation
- ⚡ Built with Next.js 14 and TypeScript
- 🚀 Optimized for static export and Firebase hosting
- 🎭 Beautiful animations and transitions
- 📊 Features, benefits, and testimonial sections

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Build the static site:
```bash
npm run build
```

This will create an optimized static export in the `out` directory.

## Firebase Deployment

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

### Setup

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)

2. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### Deploy

1. Build the site:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

Your site will be live at `https://your-project-id.web.app`

## Project Structure

```
AutoModly/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   ├── PhoneMockup.tsx     # Animated phone with comment moderation
│   ├── Features.tsx        # Features section
│   ├── Benefits.tsx        # Benefits section
│   └── CTA.tsx             # Call-to-action section
├── public/                 # Static assets
├── firebase.json           # Firebase configuration
├── .firebaserc            # Firebase project settings
└── next.config.mjs        # Next.js configuration
```

## Customization

### Colors

The landing page uses a blue-to-purple gradient theme. You can customize colors in:
- `tailwind.config.ts` - Theme configuration
- Component files - Individual section colors

### Content

Edit the following components to update content:
- `app/page.tsx` - Hero section text and stats
- `components/Features.tsx` - Feature cards
- `components/Benefits.tsx` - Benefits and testimonials
- `components/CTA.tsx` - Call-to-action text

### Phone Mockup Animation

The phone mockup automatically detects and removes spam comments. Customize the comments in:
- `components/PhoneMockup.tsx` - Update the initial comments array

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase Hosting** - Static site hosting

## License

Private - All rights reserved

## Support

For support, email support@automodly.com


