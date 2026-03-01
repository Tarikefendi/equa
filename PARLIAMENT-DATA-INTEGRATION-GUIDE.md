# 🏛️ Meclis Gündemlerini Otomatik Güncelleme Rehberi

## 📋 Mevcut Durum

Şu anda sistem **manuel gündem ekleme** ile çalışıyor:
- Admin panelinden gündem oluşturma
- Test verileri ile çalışma
- Manuel güncelleme

## 🎯 Otomatik Güncelleme Çözümleri

### Yöntem 1: Resmi API Entegrasyonu (En İyi)

#### Türkiye - TBMM
**Kaynak:** TBMM Açık Veri Portalı
- **URL:** https://www.tbmm.gov.tr/develop/owa/td_v2.tutanak_hazirla
- **API:** TBMM'nin resmi API'si (varsa)
- **Alternatif:** https://data.tbmm.gov.tr/

**Örnek Entegrasyon:**
```typescript
// backend/src/services/tbmmScraperService.ts
import axios from 'axios';

export class TBMMScraperService {
  private readonly TBMM_API_URL = 'https://data.tbmm.gov.tr/api/v1';

  async fetchAgendas() {
    try {
      const response = await axios.get(`${this.TBMM_API_URL}/agendas`);
      return response.data;
    } catch (error) {
      console.error('TBMM API error:', error);
      return [];
    }
  }

  async syncAgendas() {
    const agendas = await this.fetchAgendas();
    
    for (const agenda of agendas) {
      // Veritabanına kaydet veya güncelle
      await this.saveOrUpdateAgenda({
        title: agenda.title,
        description: agenda.description,
        country: 'Türkiye',
        category: this.mapCategory(agenda.category),
        discussion_date: agenda.discussionDate,
        voting_date: agenda.votingDate,
        official_document_url: agenda.documentUrl,
        status: this.mapStatus(agenda.status),
      });
    }
  }
}
```

#### Almanya - Bundestag
**Kaynak:** Bundestag Open Data
- **URL:** https://www.bundestag.de/services/opendata
- **API:** DIP (Dokumentations- und Informationssystem)
- **Format:** XML/JSON

#### Fransa - Assemblée Nationale
**Kaynak:** Assemblée Nationale Open Data
- **URL:** https://data.assemblee-nationale.fr/
- **API:** RESTful API
- **Format:** JSON

#### İngiltere - UK Parliament
**Kaynak:** UK Parliament API
- **URL:** https://api.parliament.uk/
- **API:** RESTful API
- **Format:** JSON

---

### Yöntem 2: Web Scraping (Alternatif)

API yoksa veya sınırlıysa web scraping kullanılabilir.

**Örnek: Puppeteer ile Scraping**
```typescript
// backend/src/services/parliamentScraperService.ts
import puppeteer from 'puppeteer';

export class ParliamentScraperService {
  async scrapeTBMM() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto('https://www.tbmm.gov.tr/develop/owa/td_v2.tutanak_hazirla');
    
    const agendas = await page.evaluate(() => {
      const items = document.querySelectorAll('.agenda-item');
      return Array.from(items).map(item => ({
        title: item.querySelector('.title')?.textContent,
        description: item.querySelector('.description')?.textContent,
        date: item.querySelector('.date')?.textContent,
      }));
    });
    
    await browser.close();
    return agendas;
  }
}
```

**Gerekli Paketler:**
```bash
npm install puppeteer cheerio axios
```

---

### Yöntem 3: RSS/Atom Feed (Basit)

Bazı meclisler RSS feed sağlar.

```typescript
// backend/src/services/rssFeedService.ts
import Parser from 'rss-parser';

export class RSSFeedService {
  private parser = new Parser();

  async fetchFromRSS(feedUrl: string) {
    const feed = await this.parser.parseURL(feedUrl);
    
    return feed.items.map(item => ({
      title: item.title,
      description: item.contentSnippet,
      link: item.link,
      pubDate: item.pubDate,
    }));
  }
}
```

---

### Yöntem 4: Cron Job ile Otomatik Güncelleme

**Günlük Otomatik Senkronizasyon:**

```typescript
// backend/src/jobs/parliamentSyncJob.ts
import cron from 'node-cron';
import { TBMMScraperService } from '../services/tbmmScraperService';
import { BundestagScraperService } from '../services/bundestagScraperService';

export class ParliamentSyncJob {
  private tbmmService = new TBMMScraperService();
  private bundestagService = new BundestagScraperService();

  start() {
    // Her gün saat 06:00'da çalış
    cron.schedule('0 6 * * *', async () => {
      console.log('🏛️ Meclis gündemleri güncelleniyor...');
      
      try {
        await this.tbmmService.syncAgendas();
        await this.bundestagService.syncAgendas();
        // Diğer ülkeler...
        
        console.log('✅ Gündemler güncellendi');
      } catch (error) {
        console.error('❌ Güncelleme hatası:', error);
      }
    });
  }
}
```

**server.ts'e ekle:**
```typescript
import { ParliamentSyncJob } from './jobs/parliamentSyncJob';

const syncJob = new ParliamentSyncJob();
syncJob.start();
```

---

## 🔧 Önerilen Mimari

### 1. Scraper Service Katmanı
```
backend/src/services/scrapers/
├── tbmmScraper.ts          # Türkiye
├── bundestagScraper.ts     # Almanya
├── assembleeScraper.ts     # Fransa
├── ukParliamentScraper.ts  # İngiltere
└── baseScraper.ts          # Ortak fonksiyonlar
```

### 2. Sync Service
```typescript
// backend/src/services/parliamentSyncService.ts
export class ParliamentSyncService {
  async syncAll() {
    const scrapers = [
      new TBMMScraper(),
      new BundestagScraper(),
      new AssembleeScraper(),
      new UKParliamentScraper(),
    ];

    for (const scraper of scrapers) {
      try {
        const agendas = await scraper.fetch();
        await this.processAgendas(agendas);
      } catch (error) {
        console.error(`Scraper error: ${scraper.name}`, error);
      }
    }
  }

  private async processAgendas(agendas: any[]) {
    for (const agenda of agendas) {
      // Duplicate kontrolü
      const existing = await this.findExisting(agenda);
      
      if (existing) {
        // Güncelle
        await this.updateAgenda(existing.id, agenda);
      } else {
        // Yeni ekle
        await this.createAgenda(agenda);
      }
    }
  }
}
```

### 3. Admin Onay Sistemi (Opsiyonel)

Otomatik çekilen gündemleri admin onayına sunmak:

```typescript
// Yeni durum ekle: 'pending_review'
await db.prepare(
  `INSERT INTO parliament_agendas 
   (title, description, country, status, source)
   VALUES (?, ?, ?, 'pending_review', 'auto_scraped')`
).run(title, description, country);

// Admin panelinde onay butonu
await adminService.approveAgenda(agendaId);
```

---

## 📊 Veri Eşleme (Mapping)

### Kategori Eşleme
```typescript
private mapCategory(sourceCategory: string): string {
  const mapping: Record<string, string> = {
    'ekonomi': 'Ekonomi',
    'economy': 'Ekonomi',
    'wirtschaft': 'Ekonomi',
    'eğitim': 'Eğitim',
    'education': 'Eğitim',
    'bildung': 'Eğitim',
    // ...
  };
  
  return mapping[sourceCategory.toLowerCase()] || 'Diğer';
}
```

### Durum Eşleme
```typescript
private mapStatus(sourceStatus: string): string {
  const mapping: Record<string, string> = {
    'scheduled': 'upcoming',
    'in_progress': 'in_discussion',
    'voted': 'voted',
    'passed': 'approved',
    'rejected': 'rejected',
  };
  
  return mapping[sourceStatus] || 'upcoming';
}
```

---

## 🚀 Uygulama Adımları

### Faz 1: Tek Ülke ile Başla (Türkiye)
1. TBMM'nin veri kaynağını araştır
2. API varsa entegre et, yoksa scraper yaz
3. Test et ve doğrula
4. Cron job kur

### Faz 2: Diğer Ülkeleri Ekle
1. Her ülke için scraper yaz
2. Ortak interface kullan
3. Hata yönetimi ekle

### Faz 3: Optimizasyon
1. Cache mekanizması
2. Rate limiting
3. Duplicate detection
4. Error logging

---

## 🔍 Veri Kaynakları

### Türkiye
- **TBMM Açık Veri:** https://data.tbmm.gov.tr/
- **TBMM Tutanak:** https://www.tbmm.gov.tr/develop/owa/td_v2.tutanak_hazirla
- **TBMM Kanun Teklifleri:** https://www.tbmm.gov.tr/develop/owa/kanun_teklif_sd.onerge_bilgileri

### Almanya
- **Bundestag Open Data:** https://www.bundestag.de/services/opendata
- **DIP API:** https://dip.bundestag.de/

### Fransa
- **Assemblée Nationale:** https://data.assemblee-nationale.fr/
- **API Documentation:** https://data.assemblee-nationale.fr/travaux-parlementaires/

### İngiltere
- **UK Parliament API:** https://api.parliament.uk/
- **Documentation:** https://api.parliament.uk/swagger/ui/index

### Avrupa Parlamentosu
- **EP Open Data:** https://data.europarl.europa.eu/
- **API:** https://data.europarl.europa.eu/api/

---

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Yasal Uyumluluk
- Robots.txt kontrol et
- Terms of Service oku
- Rate limiting uygula
- Attribution ekle

### 2. Veri Kalitesi
- Duplicate kontrolü
- Veri validasyonu
- Encoding sorunları (UTF-8)
- Tarih formatları

### 3. Performans
- Async işlemler
- Batch processing
- Cache kullanımı
- Error recovery

### 4. Güvenlik
- API key'leri .env'de sakla
- HTTPS kullan
- Input sanitization
- SQL injection koruması

---

## 📝 Örnek Kod: Tam Entegrasyon

```typescript
// backend/src/services/scrapers/tbmmScraper.ts
import axios from 'axios';
import { ParliamentAgendaService } from '../parliamentAgendaService';

export class TBMMScraper {
  private agendaService = new ParliamentAgendaService();
  private readonly API_URL = 'https://data.tbmm.gov.tr/api/v1';

  async fetchAndSync() {
    try {
      // 1. Veriyi çek
      const response = await axios.get(`${this.API_URL}/agendas`, {
        params: {
          date: new Date().toISOString().split('T')[0],
        },
      });

      // 2. İşle ve kaydet
      for (const item of response.data.items) {
        const agenda = {
          title: item.baslik,
          description: item.aciklama,
          country: 'Türkiye',
          category: this.mapCategory(item.kategori),
          discussion_date: item.gorusme_tarihi,
          voting_date: item.oylama_tarihi,
          official_document_url: item.belge_url,
          status: this.mapStatus(item.durum),
          source: 'tbmm_api',
        };

        // Duplicate kontrolü
        const existing = await this.findByTitle(agenda.title);
        
        if (!existing) {
          await this.agendaService.createAgenda(agenda);
          console.log(`✅ Yeni gündem eklendi: ${agenda.title}`);
        } else {
          await this.agendaService.updateAgenda(existing.id, agenda);
          console.log(`🔄 Gündem güncellendi: ${agenda.title}`);
        }
      }

      return { success: true, count: response.data.items.length };
    } catch (error) {
      console.error('TBMM scraper error:', error);
      return { success: false, error };
    }
  }

  private mapCategory(category: string): string {
    const mapping: Record<string, string> = {
      'ekonomi': 'Ekonomi',
      'egitim': 'Eğitim',
      'saglik': 'Sağlık',
      'adalet': 'Adalet',
      'cevre': 'Çevre',
    };
    return mapping[category.toLowerCase()] || 'Diğer';
  }

  private mapStatus(status: string): string {
    const mapping: Record<string, string> = {
      'gundemde': 'upcoming',
      'gorusulecek': 'in_discussion',
      'oylanacak': 'to_be_voted',
      'kabul': 'approved',
      'red': 'rejected',
    };
    return mapping[status.toLowerCase()] || 'upcoming';
  }

  private async findByTitle(title: string) {
    // Veritabanında başlığa göre ara
    return await this.agendaService.findByTitle(title);
  }
}
```

---

## 🎯 Sonuç ve Öneriler

### Kısa Vadeli (Hemen Yapılabilir)
1. ✅ Manuel admin paneli ile gündem ekleme (MEVCUT)
2. 🔄 TBMM için basit scraper/API entegrasyonu
3. 🔄 Günlük cron job kurulumu

### Orta Vadeli (1-2 Ay)
1. Diğer ülkeler için scraper'lar
2. Admin onay sistemi
3. Duplicate detection
4. Error monitoring

### Uzun Vadeli (3-6 Ay)
1. AI ile otomatik kategorizasyon
2. Otomatik çeviri
3. Trend analizi
4. Tahminleme algoritmaları

---

## 📦 Gerekli Paketler

```bash
# Scraping
npm install puppeteer cheerio

# RSS
npm install rss-parser

# Cron
npm install node-cron

# HTTP
npm install axios

# Type definitions
npm install -D @types/node-cron @types/cheerio
```

---

## 🔗 Faydalı Linkler

- [TBMM Açık Veri](https://data.tbmm.gov.tr/)
- [Bundestag Open Data](https://www.bundestag.de/services/opendata)
- [UK Parliament API](https://api.parliament.uk/)
- [Puppeteer Docs](https://pptr.dev/)
- [Node-Cron Docs](https://www.npmjs.com/package/node-cron)

---

**Not:** Şu anda sistem manuel gündem ekleme ile çalışıyor ve bu production için yeterli. Otomatik güncelleme sistemi gelecekte eklenebilir bir özellik olarak planlanabilir.
