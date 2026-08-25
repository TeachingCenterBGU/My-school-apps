// ============================================================
// reading-progress.js  ·  התקדמות במסע הקריאה
// ------------------------------------------------------------
// שומר כמה כוכבים הילדה קיבלה בכל תחנה, ואיזו תחנה פתוחה.
// נשמר בדפדפן (localStorage) — עובד מיד, בלי צורך להתחבר.
// אם יש חיבור ל-Firebase (מהאתר) — מדווח גם לשם דרך saveAppScore,
// כדי שהכוכבים יופיעו גם בכרטיסייה בעמוד הכיתה.
// ============================================================

const ReadingProgress = (function () {
  const KEY = 'reading_progress_v1';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* מצב פרטי / אחסון חסום — ממשיכים בלי לשמור */ }
  }

  // מספר הכוכבים בתחנה (0 אם לא שוחקה)
  function starsOf(stationId) {
    const data = load();
    return (data[stationId] && data[stationId].stars) || 0;
  }

  // האם התחנה כבר הושלמה (כוכב אחד לפחות)
  function isDone(stationId) {
    return starsOf(stationId) > 0;
  }

  // שמירת תוצאה — שומר את המספר הגבוה של כוכבים שהושג
  function record(stationId, stars) {
    const data = load();
    const prev = (data[stationId] && data[stationId].stars) || 0;
    data[stationId] = {
      stars: Math.max(prev, stars),
      lastStars: stars,
      playedAt: new Date().toISOString(),
    };
    save(data);
    return data[stationId].stars;
  }

  // תחנה פת וחה אם היא הראשונה, או שהתחנה שלפניה הושלמה
  function isUnlocked(stationId, stations) {
    stations = stations || window.READING_STATIONS || [];
    const idx = stations.findIndex(s => s.id === stationId);
    if (idx <= 0) return true;
    return isDone(stations[idx - 1].id);
  }

  // סך כל הכוכבים שנאספו במסע
  function totalStars() {
    const data = load();
    return Object.values(data).reduce((sum, s) => sum + (s.stars || 0), 0);
  }

  // מחיקת כל ההתקדמות (לכפתור "התחלה מחדש")
  function reset() {
    save({});
  }

  return { starsOf, isDone, record, isUnlocked, totalStars, reset, _load: load };
})();

window.ReadingProgress = ReadingProgress;
