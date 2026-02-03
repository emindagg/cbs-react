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
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
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

      // Dosya boyutu limitleri (profesyonel standartlar)
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],

      'max-lines-per-function': ['warn', {
        max: 120,
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

      // Magic numbers (esnek)
      'no-magic-numbers': ['warn', {
        ignore: [0, 1, -1, 2, 3, 4, 5, 10, 100, 1000],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        ignoreNumericLiteralTypes: true,
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
      }],

      // ========================================
      // STYLISTIC RULES
      // ========================================

      // Semicolon yoksa hata
      '@stylistic/semi': ['error', 'never'],

      // Single quotes
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true,
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
