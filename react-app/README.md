# React Map Visualization Application

A feature-rich map visualization application built with React, TypeScript, and MapLibre GL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - System architecture and design principles
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Features Documentation](./FEATURES.md)** - Detailed feature descriptions

## 🎯 Features

- 🗺️ **Interactive Map** - MapLibre GL based map with multiple basemaps
- 📊 **Visualizations** - Choropleth, bubble, and dot density maps
- 📁 **Data Import** - Support for Excel, CSV, GeoJSON, KML, Shapefile
- 🎨 **Customization** - Color schemes, legends, and styling options
- 📐 **GIS Tools** - Buffer, measurement, and drawing tools
- 🌍 **Basemaps** - HGM Atlas, CartoDB, and custom basemaps
- ⭐ **Astronomy** - Sun and moon position visualization
- 🔍 **Geocoding** - Address search and location finding

## 🛠️ Tech Stack

- **Framework:** React 19.2.0 + TypeScript 5.9.3
- **Build Tool:** Vite 7.3.1
- **Map:** MapLibre GL 5.17.0
- **State:** Zustand 5.0.11
- **Styling:** Tailwind CSS 4.1.18
- **Testing:** Vitest 4.0.18
- **Linting:** ESLint 9.39.1

## 📦 Project Structure

```
src/
├── features/          # Feature modules (domain code)
│   ├── astronomy/     # Sun/moon position
│   ├── data-import/   # File import
│   ├── legend/        # Legend components
│   ├── map/           # Core map
│   └── viz-wizard/    # Visualization wizard
├── components/        # Global components (orchestrators)
├── stores/            # Global state (Zustand)
├── utils/             # Shared utilities
└── types/             # Shared types
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed structure.

## 🧪 Testing

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

## 🏗️ Architecture

This project follows **Feature-First Architecture** principles:

- **Domain code in features:** Each feature is self-contained
- **Barrel exports:** Clean public APIs via `index.ts`
- **Single responsibility:** Each module has one clear purpose
- **Dependency direction:** Features → Shared, never Shared → Features

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture guide.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for:

- Development workflow
- Code standards
- Testing guidelines
- Pull request process

### Quick Contribution Steps

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... code ...

# 3. Run checks
npm run lint:fix
npm run test:run
npm run build

# 4. Commit and push
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 5. Create Pull Request
```

## 📊 Project Status

- **Test Coverage:** 86.52% ✅
- **ESLint:** 0 errors, 0 warnings ✅
- **Build:** Passing ✅
- **Features:** 10 active features ✅
- **Architecture:** Feature-First (100% compliant) ✅

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open test UI

# Linting
npm run lint             # Check for lint errors
npm run lint:fix         # Fix lint errors
npm run lint:strict      # Strict mode (max warnings 0)
```

## 🔧 Configuration

### ESLint

The project uses a comprehensive ESLint configuration with:
- TypeScript strict rules
- React Hooks rules
- Feature-First architecture rules
- Import order enforcement
- Code quality rules

See [eslint.config.js](./eslint.config.js) for details.

### TypeScript

Strict mode enabled with:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

See [tsconfig.json](./tsconfig.json) for details.

## 📄 License

This project is proprietary. See LICENSE file for details.

## 🙏 Acknowledgments

- MapLibre GL for the mapping library
- React team for the framework
- Vite team for the build tool
- All contributors to this project

---

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
