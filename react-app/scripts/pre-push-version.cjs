/**
 * Pre-push git hook: Versiyonu güncelle ve commit et
 * Git push yapılmadan önce çalışır
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..', '..');
const reactAppRoot = path.resolve(__dirname, '..');
const versionScript = path.join(reactAppRoot, 'scripts', 'version-from-git.cjs');
const versionJsonPath = path.join(reactAppRoot, 'version.json');

// Mevcut versiyonu oku
let currentVersion = null;
try {
  const current = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  currentVersion = current.version;
} catch {
  // Dosya yoksa, versiyon oluşturulacak
}

// Versiyonu güncelle (local HEAD'e göre, çünkü push yapıyoruz)
try {
  execSync(`node "${versionScript}"`, { cwd: reactAppRoot, stdio: 'inherit' });
} catch (error) {
  console.error('Versiyon güncelleme hatası:', error.message);
  process.exit(1);
}

// Yeni versiyonu oku
let newVersion = null;
try {
  const updated = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  newVersion = updated.version;
} catch {
  console.error('Versiyon dosyası okunamadı');
  process.exit(1);
}

// Versiyon değiştiyse commit et
if (currentVersion !== newVersion) {
  try {
    // version.json'un staged olup olmadığını kontrol et
    const status = execSync('git status --porcelain react-app/version.json', { 
      cwd: repoRoot, 
      encoding: 'utf8' 
    }).trim();
    
    if (status) {
      // Versiyon dosyasını stage'e ekle
      execSync('git add react-app/version.json', { cwd: repoRoot, stdio: 'inherit' });
      
      // Commit mesajı
      const commitMessage = `chore: versiyon güncellendi ${newVersion}`;
      
      // Commit yap (--no-verify ile hook'ları bypass et, sonsuz döngüyü önle)
      execSync(`git commit -m "${commitMessage}" --no-verify`, { 
        cwd: repoRoot, 
        stdio: 'inherit' 
      });
      
      console.log(`✅ Versiyon ${currentVersion} → ${newVersion} güncellendi ve commit edildi`);
      console.log('ℹ️  Versiyon commit\'i push\'a dahil edildi. Push devam ediyor...');
    }
  } catch (error) {
    console.error('Versiyon commit hatası:', error.message);
    // Hata olsa bile push devam etsin
  }
} else {
  console.log(`ℹ️  Versiyon ${currentVersion} zaten güncel`);
}

process.exit(0);
