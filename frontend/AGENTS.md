# AGENTS.md

## Development Commands

### Package Management
- `npm install` - Install dependencies
- `npm start` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm test` - Run tests (react-scripts)
- `npm test -- --watchAll=false` - Run all tests once
- `npm test -- <test-file-pattern>` - Run specific test (e.g., `npm test -- StockCard`)

### Note
No explicit lint or typecheck scripts exist in package.json. Run `npm test` which includes ESLint via react-scripts.

## Code Style Guidelines

### TypeScript
- Strict mode enabled (tsconfig.json:13)
- All components must use TypeScript with React.FC type
- Define interfaces in `src/types/index.ts` for shared types
- Use `interface` over `type` for object shapes, `type` for unions/aliases

### Imports
- Third-party packages: `import { Component } from 'antd'`
- Local modules: `import { Stock } from '../types'`
- Relative imports for local files, absolute for node_modules
- Group imports: external → internal, separated by blank line

### Components
- Use functional components with hooks
- Props interface defined before component: `interface ComponentProps { ... }`
- Export default: `export default ComponentName`
- Component files use PascalCase (e.g., `StockCard.tsx`, `Dashboard.tsx`)

### Styling
- Primary approach: inline styles in components
- Use CSS variables from index.css for consistency (e.g., `var(--primary-color)`)
- Custom CSS classes for complex reusable styles in `src/index.css`
- Ant Design styled components for UI library overrides

### State & Hooks
- Use `useState` for local state
- Use `useEffect` for side effects with proper dependency arrays
- Use destructuring for hooks: `const [loading, setLoading] = useState(false)`
- Prefix setter functions with `set` + state name

### API Calls
- All API calls through `src/services/api.ts`
- Use axios interceptors for auth headers (automatically adds Bearer token)
- API functions return Promises: `Promise<{ data: T }>`
- Handle errors with try/catch, use `message.error()` for user feedback
- 401 responses auto-redirect to `/login`

### Error Handling
- Wrap async operations in try/catch
- Use `console.error()` for debugging errors
- Use Ant Design `message` component for user notifications
- Always set loading state appropriately with `finally` blocks

### Naming Conventions
- Components: PascalCase (e.g., `StockCard`, `RuleCard`)
- Functions: camelCase (e.g., `fetchUserStocks`, `onFinish`)
- Variables: camelCase (e.g., `userStocks`, `loading`)
- Constants: UPPER_SNAKE_CASE for values, camelCase for objects
- API endpoints: kebab-case in URLs (e.g., `/user-stocks`)

### File Organization
```
src/
├── components/    # Reusable components (StockCard, RuleCard)
├── pages/         # Page components (Dashboard, Login, StockList)
├── services/      # API services (api.ts)
├── types/         # TypeScript interfaces (index.ts)
└── index.css      # Global styles and CSS variables
```

### Routing
- Use React Router v6 with `Routes` and `Route`
- Protected routes via `ProtectedRoute` component (checks localStorage token)
- Navigate using `useNavigate()` hook
- Use `<Navigate to="/path" replace />` for redirects

### UI Library (Ant Design)
- Import components: `import { Card, Typography } from 'antd'`
- Use Chinese locale: `import zhCN from 'antd/es/locale/zh_CN'`
- Wrap app in `ConfigProvider locale={zhCN}` for localized UI
- Use `message` for notifications: `message.success('登录成功')`

### Comments & Documentation
- Use Chinese for all user-facing text and UI labels
- Use inline comments sparingly (let code be self-documenting)
- Comment complex logic or business rules

### Charts
- Use ECharts via `echarts-for-react` package
- Define chart options as objects with proper TypeScript types
- Configure tooltip, legend, grid, and series consistently

### Date/Time
- Use `dayjs` for date manipulation (instead of moment.js)
- Format dates: `new Date().toLocaleString('zh-CN')`

### Security
- Store auth token in localStorage: `access_token`
- Never hardcode credentials
- API base URL from env var: `process.env.REACT_APP_API_BASE_URL`

### Responsive Design
- Use Ant Design's Grid system: `Row` and `Col` with `xs/sm/md/lg/xl` breakpoints
- Mobile-first approach where applicable
- Test on different viewport sizes
