import { readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// E2E_EMAIL and E2E_PASSWORD live in .env.local (never in source files).
// The file is read as plain KEY=value lines, so a value that starts with "#" is
// kept whole instead of being treated as a comment (as dotenv parsers do).
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^(E2E_[A-Z_]+)=(.*)$/.exec(line);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
} catch {
  // No .env.local: the variables may come from the environment instead.
}

const STORAGE_STATE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './e2e',
  // All users share the same data, so run one test at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Signs in once and saves the login state for the tests.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
