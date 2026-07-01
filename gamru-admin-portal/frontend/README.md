# Frontend (React + TypeScript + Vite)

A React application converted to TypeScript with Husky git hooks, ESLint, and Prettier integration.

## Tech Stack

- **React 18** with TypeScript
- **Vite** (build tool)
- **React Router v6** (routing)
- **Axios** (API calls, fully typed with generics)
- **React Toastify** (notifications)
- **Tailwind CSS** (styling — loaded via CDN in `index.html`)
- **ESLint + Prettier** (linting & formatting)
- **Husky + lint-staged** (git hooks)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This will also run `husky` (via the `prepare` script) to install git hooks.

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` to point at your backend:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Initialize git (if not already)

Husky needs a git repo to install hooks:

```bash
git init
npm run prepare
```

### 4. Run the dev server

```bash
npm run dev
```

## Available Scripts

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start Vite dev server                       |
| `npm run build`        | Type-check then build for production        |
| `npm run preview`      | Preview the production build                |
| `npm run lint`         | Run ESLint                                  |
| `npm run lint:fix`     | Run ESLint with auto-fix                    |
| `npm run format`       | Format all source files with Prettier       |
| `npm run format:check` | Check formatting without writing            |
| `npm run type-check`   | Run TypeScript compiler in no-emit mode     |

## Husky Git Hooks

Three hooks are configured in `.husky/`:

- **pre-commit** → runs `lint-staged` (ESLint + Prettier on staged files only)
- **pre-push** → runs `npm run type-check` (full TypeScript check)
- **commit-msg** → enforces [Conventional Commits](https://www.conventionalcommits.org/) format

### Conventional Commits format

```
<type>(<optional scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Examples:

```
feat: add login page
fix(auth): resolve token refresh issue
docs: update README
refactor(api): extract typed request helper
```

### Bypassing hooks (emergency only)

```bash
git commit --no-verify -m "..."
git push --no-verify
```

## Project Structure

```
src/
├── assets/              # Images and static files
├── components/          # Reusable components
│   ├── inputs/          # Input components (ModalInput)
│   ├── user/            # User-related components (CreateNewUser)
│   ├── ButtonLoader.tsx
│   ├── Calendar.tsx
│   ├── Header.tsx
│   ├── PageHeaderBreadcrumb.tsx
│   ├── Pagination.tsx
│   └── Sidebar.tsx
├── context/
│   └── AuthContext.tsx  # Auth provider + useAuth hook
├── layout/
│   └── DashboardLayout.tsx
├── pages/
│   ├── user/
│   │   └── UserTableList.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   └── Unauthorized.tsx
├── routes/
│   ├── PageRoutes.tsx
│   └── ProtectedRoute.tsx
├── services/
│   └── api.ts           # Typed axios instance
├── types/               # Shared TypeScript types
│   ├── api.ts
│   ├── auth.ts
│   ├── user.ts
│   └── index.ts         # Barrel export
├── App.tsx
├── main.tsx
├── App.css
├── index.css
└── vite-env.d.ts
```

## Path Aliases

`@/*` resolves to `src/*` — works in both Vite and TypeScript.

```tsx
import apiService from '@/services/api';
import type { User } from '@/types';
```

## TypeScript Configuration

Strict mode is enabled in `tsconfig.app.json`:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

## Notes

- **Tailwind** is loaded via the CDN script in `index.html` (matching the original setup). For production, install Tailwind locally and configure `tailwind.config.js` + `postcss.config.js`.
- The `services/api.ts` axios wrapper uses generics — pass the expected response data type as `apiService.get<MyType>(url)` for full type-safety.
- All shared types live in `src/types/` and are exported through the `@/types` barrel.
- React was pinned to 18.3 and Vite to 5.4 (the originals listed React 19 / Vite 8, which aren't stable). Bump as needed once you confirm compatibility.
