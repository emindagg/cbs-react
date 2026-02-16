const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..', '..');
const outPath = path.join(__dirname, '..', 'version.json');

let count = '0';
try {
  count = execSync('git rev-list --count HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
} catch {
  // not a git repo or git unavailable
}

const build = parseInt(count, 10) || 0;
const version = `0.1.${build}`;
const payload = { version, build: build };

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('version:', version);
