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
      // FEATURE-BASED ARCHITECTURE RULES
      // ========================================

      // Dosya boyutu limitleri (gerçekçi standartlar)
      'max-lines': ['warn', {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }],

      // Wizard step'ler ve modallar için daha esnek limit
      'max-lines-per-function': ['warn', {
        max: 200,
        skipBlankLines: true,
        skipComments: true,
      }],

      // ========================================
      // IMPORT RULES
      // ========================================

      // Import sıralama (alfabetik + category)
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

      // ========================================
      // TYPESCRIPT STRICT RULES
      // ========================================

      // any kullanımı (geliştirme aşamasında warning, production'da error olmalı)
      '@typescript-eslint/no-explicit-any': 'warn',

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
          0, 1, -1, 2, 3, 4, 5, 6, 7, 10, 12, 15, 19, 20, 24, 30, 39, 40, 50, 60, 81, 90, -90, 100, 150, 180, -180, 360, 365, 500, 750, 1000, 3600, 1000000,
          // Negatif sayılar
          -20, -42,
          // Matematiksel sabitler
          23.44, // Ekliptik eğimi (derece)
          3.14159, // Pi yaklaşık değeri
          // UI değerleri (opacity, threshold, multiplier)
          0.0001, 0.05, 0.1, 0.2, 0.25, 0.3, 0.45, 0.5, 0.55, 0.7, 0.75, 0.8, 0.9, 0.95,
          1.5, 2.5, // Çarpanlar ve oranlar
          // Koordinat değerleri (Türkiye merkezi ve yaygın konumlar)
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

  // Recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
