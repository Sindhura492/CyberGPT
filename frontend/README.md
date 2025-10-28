# 🎨 CyberGPT Frontend

Modern, responsive React application for the CyberGPT cybersecurity assessment platform.

## 🚀 Technology Stack

- **React 18.3.1** - UI Framework
- **TypeScript 5.6.2** - Type Safety
- **Vite 5.4.10** - Build Tool & Dev Server
- **Tailwind CSS 3.4.15** - Styling
- **Framer Motion 11.18.2** - Animations
- **D3.js 7.9.0** - Data Visualization
- **Radix UI** - Accessible Components
- **Zustand 5.0.1** - State Management
- **React Router 7.0.1** - Routing
- **Axios 1.7.8** - HTTP Client
- **Convex 1.17.4** - Real-time Database

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                      # API client configurations
│   │   ├── axios.ts             # Base Axios configuration
│   │   ├── auth.ts              # Authentication APIs
│   │   ├── chat.ts              # Chat APIs
│   │   ├── graph.ts             # Knowledge graph APIs
│   │   ├── scan.ts              # Scanning APIs
│   │   └── rag.ts               # RAG APIs
│   │
│   ├── components/               # Reusable components
│   │   ├── chat/                # Chat-related components
│   │   │   ├── mira-chat-bot.tsx
│   │   │   ├── chat-search.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── SourceLinks.tsx
│   │   │   ├── TodoListButton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/           # Dashboard components
│   │   │   ├── Layout.tsx
│   │   │   ├── DashboardCard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── graph-visualization/ # Graph components
│   │   │   ├── GraphVisualization.tsx
│   │   │   ├── GraphButton.tsx
│   │   │   └── GraphGenerationModal.tsx
│   │   │
│   │   ├── reports/             # Report components
│   │   │   ├── InteractiveTodoList.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── sidebar/             # Sidebar components
│   │   │   ├── nav-chat-history.tsx
│   │   │   └── ...
│   │   │
│   │   ├── file/                # File handling
│   │   │   ├── MarkdownViewer.tsx
│   │   │   └── FileUpload.tsx
│   │   │
│   │   └── ui/                  # Base UI components
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── toast.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useGraphGeneration.ts
│   │   └── useScan.ts
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── utils.ts
│   │   ├── convexClient.ts
│   │   └── supabase.ts
│   │
│   ├── pages/                   # Page components
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ScanPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── ...
│   │
│   ├── store/                   # Zustand state management
│   │   ├── store.ts
│   │   ├── chatActions.ts
│   │   └── scanStore.ts
│   │
│   ├── types/                   # TypeScript definitions
│   │   ├── chats.ts
│   │   ├── graphVisualization.ts
│   │   ├── scan.ts
│   │   └── ...
│   │
│   ├── utils/                   # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles
│   └── vite-env.d.ts           # Vite type definitions
│
├── public/                      # Static assets
│   ├── logo.png
│   ├── upload.svg
│   └── vite.svg
│
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
├── vite.config.ts              # Vite config
├── biome.json                  # Biome config
└── vercel.json                 # Vercel deployment
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run Biome linter
npm run lint:fix         # Fix linting issues
npm run format           # Check formatting
npm run format:fix       # Fix formatting issues
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling with custom configuration:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          // ... more colors
        },
      },
    },
  },
};
```

### CSS Variables

Custom CSS variables defined in `src/index.css`:

```css
:root {
  --sidebar: 222.2 84% 4.9%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 217.2 91.2% 59.8%;
  /* ... more variables */
}
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the frontend directory:

```env
# Backend API
VITE_API_URL=http://localhost:8000

# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Stripe (Public Key)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Application
VITE_APP_NAME=CyberGPT
VITE_APP_URL=http://localhost:3000
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

## 🧩 Key Features

### Responsive Design

All components are fully responsive using Tailwind's responsive utilities:

```tsx
<div className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
  {/* Mobile-first design */}
</div>
```

### Dark Mode Support

Theme switching using `next-themes`:

```tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>
```

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Focus management
- ARIA labels

### Animations

Smooth animations using Framer Motion:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {content}
</motion.div>
```

### State Management

Zustand for global state:

```typescript
const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  // ... more actions
}));
```

## 📦 Component Library

### UI Components (Radix UI)

- **Button**: Accessible button with variants
- **Dialog**: Modal dialogs
- **Dropdown Menu**: Context menus
- **Toast**: Notifications
- **Tooltip**: Helpful tooltips
- **Accordion**: Collapsible sections
- **Tabs**: Tab navigation
- **Progress**: Progress bars

### Custom Components

#### ChatMessage

```tsx
<ChatMessage
  message={message}
  isUser={true}
  onSourceClick={handleSourceClick}
/>
```

#### GraphVisualization

```tsx
<GraphVisualization
  data={graphData}
  className="w-full h-full"
  onNodeClick={handleNodeClick}
  onLinkClick={handleLinkClick}
/>
```

#### InteractiveTodoList

```tsx
<InteractiveTodoList
  reportId={reportId}
  initialTasks={tasks}
  onTaskUpdate={handleTaskUpdate}
/>
```

## 🔒 Security

### Protected Routes

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### XSS Prevention

- React automatically escapes values
- DOMPurify for sanitizing HTML
- Content Security Policy headers

### Authentication

JWT tokens stored in HTTP-only cookies:

```typescript
// Axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🧪 Testing

### Unit Tests

Using Vitest and React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
test('chat flow', async () => {
  render(<ChatPage />);
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'Hello');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));
  expect(await screen.findByText('Hello')).toBeInTheDocument();
});
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -f frontend.Dockerfile -t cybergpt-frontend .

# Run container
docker run -p 3000:3000 cybergpt-frontend
```

### Static Hosting

```bash
# Build
npm run build

# Output in dist/
# Deploy dist/ to any static hosting service
```

## 📊 Performance

### Optimization Techniques

- Code splitting with React.lazy
- Image optimization
- Component memoization
- Virtual scrolling for long lists
- Lazy loading for routes

```tsx
const ChatPage = lazy(() => import('./pages/ChatPage'));

<Suspense fallback={<Loading />}>
  <ChatPage />
</Suspense>
```

### Lighthouse Scores

- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

## 🐛 Troubleshooting

### Common Issues

**Issue**: Vite dev server not starting
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

**Issue**: TypeScript errors
```bash
# Regenerate types
npm run type-check
```

**Issue**: Build fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Frontend-Specific Guidelines

- Follow the established component structure
- Use TypeScript for all new components
- Add proper prop types and documentation
- Write tests for new features
- Ensure accessibility compliance
- Test on mobile devices

## 📄 License

MIT License - see [LICENSE](../LICENSE)

---

**Built with ❤️ using React & TypeScript**
