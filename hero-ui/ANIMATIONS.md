# 🎮 Mortal Kombat Style Battle Arena - Animation Guide

## 🎯 Dinamik Efektler

### ✅ Otomatik Çalışan Animasyonlar

Bu animasyonlar zaten karakterlerde aktif:

1. **Nefes Alma (Breathing)**
   - `animate-breathe` - Karakterler hafif büyüyüp küçülür (4 saniye döngü)
   - Her karakter farklı timing'de nefes alır

2. **Yüzme/Uçuşma (Float)**
   - `animate-float` - Avatar'lar yukarı aşağı hareket eder (3 saniye döngü)

3. **Parlama (Glow Pulse)**
   - `animate-glow-pulse` - Avatar çevresinde parlayan halka (2 saniye döngü)

4. **Gölge Efekti**
   - Karakterlerin altında otomatik gölge (blur-xl)

### 🎮 JavaScript ile Tetiklenecek Animasyonlar

Bu class'ları butonlara tıklandığında ekleyebilirsiniz:

#### **Savaş Animasyonları:**

```javascript
// SAVAŞ YAP butonuna tıklandığında
const playerFighter = document.querySelector('.fighter-left');
const enemyFighter = document.querySelector('.fighter-right');

// Oyuncu saldırıyor
playerFighter.classList.add('fighter-shake');
setTimeout(() => playerFighter.classList.remove('fighter-shake'), 600);

// Düşman hasar alıyor
enemyFighter.classList.add('fighter-hit');
setTimeout(() => enemyFighter.classList.remove('fighter-hit'), 500);
```

#### **İyileşme Animasyonu:**

```javascript
// İYİLEŞ butonuna tıklandığında
const playerFighter = document.querySelector('.fighter-left');

playerFighter.classList.add('fighter-heal');
setTimeout(() => playerFighter.classList.remove('fighter-heal'), 1000);
```

#### **Level Up Animasyonu:**

```javascript
// XP 100'e ulaştığında
const playerFighter = document.querySelector('.fighter-left');

playerFighter.classList.add('fighter-powerup');
setTimeout(() => playerFighter.classList.remove('fighter-powerup'), 1500);
```

#### **Yenilme Animasyonu:**

```javascript
// HP 0'a düştüğünde
const playerFighter = document.querySelector('.fighter-left');

playerFighter.classList.add('fighter-defeat');
// Bu kalıcı - oyun bittikten sonra karakteri sıfırlamadan önce kaldırılabilir
```

#### **Zafer Animasyonu:**

```javascript
// Savaş kazanıldığında
const playerFighter = document.querySelector('.fighter-left');

playerFighter.classList.add('fighter-victory');
// İsterseniz belirli süre sonra kaldırabilirsiniz
setTimeout(() => playerFighter.classList.remove('fighter-victory'), 3000);
```

#### **Buton Basma Efekti:**

```javascript
// Herhangi bir butona tıklandığında
button.addEventListener('click', (e) => {
  e.target.classList.add('button-press');
  setTimeout(() => e.target.classList.remove('button-press'), 200);
});
```

#### **Kritik Vuruş Flash:**

```javascript
// Kritik hasar veya özel saldırılarda
const arenaContainer = document.querySelector('.relative.min-h-screen');

arenaContainer.classList.add('critical-flash');
setTimeout(() => arenaContainer.classList.remove('critical-flash'), 400);
```

#### **Ekran Sarsma:**

```javascript
// Çok güçlü saldırılarda
const gameContainer = document.querySelector('.relative.min-h-screen');

gameContainer.classList.add('screen-shake');
setTimeout(() => gameContainer.classList.remove('screen-shake'), 300);
```

## 📋 Kullanılabilir CSS Class'ları

### Karakter Animasyonları:
- `fighter-shake` - Genel sarsılma
- `fighter-hit` - Hasar alma efekti (flaş)
- `fighter-heal` - İyileşme efekti (yeşil glow)
- `fighter-powerup` - Güçlenme/Level up (altın glow)
- `fighter-victory` - Zafer pulsing
- `fighter-defeat` - Yenilme (düşme + grayscale)
- `fighter-ready` - Hazır duruş animasyonu

### Ekran Efektleri:
- `screen-shake` - Tüm ekranı sarsar
- `critical-flash` - Kırmızı-sarı flaş efekti
- `button-press` - Buton basma animasyonu
- `combo-text` - Kombo sayacı zoom efekti

## 🎨 Tailwind Utility Class'ları

Zaten kullanımdaki animasyonlar:
- `animate-breathe` - Nefes alma (4s)
- `animate-float` - Yüzme (3s)
- `animate-glow-pulse` - Parlama (2s)
- `animate-pulse-slow` - Yavaş pulse (3s)
- `animate-shake` - Hafif sarsılma (0.5s)
- `animate-shake-hard` - Güçlü sarsılma (0.6s)

## 💡 Örnek React Kullanımı

```tsx
const handleBattle = () => {
  // Animasyonları tetikle
  const player = document.querySelector('.fighter-left');
  const enemy = document.querySelector('.fighter-right');
  
  // Oyuncu saldırıyor
  player?.classList.add('fighter-shake');
  
  // 300ms sonra düşman hasar alıyor
  setTimeout(() => {
    enemy?.classList.add('fighter-hit');
  }, 300);
  
  // Animasyonları temizle
  setTimeout(() => {
    player?.classList.remove('fighter-shake');
    enemy?.classList.remove('fighter-hit');
  }, 900);
  
  // Blockchain işlemini yap
  // ...
};

const handleHeal = () => {
  const player = document.querySelector('.fighter-left');
  
  player?.classList.add('fighter-heal');
  
  setTimeout(() => {
    player?.classList.remove('fighter-heal');
  }, 1000);
  
  // Blockchain işlemini yap
  // ...
};
```

## 🎬 Animasyon Kombinasyonları

### Başarılı Saldırı Sekansı:
1. Oyuncu: `fighter-shake` (0.6s)
2. Düşman: `fighter-hit` (0.5s) - hafif gecikmeyle
3. Ekran: `screen-shake` (0.3s) - çok güçlü vuruşlarda

### Level Up Sekansı:
1. Oyuncu: `fighter-powerup` (1.5s)
2. Ses efekti çal
3. Level badge'i güncelle

### Yenilme Sekansı:
1. Oyuncu: `fighter-hit` (0.5s)
2. Oyuncu: `fighter-defeat` (1s) - kalıcı
3. Game Over banner göster

## 🔧 Özelleştirme

Animasyon sürelerini ve efektleri `animations.css` dosyasından değiştirebilirsiniz.
Tailwind animasyonları `tailwind.config.js` dosyasında tanımlıdır.

---

**Not:** Bu animasyonlar sadece UI/UX içindir. Blockchain işlemleri başarılı olduktan sonra uygulanmalıdır.
