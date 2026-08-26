// ============================================================
// reading-profile.js  ·  מי משחק/ת
// ------------------------------------------------------------
// שומר את שם הילד/ה ואת המגדר (נשמר במכשיר), כדי להתאים את
// העידוד וההנחיות (זכר/נקבה) ולהוסיף ברכה אישית.
// ברירת מחדל: ענת, נקבה (האתר לכבודה).
// ============================================================
const ReadingProfile = (function () {
  const KEY = 'reader_profile_v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  return {
    get: () => load(),
    name: () => { const n = load().name; return (n && n.trim()) || 'ענת'; },
    gender: () => (load().gender === 'm' ? 'm' : 'f'),   // 'f' ברירת מחדל
    isSet: () => { const d = load(); return !!(d.name || d.gender); },
    set: (name, gender) => {
      const d = load();
      if (name != null) d.name = name;
      if (gender != null) d.gender = gender;
      save(d);
    },
  };
})();
window.ReadingProfile = ReadingProfile;
