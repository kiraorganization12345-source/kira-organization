import { toArabicNumeral } from './quranApi';
import { ALL_SURAHS } from '../data/surahs';

/**
 * Draws a complete, authentic, illuminated Quranic page onto an HTML5 Canvas.
 * Ensures that the Holy Quran text is ALWAYS razor-sharp, visible, and never blank,
 * even if external images fail or have CORS limitations.
 */
export function drawQuranPageOnCanvas(
  canvas: HTMLCanvasElement,
  pageNum: number,
  ayahs: any[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Warm Antique Parchment Background
  ctx.fillStyle = '#faf5e8';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper texture simulation
  ctx.fillStyle = 'rgba(218, 190, 140, 0.08)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 40 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Gilded Islamic Frame & Margins
  // Outer Thick Gold Frame
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 12;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  // Inner Fine Trim
  ctx.strokeStyle = '#855c26';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Corner Ornaments
  const drawCorner = (cx: number, cy: number) => {
    ctx.fillStyle = '#855c26';
    ctx.fillRect(cx - 8, cy - 8, 16, 16);
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(53, 53);
  drawCorner(width - 53, 53);
  drawCorner(53, height - 53);
  drawCorner(width - 53, height - 53);

  // Determine Juz & Surah for Header
  const firstAyah = ayahs[0];
  const juz = firstAyah && firstAyah.juz ? firstAyah.juz : Math.min(30, Math.max(1, Math.ceil(pageNum / 20)));
  const surahName = firstAyah && firstAyah.surah ? firstAyah.surah.name : (ALL_SURAHS.slice().reverse().find(s => s.startPage <= pageNum)?.name || 'الفاتحة');

  // 3. Ornate Header Strip
  ctx.fillStyle = '#42240c';
  ctx.font = 'bold 28px "Amiri Quran", "Amiri", serif';
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.fillText(`﴿ الجزء ${toArabicNumeral(juz)} ﴾`, width - 80, 95);

  ctx.textAlign = 'center';
  ctx.font = 'bold 32px "Amiri Quran", "Amiri", serif';
  ctx.fillStyle = '#2c1404';
  ctx.fillText(`سورة ${surahName}`, width / 2, 95);

  ctx.textAlign = 'left';
  ctx.font = 'bold 28px "Amiri Quran", "Amiri", serif';
  ctx.fillStyle = '#42240c';
  ctx.fillText(`صفحة ${toArabicNumeral(pageNum)}`, 80, 95);

  // Dividing Golden Rule under header
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(70, 115);
  ctx.lineTo(width - 70, 115);
  ctx.stroke();

  // 4. Render Ayahs and Surah Headers
  let currentY = 165;
  const maxContentWidth = width - 180;
  const startX = width - 90;

  if (ayahs.length === 0) {
    // If ayahs are loading, draw a dignified calligraphy title
    ctx.fillStyle = '#3a1e09';
    ctx.font = 'bold 36px "Amiri Quran", serif';
    ctx.textAlign = 'center';
    ctx.fillText(`مصحف المدينة المنورة • صفحة ${toArabicNumeral(pageNum)}`, width / 2, height / 2 - 20);
    ctx.font = '24px Cairo, sans-serif';
    ctx.fillStyle = '#7a5a3a';
    ctx.fillText('جاري تحميل كلام الله تعالى...', width / 2, height / 2 + 30);
    return;
  }

  // Iterate over ayahs and render with proper Surah transitions
  let currentSurahId: number | null = null;
  let textBuffer = '';

  const flushTextBuffer = () => {
    if (!textBuffer.trim()) return;
    
    ctx.font = pageNum <= 2 
      ? 'bold 38px "Amiri Quran", "Amiri", "Traditional Arabic", serif' 
      : 'bold 33px "Amiri Quran", "Amiri", "Traditional Arabic", serif';
    ctx.fillStyle = '#1c1007';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    const words = textBuffer.split(' ');
    let currentLine = '';
    const lineHeight = pageNum <= 2 ? 80 : 70;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxContentWidth && currentLine) {
        ctx.fillText(currentLine, startX, currentY);
        currentY += lineHeight;
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, startX, currentY);
      currentY += lineHeight;
    }
    textBuffer = '';
  };

  for (let idx = 0; idx < ayahs.length; idx++) {
    const ayah = ayahs[idx];
    const surahId = ayah.surah ? ayah.surah.id : 1;

    // New Surah Banner on this page
    if (surahId !== currentSurahId) {
      flushTextBuffer();
      currentSurahId = surahId;

      // Draw Gold Embossed Surah Banner
      currentY += 10;
      const bannerHeight = 60;
      const bannerY = currentY;

      // Gold gradient banner
      const grad = ctx.createLinearGradient(80, bannerY, width - 80, bannerY);
      grad.addColorStop(0, '#be9336');
      grad.addColorStop(0.5, '#f3e1a0');
      grad.addColorStop(1, '#be9336');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(80, bannerY, width - 160, bannerHeight, 12);
      ctx.fill();

      ctx.strokeStyle = '#6e4c0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Banner Text
      ctx.fillStyle = '#2c1404';
      ctx.font = 'bold 32px "Amiri Quran", "Amiri", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`۞ سُورَةُ ${ayah.surah?.name || ''} ۞`, width / 2, bannerY + 41);

      currentY += bannerHeight + 25;

      // Draw Bismillah (if not Al-Fatihah and not At-Tawbah and first ayah)
      if (surahId !== 1 && surahId !== 9 && ayah.numberInSurah === 1) {
        ctx.fillStyle = '#2b1406';
        ctx.font = 'bold 35px "Amiri Quran", "Amiri", serif';
        ctx.textAlign = 'center';
        ctx.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', width / 2, currentY);
        currentY += 55;
      }
    }

    // Append verse with ornamental Ayah number
    textBuffer += `${ayah.text} ﴿${toArabicNumeral(ayah.numberInSurah)}﴾ `;
  }

  // Flush remaining text
  flushTextBuffer();

  // 5. Ornate Footer
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, height - 90);
  ctx.lineTo(width - 80, height - 90);
  ctx.stroke();

  // Center Page Number Medallion
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(width / 2, height - 55, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#855c26';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#2c1404';
  ctx.font = 'bold 24px "Amiri Quran", "Amiri", serif';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillText(toArabicNumeral(pageNum), width / 2, height - 47);
}
