# Contributing Guide

Welcome to the project! This guide will help you contribute effectively.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Feature Development](#feature-development)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js:** 18+ (recommended: 20+)
- **Package Manager:** npm (comes with Node.js)
- **Git:** Latest version
- **Editor:** VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd react-app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

### Verify Setup

```bash
# Run linter
npm run lint

# Run tests
npm run test:run

# Build project
npm run build
```

All commands should complete successfully.

---

## Development Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Create bugfix branch
git checkout -b fix/bug-description

# Create docs branch
git checkout -b docs/documentation-update
```

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create/switch to your branch
git checkout -b feature/my-feature

# 3. Make changes
# ... code ...

# 4. Run linter
npm run lint:fix

# 5. Run tests
npm run test:run

# 6. Commit changes
git add .
git commit -m "feat: add new feature"

# 7. Push to remote
git push origin feature/my-feature

# 8. Create Pull Request
# Go to GitHub and create PR
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Code style (formatting, semicolons, etc.)
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance tasks

# Examples
feat(legend): add dynamic legend component
fix(data-import): handle empty Excel files
docs(architecture): update feature-first guide
refactor(map): extract controls to separate components
test(utils): add classification tests
chore(deps): update dependencies
```

---

## Code Standards

### TypeScript

**✅ Do:**
```typescript
// Use explicit types
interface User {
  id: string
  name: string
  email: string
}

// Use type imports
import type { User } from '@/types/user'

// Use const assertions
const COLORS = ['red', 'blue', 'green'] as const

// Use strict null checks
const user: User | null = getUser()
if (user) {
  console.log(user.name)
}
```

**❌ Don't:**
```typescript
// Don't use any
const data: any = getData()

// Don't mix type and value imports
import { User, getUser } from '@/types/user'

// Don't use loose types
const colors: string[] = ['red', 'blue', 'green']
```

### React Components

**✅ Do:**
```tsx
// Functional components with TypeScript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  )
}

// Named exports for utilities
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString()
}
```

**❌ Don't:**
```tsx
// Don't use default props
Button.defaultProps = {
  variant: 'primary'
}

// Don't use class components (unless necessary)
class Button extends React.Component {
  // ...
}

// Don't use inline styles (use Tailwind)
<button style={{ padding: '8px', background: 'blue' }}>
  Click
</button>
```

### Hooks

**✅ Do:**
```typescript
// Custom hooks start with 'use'
export const useFileImport = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const importFile = useCallback(async (file: File) => {
    setIsLoading(true)
    try {
      const data = await parseFile(file)
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return { importFile, isLoading, error }
}

// Use hooks at top level
const MyComponent = () => {
  const { importFile, isLoading } = useFileImport()
  
  if (isLoading) return <Loading />
  
  return <div>...</div>
}
```

**❌ Don't:**
```typescript
// Don't call hooks conditionally
const MyComponent = () => {
  if (condition) {
    const data = useData()  // ❌ Wrong
  }
  
  return <div>...</div>
}

// Don't call hooks in loops
const MyComponent = () => {
  items.forEach(item => {
    const data = useData(item)  // ❌ Wrong
  })
  
  return <div>...</div>
}
```

### Styling

**✅ Do:**
```tsx
// Use Tailwind utilities
<div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
  Content
</div>

// Use clsx for conditional classes
import clsx from 'clsx'

<div className={clsx(
  'btn',
  isActive && 'btn-active',
  isDisabled && 'btn-disabled'
)}>
  Button
</div>

// Component-specific CSS when needed
import './MyComponent.css'
```

**❌ Don't:**
```tsx
// Don't use inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  Content
</div>

// Don't use CSS-in-JS libraries
const styles = {
  container: {
    display: 'flex',
    padding: '16px'
  }
}
```

---

## Feature Development

### Creating a New Feature

#### Step 1: Plan the Feature

```markdown
# Feature: User Authentication

## Components
- LoginForm
- RegisterForm
- AuthProvider

## Hooks
- useAuth
- useLogin
- useRegister

## Services
- authApi

## Types
- User
- AuthState
- LoginCredentials
```

#### Step 2: Create Feature Structure

```bash
# Create folders
mkdir -p src/features/auth/{components,hooks,services}

# Create files
touch src/features/auth/components/LoginForm.tsx
touch src/features/auth/hooks/useAuth.ts
touch src/features/auth/services/authApi.ts
touch src/features/auth/types.ts
touch src/features/auth/index.ts
```

#### Step 3: Implement Components

```tsx
// src/features/auth/components/LoginForm.tsx
import { useState } from 'react'

import type { LoginCredentials } from '../types'
import { useLogin } from '../hooks/useLogin'

export default function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  
  const { login, isLoading, error } = useLogin()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(credentials)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        className="input"
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        className="input"
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading} className="btn btn-primary">
        {isLoading ? 'Loading...' : 'Login'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}
```

#### Step 4: Create Barrel Export

```typescript
// src/features/auth/index.ts
/**
 * Auth Feature
 * User authentication and authorization
 */

// Components
export { default as LoginForm } from './components/LoginForm'
export { default as RegisterForm } from './components/RegisterForm'

// Hooks
export { useAuth } from './hooks/useAuth'
export { useLogin } from './hooks/useLogin'
export { useRegister } from './hooks/useRegister'

// Types
export type * from './types'
```

#### Step 5: Use in Application

```tsx
// src/components/layout/AppLayout.tsx
import { LoginForm } from '@/features/auth'

export default function AppLayout() {
  return (
    <div>
      <LoginForm />
    </div>
  )
}
```

### Feature Checklist

- [ ] Feature folder created
- [ ] Components implemented
- [ ] Hooks implemented (if needed)
- [ ] Services implemented (if needed)
- [ ] Types defined
- [ ] Barrel export created
- [ ] Tests written
- [ ] Documentation updated
- [ ] ESLint passes
- [ ] Build succeeds

---

## Testing Guidelines

### Test Structure

```typescript
// src/features/auth/hooks/useAuth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    // Setup
  })
  
  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth())
      const credentials = { email: 'test@example.com', password: 'password' }
      
      // Act
      await act(async () => {
        await result.current.login(credentials)
      })
      
      // Assert
      expect(result.current.user).toBeDefined()
      expect(result.current.isAuthenticated).toBe(true)
    })
    
    it('should handle invalid credentials', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth())
      const credentials = { email: 'test@example.com', password: 'wrong' }
      
      // Act
      await act(async () => {
        await result.current.login(credentials)
      })
      
      // Assert
      expect(result.current.error).toBeDefined()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
```

### Test Coverage

**Minimum Requirements:**
- **Utils:** 90%+ coverage
- **Hooks:** 80%+ coverage
- **Components:** 70%+ coverage

**Run Coverage:**
```bash
npm run test:coverage
```

### Test Best Practices

**✅ Do:**
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test edge cases
- Use mock data from `src/test/mockData.ts`
- Keep tests independent

**❌ Don't:**
- Test implementation details
- Share state between tests
- Use real API calls
- Skip error cases

---

## Pull Request Process

### Before Creating PR

```bash
# 1. Update from main
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main

# 2. Run checks
npm run lint
npm run test:run
npm run build

# 3. Review changes
git diff main
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added
```

### Review Process

1. **Automated Checks:**
   - ESLint
   - TypeScript compilation
   - Tests
   - Build

2. **Code Review:**
   - At least 1 approval required
   - Address all comments
   - Update as needed

3. **Merge:**
   - Squash and merge (preferred)
   - Rebase and merge (for clean history)
   - Merge commit (for feature branches)

---

## Common Tasks

### Adding a New Component

```bash
# 1. Create component file
touch src/features/my-feature/components/MyComponent.tsx

# 2. Implement component
# ... code ...

# 3. Add to barrel export
# Edit src/features/my-feature/index.ts

# 4. Add tests
touch src/features/my-feature/components/MyComponent.test.tsx

# 5. Run checks
npm run lint:fix
npm run test:run
```

### Adding a New Hook

```bash
# 1. Create hook file
touch src/features/my-feature/hooks/useMyHook.ts

# 2. Implement hook
# ... code ...

# 3. Add to barrel export
# Edit src/features/my-feature/index.ts

# 4. Add tests
touch src/features/my-feature/hooks/useMyHook.test.ts

# 5. Run checks
npm run lint:fix
npm run test:run
```

### Adding a New Utility

```bash
# 1. Decide: Feature-specific or shared?

# Feature-specific:
touch src/features/my-feature/utils/myUtil.ts

# Shared:
touch src/utils/myUtil.ts

# 2. Implement utility
# ... code ...

# 3. Add tests (co-located)
touch src/utils/myUtil.test.ts

# 4. Run checks
npm run lint:fix
npm run test:run
```

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update specific package
npm update <package-name>

# Update all packages (careful!)
npm update

# After update, test everything
npm run lint
npm run test:run
npm run build
```

---

## Troubleshooting

### ESLint Errors

**Problem:** Import order errors
```bash
# Solution: Auto-fix
npm run lint:fix
```

**Problem:** Feature-first violations
```typescript
// Error: Cross-feature deep import
import { Component } from '@/features/auth/components/Component'

// Solution: Use barrel
import { Component } from '@/features/auth'
```

### TypeScript Errors

**Problem:** Type errors after moving files
```bash
# Solution: Clean and rebuild
rm -rf node_modules/.vite
npm run build
```

**Problem:** Cannot find module
```bash
# Solution: Check tsconfig paths
# Verify @/* alias is configured
```

### Test Failures

**Problem:** Tests fail after refactoring
```bash
# Solution: Update test imports
# Check if barrel exports are updated
```

**Problem:** Flaky tests
```bash
# Solution: Check for shared state
# Ensure tests are independent
# Use beforeEach for setup
```

### Build Errors

**Problem:** Build fails but dev works
```bash
# Solution: Check for dynamic imports
# Verify all dependencies are installed
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## Code Review Checklist

### For Authors

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console.log or debugger statements
- [ ] Comments explain "why", not "what"
- [ ] No unnecessary files committed
- [ ] PR description is clear
- [ ] Breaking changes documented

### For Reviewers

- [ ] Code is readable and maintainable
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Tests are adequate
- [ ] No security issues
- [ ] Performance considerations
- [ ] Documentation updated

---

## Resources

### Documentation
- [Architecture Guide](./ARCHITECTURE.md)
- [Feature List](./FEATURES.md)
- [ESLint Config](./eslint.config.js)

### External Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Getting Help

- **Questions:** Open a discussion on GitHub
- **Bugs:** Create an issue with reproduction steps
- **Features:** Propose in discussions first

---

## License

This project is proprietary. See LICENSE file for details.

---

**Happy Coding! 🚀**

*Last Updated: 15 Şubat 2026*
