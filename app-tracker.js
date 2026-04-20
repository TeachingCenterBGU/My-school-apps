// ==============================================
// app-tracker.js
// מעקב אחרי ביצוע אפליקציות + כוכבים לפי הצלחה
// נטען בעמודי הכיתות ובתוך המשחקים עצמם
// ==============================================

// --- שמירת תוצאה של אפליקציה ---
// נקרא מתוך המשחקים/תרגולים כשהילד מסיים
// appId: מזהה האפליקציה (data-app-id מהכרטיסייה)
// score: הציון שקיבל
// total: הציון המקסימלי
// דוגמה: saveAppScore('fractions-kingdom', 80, 100)

window.saveAppScore = function(appId, score, total) {
    // בדיקה שיש Firebase ומשתמש מחובר
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
        // שמירה זמנית ב-localStorage עד שיתחבר
        const pending = JSON.parse(localStorage.getItem('pending_scores') || '[]');
        pending.push({ appId, score, total, timestamp: new Date().toISOString() });
        localStorage.setItem('pending_scores', JSON.stringify(pending));
        return;
    }

    const user = firebase.auth().currentUser;
    const uid = user.uid;
    const percent = Math.round((score / total) * 100);
    const stars = percentToStars(percent);

    const db = firebase.database();
    const now = new Date();

    // שמירת התוצאה האחרונה (ועדכון הטובה ביותר)
    const scoreRef = db.ref('app_scores/' + uid + '/' + appId);
    
    scoreRef.once('value').then(snapshot => {
        const existing = snapshot.val();
        const bestPercent = existing ? Math.max(existing.bestPercent || 0, percent) : percent;
        const bestStars = percentToStars(bestPercent);
        const attempts = existing ? (existing.attempts || 0) + 1 : 1;

        scoreRef.set({
            lastScore: score,
            lastTotal: total,
            lastPercent: percent,
            lastStars: stars,
            bestPercent: bestPercent,
            bestStars: bestStars,
            attempts: attempts,
            lastPlayedAt: now.toISOString(),
            lastPlayedDisplay: now.toLocaleDateString('he-IL'),
            userName: user.displayName || user.email
        });
    });
};

// --- המרת אחוז לכוכבים (1-5) ---
function percentToStars(percent) {
    if (percent >= 90) return 5;
    if (percent >= 75) return 4;
    if (percent >= 60) return 3;
    if (percent >= 40) return 2;
    return 1;
}

// --- יצירת HTML של כוכבים ---
function starsHTML(starCount, size) {
    size = size || '0.9em';
    let html = '<span class="star-rating" style="font-size:' + size + ';">';
    for (let i = 1; i <= 5; i++) {
        if (i <= starCount) {
            html += '<span class="star filled">⭐</span>';
        } else {
            html += '<span class="star empty">☆</span>';
        }
    }
    html += '</span>';
    return html;
}

// --- טעינת ציוני אפליקציות והצגת כוכבים על כרטיסיות ---

async function loadAndDisplayAppScores() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) return;

    const uid = firebase.auth().currentUser.uid;
    const db = firebase.database();

    try {
        const snapshot = await db.ref('app_scores/' + uid).once('value');
        const scores = snapshot.val();
        if (!scores) return;

        // עבור כל כרטיסייה עם data-app-id, הצג סטטוס
        document.querySelectorAll('.card[data-app-id]').forEach(card => {
            const appId = card.getAttribute('data-app-id');
            const scoreData = scores[appId];
            
            if (scoreData) {
                // הוספת badge כוכבים
                const existingBadge = card.querySelector('.app-score-badge');
                if (existingBadge) existingBadge.remove();

                const badge = document.createElement('div');
                badge.className = 'app-score-badge';
                badge.innerHTML = starsHTML(scoreData.bestStars);
                
                // הוספת tooltip עם פרטים
                badge.title = `ציון אחרון: ${scoreData.lastPercent}% | שוחק ${scoreData.attempts} פעמים | ${scoreData.lastPlayedDisplay}`;
                
                card.appendChild(badge);

                // הוספת סגנון ירוק לכרטיסייה שבוצעה
                card.classList.add('app-completed');
            }
        });
    } catch (e) {
        console.error("Error loading app scores:", e);
    }
}

// --- שליחת ציונים תלויים (ששמרנו לפני ההתחברות) ---
function flushPendingScores() {
    const pending = JSON.parse(localStorage.getItem('pending_scores') || '[]');
    if (pending.length === 0) return;

    pending.forEach(item => {
        saveAppScore(item.appId, item.score, item.total);
    });

    localStorage.removeItem('pending_scores');
}

// --- הרצה אוטומטית כשהדף נטען (בעמודי כיתות) ---
// נקרא מתוך initHomework או בנפרד

window.initAppTracker = function() {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        flushPendingScores();
        loadAndDisplayAppScores();
    }
};
