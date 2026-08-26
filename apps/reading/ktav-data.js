// ============================================================
// ktav-data.js  ·  מסלול "אותיות בכתב" (כתב יד עברי)
// ------------------------------------------------------------
// לכל אות יש תמונת צורת הכתב (PNG שקוף) בתיקייה apps/reading/ktav/ .
// עוקבים עם האצבע על צורת הכתב. אין ניקוד — צורת האות בלבד.
//
// לכל אות:
//   img  – שם קובץ התמונה בתיקייה ktav/
//   name – שם האות (לתצוגה/הקראה)
//   base – (לאותיות סופיות) האות הרגילה שממנה נלקח הצליל להשמעה
// ============================================================

const KTAV_LETTERS = {
  'א': { img: 'alef.png',  name: 'אָלֶף' },
  'ב': { img: 'bet.png',   name: 'בֵּית' },
  'ג': { img: 'gimel.png', name: 'גִּימֶל' },
  'ד': { img: 'dalet.png', name: 'דָּלֶת' },
  'ה': { img: 'he.png',    name: 'הֵא' },
  'ו': { img: 'vav.png',   name: 'וָו' },
  'ז': { img: 'zayin.png', name: 'זַיִן' },
  'ח': { img: 'het.png',   name: 'חֵית' },
  'ט': { img: 'tet.png',   name: 'טֵית' },
  'י': { img: 'yod.png',   name: 'יוֹד' },
  'כ': { img: 'kaf.png',   name: 'כַּף' },
  'ל': { img: 'lamed.png', name: 'לָמֶד' },
  'מ': { img: 'mem.png',   name: 'מֵם' },
  'נ': { img: 'nun.png',   name: 'נוּן' },
  'ע': { img: 'ayin.png',  name: 'עַיִן' },
  'ס': { img: 'samekh.png',name: 'סָמֶךְ' },
  'פ': { img: 'pe.png',    name: 'פֵּא' },
  'צ': { img: 'tsadi.png', name: 'צָדִי' },
  'ק': { img: 'qof.png',   name: 'קוּף' },
  'ר': { img: 'resh.png',  name: 'רֵישׁ' },
  'ש': { img: 'shin.png',  name: 'שִׁין' },
  'ת': { img: 'tav.png',   name: 'תָּו' },
  // אותיות סופיות — הצליל להשמעה נלקח מהאות הרגילה (base)
  'ך': { img: 'kaf_sofit.png',   name: 'כַּף סוֹפִית',  base: 'כ' },
  'ם': { img: 'mem_sofit.png',   name: 'מֵם סוֹפִית',   base: 'מ' },
  'ן': { img: 'nun_sofit.png',   name: 'נוּן סוֹפִית',  base: 'נ' },
  'ף': { img: 'pe_sofit.png',    name: 'פֵּא סוֹפִית',  base: 'פ' },
  'ץ': { img: 'tsadi_sofit.png', name: 'צָדִי סוֹפִית', base: 'צ' },
};

// קבוצות המסלול — 4-5 אותיות לקבוצה, לפי סדר הא-ב, וקבוצת סופיות בסוף
const KTAV_GROUPS = [
  { id: 'k1', name: 'קבוצה ראשונה', emoji: '🌟', letters: ['א', 'ב', 'ג', 'ד', 'ה'] },
  { id: 'k2', name: 'קבוצה שנייה',  emoji: '🌈', letters: ['ו', 'ז', 'ח', 'ט', 'י'] },
  { id: 'k3', name: 'קבוצה שלישית', emoji: '🎈', letters: ['כ', 'ל', 'מ', 'נ', 'ס'] },
  { id: 'k4', name: 'קבוצה רביעית', emoji: '🚀', letters: ['ע', 'פ', 'צ', 'ק'] },
  { id: 'k5', name: 'קבוצה חמישית', emoji: '🎨', letters: ['ר', 'ש', 'ת'] },
  { id: 'k6', name: 'אותיות סופיות', emoji: '👑', letters: ['ך', 'ם', 'ן', 'ף', 'ץ'] },
];

function ktavId(ch) { return 'ktav-' + (KTAV_LETTERS[ch].img.replace('.png', '')); }

function buildKtavStations() {
  const st = [];
  KTAV_GROUPS.forEach(g => g.letters.forEach(ch => {
    st.push({ id: ktavId(ch), type: 'ktav', char: ch, groupId: g.id });
  }));
  return st;
}

const KTAV_STATIONS = buildKtavStations();
function getKtavStationById(id) { return KTAV_STATIONS.find(s => s.id === id) || null; }

// עזר: הצליל להשמעה (סופית → האות הרגילה)
function ktavSoundChar(ch) { const d = KTAV_LETTERS[ch] || {}; return d.base || ch; }

window.KTAV_LETTERS = KTAV_LETTERS;
window.KTAV_GROUPS = KTAV_GROUPS;
window.KTAV_STATIONS = KTAV_STATIONS;
window.getKtavStationById = getKtavStationById;
window.ktavSoundChar = ktavSoundChar;
