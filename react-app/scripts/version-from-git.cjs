const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..', '..');
const outPath = path.join(__dirname, '..', 'version.json');

// Bu commit sayısında sürüm 0.1.1 olur; sonrası 0.1.2, 0.1.3...
const BASELINE = 110;

let count = '0';
try {
  count = execSync('git rev-list --count HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
} catch {
  // not a git repo or git unavailable
}

const totalCommits = parseInt(count, 10) || 0;
const build = Math.max(1, totalCommits - BASELINE + 1);
const version = `0.1.${build}`;
const payload = { version, build: build };

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('version:', version);
