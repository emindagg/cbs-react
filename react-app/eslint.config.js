import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import stylistic from '@stylistic/eslint-plugin'

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'public/**'],
  },

  // Base config for all TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
      '@stylistic': stylistic,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // ========================================
      // FEATURE-FIRST / PRAGMATİK LİMİTLER (KURAL 3)
      // ========================================

      // Dosya: 600 satır (Rule dosyası ile uyumlu)
      'max-lines': ['warn', {
        max: 600,
        skipBlankLines: true,
        skipComments: true,
      }],

      // Fonksiyon: 500 satır (wizard/modallar için pragmatik)
      'max-lines-per-function': ['warn', {
        max: 500,
        skipBlankLines: true,
        skipComments: true,
      }],

      // ========================================
      // IMPORT RULES
      // ========================================

      // Import sıralama (alfabetik + kategori)
      'import/order': ['error', {
        groups: [
          'builtin',   // Node.js built-in modules
          'external',  // npm packages
          'internal',  // @/ ile başlayanlar
          ['parent', 'sibling'],
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      }],

      // Duplicate imports yasak
      'import/no-duplicates': 'error',

      // Default export var mı kontrol et
      'import/default': 'error',

      // Named export var mı kontrol et
      'import/named': 'error',

      // Feature-First: domain kodu src/features altında; components/visualization yasak
      // KURAL 2: Derin feature import yasak — sadece barrel (index) kullan: @/features/name
      'no-restricted-imports': ['error', {
        paths: [{
          name: '@/components/visualization',
          message: 'Feature-First: domain kodu src/features altındadır. @/features/viz-wizard, @/features/legend-dw veya @/features/data-mapper kullanın.',
        }],
        patterns: [
          {
            group: ['**/components/visualization', '**/components/visualization/*'],
            message: 'Feature-First: domain kodu src/features altındadır. @/features/viz-wizard, @/features/legend-dw veya @/features/data-mapper kullanın.',
          },
          {
            group: ['@/features/*/*', '@/features/*/*/*'],
            message: "Cross-feature imports must use the public barrel (e.g. '@/features/auth'). Do not import deep internal files. Use relative paths inside the same feature.",
          },
        ],
      }],

      // ========================================
      // TYPESCRIPT STRICT RULES
      // ========================================

      // any kullanımı (geliştirme aşamasında warning, production'da error olmalı)
      '@typescript-eslint/no-explicit-any': 'error',

      // Kullanılmayan değişkenler
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],

      // Explicit function return types (sadece export edilenler için)
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // ========================================
      // REACT RULES
      // ========================================

      // React hooks kuralları
      ...reactHooks.configs.recommended.rules,

      // React refresh için fast refresh uyumluluğu
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],

      // ========================================
      // CODE QUALITY RULES
      // ========================================

      // console.log development için OK ama production'da kaldırılmalı
      'no-console': ['warn', {
        allow: ['warn', 'error', 'info', 'debug'],
      }],

      // debugger yasak
      'no-debugger': 'error',

      // alert yasak
      'no-alert': 'warn',

      // const > let > var
      'prefer-const': 'error',
      'no-var': 'error',

      // === zorunlu
      'eqeqeq': ['error', 'always'],

      // Magic numbers (matematiksel sabitler, UI değerleri ve koordinatlar için esnek)
      'no-magic-numbers': ['warn', {
        ignore: [
          // Temel sayılar
          0, 1, -1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 15, 16, 19, 20, 24, 26, 28, 30, 32, 39, 40, 50, 60, 80, 81, 90, -90, 100, 116, 150, 180, -180, 200, 255, 360, 365, 500, 750, 1000, 3600, 1000000,
          // Negatif sayılar
          -20, -42,
          // Matematiksel sabitler
          23.44, 3.14159,
          // UI değerleri (opacity, font-size, grid row height)
          0.0001, 0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.75, 0.8, 0.9, 0.95,
          1.5, 2.5,
          // Renk / sRGB sabitleri
          0.04045, 0.055, 1.055, 2.4, 12.92, 0.008856, 7.787, 0.95047, 1.08883,
          0.4124564, 0.3575761, 0.1804375, 0.2126729, 0.7151522, 0.072175, 0.0193339, 0.119192, 0.9503041,
          1.8760108,
          0.0031308, -1.5371385, -0.4985314, -0.969266, 0.041556, 0.0556434, -0.2040259, 1.0572252,
          3.2404542,
          // Koordinat değerleri
          33.41, 35.2433, 38.9637,
        ],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        ignoreNumericLiteralTypes: true,
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
        detectObjects: false,
      }],

      // ========================================
      // STYLISTIC RULES
      // ========================================

      // Semicolon yoksa hata
      '@stylistic/semi': ['error', 'never'],

      // Single quotes
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true,
      }],

      // Trailing comma
      '@stylistic/comma-dangle': ['error', 'always-multiline'],

      // Indent 2 spaces
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
      }],
    },
  },

  // Test dosyaları için özel kurallar
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      'no-magic-numbers': 'off', // Test dosyalarında magic number serbest
      '@typescript-eslint/no-explicit-any': 'warn', // Test'lerde any daha esnek
      'max-lines-per-function': 'off', // Test fonksiyonları uzun olabilir
    },
  },

  // Feature-First KURAL 1: src/components (global) feature'lardan import edemez (warn = hedef mimari, mevcut kod geçiş sonrası error yapılabilir)
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['warn', {
        paths: [{
        name: '@/components/visualization',
        message: 'Feature-First: domain kodu src/features altındadır.',
        }],
        patterns: [
          {
            group: ['**/components/visualization', '**/components/visualization/*'],
            message: 'Feature-First: domain kodu src/features altındadır.',
          },
          {
            group: ['@/features/*', '@/features/*/*', '../features/*', '../features/*/*'],
            message: "Global 'components' cannot import from 'features'. Move this component into the respective feature folder or make it agnostic.",
          },
        ],
      }],
    },
  },

  // Feature-First KURAL 4: Feature'lar arası doğrudan import yasak (sadece public API)
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*'],
            message: "Files under 'src/features' cannot import from '@/features/*' (including own feature). Use relative imports inside the same feature, and use '@/shared/*' or root orchestration for cross-feature dependencies.",
          },
        ],
      }],
    },
  },

  // Root orchestratorlar ve map-level orchestratorlar: sadece barrel (index) import'una izin verilir
  // Bu kural Feature-First KURAL 4'ün ardından geldiği için onun yerine geçer (flat config: son kural kazanır)
  {
    files: [
      'src/components/layout/AppLayout.tsx',
      'src/components/sidebar/Sidebar.tsx',
      'src/features/map/components/MapContainer.tsx',
      'src/features/map/layers/DataLayer.tsx',
      'src/features/map/controls/GISToolsControl.tsx',
      'src/features/map/controls/GISToolsControl.buffer.tsx',
      'src/features/map/controls/GISToolsControl.bufferOptions.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/*'],
            message: "Root/map orchestrators must import features only via public barrel: '@/features/<name>' (no deep imports).",
          },
        ],
      }],
    },
  },

  // Recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
]

