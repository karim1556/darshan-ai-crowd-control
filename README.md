# DARSHAN.AI - Smart Pilgrimage Crowd Control System

**Intelligent crowd management, real-time SOS coordination, and safety-first technology for pilgrimages**

## Overview

DARSHAN.AI is a comprehensive system designed to make large pilgrimages safer and more accessible through real-time crowd monitoring, AI-powered routing, and emergency coordination. The platform serves four key stakeholder groups: pilgrims, temple administrators, police/security, and medical teams.

## Features

### Pilgrim/Devotee App
- **Smart Booking**: Reserve entry slots with real-time availability
- **Crowd Monitoring**: View live crowd density heatmaps across temple areas
- **Emergency SOS**: One-tap distress signal with automatic responder dispatch
- **AI Darshan Guide**: Personalized routes and timing recommendations
- **Safety Alerts**: Real-time notifications about crowd conditions and closures

### Temple Admin Dashboard
- **Live Capacity Management**: Monitor current crowd levels in real-time
- **Predictive Analytics**: AI-powered forecasting of peak hours and crowd patterns
- **Slot Management**: Dynamic booking system with capacity constraints
- **Area-wise Distribution**: Heatmaps showing crowd distribution across zones
- **Alert Broadcasting**: Send emergency messages to all pilgrims

### Police/Security Dashboard
- **Incident Tracking**: Real-time monitoring of reported incidents
- **SOS Alert Integration**: Receive and coordinate emergency responses
- **Unit Deployment**: Auto-assign nearest units to incidents
- **Traffic Control**: Manage road access and vehicle flow
- **Response Analytics**: Track incident resolution times

### Medical Emergency Dashboard
- **Active SOS Management**: Prioritized medical emergency tracking
- **Resource Allocation**: Track ambulance and medical team locations
- **Hospital Network**: Real-time bed availability at nearby facilities
- **Case History**: Comprehensive records of all medical incidents
- **Emergency Protocols**: Rapid response activation for critical cases

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Real-time**: Polling-based updates with WebSocket-ready architecture
- **Design System**: Custom semantic design tokens with dark mode support
- **Authentication**: Mock authentication (ready for integration with Supabase, Auth.js, etc.)
- **Database**: Mock data layer (ready for PostgreSQL, MongoDB, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Landing Page                        │
└──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │
      ┌────▼──┐  ┌───▼───┐  ┌──▼───┐  ┌──▼────┐
      │Pilgrim│  │ Admin │  │Police│  │Medical│
      │ App   │  │Dash   │  │Dash  │  │Dash   │
      └────┬──┘  └───┬───┘  └──┬───┘  └──┬────┘
           │         │         │         │
           └─────────┼─────────┼─────────┘
                     │
           ┌─────────▼──────────┐
           │   API Layer        │
           │ ─────────────────  │
           │ • Crowd Density    │
           │ • SOS Management   │
           │ • Bookings         │
           │ • AI Guidance      │
           │ • Incidents        │
           │ • Hospital Data    │
           │ • Analytics        │
           └────────────────────┘
```

## API Endpoints

### Crowd Management
- `GET /api/crowd-density` - Real-time crowd levels by area
- `GET /api/analytics` - Daily analytics and predictions

### Emergency Response
- `POST/GET /api/sos` - SOS case creation and status
- `POST/GET /api/incidents` - Incident reporting and tracking
- `GET /api/hospital-capacity` - Hospital network status

### Pilgrim Services
- `POST/GET /api/booking` - Slot reservations
- `POST /api/ai-guide` - Route recommendations

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and setup**:
```bash
git clone <repository>
cd darshan-ai
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Open in browser**:
Navigate to `http://localhost:3000`

### Usage

1. **Landing Page** (`/`) - Choose your role and access the appropriate dashboard
2. **Pilgrim** (`/pilgrim`) - Book slots, view crowds, request help
3. **Admin** (`/admin`) - Manage capacity and broadcast alerts
4. **Police** (`/police`) - Track incidents and deploy units
5. **Medical** (`/medical`) - Manage emergency responses

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Deploy DARSHAN.AI"
git push origin main
```

2. **Connect to Vercel**:
- Visit [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables if needed
- Deploy

### Environment Variables

For production, add these to your `.env.local` (development) or Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-deployment.vercel.app
```

## Database Integration (Future)

The system is designed to integrate with:
- **Supabase**: For PostgreSQL + real-time subscriptions
- **Firebase**: For real-time updates and cloud functions
- **MongoDB**: For flexible document storage
- **Prisma ORM**: For type-safe database access

Mock data is currently used for demonstration.

## Real-time Updates

The system uses polling for real-time updates (3-5 second intervals). For production deployment with thousands of users, consider:

1. **WebSocket Implementation**: Direct bidirectional communication
2. **Server-Sent Events (SSE)**: One-way real-time updates
3. **Supabase Realtime**: Built-in real-time subscriptions
4. **Socket.io**: Full-duplex communication

## Security Considerations

Before production deployment:

1. **Authentication**: Implement user login/verification
   - Temple staff authentication
   - Police officer verification
   - Pilgrim identity confirmation
   - Medical personnel credentials

2. **Authorization**: Role-based access control
   - Pilgrims can only view their data
   - Admin has full temple management
   - Police can't access medical details
   - Sensitive SOS data encrypted

3. **Data Privacy**: GDPR/privacy compliance
   - Location data encryption
   - Medical information protection
   - Consent management
   - Data retention policies

4. **API Security**:
   - Rate limiting on endpoints
   - CSRF protection
   - Input validation
   - SQL injection prevention

5. **Monitoring**: Track and log
   - Error tracking (Sentry)
   - Performance monitoring
   - Security incidents
   - System health

## Troubleshooting

### Real-time Updates Not Working
- Check browser console for API errors
- Verify API routes are accessible
- Ensure polling interval isn't too aggressive

### Crowd Density Not Updating
- Verify `/api/crowd-density` endpoint returns data
- Check Network tab in browser DevTools
- Confirm `setInterval` is running in component

### SOS Not Triggering
- Verify POST to `/api/sos` succeeds
- Check pilgrim ID is included
- Monitor console for error messages

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: support@darshan-ai.com
- Emergency: +91-XXXX-XXXXXX

## Roadmap

- [ ] Mobile app (React Native)
- [ ] SMS notifications (Twilio)
- [ ] Advanced ML predictions
- [ ] Video monitoring integration
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Social sharing
- [ ] Accessibility improvements

---

**DARSHAN.AI** - Making Pilgrimages Safer, Smarter, and More Spiritual
