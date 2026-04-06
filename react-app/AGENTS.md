# Agent Talimatları (Genel Amaçlı)

> Bu dosya proje türünden bağımsızdır. Vanilla JS, React, Node, Python veya başka herhangi bir stack için geçerlidir. Codex ve Claude Project bu talimatları her oturumda referans alır.

---

## 1. Oturum Başlangıç Protokolü

Her yeni görev veya oturumda sırasıyla:

1. **Proje keşfi**: Kök dizini tara. `package.json`, `requirements.txt`, `pyproject.toml`, `Makefile`, `tsconfig.json`, `.env.example` gibi dosyaları oku. Stack'i, bağımlılıkları ve build sistemi tahmin etme — oku ve anla.
2. **Mevcut yapıyı öğren**: `src/`, `app/`, `pages/`, `components/` gibi dizin yapısını incele. Proje konvansiyonlarını (isimlendirme, klasör yapısı, import stili) mevcut koddan çıkar.


> Kural: Proje hakkında varsayımda bulunma. Önce oku, sonra hareket et.

---

## 2. Planlama

### Ne zaman plan yazılır?

- 3+ adım gerektiren her görev
- Birden fazla dosyaya dokunulacak her değişiklik
- Mimari karar içeren her iş
- Emin değilsen → plan yaz

### Plan formatı (`tasks/todo.md`)

```markdown
# Görev: [Kısa başlık]
Tarih: YYYY-MM-DD

## Bağlam
[Sorun veya istek — 2-3 cümle]

## Plan
- [ ] Adım 1: ...
- [ ] Adım 2: ...
- [ ] Adım 3: ...

## Doğrulama kriterleri
- [ ] [Somut, test edilebilir kriter]
- [ ] [Somut, test edilebilir kriter]

## Sonuç
[Tamamlandığında doldur]
```

### Planlama kuralları

- Planı yazdıktan sonra kullanıcıya **özet olarak sun**, onay al, sonra başla.
- Bir şey ters giderse **dur ve yeniden planla**. Başarısız yolda ısrar etme.
- Her tamamlanan adımı `[x]` olarak işaretle.

---

## 3. Kod Yazma İlkeleri

### Basitlik

- Her değişiklik mümkün olan en az kodu etkilemeli.
- Yeni soyutlama eklemeden önce sor: "Bu gerçekten gerekli mi?"
- Tek sorumluluk: bir fonksiyon bir iş yapar.

### Proje konvansiyonlarına uy

- Mevcut projede `camelCase` varsa `camelCase` kullan, `snake_case` varsa `snake_case` kullan.
- Import stili, dosya organizasyonu, state yönetimi — hepsini mevcut koddan çıkar ve ona uy.
- Proje ESLint, Prettier veya benzeri araçlar kullanıyorsa onlara uygunluğu kontrol et.

### Kök neden analizi

- Bir hata varsa semptoma değil kök nedene odaklan.
- Geçici çözüm (workaround) kabul edilemez. Neden oluştuğunu anla, sonra düzelt.
- `// HACK`, `// TODO: fix later` gibi ifadeler son çıktıda bulunmamalı.

### Minimal etki

- Sadece gerekli dosyalara dokun.
- İlgisiz refactoring yapma — görev ne ise onu yap.
- Her değişikliğin neden yapıldığını açıklayabilmelisin.

---

## 4. Hata Ayıklama ve Bug Düzeltme

### Otonom çalış

- Bug raporu geldiğinde soru sorma, doğrudan araştır.
- Log, hata mesajı, stack trace, failing test — ilk bunları bul.
- Hipotez kur → doğrula → düzelt → test et.

### Hata sınıflandırma

| Seviye | Tanım | Yaklaşım |
|--------|--------|----------|
| **Basit** | Tek dosya, açık neden (typo, yanlış değer, eksik import) | Direkt düzelt |
| **Orta** | 2-3 dosya, neden araştırma gerektirir | Kısa plan yaz, sonra düzelt |
| **Karmaşık** | Birden fazla modül, belirsiz kök neden | Tam plan yaz, subagent kullan, adım adım ilerle |

### Yeniden planlama tetikleyicileri

Aşağıdaki durumlardan biri gerçekleşirse **dur ve yeniden planla**:

- Aynı hatayı düzeltmek için 2. deneme başarısız olduysa
- Yeni, beklenmedik bir sorun ortaya çıktıysa
- Değişiklik kapsamı başlangıçtaki plandan belirgin şekilde büyüdüyse

---

## 5. Doğrulama (Verification)

### Hiçbir görev doğrulanmadan tamamlanmış sayılmaz.

#### Somut kontrol listesi

- [ ] **Çalışıyor mu?** → Uygulamayı çalıştır veya ilgili fonksiyonu test et.
- [ ] **Testler geçiyor mu?** → Mevcut test varsa çalıştır. Yoksa en az bir happy-path testi yaz.
- [ ] **Linter/formatter temiz mi?** → Projede varsa `lint` komutunu çalıştır.
- [ ] **Build başarılı mı?** → `build` komutu varsa çalıştır.
- [ ] **Encoding bozulmamış mı?** → Türkçe karakter içeren dosyalarda çıktıyı kontrol et.
- [ ] **Sadece gerekli dosyalar değişti mi?** → Diff'i gözden geçir.

#### Kalite sorusu

Her değişiklik sonrası kendine sor:

> "Bu PR'ı bir senior developer review etse, onaylar mı?"

Cevap hayırsa veya tereddütlüyse, geri dön ve iyileştir.

---

## 6. Rollback Stratejisi

Bir değişiklik doğrulamayı geçemezse:

1. **Değişikliği geri al** — dosyaları önceki haline döndür.
2. **Neden başarısız olduğunu `tasks/lessons.md`'ye yaz.**
3. **Yeni plan oluştur** — farklı bir yaklaşım dene.
4. Aynı yaklaşımı üçüncü kez deneme.

---

## 7. Subagent Kullanımı

### Ne zaman subagent kullan?

- Araştırma ve keşif (dosya yapısı tarama, bağımlılık analizi)
- Paralel yapılabilecek bağımsız görevler
- Ana context window'u temiz tutmak gerektiğinde
- Karmaşık problemlerde farklı çözüm yollarını aynı anda denemek için

### Kurallar

- Her subagent **tek bir göreve** odaklanır.
- Subagent sonucunu ana akışa **özet olarak** aktar, ham çıktıyı değil.
- Subagent da bu `agent.md` kurallarına tabidir.

---

## 8. İletişim Protokolü

### Kullanıcıya ne zaman sor?

- Gereksinim belirsizse (birden fazla makul yorum varsa)
- Silme veya üzerine yazma gibi geri dönüşü zor işlemler öncesi
- Mimari tercih gerektiğinde (örn: state yönetimi yaklaşımı)

### Kullanıcıya ne zaman sorma?

- Çözümü netse ve tek makul yol varsa
- Bug düzeltme — direkt çöz
- Formatla ilgili kararlar (projede zaten konvansiyon varsa)

### Raporlama

Her adım sonrasında kısa bir güncelleme ver:

- Ne yapıldı (1-2 cümle)
- Sonraki adım ne
- Beklenmedik bir durum varsa açıkça belirt

Gereksiz detay verme. Kullanıcı isterse detaylandırırsın.



## 10. Karakter Kodlaması (Encoding)

Bu kurallar **her dosya okuma ve yazma işleminde** geçerlidir.

1. **Kesinlikle UTF-8**: Tüm dosyaları UTF-8 olarak oku ve yaz. Açıkça belirt: `encoding='utf-8'`.
2. **Türkçe karakter bütünlüğü**: `ğ, ü, ş, ı, ö, ç, İ, Ğ, Ü, Ş, Ö, Ç` karakterleri asla bozulmamalı.
3. **Çift encoding tespiti**: `Ã‡`, `Ä±`, `ÅŸ`, `Ã¶`, `Ã¼` gibi kalıplar görürsen **dur**. Bu çift encoding (UTF-8 → Latin-1 → UTF-8) belirtisidir. Yaymadan düzelt.
4. **Araç bazlı dikkat noktaları**:
   - Python `open()`: her zaman `encoding='utf-8'` parametresi ekle
   - `subprocess`: `encoding='utf-8'` veya çıktıyı `.decode('utf-8')` ile çöz
   - Node.js `fs`: `'utf8'` parametresi kullan
   - `python-docx`, `openpyxl`: çıktıda Türkçe karakterleri doğrula
5. **Kaydetmeden önce kontrol**: Dosyayı yazmadan önce Türkçe karakter içeren bir satırı okuyarak doğrula.

---

## 11. Elegance Kontrolü (Seçici)

Her değişiklik sonrası değil, **şu durumlarda** sor:

> "Şu an bildiğim her şeyle, daha zarif bir çözüm var mı?"

- 3+ dosya değişen refactoring'lerde
- Yeni bir modül veya soyutlama eklenmesinde
- Performans kritik kod değişikliklerinde
- Tekrarlayan pattern fark ettiğinde (DRY ihlali)

**Sorma:**
- Tek satır düzeltmelerde
- Açık ve basit bug fix'lerde
- Stil/format değişikliklerinde

---

## 12. Güvenlik Temel Kuralları

- `.env` dosyalarını asla commit etme veya çıktıya dahil etme.
- API anahtarları, şifreler, token'lar — bunları hardcode etme.
- Kullanıcı girdisini doğrudan SQL, shell komutu veya HTML'e enjekte etme.
- Üçüncü parti bağımlılık eklerken versiyon sabitle.

---

## Özet: Karar Akışı

```
Yeni görev geldi
    │
    ├─ Basit mi? (tek dosya, açık çözüm)
    │   └─ Direkt yap → Doğrula → Tamamla
    │
    ├─ Orta mı? (2-3 dosya)
    │   └─ Kısa plan yaz → Onayla → Yap → Doğrula → Tamamla
    │
    └─ Karmaşık mı? (çok dosya, belirsiz)
        └─ Proje keşfi → Detaylı plan → Onayla → Subagent kullan
            → Adım adım yap → Her adımda doğrula → Tamamla
```

Her seviyede: bir şey ters giderse → **dur → lessons.md güncelle → yeniden planla**