# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Testing

This project uses [Vitest](https://vitest.dev/) for unit testing with comprehensive coverage reporting.

### Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Open visual test UI
npm run test:ui

# Explicit watch mode
npm run test:watch
```

### Coverage Report

After running `npm run test:coverage`, you can:
- View the summary in the terminal
- Open `coverage/index.html` in your browser for detailed HTML report
- Check `coverage/lcov.info` for CI/CD integration

Current coverage: **86.52%** (exceeds 70% minimum threshold)

### Writing Tests

Tests are co-located with source files using the `*.test.ts` pattern:

```
src/
  utils/
    classification.ts
    classification.test.ts  ← Test file
```

**Test structure example:**

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myModule'

describe('myModule', () => {
  describe('myFunction', () => {
    it('should return expected result when given valid input', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = myFunction(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

**Best practices:**
- Use descriptive test names: `it('should <expected behavior> when <condition>')`
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests independent (no shared state)
- Use mock data from `src/test/mockData.ts` for consistency
- Target 70%+ coverage for new code

### Test Utilities

The project provides test utilities in `src/test/`:
- `mockData.ts` - Mock data factories for GeoJSON, user data, etc.
- `helpers.ts` - Test helper functions for assertions

### CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/test.yml` for CI/CD configuration.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
