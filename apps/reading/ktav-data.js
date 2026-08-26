// ============================================================
// ktav-data.js  ·  מסלול "אותיות בכתב" (כתב יד עברי)
// ------------------------------------------------------------
// לכל אות יש תמונת צורת הכתב (PNG) בתיקייה apps/reading/ktav/ .
// אין ניקוד — צורת האות בלבד.
//
// המסלול בנוי בקבוצות, ולכל קבוצה כמה משחקים שמחברים בין
// צורת האות בכתב לבין הצליל שלה:
//   write – כתיבת האותיות של הקבוצה (עקיבה על צורת הכתב)
//   hear  – שומעים שם/צליל אות ובוחרים את צורת הכתב הנכונה
//   sound – שומעים מילה ובוחרים את צורת הכתב של האות הפותחת
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
  'ך': { img: 'kaf_sofit.png',   name: 'כַּף סוֹפִית',  base: 'כ' },
  'ם': { img: 'mem_sofit.png',   name: 'מֵם סוֹפִית',   base: 'מ' },
  'ן': { img: 'nun_sofit.png',   name: 'נוּן סוֹפִית',  base: 'נ' },
  'ף': { img: 'pe_sofit.png',    name: 'פֵּא סוֹפִית',  base: 'פ' },
  'ץ': { img: 'tsadi_sofit.png', name: 'צָדִי סוֹפִית', base: 'צ' },
};

const KTAV_GROUPS = [
  { id: 'k1', name: 'קבוצה ראשונה', emoji: '🌟', letters: ['א', 'ב', 'ג', 'ד', 'ה'] },
  { id: 'k2', name: 'קבוצה שנייה',  emoji: '🌈', letters: ['ו', 'ז', 'ח', 'ט', 'י'] },
  { id: 'k3', name: 'קבוצה שלישית', emoji: '🎈', letters: ['כ', 'ל', 'מ', 'נ', 'ס'] },
  { id: 'k4', name: 'קבוצה רביעית', emoji: '🚀', letters: ['ע', 'פ', 'צ', 'ק'] },
  { id: 'k5', name: 'קבוצה חמישית', emoji: '🎨', letters: ['ר', 'ש', 'ת'] },
  { id: 'k6', name: 'אותיות סופיות', emoji: '👑', letters: ['ך', 'ם', 'ן', 'ף', 'ץ'] },
];

const KTAV_TYPE_META = {
  write: { title: 'כתיבת האות',      emoji: '✍️', short: 'כתיבה' },
  hear:  { title: 'איזו אות שמעת?',  emoji: '👂', short: 'מה שמעת' },
  sound: { title: 'הצליל הפותח',     emoji: '🔤', short: 'צליל פותח' },
};

// אותיות סופיות: הצליל להשמעה נלקח מהאות הרגילה (base)
function ktavSoundChar(ch) { const d = KTAV_LETTERS[ch] || {}; return d.base || ch; }

// בניית התחנות: לכל קבוצה — כתיבה → מה שמעת → צליל פותח.
// לקבוצת הסופיות אין "צליל פותח" (אין מילים שמתחילות באות סופית).
function buildKtavStations() {
  const st = [];
  KTAV_GROUPS.forEach(g => {
    st.push({ id: 'kt-write-' + g.id, type: 'write', groupId: g.id, letters: g.letters.slice() });
    st.push({ id: 'kt-hear-' + g.id,  type: 'hear',  groupId: g.id, letters: g.letters.slice() });
    if (g.id !== 'k6') {
      st.push({ id: 'kt-sound-' + g.id, type: 'sound', groupId: g.id, letters: g.letters.slice() });
    }
  });
  return st;
}

const KTAV_STATIONS = buildKtavStations();
function getKtavStationById(id) { return KTAV_STATIONS.find(s => s.id === id) || null; }

// מילה שמתחילה באות (למשחק "צליל פותח") — מתוך בנק האותיות של מסלול הדפוס
function ktavPickWord(ch) {
  const L = (window.READING_LETTERS || {})[ch];
  if (!L || !L.words || !L.words.length) return null;
  return L.words[Math.floor(Math.random() * L.words.length)];
}

// ערבוב + בחירה
function ktavShuffle(a) { return a.slice().sort(() => Math.random() - 0.5); }
function ktavPick(a, n) { return ktavShuffle(a).slice(0, n); }

window.KTAV_LETTERS = KTAV_LETTERS;
window.KTAV_GROUPS = KTAV_GROUPS;
window.KTAV_TYPE_META = KTAV_TYPE_META;
window.KTAV_STATIONS = KTAV_STATIONS;
window.getKtavStationById = getKtavStationById;
window.ktavSoundChar = ktavSoundChar;
window.ktavPickWord = ktavPickWord;
window.ktavShuffle = ktavShuffle;
window.ktavPick = ktavPick;
