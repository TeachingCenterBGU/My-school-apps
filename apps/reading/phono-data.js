// ============================================================
// phono-data.js  ·  "אוזניים של קסם" — מודעות פונולוגית (בלי אותיות)
// ------------------------------------------------------------
// מסלול מקדים לפני האותיות. הכול על שמע ותמונות בלבד — אין כאן
// אף אות כתובה. זהו הקובץ היחיד שצריך לערוך כדי לשנות תוכן.
//
// כל מילה בבנק:
//   word  – המילה עם ניקוד (לא מוצגת לילד/ה — משמשת רק ל-TTS)
//   emoji – התמונה
//   audio – שם קובץ הקלטה בתיקייה letters/ .  '' = אין הקלטה עדיין,
//           ואז מושמע קול סינתטי (TTS) — בדיוק כמו במסלול האותיות.
//   syl   – מספר ההברות (למשחק "מכונת ההברות")
//   init  – הצליל הפותח (מפתח פונמה, לא אות!) — למשחקי המיון/הבלש/החיבור
//   rime  – "החרוז" = צליל הסיום (למשחק החרוזים). '' = לא משתתפת בחריזה.
//   parts – (רשות) פירוק לצלילים לחיבור פונמי (למשחק "קסם החיבור").
//
// מפתחות הצליל (init) מאחדים אותיות שנשמעות אותו דבר:
//   'ט' = ת+ט   ·   'ק' = ק+כּ   ·   'ח' = ח+כ(רפה)   ·   'א' = א+ע
// כי בשלב הזה הכול לפי האוזן, לא לפי הכתיב.
// ============================================================

// --- הצליל הפותח: שם ידידותי + איך אומרים אותו (למשחקים) ---
// say = מחרוזת שה-TTS יבטא כדי "להשמיע את הצליל". בהמשך אפשר
// להחליף בהקלטה אמיתית (phonemeAudio) — כרגע קול סינתטי.
const PHONO_SOUNDS = {
  'מ': { label: 'מְמְמ', say: 'מְמְמְמ', emoji: '🐮' },
  'ש': { label: 'שְׁשְׁ', say: 'שְׁשְׁשְׁ', emoji: '🤫' },
  'ר': { label: 'רְרְר', say: 'רְרְרְר', emoji: '🐯' },
  'ל': { label: 'לְלְל', say: 'לְלְלְ', emoji: '🎵' },
  'ס': { label: 'סְסְס', say: 'סְסְסְ', emoji: '🐍' },
  'ב': { label: 'בְּ', say: 'בְּ', emoji: '💥' },
  'פ': { label: 'פְּ', say: 'פְּ', emoji: '💨' },
  'ד': { label: 'דְּ', say: 'דְּ', emoji: '🥁' },
  'ט': { label: 'טְ', say: 'טְ', emoji: '⏰' },
  'ק': { label: 'קְ', say: 'קְ', emoji: '🐸' },
  'ג': { label: 'גְּ', say: 'גְּ', emoji: '🐊' },
  'ח': { label: 'חְח', say: 'חְחְח', emoji: '😮‍💨' },
  'א': { label: 'אַ', say: 'אַ', emoji: '👄' },
  'ה': { label: 'הְ', say: 'הַה', emoji: '🌬️' },
  'צ': { label: 'צְ', say: 'צְ', emoji: '🐦' },
  'ז': { label: 'זְזְז', say: 'זְזְזְ', emoji: '🐝' },
  'י': { label: 'יְ', say: 'יְ', emoji: '✋' },
  'ו': { label: 'וְו', say: 'וְוְ', emoji: '🌹' },
  'נ': { label: 'נְנ', say: 'נְנְנ', emoji: '👃' },
};

// --- בנק המילים ---
const PHONO_WORDS = [
  // ---- מ ----
  { word: 'מְכוֹנִית', emoji: '🚗', audio: 'mechonit.mp3', syl: 3, init: 'מ', rime: 'it', parts: ['מ','כו','נית'] },
  { word: 'מָטוֹס',    emoji: '✈️', audio: '', syl: 2, init: 'מ', rime: '' },
  { word: 'מִטְרִיָּה', emoji: '☂️', audio: '', syl: 3, init: 'מ', rime: '' },
  { word: 'מֶלֶךְ',    emoji: '🤴', audio: '', syl: 2, init: 'מ', rime: '' },
  { word: 'מְנוֹרָה',  emoji: '💡', audio: '', syl: 3, init: 'מ', rime: 'ra' },
  { word: 'מַפְתֵּחַ',  emoji: '🔑', audio: '', syl: 2, init: 'מ', rime: '' },

  // ---- ש ----
  { word: 'שֶׁמֶשׁ',    emoji: '☀️', audio: 'shemesh.mp3', syl: 2, init: 'ש', rime: '' },
  { word: 'שָׁעוֹן',    emoji: '⏰', audio: '', syl: 2, init: 'ש', rime: 'on' },
  { word: 'שֻׁלְחָן',   emoji: '🍽️', audio: '', syl: 2, init: 'ש', rime: '' },
  { word: 'שׁוֹקוֹלָד', emoji: '🍫', audio: '', syl: 3, init: 'ש', rime: '' },
  { word: 'שׁוּעָל',    emoji: '🦊', audio: '', syl: 2, init: 'ש', rime: '' },

  // ---- ר ----
  { word: 'רַכֶּבֶת',  emoji: '🚂', audio: 'rakevet.mp3', syl: 3, init: 'ר', rime: '' },
  { word: 'רוֹבּוֹט',  emoji: '🤖', audio: '', syl: 2, init: 'ר', rime: '' },
  { word: 'רַגְלַיִם', emoji: '🦵', audio: '', syl: 3, init: 'ר', rime: '' },
  { word: 'רוּחַ',    emoji: '🌬️', audio: '', syl: 2, init: 'ר', rime: '' },

  // ---- ל ----
  { word: 'לֵיצָן',   emoji: '🤡', audio: 'leitzan.mp3', syl: 2, init: 'ל', rime: '' },
  { word: 'לִימוֹן',  emoji: '🍋', audio: '', syl: 2, init: 'ל', rime: 'on' },
  { word: 'לֵב',      emoji: '❤️', audio: '', syl: 1, init: 'ל', rime: '' },
  { word: 'לְטָאָה',  emoji: '🦎', audio: '', syl: 3, init: 'ל', rime: '' },
  { word: 'לַיְלָה',   emoji: '🌙', audio: '', syl: 2, init: 'ל', rime: '' },

  // ---- ס ----
  { word: 'סוּס',       emoji: '🐴', audio: 'sus.mp3', syl: 1, init: 'ס', rime: 'us', parts: ['ס','ו','ס'] },
  { word: 'סֵפֶר',      emoji: '📖', audio: '', syl: 2, init: 'ס', rime: 'er' },
  { word: 'סֻכָּרִיָּה', emoji: '🍬', audio: '', syl: 4, init: 'ס', rime: '' },
  { word: 'סִירָה',     emoji: '⛵', audio: '', syl: 2, init: 'ס', rime: 'ra' },
  { word: 'סַבָּא',     emoji: '👴', audio: '', syl: 2, init: 'ס', rime: '' },

  // ---- ב ----
  { word: 'בַּיִת',   emoji: '🏠', audio: '', syl: 2, init: 'ב', rime: '' },
  { word: 'בַּלּוֹן', emoji: '🎈', audio: '', syl: 2, init: 'ב', rime: 'on' },
  { word: 'בַּרְוָז', emoji: '🦆', audio: 'barvaz.mp3', syl: 2, init: 'ב', rime: '' },
  { word: 'בָּנָנָה', emoji: '🍌', audio: '', syl: 3, init: 'ב', rime: '' },
  { word: 'בֻּבָּה',  emoji: '🪆', audio: '', syl: 2, init: 'ב', rime: '' },

  // ---- פ ----
  { word: 'פִּיל',    emoji: '🐘', audio: 'pil.mp3', syl: 1, init: 'פ', rime: '', parts: ['פ','י','ל'] },
  { word: 'פַּרְפַּר', emoji: '🦋', audio: '', syl: 2, init: 'פ', rime: '' },
  { word: 'פִּיצָה',  emoji: '🍕', audio: '', syl: 2, init: 'פ', rime: '' },
  { word: 'פֶּרַח',   emoji: '🌸', audio: '', syl: 2, init: 'פ', rime: '' },
  { word: 'פֻּזְמָק',  emoji: '🧦', audio: '', syl: 2, init: 'פ', rime: '' },

  // ---- ד ----
  { word: 'דֹּב',       emoji: '🐻', audio: 'dov.mp3', syl: 1, init: 'ד', rime: '', parts: ['ד','ו','ב'] },
  { word: 'דָּג',       emoji: '🐟', audio: '', syl: 1, init: 'ד', rime: '' },
  { word: 'דֶּלֶת',     emoji: '🚪', audio: '', syl: 2, init: 'ד', rime: '' },
  { word: 'דֶּגֶל',     emoji: '🚩', audio: '', syl: 2, init: 'ד', rime: '' },
  { word: 'דֻּבְדְּבָן', emoji: '🍒', audio: '', syl: 3, init: 'ד', rime: '' },

  // ---- ט (ת+ט) ----
  { word: 'תַּפּוּחַ',  emoji: '🍎', audio: 'tapuach.mp3', syl: 3, init: 'ט', rime: '' },
  { word: 'תּוּת',     emoji: '🍓', audio: '', syl: 1, init: 'ט', rime: '' },
  { word: 'תַּרְנְגוֹל', emoji: '🐓', audio: '', syl: 3, init: 'ט', rime: '' },
  { word: 'טְרַקְטוֹר', emoji: '🚜', audio: 'traktor.mp3', syl: 3, init: 'ט', rime: '' },
  { word: 'טַוָּס',    emoji: '🦚', audio: '', syl: 2, init: 'ט', rime: '' },
  { word: 'טֶלֶפוֹן',  emoji: '📞', audio: '', syl: 3, init: 'ט', rime: 'on' },

  // ---- ק (ק+כּ) ----
  { word: 'קוֹף',    emoji: '🐒', audio: 'kof.mp3', syl: 1, init: 'ק', rime: '' },
  { word: 'קֶשֶׁת',   emoji: '🌈', audio: '', syl: 2, init: 'ק', rime: '' },
  { word: 'קֻבִּיָּה', emoji: '🎲', audio: '', syl: 3, init: 'ק', rime: '' },
  { word: 'כֶּלֶב',   emoji: '🐶', audio: 'kelev.mp3', syl: 2, init: 'ק', rime: '' },
  { word: 'כֶּתֶר',   emoji: '👑', audio: '', syl: 2, init: 'ק', rime: 'er' },
  { word: 'כּוֹבַע',  emoji: '🧢', audio: '', syl: 2, init: 'ק', rime: '' },

  // ---- ג ----
  { word: 'גָּמָל',    emoji: '🐪', audio: 'gamal.mp3', syl: 2, init: 'ג', rime: '' },
  { word: 'גֶּזֶר',    emoji: '🥕', audio: '', syl: 2, init: 'ג', rime: '' },
  { word: 'גְּלִידָה', emoji: '🍦', audio: '', syl: 3, init: 'ג', rime: '' },
  { word: 'גִּיטָרָה', emoji: '🎸', audio: '', syl: 3, init: 'ג', rime: 'ra' },

  // ---- ח (ח+כ רפה) ----
  { word: 'חָתוּל', emoji: '🐱', audio: 'chatul.mp3', syl: 2, init: 'ח', rime: '' },
  { word: 'חַלָּה',  emoji: '🥖', audio: '', syl: 2, init: 'ח', rime: '' },
  { word: 'חוֹף',   emoji: '🏖️', audio: '', syl: 1, init: 'ח', rime: '' },
  { word: 'חָצִיל', emoji: '🍆', audio: '', syl: 2, init: 'ח', rime: '' },

  // ---- א (א+ע) ----
  { word: 'אַרְיֵה', emoji: '🦁', audio: 'aryeh.mp3', syl: 2, init: 'א', rime: '' },
  { word: 'אֹזֶן',   emoji: '👂', audio: '', syl: 2, init: 'א', rime: '' },
  { word: 'אֶצְבַּע', emoji: '👆', audio: '', syl: 2, init: 'א', rime: '' },
  { word: 'עֵץ',    emoji: '🌳', audio: '', syl: 1, init: 'א', rime: '' },
  { word: 'עֵנָב',   emoji: '🍇', audio: '', syl: 2, init: 'א', rime: '' },
  { word: 'עַכְבָּר', emoji: '🐭', audio: 'achbar.mp3', syl: 2, init: 'א', rime: '' },
  { word: 'עֻגָּה',  emoji: '🎂', audio: '', syl: 2, init: 'א', rime: '' },

  // ---- ה ----
  { word: 'הַר',            emoji: '⛰️', audio: 'har.mp3', syl: 1, init: 'ה', rime: '' },
  { word: 'הֶגֶה',          emoji: '🛞', audio: '', syl: 2, init: 'ה', rime: '' },
  { word: 'הִיפּוֹפּוֹטָם', emoji: '🦛', audio: '', syl: 5, init: 'ה', rime: '' },

  // ---- צ ----
  { word: 'צַב',     emoji: '🐢', audio: 'tzav.mp3', syl: 1, init: 'צ', rime: '' },
  { word: 'צִפּוֹר',  emoji: '🐦', audio: '', syl: 2, init: 'צ', rime: '' },
  { word: 'צֶדֶף',   emoji: '🐚', audio: '', syl: 2, init: 'צ', rime: '' },
  { word: 'צַלַּחַת', emoji: '🍽️', audio: '', syl: 3, init: 'צ', rime: '' },

  // ---- ז ----
  { word: 'זֶבְּרָה', emoji: '🦓', audio: 'zebra.mp3', syl: 2, init: 'ז', rime: 'ra' },
  { word: 'זְאֵב',   emoji: '🐺', audio: '', syl: 2, init: 'ז', rime: '' },
  { word: 'זְבוּב',  emoji: '🪰', audio: '', syl: 2, init: 'ז', rime: '' },
  { word: 'זֵר',     emoji: '💐', audio: '', syl: 1, init: 'ז', rime: '' },

  // ---- י ----
  { word: 'יַנְשׁוּף', emoji: '🦉', audio: 'yanshuf.mp3', syl: 2, init: 'י', rime: '' },
  { word: 'יָד',      emoji: '✋', audio: '', syl: 1, init: 'י', rime: '' },
  { word: 'יָרֵחַ',   emoji: '🌙', audio: '', syl: 2, init: 'י', rime: '' },
  { word: 'יַלְדָּה',  emoji: '👧', audio: '', syl: 2, init: 'י', rime: '' },

  // ---- ו ----
  { word: 'וֶרֶד',   emoji: '🌹', audio: 'vered.mp3', syl: 2, init: 'ו', rime: '' },
  { word: 'וִילוֹן', emoji: '🪟', audio: '', syl: 2, init: 'ו', rime: 'on' },

  // ---- נ ----
  { word: 'נָחָשׁ',  emoji: '🐍', audio: 'nachash.mp3', syl: 2, init: 'נ', rime: '' },
  { word: 'נֵר',    emoji: '🕯️', audio: '', syl: 1, init: 'נ', rime: '' },
  { word: 'נַעַל',   emoji: '👟', audio: '', syl: 2, init: 'נ', rime: '' },
  { word: 'נָמֵר',   emoji: '🐆', audio: '', syl: 2, init: 'נ', rime: '' },
  { word: 'נְמָלָה', emoji: '🐜', audio: '', syl: 3, init: 'נ', rime: '' },

  // ---- מילים נוספות לחריזה בלבד ----
  { word: 'חִפּוּשִׁית', emoji: '🐞', audio: '', syl: 3, init: 'ח', rime: 'it' },
  { word: 'אוֹטוֹבּוּס', emoji: '🚌', audio: '', syl: 3, init: 'א', rime: 'us' },
  { word: 'פָּרָה',      emoji: '🐄', audio: '', syl: 2, init: 'פ', rime: 'ra' },
];

// --- 4 מקבצי הצלילים (מהקל שמיעתית לקשה) ---
const PHONO_GROUPS = [
  { id: 'p1', name: 'הצלילים המתמשכים', emoji: '🎵', color: '#39c6a6',
    sounds: ['מ', 'ש', 'ר', 'ל', 'ס'],
    hint: 'צלילים שאפשר "למשוך" ולשיר: מממ, ששש, ררר' },
  { id: 'p2', name: 'הצלילים הפוצצים', emoji: '💥', color: '#ff7a59',
    sounds: ['ב', 'פ', 'ד', 'ט', 'ק', 'ג'],
    hint: 'צלילים קצרים ש"נחתכים" באוויר: בְּ! פְּ! דְּ!' },
  { id: 'p3', name: 'הצלילים הגרוניים', emoji: '🌬️', color: '#8f6ed5',
    sounds: ['ח', 'א', 'ה'],
    hint: 'צלילים שיוצאים עמוק מהגרון, ולפעמים כמעט נעלמים' },
  { id: 'p4', name: 'השורקים והמורכבים', emoji: '🐝', color: '#ff5ca8',
    sounds: ['צ', 'ז', 'י', 'ו', 'נ'],
    hint: 'צלילים מיוחדים שצריך אוזן חדה כדי לבודד' },
];

// ============================================================
//  עזרים
// ============================================================
function phonoStripNikud(w) { return (w || '').replace(/[֑-ׇ]/g, ''); }
function phonoShuffle(a) { return a.slice().sort(() => Math.random() - 0.5); }
function phonoPick(a, n) { return phonoShuffle(a).slice(0, n); }
function phonoOne(a) { return a[Math.floor(Math.random() * a.length)]; }

function phonoWordsBySound(sound) { return PHONO_WORDS.filter(w => w.init === sound); }
function phonoWordsBySyl(n) { return PHONO_WORDS.filter(w => w.syl === n); }
function phonoWordsByRime(rime) { return PHONO_WORDS.filter(w => w.rime === rime); }
function phonoSoundLabel(s) { return (PHONO_SOUNDS[s] || {}).label || s; }
function phonoSoundSay(s) { return (PHONO_SOUNDS[s] || {}).say || s; }

// כל החרוזים שיש להם לפחות 2 מילים (לבניית שאלות חריזה)
function phonoRimeGroups() {
  const map = {};
  PHONO_WORDS.forEach(w => { if (w.rime) (map[w.rime] = map[w.rime] || []).push(w); });
  return Object.keys(map).filter(r => map[r].length >= 2).map(r => map[r]);
}

// ============================================================
//  בניית תחנות המסלול
// ------------------------------------------------------------
//  סוגי התחנות (type) = שם המשחק:
//    syll  · מכונת ההברות     (אנליזה — הקל ביותר)
//    rhyme · שומרי החרוזים    (זיהוי חרוז)
//    catch · מפעל המיון       (בידוד צליל פותח)
//    odd   · בלש הצלילים       (יוצא דופן)
//    blend · קסם החיבור        (סינתזה — ההכנה לקריאה)
// ============================================================
const PHONO_TYPE_META = {
  syll:  { title: 'מכונת ההברות', emoji: '🥁', short: 'הברות' },
  rhyme: { title: 'שומרי החרוזים', emoji: '🚪', short: 'חרוזים' },
  catch: { title: 'מפעל המיון',    emoji: '🏭', short: 'צליל פותח' },
  odd:   { title: 'בלש הצלילים',   emoji: '🔍', short: 'יוצא דופן' },
  blend: { title: 'קסם החיבור',    emoji: '✨', short: 'חיבור צלילים' },
};

function buildPhonoStations() {
  const st = [];
  // שלב פתיחה: הברות וחרוזים (לא תלויי צליל ספציפי)
  st.push({ id: 'ph-syll', type: 'syll', groupId: 'intro', title: PHONO_TYPE_META.syll.title, emoji: PHONO_TYPE_META.syll.emoji });
  st.push({ id: 'ph-rhyme', type: 'rhyme', groupId: 'intro', title: PHONO_TYPE_META.rhyme.title, emoji: PHONO_TYPE_META.rhyme.emoji });

  // לכל מקבץ צלילים: מיון → בלש (→ חיבור, למקבצים הקלים)
  PHONO_GROUPS.forEach(g => {
    st.push({ id: 'ph-catch-' + g.id, type: 'catch', groupId: g.id, sounds: g.sounds.slice(),
              title: PHONO_TYPE_META.catch.title, emoji: PHONO_TYPE_META.catch.emoji });
    st.push({ id: 'ph-odd-' + g.id, type: 'odd', groupId: g.id, sounds: g.sounds.slice(),
              title: PHONO_TYPE_META.odd.title, emoji: PHONO_TYPE_META.odd.emoji });
    // חיבור פונמי — רק במקבצים 1-2 (מספיק מילים עם פירוק parts)
    if (g.id === 'p1' || g.id === 'p2') {
      st.push({ id: 'ph-blend-' + g.id, type: 'blend', groupId: g.id, sounds: g.sounds.slice(),
                title: PHONO_TYPE_META.blend.title, emoji: PHONO_TYPE_META.blend.emoji });
    }
  });

  // אלוף הצלילים — חיבור מכל הצלילים
  st.push({ id: 'ph-blend-final', type: 'blend', groupId: 'final', mixed: true,
            title: 'אלוף הצלילים', emoji: '👑' });
  return st;
}

const PHONO_STATIONS = buildPhonoStations();
function getPhonoStationById(id) { return PHONO_STATIONS.find(s => s.id === id) || null; }

// ============================================================
//  בנק "קסם החיבור" — מילים מחולקות לחלקים (הברות) שאפשר לבטא בבירור.
//  parts = חלקי המילה שמושמעים בזה אחר זה. audio = הקלטת המילה השלמה.
//  אפשר להקליט באולפן גם את המילה (word:) וגם כל חלק (part:).
// ============================================================
const PHONO_BLEND = [
  { word:'מְכוֹנִית', emoji:'🚗', audio:'mechonit.mp3', init:'מ', parts:['מְכוֹ','נִית'] },
  { word:'מְנוֹרָה',  emoji:'💡', audio:'', init:'מ', parts:['מְנוֹ','רָה'] },
  { word:'שָׁעוֹן',   emoji:'⏰', audio:'', init:'ש', parts:['שָׁ','עוֹן'] },
  { word:'שֻׁלְחָן',  emoji:'🍽️', audio:'', init:'ש', parts:['שֻׁל','חָן'] },
  { word:'רַכֶּבֶת',  emoji:'🚂', audio:'rakevet.mp3', init:'ר', parts:['רַ','כֶּ','בֶת'] },
  { word:'לִימוֹן',   emoji:'🍋', audio:'', init:'ל', parts:['לִי','מוֹן'] },
  { word:'סִירָה',    emoji:'⛵', audio:'', init:'ס', parts:['סִי','רָה'] },
  { word:'בַּלּוֹן',  emoji:'🎈', audio:'', init:'ב', parts:['בַּ','לּוֹן'] },
  { word:'בָּנָנָה',  emoji:'🍌', audio:'', init:'ב', parts:['בָּ','נָ','נָה'] },
  { word:'פַּרְפַּר', emoji:'🦋', audio:'', init:'פ', parts:['פַּר','פַּר'] },
  { word:'פִּיצָה',   emoji:'🍕', audio:'', init:'פ', parts:['פִּי','צָה'] },
  { word:'דֻּבְדְּבָן', emoji:'🍒', audio:'', init:'ד', parts:['דֻּבְ','דְּבָן'] },
  { word:'תַּפּוּחַ',  emoji:'🍎', audio:'tapuach.mp3', init:'ט', parts:['תַּ','פּוּחַ'] },
  { word:'קֶשֶׁת',    emoji:'🌈', audio:'', init:'ק', parts:['קֶ','שֶׁת'] },
  { word:'גָּמָל',    emoji:'🐪', audio:'gamal.mp3', init:'ג', parts:['גָּ','מָל'] },
  { word:'גְּלִידָה', emoji:'🍦', audio:'', init:'ג', parts:['גְּלִי','דָה'] },
  { word:'זֶבְּרָה',  emoji:'🦓', audio:'zebra.mp3', init:'ז', parts:['זֶבְּ','רָה'] },
  { word:'נָמֵר',     emoji:'🐆', audio:'', init:'נ', parts:['נָ','מֵר'] },
];
// כל חלקי המילה הייחודיים (לאולפן ההקלטות)
function phonoBlendParts() {
  const seen = {}, out = [];
  PHONO_BLEND.forEach(w => w.parts.forEach(p => { if (!seen[p]) { seen[p] = 1; out.push(p); } }));
  return out;
}

// חשיפה גלובלית
window.PHONO_SOUNDS = PHONO_SOUNDS;
window.PHONO_WORDS = PHONO_WORDS;
window.PHONO_GROUPS = PHONO_GROUPS;
window.PHONO_TYPE_META = PHONO_TYPE_META;
window.PHONO_STATIONS = PHONO_STATIONS;
window.PHONO_BLEND = PHONO_BLEND;
window.phonoBlendParts = phonoBlendParts;
window.getPhonoStationById = getPhonoStationById;
window.phonoStripNikud = phonoStripNikud;
window.phonoShuffle = phonoShuffle;
window.phonoPick = phonoPick;
window.phonoOne = phonoOne;
window.phonoWordsBySound = phonoWordsBySound;
window.phonoWordsBySyl = phonoWordsBySyl;
window.phonoWordsByRime = phonoWordsByRime;
window.phonoRimeGroups = phonoRimeGroups;
window.phonoSoundLabel = phonoSoundLabel;
window.phonoSoundSay = phonoSoundSay;
