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
  let currentAudio = null;               // ההקלטה שמתנגנת כרגע (כדי לעצור לפני מעבר)
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
    .rg-topbar .rg-title{font-weight:800;color:#5a3d1e;font-size:1.1em;display:flex;align-items:center;gap:6px;}
    .rg-topbar .rg-logo{display:inline-flex;}
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

    /* רקע משחקי מונפש (שכבה מאחורי הכל) */
    .rg-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;}
    .rg-bg .blob{position:absolute;border-radius:50%;filter:blur(2px);opacity:.5;
      animation:rg-float linear infinite;}
    @keyframes rg-float{0%{transform:translateY(0) translateX(0)}
      50%{transform:translateY(-24px) translateX(14px)}100%{transform:translateY(0) translateX(0)}}
    .rg-bg .floaty{position:absolute;font-size:2rem;opacity:.65;animation:rg-drift linear infinite;}
    @keyframes rg-drift{0%{transform:translateY(0) rotate(0)}
      50%{transform:translateY(-18px) rotate(12deg)}100%{transform:translateY(0) rotate(0)}}

    /* דמות מעודדת במסך הסיום */
    .rg-mascot{font-size:3.4rem;animation:rg-cheer .8s ease-in-out infinite;display:inline-block;}
    @keyframes rg-cheer{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-10px) rotate(6deg)}}
    `;
    const st = document.createElement('style');
    st.id = 'rg-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // --- אודיו: השמעת מקור (src מלא — קובץ או dataURL) ---
  function playSrc(src) {
    return new Promise(resolve => {
      if (!soundOn || !src) return resolve(false);
      try {
        let a = audioCache[src];
        if (!a) { a = new Audio(src); audioCache[src] = a; }
        stopAudio();               // עוצרים כל אודיו קודם — לא ייגרר לשאלה הבאה
        currentAudio = a;
        a.currentTime = 0;
        a.onended = () => resolve(true);
        a.onerror = () => resolve(false);
        const p = a.play();
        if (p && p.catch) p.catch(() => resolve(false));
      } catch (e) { resolve(false); }
    });
  }
  function playFile(file) { return playSrc(file ? encodeURI(audioBase + file) : null); }

  // הקלטת קול של ההורה/הילדה (מ-reading-voices.js), אם קיימת
  function voiceSrc(key) {
    const v = window.READING_VOICES;
    return (v && v[key]) || null;
  }

  // עצירת כל אודיו שמתנגן (הקלטה + קול סינתטי)
  function stopAudio() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    try { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; } } catch (e) {}
    currentAudio = null;
  }

  function letterData(char) { return (window.READING_LETTERS || {})[char] || null; }

  // השמעת שם/צליל האות.  סדר עדיפות: הקלטת המשפחה → הקלטה קיימת → קול סינתטי
  async function playLetter(char) {
    const d = letterData(char);
    if (!d) return;
    const vs = voiceSrc('letter:' + char);
    const ok = vs ? await playSrc(vs) : await playFile(d.letterAudio);
    if (!ok && soundOn) speak(d.name || char);
  }

  // השמעת מילת דוגמה.  אפשר להעביר אובייקט מילה ({word,emoji,audio});
  // אם לא — נבחרת המילה הראשונה של האות.  סדר עדיפות כמו באות.
  async function playWord(char, wordObj) {
    const w = wordObj || (window.primaryWord ? window.primaryWord(char) : null);
    if (!w) return;
    const vs = voiceSrc('word:' + w.word);
    const ok = vs ? await playSrc(vs) : await playFile(w.audio);
    if (!ok && soundOn) speak((w.word || '').replace(/[֑-ׇ]/g, '') || char);
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

  // משפט עידוד: מגריל אחת מהקלטות המשפחה שקיימות; אחרת קול סינתטי של הטקסט
  function praise(fallbackText) {
    if (!soundOn) return;
    const V = window.READING_VOICES || {};
    const keys = (window.READING_PHRASES || []).map(p => 'phrase:' + p.key).filter(k => V[k]);
    if (keys.length) { playSrc(V[keys[Math.floor(Math.random() * keys.length)]]); return; }
    if (fallbackText) speak(fallbackText);
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

  // --- דמות המסע: חד-קרן (SVG חמוד, נשאר חד בכל גודל) ---
  function unicorn(size) {
    size = size || 64;
    const id = 'u' + Math.random().toString(36).slice(2, 7);
    return `
    <svg viewBox="0 0 128 124" width="${size}" height="${size}" style="display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff9f45"/>
        </linearGradient>
      </defs>
      <g stroke="#4a2c5a" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <!-- זנב -->
        <path d="M40,74 C14,66 10,94 22,106 C29,113 38,108 42,98 Z" fill="#6fe0d0"/>
        <path d="M44,80 C24,74 22,98 32,108 C38,113 45,108 48,99 Z" fill="#ffd35c"/>
        <path d="M48,85 C32,81 32,100 40,108 C44,112 51,108 53,100 Z" fill="#ff8fb1"/>
        <!-- רגליים -->
        <g fill="#fff">
          <path d="M46,84 h11 v22 h-11 Z"/><path d="M62,90 h11 v18 h-11 Z"/>
          <path d="M80,90 h11 v18 h-11 Z"/><path d="M94,84 h11 v22 h-11 Z"/>
        </g>
        <g fill="#ff8fb1" stroke="none">
          <rect x="47" y="99" width="9" height="6" rx="2"/><rect x="63" y="101" width="9" height="6" rx="2"/>
          <rect x="81" y="101" width="9" height="6" rx="2"/><rect x="95" y="99" width="9" height="6" rx="2"/>
        </g>
        <!-- גוף -->
        <path d="M40,74 C40,52 60,44 76,46 C98,48 106,66 101,84 C96,100 74,104 58,99 C46,95 40,88 40,74 Z" fill="#fff"/>
        <!-- אוזניים -->
        <path d="M72,28 l4,-14 10,10 Z" fill="#fff"/>
        <path d="M104,22 l3,-14 8,12 Z" fill="#fff"/>
        <!-- ראש -->
        <circle cx="92" cy="46" r="27" fill="#fff"/>
        <!-- רעמה -->
        <path d="M70,26 C56,32 55,50 63,64 C66,52 71,45 76,41 Z" fill="#6fe0d0"/>
        <path d="M78,20 C66,26 64,44 72,58 C76,46 80,38 85,34 Z" fill="#ffd35c"/>
        <path d="M86,16 C77,20 75,36 82,50 C86,40 90,32 95,30 Z" fill="#ff8fb1"/>
        <!-- קרן -->
        <path d="M98,2 l9,24 -18,0 Z" fill="url(#${id}h)"/>
        <!-- עיניים עצומות שמחות -->
        <path d="M80,48 q4.5,-7 9,0" fill="none"/>
        <path d="M97,48 q4.5,-7 9,0" fill="none"/>
        <!-- לחיים -->
        <circle cx="80" cy="57" r="3.6" fill="#ff9ecb" stroke="none"/>
        <circle cx="107" cy="57" r="3.6" fill="#ff9ecb" stroke="none"/>
        <!-- חיוך -->
        <path d="M89,56 q5,8 11,2" fill="none"/>
      </g>
    </svg>`;
  }

  // --- רקע משחקי מונפש ---
  function mountBackground(theme) {
    injectStyle();
    if (document.querySelector('.rg-bg')) return;
    const bg = document.createElement('div');
    bg.className = 'rg-bg';
    const blobColors = ['#ffd59e', '#b9f0c0', '#d8c9ff', '#ffe082', '#a8e6ff', '#ffc1e3'];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('div');
      b.className = 'blob';
      const s = 90 + Math.random() * 140;
      b.style.width = b.style.height = s + 'px';
      b.style.background = blobColors[i % blobColors.length];
      b.style.top = Math.random() * 90 + 'vh';
      b.style.left = Math.random() * 90 + 'vw';
      b.style.animationDuration = (6 + Math.random() * 6) + 's';
      b.style.animationDelay = (-Math.random() * 6) + 's';
      bg.appendChild(b);
    }
    const emojis = theme || ['⭐', '☁️', '🎈', '🌈', '🦋', '🌸', '✨'];
    for (let i = 0; i < 7; i++) {
      const f = document.createElement('div');
      f.className = 'floaty';
      f.textContent = emojis[i % emojis.length];
      f.style.top = Math.random() * 88 + 'vh';
      f.style.left = Math.random() * 90 + 'vw';
      f.style.fontSize = (1.4 + Math.random() * 1.8) + 'rem';
      f.style.animationDuration = (5 + Math.random() * 5) + 's';
      f.style.animationDelay = (-Math.random() * 5) + 's';
      bg.appendChild(f);
    }
    document.body.appendChild(bg);
  }

  // --- סרגל עליון ---
  // opts.bg === false ← בלי הרקע הכללי (למשחק שיש לו רקע משלו)
  function mountTopBar(title, opts) {
    injectStyle();
    if (!opts || opts.bg !== false) mountBackground();
    document.body.classList.add('rg-has-topbar');
    const bar = document.createElement('div');
    bar.className = 'rg-topbar';
    bar.innerHTML =
      `<a class="rg-home" href="../journey.html" title="חזרה למפה">🏠</a>` +
      `<span class="rg-title"><span class="rg-logo">${unicorn(30)}</span>${title || ''}</span>` +
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
         <div class="rg-mascot" style="display:flex;justify-content:center">${unicorn(90)}</div>
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
    praise(msg);
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
    injectStyle, playLetter, playWord, speak, praise, stopAudio,
    ding, buzz, fanfare, confetti, unicorn,
    mountTopBar, mountBackground, starsForAccuracy, finish,
    currentStation, shuffle, pickDistractors,
  };
})();

window.RG = RG;
