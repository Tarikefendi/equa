# YARIN YAPILACAKLAR - KURUMSAL TASARIM

## ✅ BUGÜN TAMAMLANANLAR
1. ✅ "Denetim Dosyası" başlığı eklendi
2. ✅ Helper fonksiyonlar eklendi (generateFileNumber, calculateRemainingDays)
3. ✅ fileNumber ve remainingDays değişkenleri tanımlandı

## 📋 YARIN YAPILACAKLAR

### 1. Sidebar'ı Değiştir
`KURUMSAL-TASARIM-SIDEBAR.txt` dosyasındaki kodu kullan:
- VS Code'da page.tsx'i aç
- Satır 380 civarında sidebar'ı bul (3 kart: İmza, Hedef, Son İmzalar)
- Tüm sidebar'ı sil
- Yeni kodu yapıştır (Dosya Bilgileri, Hedef Kuruluş, Son Destekleyenler)

### 2. Ana İçeriğin Sonuna "Destekle" Bölümü Ekle
Satır 370 civarında, Organization Responses'dan ÖNCE ekle:

```tsx
            {/* Support Section - Bottom */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Toplam Destek</p>
                  <p className="text-2xl font-semibold text-gray-900">{signatureCount}</p>
                </div>
                <div>
                  {userSignature ? (
                    <button
                      onClick={handleRemoveSignature}
                      className="px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
                    >
                      Desteği Geri Çek
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSignatureModal(true)}
                      className="px-6 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900 transition-colors"
                      disabled={campaign.status !== 'active'}
                    >
                      Destekle
                    </button>
                  )}
                </div>
              </div>
            </div>
```

### 3. Emoji'leri Kaldır (Opsiyonel)
Ctrl+F ile şunları ara ve sil:
- 🟢, ✅, ⏳ (status emoji'leri)
- 🎯, 👤, 📅, ✍️ (bilgi emoji'leri)
- 🆕, 🔎 (V2 emoji'leri)

### 4. Renkleri Gri Tonlara Çevir (Opsiyonel)
- `bg-blue-` → `bg-gray-`
- `text-blue-` → `text-gray-`
- `border-accent-primary` → `border-gray-200`

## 🎯 SONUÇ
Bu değişikliklerden sonra sayfa:
- ✅ "Denetim Dosyası" başlıklı
- ✅ Dosya No, Durum, Kalan Süre gösterir
- ✅ Minimal "Destekle" butonu olur
- ✅ Kurumsal gri tasarım

## 📝 NOT
Eğer çok karmaşık gelirse, ben sana tam kodu hazırlayabilirim.
Sadece söyle, ben tüm page.tsx'i yeniden yazarım.
