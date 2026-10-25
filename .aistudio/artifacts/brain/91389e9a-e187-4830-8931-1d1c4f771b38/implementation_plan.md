# Reliable Verse-by-Verse Tafsir (Quran Explanations)

An interactive, responsive feature providing reliable, simplified Quranic explanations (Tafsir) accessible directly alongside each verse upon tapping the verse or its explanation button, with instant tab switching between reputable easy-to-read sources.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed based on your responses:
> 
> - **Confirmed Access Mode**: When tapping an Ayah or its dedicated Tafsir action, a clean inline contextual panel opens immediately alongside/beneath the verse in the reading flow, maintaining visual immersion without displacing the user's reading position.
> - **Confirmed Sources Scope**: Focus on **simple, reputable, and easy-to-read** Tafsir collections:
>   1. **التفسير الميسر (Al-Tafsir Al-Muyassar)** — King Fahd Quran Printing Complex (concise, clear, universally referenced).
>   2. **تفسير السعدي (Tafsir Al-Saadi - Taysir Al-Karim Al-Rahman)** — Sheikh Abdur-Rahman Al-Saadi (crystal-clear, spiritually uplifting, modern readability).
>   3. **تفسير الجلالين (Tafsir Al-Jalalayn)** — Classic concise word-for-word and phrase explanation.
> - **Confirmed Navigation & Comparison**: Quick tab switcher placed at the top of the explanation panel for instant toggling between Al-Muyassar, Al-Saadi, and Al-Jalalayn for the active verse, paired with font zoom controls and one-tap copying.

---

## 1. Overview & Core Concept

- **What It Does**: Enables readers to effortlessly understand any Quranic verse as they read. Users can click any verse or tap its "التفسير" button to immediately reveal a beautifully styled, contextual explanation panel directly below or beside the verse, complete with tabs to switch between reputable simplified Tafsir books, copy the explanation, or transition to deep AI Tadabbur.
- **Target Audience**: Quran reciters, students, and daily readers who want immediate, authentic understanding without leaving their reading page or navigating away.
- **Key Value**: Bridges the gap between recitation and comprehension with zero friction and zero distraction.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Verse-by-Verse Mode (`SurahReader.tsx`)**:
   - The user browses the surah. Each verse card features the ayah text, number medallion, audio play, and "التفسير" button.
   - Clicking either the verse text itself or the "التفسير" button smoothly expands an inline Tafsir container right below the verse.
   - The user sees segmented tabs: `[ التفسير الميسر ] [ تفسير السعدي ] [ تفسير الجلالين ]`.
   - Switching tabs instantly fetches/displays the selected explanation with a smooth fade animation.
   - Controls available inside the panel:
     - Font size adjuster (`-` / `+`) specific to Tafsir text legibility.
     - One-tap "نسخ التفسير" (Copy) button with clipboard confirmation.
     - Direct jump to "تدبر الآية" (AI Tadabbur) for spiritual reflection.
     - "إغلاق" (Close) button to collapse the panel back.

2. **Mushaf Page Mode (`PageReader.tsx`) & Mushaf Continuous Mode**:
   - In continuous text or page mode, tapping any verse opens an ergonomic bottom sheet / contextual card containing the same rich Tafsir tabs and controls, perfectly scaled for both desktop and mobile viewports.

### Visual Identity & Theme

- **Palette**: Warm gold and amber accents (`text-amber-300`, `border-amber-500/30`, `bg-amber-500/10`) set against the chosen Mushaf paper theme (`dark`, `amoled`, `sepia`, `emerald`, `light`).
- **Typography**:
  - Quran Verse: Traditional Uthmani calligraphy (`font-quran`, Amiri Quran / Scheherazade).
  - Tafsir Text: Highly legible Naskh/Cairo typography (`font-cairo`, `leading-loose`, `text-sm sm:text-base`) with high contrast to prevent eye fatigue.
- **Micro-Interactions**: Gentle fade-in and height transition (`transition-all duration-200 ease-out`), active tab gold badge highlight, and haptic feedback on touch devices.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Inline Expandable Accordion vs. Full-Screen Modal**:
  - *Chosen Approach*: Inline contextual accordion in Verse Mode + bottom sheet in Page Mode.
  - *Why*: Inline expansion preserves spatial reading context so the reader keeps their eyes on the surrounding verses while digesting the explanation.
- **Decision 2: Local Storage Caching & Offline Resilience**:
  - *Chosen Approach*: Cache fetched Surah Tafsirs in `localStorage` under `tawbah_tafsir_${surahId}_${edition}`.
  - *Why*: Once a Surah's tafsir is fetched, all subsequent verse views within that Surah load instantaneously (0ms latency), even with offline or intermittent connectivity.
- **Decision 3: Reputable Source Filtering**:
  - *Chosen Approach*: Highlight Al-Muyassar, Al-Saadi, and Al-Jalalayn prominently in the primary tabs, with a clean dropdown/picker if the user wishes to explore additional classical references (Ibn Kathir, Al-Baghawi, Al-Qurtubi).
  - *Why*: Respects the user's choice for simple and modern easy-to-read tafsir while keeping classical references accessible.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      SurahReader                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Verse Card 1: Ayah Text + End Medallion          │  │
│  │ Action Row: [Play] [التفسير] [تدبر] [حفظ] [نسخ]  │  │
│  └──────────────────────────────────────────────────┘  │
│         │ (click "التفسير" or tap verse)               │
│         ▼                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ InlineVerseTafsirPanel                           │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ [ التفسير الميسر ] [ السعدي ] [ الجلالين ]   │ │  │
│  │ │ -------------------------------------------- │ │  │
│  │ │ Controls: [A- / A+] [نسخ التفسير] [إغلاق]    │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  │ Tafsir Text Content (Rich, readable Arabic font) │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
          quranApi.ts / fetchSurahTafsir()
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
LocalStorage Cache                    Al-Quran Cloud API
(tawbah_tafsir_...)                   (api.alquran.cloud/v1/...)
```

### Components & Modules to Update

1. **`src/data/tafsirs.ts`**:
   - Verify and tag the simplified, easy-to-read tafsir sources (`isSimplified: true` for `ar.muyassar`, `ar.saadi`, `ar.jalalayn`).
2. **`src/components/InlineVerseTafsir.tsx`** (New Component):
   - Modular, self-contained inline explanation panel.
   - Manages active tafsir book tab, font size scaling, copy-to-clipboard, loading skeletons, and error retry.
3. **`src/components/SurahReader.tsx`**:
   - Add state for `expandedTafsirAyahNum: number | null`.
   - Wire verse tap & "التفسير" button to toggle the inline panel.
4. **`src/components/TafsirModal.tsx`**:
   - Update modal layout with the simplified sources filter and quick tabs to maintain visual and functional consistency across all entry points.
5. **`src/services/quranApi.ts`**:
   - Ensure resilient multi-source tafsir retrieval with batch caching per surah and graceful network fallback.

---

## Verification Plan

### Automated Verification
- Run `npm run lint` (`lint_applet`) to ensure strict TypeScript type safety.
- Run `compile_applet` to verify zero build errors.

### Manual Verification
1. Open Surah Al-Fatihah and Surah Al-Baqarah in Verse Mode.
2. Tap on any Ayah or click the "التفسير" button; verify that the inline Tafsir panel opens smoothly right under that specific Ayah.
3. Click between "التفسير الميسر", "تفسير السعدي", and "تفسير الجلالين"; verify that the text updates accurately.
4. Verify font scaling (`-` / `+`) and the "نسخ" button with toast notification.
5. Verify on mobile phone viewport (responsive layout, touch target $\ge 44\text{px}$, no overflow).
