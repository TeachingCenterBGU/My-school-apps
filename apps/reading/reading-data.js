// ============================================================
// reading-data.js  ·  "מסע הקריאה"
// ------------------------------------------------------------
// זהו הקובץ היחיד שצריך לערוך כדי לשנות תוכן:
//   • אילו אותיות במסע ובאיזה סדר
//   • מילת הדוגמה והאימוג'י של כל אות
//   • הרכב הקבוצות (3-4 אותיות לקבוצה)
//
// הכל מבוסס על ההקלטות האמיתיות שכבר קיימות בתיקייה letters/
// (שם האות + מילת דוגמה מוקלטת לכל אות) — לכן זה נשמע איכותי.
//
// להוספה עתידית (ניקוד, הברות, מילים): מוסיפים כאן שדות/סוגי-תחנה
// חדשים, והמנוע (reading-engine.js) כבר יודע לטעון לפי type.
// ============================================================

// --- מאגר האותיות ---
// לכל אות:
//   name       – שם האות (לגיבוי קולי אם קובץ השמע לא נטען)
//   letterAudio– קובץ ההקלטה של שם האות (מתוך letters/)
//   word       – מילת הדוגמה (עם ניקוד, לתצוגה)
//   wordAudio  – הקלטת מילת הדוגמה (מתוך letters/)
//   emoji      – אימוג'י שמלווה את מילת הדוגמה
const READING_LETTERS = {
  'א': { name: 'אָלֶף',   letterAudio: 'Aleph1.mp3',   word: 'אַרְיֵה',   wordAudio: 'aryeh.mp3',    emoji: '🦁' },
  'ב': { name: 'בֵּית',   letterAudio: 'beit.mp3',     word: 'בַּרְוָז',  wordAudio: 'barvaz.mp3',   emoji: '🦆' },
  'ג': { name: 'גִּימֶל', letterAudio: 'gimel_1.mp3',  word: 'גָּמָל',    wordAudio: 'gamal.mp3',    emoji: '🐪' },
  'ד': { name: 'דָּלֶת',  letterAudio: 'dalet_1.mp3',  word: 'דֹּב',      wordAudio: 'dov.mp3',      emoji: '🐻' },
  'ה': { name: 'הֵא',     letterAudio: 'hei_1.mp3',    word: 'הַר',      wordAudio: 'har.mp3',      emoji: '⛰️' },
  'ו': { name: 'וָו',     letterAudio: 'vav_1.mp3',    word: 'וֶרֶד',     wordAudio: 'vered.mp3',    emoji: '🌹' },
  'ז': { name: 'זַיִן',   letterAudio: 'zain_1.mp3',   word: 'זֶבְּרָה',  wordAudio: 'zebra.mp3',    emoji: '🦓' },
  'ח': { name: 'חֵית',    letterAudio: 'chet_1.mp3',   word: 'חָתוּל',   wordAudio: 'chatul.mp3',   emoji: '🐱' },
  'ט': { name: 'טֵית',    letterAudio: 'tet.mp3',      word: 'טְרַקְטוֹר', wordAudio: 'traktor.mp3',  emoji: '🚜' },
  'י': { name: 'יוֹד',    letterAudio: 'yud.mp3',      word: 'יַנְשׁוּף', wordAudio: 'yanshuf.mp3',  emoji: '🦉' },
  'כ': { name: 'כַּף',    letterAudio: 'chaf_1.mp3',   word: 'כֶּלֶב',    wordAudio: 'kelev.mp3',    emoji: '🐶' },
  'ל': { name: 'לָמֶד',   letterAudio: 'lamed.mp3',    word: 'לֵיצָן',    wordAudio: 'leitzan.mp3',  emoji: '🤡' },
  'מ': { name: 'מֵם',     letterAudio: 'mem_1.mp3',    word: 'מְכוֹנִית', wordAudio: 'mechonit.mp3', emoji: '🚗' },
  'נ': { name: 'נוּן',    letterAudio: 'nun.mp3',      word: 'נָחָשׁ',    wordAudio: 'nachash.mp3',  emoji: '🐍' },
  'ס': { name: 'סָמֶךְ',  letterAudio: 'samech.mp3',   word: 'סוּס',     wordAudio: 'sus.mp3',      emoji: '🐴' },
  'ע': { name: 'עַיִן',   letterAudio: 'ain.mp3',      word: 'עַכְבָּר',  wordAudio: 'achbar.mp3',   emoji: '🐭' },
  'פ': { name: 'פֵּא',    letterAudio: 'peh_1.mp3',    word: 'פִּיל',     wordAudio: 'pil.mp3',      emoji: '🐘' },
  'צ': { name: 'צָדִי',   letterAudio: 'tzadik_1.mp3', word: 'צָב',      wordAudio: 'tzav.mp3',     emoji: '🐢' },
  'ק': { name: 'קוּף',    letterAudio: 'kuf.mp3',      word: 'קוֹף',     wordAudio: 'kof.mp3',      emoji: '🐒' },
  'ר': { name: 'רֵישׁ',   letterAudio: 'reish.mp3',    word: 'רַכֶּבֶת',  wordAudio: 'rakevet.mp3',  emoji: '🚆' },
  'ש': { name: 'שִׁין',   letterAudio: 'shin.mp3',     word: 'שֶׁמֶשׁ',   wordAudio: 'shemesh.mp3',  emoji: '☀️' },
  'ת': { name: 'תָּו',    letterAudio: 'taf_1.mp3',    word: 'תַּפּוּחַ', wordAudio: 'tapuach.mp3',  emoji: '🍎' },
};

// --- הקבוצות של המסע (סדר מומלץ) ---
// כל קבוצה = 3-4 אותיות. הסדר כאן = סדר ההתקדמות במפה.
// עקרונות הסדר: מתחילים באותיות נפוצות וברורות חזותית; אותיות
// דומות (ד/ר, ב/כ, ה/ח, ס/ם) מפוזרות ומתורגלות בהבחנה בהמשך.
const READING_GROUPS = [
  { id: 'g1', name: 'קבוצה 1', emoji: '🌱', letters: ['א', 'ש', 'מ', 'ל'] },
  { id: 'g2', name: 'קבוצה 2', emoji: '🌼', letters: ['ב', 'ו', 'ת', 'ה'] },
  { id: 'g3', name: 'קבוצה 3', emoji: '🍎', letters: ['ד', 'ר', 'נ', 'י'] },
  { id: 'g4', name: 'קבוצה 4', emoji: '🚀', letters: ['ג', 'ח', 'כ', 'ק'] },
  { id: 'g5', name: 'קבוצה 5', emoji: '🌊', letters: ['ס', 'ע', 'צ'] },
  { id: 'g6', name: 'קבוצה 6', emoji: '🏆', letters: ['פ', 'ז', 'ט'] },
];

// --- בניית רשימת התחנות של המסע ---
// לכל קבוצה נוצרות תחנות בסדר הזה:
//   1. "הכרת האות"  – תחנה לכל אות חדשה בקבוצה (type: meet)
//   2. "ציד האות"   – מציאת האותיות של הקבוצה בין הרבה (type: hunt)
//   3. "איזו אות שמעת" – הבחנה קולית בין אותיות הקבוצה (type: hear)
//   4. "אתגר הסיכום" – ערבוב כל אותיות הקבוצה, נותן 3 כוכבים (type: quiz)
//
// כל תחנה: { id, type, groupId, groupName, title, emoji, letter?, letters }
function buildReadingStations() {
  const TYPE_META = {
    meet: { title: 'הכרת האות', emoji: '👋' },
    hunt: { title: 'ציד האותיות', emoji: '🔍' },
    hear: { title: 'איזו אות שמעת?', emoji: '👂' },
    quiz: { title: 'אתגר הסיכום', emoji: '🏆' },
  };

  const stations = [];
  READING_GROUPS.forEach(group => {
    // תחנת "הכרת האות" לכל אות בקבוצה
    group.letters.forEach((letter, i) => {
      stations.push({
        id: `${group.id}_meet_${i}`,
        type: 'meet',
        groupId: group.id,
        groupName: group.name,
        title: `${TYPE_META.meet.title} ${letter}`,
        emoji: TYPE_META.meet.emoji,
        letter: letter,
        letters: [letter],
      });
    });
    // תחנת ציד — כל אותיות הקבוצה
    stations.push({
      id: `${group.id}_hunt`,
      type: 'hunt', groupId: group.id, groupName: group.name,
      title: TYPE_META.hunt.title, emoji: TYPE_META.hunt.emoji,
      letters: group.letters.slice(),
    });
    // תחנת הבחנה קולית
    stations.push({
      id: `${group.id}_hear`,
      type: 'hear', groupId: group.id, groupName: group.name,
      title: TYPE_META.hear.title, emoji: TYPE_META.hear.emoji,
      letters: group.letters.slice(),
    });
    // תחנת סיכום (בוס)
    stations.push({
      id: `${group.id}_quiz`,
      type: 'quiz', groupId: group.id, groupName: group.name,
      title: TYPE_META.quiz.title, emoji: TYPE_META.quiz.emoji,
      isBoss: true,
      letters: group.letters.slice(),
    });
  });
  return stations;
}

const READING_STATIONS = buildReadingStations();

// כל האותיות שכבר "נלמדו" עד תחנה מסוימת (למסיחים חכמים)
function lettersUpToStation(stationId) {
  const seen = [];
  for (const st of READING_STATIONS) {
    (st.letters || []).forEach(l => { if (!seen.includes(l)) seen.push(l); });
    if (st.id === stationId) break;
  }
  return seen;
}

// חשיפה גלובלית (הקבצים נטענים כ-script רגיל, בלי מודולים)
window.READING_LETTERS = READING_LETTERS;
window.READING_GROUPS = READING_GROUPS;
window.READING_STATIONS = READING_STATIONS;
window.lettersUpToStation = lettersUpToStation;
window.getStationById = id => READING_STATIONS.find(s => s.id === id) || null;
