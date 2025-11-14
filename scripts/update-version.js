#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate version info
const version = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local-build',
  timestamp: Date.now()
};

// Write to public/version.json
const versionPath = join(__dirname, '..', 'public', 'version.json');
writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log(`✅ Updated version.json:`, version);