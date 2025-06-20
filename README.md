# WordWise AI

**Write with confidence. Edit with intelligence.**

WordWise AI is a modern writing assistance application designed for college students who want to catch up on fundamental writing skills. This MVP focuses on core functionality including user authentication, document management, and a rich text editor, with a clean architecture ready for future AI integration.

## Features

### MVP Features (Current)
- ✅ User Authentication (Sign up/Sign in)
- ✅ Document Management (Create, Save, Load, Delete, Rename)
- ✅ Rich Text Editor with TipTap
  - Bold, Italic formatting
  - Heading levels (H1, H2, H3)
  - Bullet & Numbered lists
  - Undo/Redo functionality
- ✅ Auto-save every 1 second
- ✅ Real-time word and character count
- ✅ Basic grammar & spelling suggestions
- ✅ Version history with restore & download
- ✅ Responsive design for all devices
- ✅ Clean, distraction-free interface

### Future Features (Post-MVP)
- 🔮 AI-powered grammar, style, and tone suggestions
- 🔮 Readability analysis & advanced insights
- 🔮 Context-aware writing recommendations
- 🔮 Personalized writing improvement tracking
- 🔮 Real-time collaboration & shared editing

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Rich Text Editor**: TipTap
- **Backend & Database**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Vercel (recommended)

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Supabase account (already configured)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# OpenAI – required for AI suggestion features
VITE_OPENAI_KEY=

# Optional: For development
VITE_APP_ENV=development
```

### 3. Database Setup

The database schema has already been created in your Supabase project with:
- ✅ `documents` table with proper schema
- ✅ Row Level Security (RLS) policies
- ✅ Automatic `updated_at` triggers
- ✅ Performance indexes

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
WordWise/
├── index.html                          # HTML entry for Vite
├── package.json                        # Dependencies and scripts
├── package-lock.json
├── postcss.config.js                   # PostCSS plugins (Tailwind)
├── tailwind.config.js                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript base config
├── tsconfig.node.json                  # Node-specific TS config
├── vite.config.ts                      # Vite build configuration
├── src/                                # Application source
│   ├── App.tsx                         # Main application component
│   ├── main.tsx                        # Application entry point
│   ├── index.css                       # Global styles & Tailwind imports
│   ├── components/                     # Reusable UI components
│   │   ├── LoadingSpinner.tsx
│   │   ├── Modal.tsx
│   │   ├── Sidebar.tsx
│   │   └── SuggestionSidebar.tsx
│   ├── lib/                            # Utility libraries & configurations
│   │   ├── supabase.ts
│   │   └── textChecker.ts
│   ├── pages/                          # Main application pages
│   │   ├── AccountPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EditorPage.tsx
│   │   ├── TrashPage.tsx
│   │   └── VersionHistoryPage.tsx
│   ├── stores/                         # Zustand state management
│   │   ├── authStore.ts
│   │   ├── documentStore.ts
│   │   └── versionStore.ts
│   └── types/                          # Shared TypeScript types
└── README.md                           # Documentation
```

## User Stories (MVP)

1. ✅ **Account Creation**: New users can easily create an account
2. ✅ **Secure Login**: Users can log in securely to access their documents
3. ✅ **Create Documents**: Users can create new blank documents
4. ✅ **Rich Text Editing**: Users can format text with bold, italic, and headings
5. ✅ **Word/Character Count**: Real-time tracking of document statistics
6. ✅ **Auto-save**: Documents are saved automatically to prevent data loss
7. ✅ **Document Management**: Users can view, open, and organize their documents
8. ✅ **Continue Editing**: Users can return to any document to continue writing
9. ✅ **Rename Documents**: Users can organize documents with custom titles
10. ✅ **Delete Documents**: Users can remove unwanted documents

## Database Schema

### documents table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- title (TEXT, Default: 'Untitled Document')
- content (TEXT, Default: '')
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE, Auto-updated)
```

### Security
- Row Level Security (RLS) enabled
- Users can only access their own documents
- Proper authentication required for all operations

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Recommended: Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to add these environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Future Development

This MVP is designed with a clean architecture that supports easy integration of AI features. Future enhancements will include:

1. **AI Integration Layer**: OpenAI GPT-4o API integration
2. **Advanced Analytics**: User writing progress tracking
3. **Collaboration Features**: Real-time document sharing
4. **Export Options**: PDF and DOCX export functionality
5. **Advanced Editor Features**: Tables, images, and more formatting options

## Contributing

This project follows the Product Requirements Document (PRD) specifications for WordWise AI MVP. All features are implemented according to the functional requirements outlined in the PRD.

## License

Private project - All rights reserved.

## Support

For any issues or questions, please check the development setup and ensure all environment variables are properly configured. 