#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const angularDir = resolve(repoRoot, 'blesong-angular');
const distDir = resolve(angularDir, 'dist/blesong/browser');
const destParent = resolve(repoRoot, 'src-tauri/www');
const destDir = resolve(destParent, 'browser');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('[prebuild-tauri] Building Angular (production) in', angularDir);
const result = spawnSync(npmCmd, ['run', 'prod'], {
  cwd: angularDir,
  stdio: 'inherit',
});
if (result.status !== 0) {
  console.error('[prebuild-tauri] Angular build failed.');
  process.exit(result.status ?? 1);
}

if (!existsSync(distDir)) {
  console.error(`[prebuild-tauri] Expected Angular dist at ${distDir} but it does not exist.`);
  process.exit(1);
}

console.log(`[prebuild-tauri] Refreshing ${destDir}`);
rmSync(destDir, { recursive: true, force: true });
mkdirSync(destParent, { recursive: true });
cpSync(distDir, destDir, { recursive: true });

console.log('[prebuild-tauri] Done.');
