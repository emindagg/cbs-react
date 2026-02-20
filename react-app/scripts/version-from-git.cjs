const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..', '..');
const outPath = path.join(__dirname, '..', 'version.json');

// Bu commit sayısında sürüm 0.1.1 olur; sonrası 0.1.2, 0.1.3...
const BASELINE = 110;

let count = '0';
try {
  // CI/CD ortamında (GitHub Actions) remote'dan al
  // Local development ve pre-push hook'ta local HEAD kullan (push edilecek commit'ler dahil)
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  if (isCI) {
    // CI/CD'de her zaman remote'dan al (senkronizasyon için)
    try {
      count = execSync('git rev-list --count origin/main', { cwd: repoRoot, encoding: 'utf8' }).trim();
    } catch {
      // Fallback: HEAD kullan
      count = execSync('git rev-list --count HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    }
  } else {
    // Local development ve pre-push hook: Local HEAD kullan
    // (Push edilecek commit'ler dahil, böylece doğru versiyon oluşur)
    count = execSync('git rev-list --count HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  }
} catch {
  // Git repo yoksa veya git mevcut değilse
  // Mevcut version.json'dan versiyonu oku (fallback)
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    console.log('version:', existing.version, '(cached, git unavailable)');
    process.exit(0);
  } catch {
    // Hiçbir şey yoksa varsayılan versiyon
    count = '0';
  }
}

const totalCommits = parseInt(count, 10) || 0;
const build = Math.max(1, totalCommits - BASELINE + 1);
const version = `0.1.${build}`;
const payload = { version, build: build };

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('version:', version);
