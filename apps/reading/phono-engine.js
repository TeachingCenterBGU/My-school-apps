// ============================================================
// phono-engine.js  ·  שכבת עזר למשחקי המודעות הפונולוגית
// ------------------------------------------------------------
// עוטף את RG (reading-engine.js) — משתמש בכל הכלים הקיימים
// (אודיו, חד-קרן, אפקטים, קונפטי) אבל עם:
//   • השמעת "צליל" (פונמה) — PG.playSound
//   • השמעת מילה לפי אובייקט — PG.playWord
//   • סרגל עליון שחוזר למפת המודעות הפונולוגית (phono.html)
//   • מסך סיום שמדווח להתקדמות של המסלול הפונולוגי
// כך שאין צורך לגעת במנוע האותיות הקיים.
// ============================================================
const PG = (function () {

  function currentStation() {
    const id = new URLSearchParams(location.search).get('station');
    return window.getPhonoStationById ? window.getPhonoStationById(id) : null;
  }

  // השמעת מילה (אובייקט מהבנק: {word, emoji, audio}) — הקלטה→TTS דרך RG
  function playWord(w) { if (w) RG.playWord(null, w); }

  // השמעת "צליל" פותח (פונמה). כרגע קול סינתטי לפי PHONO_SOUNDS[..].say;
  // בהמשך אפשר להוסיף הקלטה אמיתית (אולפן) ולהשמיע אותה כאן במקום.
  function playSound(sound) {
    RG.speak(window.phonoSoundSay ? phonoSoundSay(sound) : sound);
  }

  function speak(t) { RG.speak(t); }

  // סרגל עליון — כמו במשחקי האותיות, אבל הבית חוזר למפה הפונולוגית
  function mountTopBar(title) {
    RG.mountTopBar(title || '');
    const home = document.querySelector('.rg-topbar .rg-home');
    if (home) { home.setAttribute('href', '../phono.html'); home.setAttribute('title', 'חזרה למפה'); }
  }

  function mountBackground(theme) { RG.mountBackground(theme); }

  // דיווח התקדמות המסלול הפונולוגי למערכת הכוכבים של האתר (אפליקציה נפרדת)
  function reportProgress() {
    try {
      const stations = window.PHONO_STATIONS || [];
      const max = stations.length * 3;
      if (!max || !window.ReadingProgress) return;
      let got = 0;
      stations.forEach(s => { got += ReadingProgress.starsOf(s.id); });
      if (typeof window.saveAppScore === 'function') {
        window.saveAppScore('reading-phono', got, max);
      } else {
        const pending = JSON.parse(localStorage.getItem('pending_scores') || '[]');
        pending.push({ appId: 'reading-phono', score: got, total: max, timestamp: new Date().toISOString() });
        localStorage.setItem('pending_scores', JSON.stringify(pending));
      }
    } catch (e) { /* לא חוסם */ }
  }

  // מסך סיום — מבנה זהה למשחקי האותיות, אך חוזר ל-phono.html ומדווח לפונולוגי
  // opts: { stationId, correct, total, replay(fn) }
  function finish(opts) {
    RG.injectStyle();
    const stars = RG.starsForAccuracy(opts.correct, opts.total);
    if (window.ReadingProgress) ReadingProgress.record(opts.stationId, stars);
    reportProgress();

    if (stars >= 2) { RG.confetti(); RG.fanfare(); } else { RG.ding(); }

    const msg = stars === 3 ? 'מושלם! 🌟' : stars === 2 ? 'כל הכבוד!' : 'יופי, סיימת!';
    const overlay = document.createElement('div');
    overlay.className = 'rg-overlay';
    overlay.innerHTML =
      `<div class="rg-card">
         <div class="rg-mascot" style="display:flex;justify-content:center">${RG.unicorn(90)}</div>
         <div class="rg-stars">
           <span class="s ${stars >= 1 ? 'on' : ''}">⭐</span>
           <span class="s ${stars >= 2 ? 'on' : ''}">⭐</span>
           <span class="s ${stars >= 3 ? 'on' : ''}">⭐</span>
         </div>
         <h2>${msg}</h2>
         <div class="rg-sub">${opts.correct} מתוך ${opts.total} 🎉</div>
         <div class="rg-btns">
           <button class="rg-btn primary" id="pg-again">🔁 עוד פעם</button>
           <a class="rg-btn ghost" href="../phono.html">🗺️ חזרה למפה</a>
         </div>
       </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('#pg-again').addEventListener('click', () => {
      overlay.remove();
      if (typeof opts.replay === 'function') opts.replay();
      else location.reload();
    });
    RG.praise(msg);
    return stars;
  }

  return {
    currentStation, playWord, playSound, speak,
    mountTopBar, mountBackground, finish, reportProgress,
    // מעבירים הלאה כלים שימושיים של RG
    unicorn: RG.unicorn, confetti: RG.confetti, ding: RG.ding, buzz: RG.buzz,
    fanfare: RG.fanfare, shuffle: RG.shuffle, stopAudio: RG.stopAudio,
  };
})();
window.PG = PG;
