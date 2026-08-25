// ============================================================
// reading-data.js  ·  "מסע הקריאה"
// ------------------------------------------------------------
// זהו הקובץ היחיד שצריך לערוך כדי לשנות תוכן:
//   • אילו אותיות במסע ובאיזה סדר
//   • בנק המילים והתמונות של כל אות (אפשר להוסיף כמה שרוצים)
//   • הרכב הקבוצות (3-4 אותיות לקבוצה)
//
// לכל אות יש מספר מילים ("words"), וכל מילה:
//   word  – המילה עם ניקוד (לתצוגה)
//   emoji – תמונה קטנה (אימוג'י)
//   audio – שם קובץ הקלטה בתיקייה letters/ .  '' = אין עדיין הקלטה,
//           ואז מושמע קול סינתטי (TTS) עד שמקליטים.  << כאן נכנסות
//           ההקלטות שתקליטו: שמים קובץ ב-letters/ וכותבים את שמו כאן.
//
// שם האות עצמה מוקלט ב-letterAudio (כבר קיים לכל האותיות).
// ============================================================

const READING_LETTERS = {
  'א': { name: 'אָלֶף', letterAudio: 'Aleph1.mp3', words: [
    { word: 'אַרְיֵה',  emoji: '🦁', audio: 'aryeh.mp3' },
    { word: 'אֹזֶן',    emoji: '👂', audio: '' },
    { word: 'אֶפְרוֹחַ', emoji: '🐥', audio: '' },
    { word: 'אֶצְבַּע',  emoji: '👆', audio: '' },
  ]},
  'ב': { name: 'בֵּית', letterAudio: 'beit.mp3', words: [
    { word: 'בַּרְוָז', emoji: '🦆', audio: 'barvaz.mp3' },
    { word: 'בַּיִת',   emoji: '🏠', audio: '' },
    { word: 'בָּנָנָה', emoji: '🍌', audio: '' },
    { word: 'בַּלּוֹן', emoji: '🎈', audio: '' },
  ]},
  'ג': { name: 'גִּימֶל', letterAudio: 'gimel_1.mp3', words: [
    { word: 'גָּמָל',    emoji: '🐪', audio: 'gamal.mp3' },
    { word: 'גְּלִידָה', emoji: '🍦', audio: '' },
    { word: 'גֶּזֶר',    emoji: '🥕', audio: '' },
    { word: 'גִּיטָרָה', emoji: '🎸', audio: '' },
  ]},
  'ד': { name: 'דָּלֶת', letterAudio: 'dalet_1.mp3', words: [
    { word: 'דֹּב',   emoji: '🐻', audio: 'dov.mp3' },
    { word: 'דָּג',   emoji: '🐟', audio: '' },
    { word: 'דֶּלֶת', emoji: '🚪', audio: '' },
    { word: 'דֶּגֶל', emoji: '🚩', audio: '' },
  ]},
  'ה': { name: 'הֵא', letterAudio: 'hei_1.mp3', words: [
    { word: 'הַר',            emoji: '⛰️', audio: 'har.mp3' },
    { word: 'הִיפּוֹפּוֹטָם', emoji: '🦛', audio: '' },
    { word: 'הֶגֶה',          emoji: '🛞', audio: '' },
  ]},
  'ו': { name: 'וָו', letterAudio: 'vav_1.mp3', words: [
    { word: 'וֶרֶד',   emoji: '🌹', audio: 'vered.mp3' },
    { word: 'וִילוֹן', emoji: '🪟', audio: '' },
    { word: 'וָו',     emoji: '🪝', audio: '' },
  ]},
  'ז': { name: 'זַיִן', letterAudio: 'zain_1.mp3', words: [
    { word: 'זֶבְּרָה', emoji: '🦓', audio: 'zebra.mp3' },
    { word: 'זְאֵב',   emoji: '🐺', audio: '' },
    { word: 'זְבוּב',  emoji: '🪰', audio: '' },
    { word: 'זֵר',     emoji: '💐', audio: '' },
  ]},
  'ח': { name: 'חֵית', letterAudio: 'chet_1.mp3', words: [
    { word: 'חָתוּל',    emoji: '🐱', audio: 'chatul.mp3' },
    { word: 'חַלָּה',    emoji: '🥖', audio: '' },
    { word: 'חַדְקֶרֶן', emoji: '🦄', audio: '' },
    { word: 'חֻלְצָה',   emoji: '👕', audio: '' },
  ]},
  'ט': { name: 'טֵית', letterAudio: 'tet.mp3', words: [
    { word: 'טְרַקְטוֹר', emoji: '🚜', audio: 'traktor.mp3' },
    { word: 'טַוָּס',    emoji: '🦚', audio: '' },
    { word: 'טִירָה',    emoji: '🏰', audio: '' },
    { word: 'טֶלֶפוֹן',  emoji: '📞', audio: '' },
  ]},
  'י': { name: 'יוֹד', letterAudio: 'yud.mp3', words: [
    { word: 'יַנְשׁוּף', emoji: '🦉', audio: 'yanshuf.mp3' },
    { word: 'יָד',      emoji: '✋', audio: '' },
    { word: 'יָרֵחַ',   emoji: '🌙', audio: '' },
    { word: 'יַלְדָּה',  emoji: '👧', audio: '' },
  ]},
  'כ': { name: 'כַּף', letterAudio: 'chaf_1.mp3', words: [
    { word: 'כֶּלֶב',  emoji: '🐶', audio: 'kelev.mp3' },
    { word: 'כּוֹבַע', emoji: '🧢', audio: '' },
    { word: 'כּוֹכָב', emoji: '⭐', audio: '' },
    { word: 'כַּדּוּר', emoji: '⚽', audio: '' },
  ]},
  'ל': { name: 'לָמֶד', letterAudio: 'lamed.mp3', words: [
    { word: 'לֵיצָן',    emoji: '🤡', audio: 'leitzan.mp3' },
    { word: 'לִימוֹן',   emoji: '🍋', audio: '' },
    { word: 'לֵב',       emoji: '❤️', audio: '' },
    { word: 'לִוְיָתָן',  emoji: '🐋', audio: '' },
  ]},
  'מ': { name: 'מֵם', letterAudio: 'mem_1.mp3', words: [
    { word: 'מְכוֹנִית', emoji: '🚗', audio: 'mechonit.mp3' },
    { word: 'מֶלֶךְ',    emoji: '🤴', audio: '' },
    { word: 'מַפְתֵּחַ',  emoji: '🔑', audio: '' },
    { word: 'מִטְרִיָּה', emoji: '☔', audio: '' },
  ]},
  'נ': { name: 'נוּן', letterAudio: 'nun.mp3', words: [
    { word: 'נָחָשׁ', emoji: '🐍', audio: 'nachash.mp3' },
    { word: 'נֵר',   emoji: '🕯️', audio: '' },
    { word: 'נַעַל',  emoji: '👟', audio: '' },
    { word: 'נָמֵר',  emoji: '🐆', audio: '' },
  ]},
  'ס': { name: 'סָמֶךְ', letterAudio: 'samech.mp3', words: [
    { word: 'סוּס',    emoji: '🐴', audio: 'sus.mp3' },
    { word: 'סֻלָּם',   emoji: '🪜', audio: '' },
    { word: 'סְפִינָה', emoji: '🚢', audio: '' },
    { word: 'סֵפֶר',   emoji: '📚', audio: '' },
  ]},
  'ע': { name: 'עַיִן', letterAudio: 'ain.mp3', words: [
    { word: 'עַכְבָּר', emoji: '🐭', audio: 'achbar.mp3' },
    { word: 'עֵץ',     emoji: '🌳', audio: '' },
    { word: 'עֵנָב',   emoji: '🍇', audio: '' },
    { word: 'עַיִן',   emoji: '👁️', audio: '' },
  ]},
  'פ': { name: 'פֵּא', letterAudio: 'peh_1.mp3', words: [
    { word: 'פִּיל',     emoji: '🐘', audio: 'pil.mp3' },
    { word: 'פַּרְפַּר',  emoji: '🦋', audio: '' },
    { word: 'פֶּרַח',    emoji: '🌸', audio: '' },
    { word: 'פִּיצָה',   emoji: '🍕', audio: '' },
  ]},
  'צ': { name: 'צָדִי', letterAudio: 'tzadik_1.mp3', words: [
    { word: 'צָב',       emoji: '🐢', audio: 'tzav.mp3' },
    { word: 'צִפּוֹר',   emoji: '🐦', audio: '' },
    { word: 'צְפַרְדֵּעַ', emoji: '🐸', audio: '' },
    { word: 'צֶבַע',     emoji: '🎨', audio: '' },
  ]},
  'ק': { name: 'קוּף', letterAudio: 'kuf.mp3', words: [
    { word: 'קוֹף',    emoji: '🐒', audio: 'kof.mp3' },
    { word: 'קֶשֶׁת',   emoji: '🌈', audio: '' },
    { word: 'קַרְנַף',  emoji: '🦏', audio: '' },
    { word: 'קֻפְסָה',  emoji: '📦', audio: '' },
  ]},
  'ר': { name: 'רֵישׁ', letterAudio: 'reish.mp3', words: [
    { word: 'רַכֶּבֶת', emoji: '🚆', audio: 'rakevet.mp3' },
    { word: 'רוֹבּוֹט', emoji: '🤖', audio: '' },
    { word: 'רַמְזוֹר', emoji: '🚦', audio: '' },
    { word: 'רוּחַ',   emoji: '🌬️', audio: '' },
  ]},
  'ש': { name: 'שִׁין', letterAudio: 'shin.mp3', words: [
    { word: 'שֶׁמֶשׁ',   emoji: '☀️', audio: 'shemesh.mp3' },
    { word: 'שָׁעוֹן',   emoji: '⌚', audio: '' },
    { word: 'שׁוֹקוֹלָד', emoji: '🍫', audio: '' },
    { word: 'שֶׁלֶג',    emoji: '❄️', audio: '' },
  ]},
  'ת': { name: 'תָּו', letterAudio: 'taf_1.mp3', words: [
    { word: 'תַּפּוּחַ', emoji: '🍎', audio: 'tapuach.mp3' },
    { word: 'תּוּת',    emoji: '🍓', audio: '' },
    { word: 'תַּפּוּז',  emoji: '🍊', audio: '' },
    { word: 'תֻּכִּי',   emoji: '🦜', audio: '' },
  ]},
};

// --- הקבוצות של המסע (סדר מומלץ) ---
// כל קבוצה = 3-4 אותיות. הסדר כאן = סדר ההתקדמות במפה.
const READING_GROUPS = [
  { id: 'g1', name: 'קבוצה 1', emoji: '🌱', letters: ['א', 'ש', 'מ', 'ל'] },
  { id: 'g2', name: 'קבוצה 2', emoji: '🌼', letters: ['ב', 'ו', 'ת', 'ה'] },
  { id: 'g3', name: 'קבוצה 3', emoji: '🍎', letters: ['ד', 'ר', 'נ', 'י'] },
  { id: 'g4', name: 'קבוצה 4', emoji: '🚀', letters: ['ג', 'ח', 'כ', 'ק'] },
  { id: 'g5', name: 'קבוצה 5', emoji: '🌊', letters: ['ס', 'ע', 'צ'] },
  { id: 'g6', name: 'קבוצה 6', emoji: '🏆', letters: ['פ', 'ז', 'ט'] },
];

// --- עזרי מילים ---
function letterWords(char) {
  const d = READING_LETTERS[char];
  return (d && d.words) || [];
}
function primaryWord(char) {
  const w = letterWords(char);
  return w[0] || { word: char, emoji: '❓', audio: '' };
}
function pickWord(char) {
  const w = letterWords(char);
  return w.length ? w[Math.floor(Math.random() * w.length)] : primaryWord(char);
}

// --- בניית רשימת התחנות של המסע ---
function buildReadingStations() {
  const TYPE_META = {
    meet: { title: 'הכרת האות', emoji: '👋' },
    hunt: { title: 'ציד האותיות', emoji: '🔍' },
    hear: { title: 'איזו אות שמעת?', emoji: '👂' },
    quiz: { title: 'אתגר הסיכום', emoji: '🏆' },
  };
  const stations = [];
  READING_GROUPS.forEach(group => {
    group.letters.forEach((letter, i) => {
      stations.push({
        id: `${group.id}_meet_${i}`, type: 'meet',
        groupId: group.id, groupName: group.name,
        title: `${TYPE_META.meet.title} ${letter}`, emoji: TYPE_META.meet.emoji,
        letter: letter, letters: [letter],
      });
    });
    stations.push({ id: `${group.id}_hunt`, type: 'hunt', groupId: group.id, groupName: group.name,
      title: TYPE_META.hunt.title, emoji: TYPE_META.hunt.emoji, letters: group.letters.slice() });
    stations.push({ id: `${group.id}_hear`, type: 'hear', groupId: group.id, groupName: group.name,
      title: TYPE_META.hear.title, emoji: TYPE_META.hear.emoji, letters: group.letters.slice() });
    stations.push({ id: `${group.id}_quiz`, type: 'quiz', groupId: group.id, groupName: group.name,
      title: TYPE_META.quiz.title, emoji: TYPE_META.quiz.emoji, isBoss: true, letters: group.letters.slice() });
  });
  return stations;
}

const READING_STATIONS = buildReadingStations();

function lettersUpToStation(stationId) {
  const seen = [];
  for (const st of READING_STATIONS) {
    (st.letters || []).forEach(l => { if (!seen.includes(l)) seen.push(l); });
    if (st.id === stationId) break;
  }
  return seen;
}

// חשיפה גלובלית
window.READING_LETTERS = READING_LETTERS;
window.READING_GROUPS = READING_GROUPS;
window.READING_STATIONS = READING_STATIONS;
window.letterWords = letterWords;
window.primaryWord = primaryWord;
window.pickWord = pickWord;
window.lettersUpToStation = lettersUpToStation;
window.getStationById = id => READING_STATIONS.find(s => s.id === id) || null;
