// ============================================================
// reading-engine.js  ·  כלים משותפים לכל משחקי הקריאה
// ------------------------------------------------------------
// מספק:
//   RG.playLetter(char)  – השמעת שם האות (הקלטה אמיתית + גיבוי קולי)
//   RG.playWord(char)    – השמעת מילת הדוגמה
//   RG.speak(text)       – הקראה חופשית (הוראות)
//   RG.ding/buzz/fanfare – אפקטים (WebAudio, בלי אינטרנט)
//   RG.confetti()        – חגיגה ויזואלית
//   RG.mountTopBar()     – סרגל עליון: בית + כותרת + כפתור סאונד
//   RG.finish(...)       – מסך סיום עם כוכבים + שמירת התקדמות
// ============================================================

const RG = (function () {
  let audioBase = '../../../letters/';   // מ-apps/reading/games/ אל letters/
  let soundOn = true;
  let audioCtx = null;
  const audioCache = {};

  // --- הזרקת סגנון משותף (מסך סיום, כוכבים, סרגל, קונפטי) ---
  function injectStyle() {
    if (document.getElementById('rg-style')) return;
    const css = `
    .rg-topbar{position:fixed;top:0;right:0;left:0;height:56px;display:flex;
      align-items:center;justify-content:space-between;padding:0 14px;
      background:rgba(255,255,255,.85);backdrop-filter:blur(6px);
      box-shadow:0 2px 10px rgba(0,0,0,.06);z-index:50;}
    .rg-topbar .rg-home,.rg-topbar .rg-sound{width:42px;height:42px;border-radius:50%;
      border:2px solid #ffb74d;background:#fff;font-size:1.3em;cursor:pointer;
      display:flex;align-items:center;justify-content:center;text-decoration:none;color:#e65100;}
    .rg-topbar .rg-title{font-weight:800;color:#5a3d1e;font-size:1.1em;}
    body.rg-has-topbar{padding-top:64px;}

    .rg-overlay{position:fixed;inset:0;background:rgba(30,20,10,.55);
      display:flex;align-items:center;justify-content:center;z-index:100;
      opacity:0;pointer-events:none;transition:opacity .3s;}
    .rg-overlay.show{opacity:1;pointer-events:auto;}
    .rg-card{background:#fff;border-radius:28px;padding:32px 28px;max-width:340px;width:88%;
      text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3);
      animation:rg-pop .45s cubic-bezier(.175,.885,.32,1.275);}
    @keyframes rg-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
    .rg-card h2{margin:.2em 0;color:#e65100;font-size:1.6em;}
    .rg-card .rg-sub{color:#777;margin-bottom:10px;}
    .rg-stars{font-size:3.2em;line-height:1;margin:12px 0 4px;}
    .rg-stars .s{display:inline-block;filter:grayscale(1) opacity(.35);}
    .rg-stars .s.on{filter:none;animation:rg-star .5s backwards;}
    .rg-stars .s.on:nth-child(2){animation-delay:.18s}
    .rg-stars .s.on:nth-child(3){animation-delay:.36s}
    @keyframes rg-star{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.35)}100%{transform:scale(1)}}
    .rg-btns{display:flex;flex-direction:column;gap:10px;margin-top:18px;}
    .rg-btn{border:none;border-radius:50px;padding:13px 20px;font-size:1.15em;font-weight:700;
      cursor:pointer;font-family:inherit;}
    .rg-btn.primary{background:#ff9800;color:#fff;box-shadow:0 4px 0 #e67e00;}
    .rg-btn.ghost{background:#eef;color:#3949ab;}
    .rg-btn:active{transform:translateY(3px);box-shadow:none;}

    .rg-confetti{position:fixed;top:-20px;width:12px;height:12px;z-index:120;
      pointer-events:none;border-radius:2px;animation:rg-fall linear forwards;}
    @keyframes rg-fall{to{transform:translateY(105vh) rotate(720deg);opacity:.9}}
    `;
    const st = document.createElement('style');
    st.id = 'rg-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // --- אודיו: השמעת קובץ הקלטה ---
  function playFile(file) {
    return new Promise(resolve => {
      if (!soundOn || !file) return resolve(false);
      try {
        let a = audioCache[file];
        if (!a) { a = new Audio(encodeURI(audioBase + file)); audioCache[file] = a; }
        a.currentTime = 0;
        a.onended = () => resolve(true);
        a.onerror = () => resolve(false);
        const p = a.play();
        if (p && p.catch) p.catch(() => resolve(false));
      } catch (e) { resolve(false); }
    });
  }

  function letterData(char) { return (window.READING_LETTERS || {})[char] || null; }

  // השמעת שם האות (הקלטה; אם נכשל — קול סינתטי עם שם האות)
  async function playLetter(char) {
    const d = letterData(char);
    if (!d) return;
    const ok = await playFile(d.letterAudio);
    if (!ok && soundOn) speak(d.name || char);
  }

  // השמעת מילת הדוגמה
  async function playWord(char) {
    const d = letterData(char);
    if (!d) return;
    const ok = await playFile(d.wordAudio);
    if (!ok && soundOn) speak((d.word || '').replace(/[֑-ׇ]/g, '') || char);
  }

  function speak(text) {
    if (!soundOn || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'he-IL';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* לא נורא */ }
  }

  // --- אפקטים קוליים ב-WebAudio (בלי תלות באינטרנט) ---
  function ctx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }
  function tone(freq, start, dur, type, gain) {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function ding() { if (!soundOn) return; tone(880, 0, 0.15, 'sine', 0.18); tone(1320, 0.08, 0.18, 'sine', 0.15); }
  function buzz() { if (!soundOn) return; tone(180, 0, 0.22, 'square', 0.08); }
  function fanfare() {
    if (!soundOn) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, 'triangle', 0.16));
  }

  // --- קונפטי ---
  function confetti(n) {
    n = n || 60;
    const colors = ['#ff9800', '#4dd0e1', '#ffd964', '#ff8a80', '#a8e6a3', '#b39ddb'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'rg-confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // --- סרגל עליון ---
  function mountTopBar(title) {
    injectStyle();
    document.body.classList.add('rg-has-topbar');
    const bar = document.createElement('div');
    bar.className = 'rg-topbar';
    bar.innerHTML =
      `<a class="rg-home" href="../journey.html" title="חזרה למפה">🏠</a>` +
      `<span class="rg-title">${title || ''}</span>` +
      `<button class="rg-sound" title="סאונד">🔊</button>`;
    document.body.appendChild(bar);
    bar.querySelector('.rg-sound').addEventListener('click', function () {
      soundOn = !soundOn;
      this.textContent = soundOn ? '🔊' : '🔇';
      if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
    });
  }

  // --- חישוב כוכבים לפי דיוק (תמיד לפחות 1 על סיום) ---
  function starsForAccuracy(correct, total) {
    if (!total) return 1;
    const acc = correct / total;
    if (acc >= 0.85) return 3;
    if (acc >= 0.6) return 2;
    return 1;
  }

  // --- דיווח התקדמות כוללת של המסע למערכת הכוכבים של האתר ---
  // מדווח כאפליקציה אחת ('reading-journey') לפי סך הכוכבים שנאספו.
  function reportJourney() {
    try {
      const stations = window.READING_STATIONS || [];
      const maxStars = stations.length * 3;
      const got = window.ReadingProgress ? ReadingProgress.totalStars() : 0;
      if (!maxStars) return;
      if (typeof window.saveAppScore === 'function') {
        window.saveAppScore('reading-journey', got, maxStars);
      } else {
        // שמירה ל-pending בפורמט של app-tracker — יסונכרן בכניסה הבאה לעמוד הכיתה
        const pending = JSON.parse(localStorage.getItem('pending_scores') || '[]');
        pending.push({ appId: 'reading-journey', score: got, total: maxStars, timestamp: new Date().toISOString() });
        localStorage.setItem('pending_scores', JSON.stringify(pending));
      }
    } catch (e) { /* לא חוסם */ }
  }

  // --- מסך סיום ---
  // opts: { stationId, correct, total, replay(fn) }
  function finish(opts) {
    injectStyle();
    const stars = starsForAccuracy(opts.correct, opts.total);
    if (window.ReadingProgress) ReadingProgress.record(opts.stationId, stars);
    reportJourney();

    if (stars >= 2) { confetti(); fanfare(); } else { ding(); }

    const msg = stars === 3 ? 'מושלם! 🌟' : stars === 2 ? 'כל הכבוד!' : 'יופי, סיימת!';
    const overlay = document.createElement('div');
    overlay.className = 'rg-overlay';
    overlay.innerHTML =
      `<div class="rg-card">
         <div class="rg-stars">
           <span class="s ${stars >= 1 ? 'on' : ''}">⭐</span>
           <span class="s ${stars >= 2 ? 'on' : ''}">⭐</span>
           <span class="s ${stars >= 3 ? 'on' : ''}">⭐</span>
         </div>
         <h2>${msg}</h2>
         <div class="rg-sub">ענית נכון על ${opts.correct} מתוך ${opts.total}</div>
         <div class="rg-btns">
           <button class="rg-btn primary" id="rg-again">🔁 עוד פעם</button>
           <a class="rg-btn ghost" href="../journey.html">🗺️ חזרה למפה</a>
         </div>
       </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('#rg-again').addEventListener('click', () => {
      overlay.remove();
      if (typeof opts.replay === 'function') opts.replay();
      else location.reload();
    });
    speak(msg);
    return stars;
  }

  // עזר: פרמטר station מה-URL + התחנה עצמה
  function currentStation() {
    const id = new URLSearchParams(location.search).get('station');
    const st = window.getStationById ? window.getStationById(id) : null;
    return st;
  }

  // ערבוב מערך
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

  // בחירת N מסיחים (אותיות) שאינם ב-exclude
  function pickDistractors(n, exclude, pool) {
    pool = (pool || Object.keys(window.READING_LETTERS || {})).filter(l => !exclude.includes(l));
    return shuffle(pool).slice(0, n);
  }

  return {
    get soundOn() { return soundOn; },
    set audioBase(v) { audioBase = v; },
    injectStyle, playLetter, playWord, speak,
    ding, buzz, fanfare, confetti,
    mountTopBar, starsForAccuracy, finish,
    currentStation, shuffle, pickDistractors,
  };
})();

window.RG = RG;
