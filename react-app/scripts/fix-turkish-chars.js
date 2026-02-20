#!/usr/bin/env node
/**
 * Türkçe karakter sorunlarını otomatik tespit ve düzeltme scripti
 * 
 * Bu script:
 * - Unicode escape sequence'ları (\u00f6 gibi) tespit eder
 * - Bunları gerçek Türkçe karakterlere dönüştürür
 * - Dosyaları otomatik düzeltir
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

// Türkçe karakter Unicode mapping
const TURKISH_CHAR_MAP = {
  '\\u00e7': 'ç', // ç
  '\\u00c7': 'Ç', // Ç
  '\\u011f': 'ğ', // ğ
  '\\u011e': 'Ğ', // Ğ
  '\\u0131': 'ı', // ı
  '\\u0130': 'İ', // İ
  '\\u00f6': 'ö', // ö
  '\\u00d6': 'Ö', // Ö
  '\\u015f': 'ş', // ş
  '\\u015e': 'Ş', // Ş
  '\\u00fc': 'ü', // ü
  '\\u00dc': 'Ü', // Ü
}

// Tespit edilen sorunları sakla
const issues = []

/**
 * Dosyayı oku ve Unicode escape'leri düzelt
 */
function fixFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    let fixedContent = content
    let hasChanges = false
    const fileIssues = []

    // Her Unicode escape'i kontrol et ve düzelt
    for (const [escape, char] of Object.entries(TURKISH_CHAR_MAP)) {
      const regex = new RegExp(escape.replace('\\', '\\\\'), 'g')
      const matches = content.match(regex)
      
      if (matches) {
        fixedContent = fixedContent.replace(regex, char)
        hasChanges = true
        fileIssues.push({
          escape,
          char,
          count: matches.length,
        })
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, fixedContent, 'utf-8')
      issues.push({
        file: filePath,
        fixes: fileIssues,
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Hata: ${filePath}`, error.message)
    return false
  }
}

/**
 * Recursive dosya bulma (glob yerine)
 */
function findFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      // node_modules ve dist'i atla
      if (!file.includes('node_modules') && !file.includes('dist')) {
        findFiles(filePath, fileList)
      }
    } else {
      const ext = extname(file)
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        fileList.push(filePath)
      }
    }
  }
  
  return fileList
}

/**
 * Ana fonksiyon
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-d')
  const checkOnly = args.includes('--check') || args.includes('-c')

  console.log('🔍 Türkçe karakter sorunlarını tespit ediyorum...\n')

  // React app src klasöründeki tüm TS/TSX dosyalarını bul
  const srcDir = join(process.cwd(), 'src')
  const files = findFiles(srcDir)

  console.log(`📁 ${files.length} dosya tarandı\n`)

  let fixedCount = 0

  for (const file of files) {
    if (checkOnly || dryRun) {
      // Sadece kontrol et, değişiklik yapma
      const content = readFileSync(file, 'utf-8')
      const fileIssues = []

      for (const [escape, char] of Object.entries(TURKISH_CHAR_MAP)) {
        const regex = new RegExp(escape.replace('\\', '\\\\'), 'g')
        const matches = content.match(regex)
        
        if (matches) {
          fileIssues.push({
            escape,
            char,
            count: matches.length,
          })
        }
      }

      if (fileIssues.length > 0) {
        issues.push({
          file,
          fixes: fileIssues,
        })
      }
    } else {
      // Düzelt
      if (fixFile(file)) {
        fixedCount++
      }
    }
  }

  // Sonuçları göster
  if (issues.length === 0) {
    console.log('✅ Türkçe karakter sorunu bulunamadı!\n')
    process.exit(0)
  }

  console.log(`\n${checkOnly || dryRun ? '🔍 Bulunan sorunlar' : '✅ Düzeltilen dosyalar'}:\n`)

  for (const issue of issues) {
    console.log(`📄 ${issue.file}`)
    for (const fix of issue.fixes) {
      console.log(`   ${fix.escape} → ${fix.char} (${fix.count} adet)`)
    }
    console.log()
  }

  if (checkOnly || dryRun) {
    console.log(`\n💡 Düzeltmek için: pnpm run fix:turkish\n`)
    process.exit(issues.length > 0 ? 1 : 0)
  } else {
    console.log(`\n✨ Toplam ${fixedCount} dosya düzeltildi!\n`)
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('❌ Hata:', error)
  process.exit(1)
})
