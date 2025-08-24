import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: [
        // libraries and utils
        'src/lib/**/*.{ts,tsx}',
        // middleware
        'src/middleware.ts',
        // app routes we actively test
        'src/app/auth/**/*.{ts,tsx}',
        'src/app/profile/**/*.{ts,tsx}',
        'src/app/restaurants/**/*.{ts,tsx}',
        'src/app/api/**/*.{ts,tsx}',
        // components used by those pages
        'src/components/restaurants/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        'coverage/**',
        'next-env.d.ts',
        'next.config.*',
        'postcss.config.*',
        'tailwind.config.*',
        'vitest.config.*',
        'vitest.setup.*',
        'src/lib/db.ts',
        // test files and fixtures
        'src/app/auth/error/**',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
