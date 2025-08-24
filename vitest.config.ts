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
      include: ['src/lib/**/*.{ts,tsx}', 'src/app/auth/**/*.{ts,tsx}', 'src/middleware.ts'],
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
        // exclude currently untested UI
        'src/components/**',
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
