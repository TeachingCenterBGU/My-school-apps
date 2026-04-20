// ==============================================
// firebase-homework.js
// שמירת שיעורי בית ב-Firebase
// אימות משתמש באמצעות Google/Gmail
// מחיקה רכה: משימות נמחקות אחרי שבוע
// ==============================================

const firebaseConfig = {
    apiKey: "AIzaSyAi0YrEfLEr7GK2VRjJ9FOuhz4066_7T5M",
    authDomain: "homework-barad.firebaseapp.com",
    databaseURL: "https://homework-barad-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "homework-barad",
    storageBucket: "homework-barad.firebasestorage.app",
    messagingSenderId: "324035760311",
    appId: "1:324035760311:web:2b9793e3924cc2840a3d32"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

if (firebase.appCheck) {
    const appCheck = firebase.appCheck();
    appCheck.activate('6Lc3ybEsAAAAAJpdWESSOGNXCqW764S9qIpsbc0k', true);
}

// --- הגדרות ---
const SOFT_DELETE_DAYS = 7; // מספר ימים עד למחיקה מוחלטת

// --- זיהוי משתמש ---
let currentUser = null;       // Firebase UID
let currentDisplayName = null;
let currentEmail = null;
let isGuest = false;

// --- מצב אורח ---

window.continueAsGuest = function() {
    isGuest = true;
    currentUser = null;
    currentDisplayName = "אורח/ת";
    currentEmail = null;

    const overlay = document.getElementById("user-select-overlay");
    if (overlay) overlay.remove();

    // הסתרת כל קוביות שיעורי הבית
    document.querySelectorAll('.homework-box').forEach(box => {
        box.style.display = 'none';
    });

    // הצגת badge אורח
    showGuestBadge();

    // טעינת כוכבים לא רלוונטית לאורח, אבל אפשר להציג את הכרטיסיות
};

function showGuestBadge() {
    const existing = document.getElementById("user-badge");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "user-badge";
    badge.style.cssText = `
        position: fixed; top: 10px; left: 10px; background: #9e9e9e; color: white;
        padding: 6px 14px; border-radius: 20px; font-size: 0.85em; z-index: 999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; direction: rtl;
        display: flex; align-items: center; gap: 6px;
    `;
    badge.title = "לחצי להתחברות";
    badge.innerHTML = `<span style="font-size: 0.9em;">👀</span> אורח/ת`;
    badge.addEventListener("click", () => {
        isGuest = false;
        // הצגת קוביות שיעורי בית מחדש
        document.querySelectorAll('.homework-box').forEach(box => {
            box.style.display = '';
        });
        badge.remove();
        showLoginScreen();
    });
    document.body.appendChild(badge);
}

// --- מסך כניסה עם Google ---

function showLoginScreen() {
    const overlay = document.createElement("div");
    overlay.id = "user-select-overlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
    `;

    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; max-width: 320px; width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2); direction: rtl;">
            <h2 style="margin: 0 0 8px 0; font-size: 1.4em;">👋 שלום!</h2>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 0.95em;">התחברי עם חשבון Google כדי להתחיל</p>
            <button id="google-login-btn" onclick="signInWithGoogle()" style="
                display: flex; align-items: center; justify-content: center; gap: 10px;
                width: 100%; padding: 12px; margin: 0 auto;
                font-size: 1.05em; border: 2px solid #ddd; border-radius: 10px;
                background: white; cursor: pointer; font-family: inherit;
                transition: all 0.2s;
            ">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width: 22px; height: 22px;">
                <span>התחברות עם Google</span>
            </button>
            <div style="display:flex; align-items:center; gap:10px; margin:16px 0 0 0;">
                <hr style="flex:1; border:0; border-top:1px solid #eee;">
                <span style="color:#aaa; font-size:0.85em;">או</span>
                <hr style="flex:1; border:0; border-top:1px solid #eee;">
            </div>
            <button onclick="continueAsGuest()" style="
                width: 100%; padding: 10px; margin-top: 12px;
                font-size: 0.95em; border: 1px solid #ddd; border-radius: 10px;
                background: #f5f5f5; color: #777; cursor: pointer; font-family: inherit;
                transition: all 0.2s;
            ">כניסה כאורח 👀</button>
            <p id="login-error" style="color: #e53935; font-size: 0.85em; margin-top: 12px; display: none;"></p>
        </div>
    `;

    document.body.appendChild(overlay);
}

window.signInWithGoogle = async function() {
    const btn = document.getElementById("google-login-btn");
    const errorEl = document.getElementById("login-error");
    
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.querySelector("span").textContent = "מתחבר...";
    }

    try {
        const result = await auth.signInWithPopup(googleProvider);
        // ההצלחה תטופל ב-onAuthStateChanged
    } catch (error) {
        console.error("Login error:", error);
        if (errorEl) {
            errorEl.style.display = "block";
            if (error.code === 'auth/popup-closed-by-user') {
                errorEl.textContent = "החלון נסגר. נסי שוב.";
            } else if (error.code === 'auth/popup-blocked') {
                errorEl.textContent = "הדפדפן חסם את חלון ההתחברות. אפשרי חלונות קופצים ונסי שוב.";
            } else {
                errorEl.textContent = "שגיאה בהתחברות. נסי שוב.";
            }
        }
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.querySelector("span").textContent = "התחברות עם Google";
        }
    }
};

function showUserBadge() {
    if (!currentDisplayName) return;

    // הסרת badge קודם אם קיים
    const existing = document.getElementById("user-badge");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "user-badge";
    badge.style.cssText = `
        position: fixed; top: 10px; left: 10px; background: #5c6bc0; color: white;
        padding: 6px 14px; border-radius: 20px; font-size: 0.85em; z-index: 999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; direction: rtl;
        display: flex; align-items: center; gap: 6px;
    `;
    badge.title = "לחצי להתנתקות";
    badge.innerHTML = `<span style="font-size: 0.9em;">👤</span> ${currentDisplayName}`;
    badge.addEventListener("click", async () => {
        if (confirm("להתנתק?")) {
            await auth.signOut();
            location.reload();
        }
    });
    document.body.appendChild(badge);
}

// --- פונקציות Firebase ---

function saveTaskDone(taskId, taskInfo) {
    if (!currentUser) return;

    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL') + ' ' + now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

    // שמירת הזמן שבו סומן כ"בוצע" (מחיקה רכה)
    db.ref('done/' + currentUser + '/' + taskId).set({
        completedAt: now.toISOString(),
        completedAtDisplay: displayDate
    });

    db.ref('log/' + currentUser + '/' + taskId).set({
        completedAt: now.toISOString(),
        completedAtDisplay: displayDate,
        subject: taskInfo.subject || '',
        task: taskInfo.task || '',
        grade: taskInfo.grade || '',
        userName: currentDisplayName,
        userEmail: currentEmail
    });
}

async function getDoneData() {
    if (!currentUser) return {};

    const snapshot = await db.ref('done/' + currentUser).once('value');
    return snapshot.val() || {};
}

function isExpired(completedAt) {
    if (!completedAt) return false;
    const completedDate = new Date(completedAt);
    const now = new Date();
    const diffDays = (now - completedDate) / (1000 * 60 * 60 * 24);
    return diffDays >= SOFT_DELETE_DAYS;
}

// --- ניקוי משימות ישנות מ-Firebase ---
async function cleanupExpiredTasks() {
    if (!currentUser) return;
    const doneData = await getDoneData();
    
    for (const [taskId, info] of Object.entries(doneData)) {
        const completedAt = typeof info === 'object' ? info.completedAt : null;
        // תאימות לאחור: אם הערך הוא true (פורמט ישן), לא מוחקים
        if (completedAt && isExpired(completedAt)) {
            db.ref('done/' + currentUser + '/' + taskId).remove();
        }
    }
}

// --- רינדור שיעורי בית ---

async function renderHomework(grade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#888;">⏳ טוען שיעורי בית...</p>';

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual);

    const doneData = await getDoneData();

    // הפרדה: משימות פתוחות + משימות שהושלמו (ולא עבר שבוע)
    const pendingTasks = [];
    const completedTasks = [];

    tasks.filter(t => t.grade === grade).forEach(task => {
        const doneInfo = doneData[task.id];
        if (!doneInfo) {
            pendingTasks.push(task);
        } else {
            // תאימות: אם הערך הוא true (פורמט ישן) — חשב כמושלם
            const completedAt = typeof doneInfo === 'object' ? doneInfo.completedAt : null;
            const completedDisplay = typeof doneInfo === 'object' ? doneInfo.completedAtDisplay : null;
            
            if (completedAt && !isExpired(completedAt)) {
                completedTasks.push({ ...task, completedAt, completedDisplay });
            }
            // אם עבר שבוע או פורמט ישן — לא מציגים כלל
        }
    });

    if (pendingTasks.length === 0 && completedTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; margin:0;">אין שיעורי בית 🎉</p>';
        return;
    }

    let html = '';

    // משימות פתוחות
    if (pendingTasks.length > 0) {
        html += '<h3 style="margin:0 0 10px 0; font-size:1.1em;">📝 שיעורי בית:</h3>';
        pendingTasks.forEach(task => {
            const dateHtml = task.date ? `<span class="hw-date">${task.date}</span>` : '';
            html += `
                <div class="homework-item" id="task-${task.id}">
                    <div class="homework-info" style="width: 100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span class="homework-subject">${task.subject}</span>
                            ${dateHtml}
                        </div>
                        <div style="color:#555; line-height:1.4;">${task.task}</div>
                    </div>
                    <button class="hw-done-btn"
                            onclick="markHomeworkDone('${task.id}')"
                            title="סיימתי!">✓</button>
                </div>
            `;
        });
    }

    // משימות שהושלמו (מחיקה רכה)
    if (completedTasks.length > 0) {
        html += '<div class="hw-completed-section">';
        html += '<h4 class="hw-completed-title">✅ הושלמו:</h4>';
        completedTasks.forEach(task => {
            const dateHtml = task.completedDisplay 
                ? `<span class="hw-date">הושלם ${task.completedDisplay}</span>` 
                : '';
            html += `
                <div class="homework-item hw-done" id="task-${task.id}">
                    <div class="homework-info" style="width: 100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span class="homework-subject">${task.subject}</span>
                            ${dateHtml}
                        </div>
                        <div class="hw-done-text">${task.task}</div>
                    </div>
                    <span class="hw-done-icon">✔️</span>
                </div>
            `;
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

// --- סימון משימה (מחיקה רכה) ---

window.markHomeworkDone = function(id) {
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual);
    const taskInfo = tasks.find(t => t.id === id) || {};

    saveTaskDone(id, taskInfo);

    // אנימציה: הפיכה לחצי שקוף עם קו חוצה (לא מחיקה!)
    const taskItem = document.getElementById("task-" + id);
    if (taskItem) {
        taskItem.style.transition = "all 0.5s ease";
        
        setTimeout(() => {
            taskItem.classList.add("hw-done");
            // החלפת כפתור ✓ באייקון ✔️
            const btn = taskItem.querySelector(".hw-done-btn");
            if (btn) {
                const icon = document.createElement("span");
                icon.className = "hw-done-icon";
                icon.textContent = "✔️";
                btn.replaceWith(icon);
            }
            // הוספת טקסט "הושלם עכשיו"
            const infoDiv = taskItem.querySelector(".homework-info div:last-child");
            if (infoDiv) {
                infoDiv.classList.add("hw-done-text");
            }
        }, 300);
    }
};

// --- הפעלה ---

function initHomework() {
    showUserBadge();
    renderHomework(3, 'hw-container-3');
    renderHomework(5, 'hw-container-5');
    // ניקוי משימות שעבר שבוע מאז שהושלמו
    cleanupExpiredTasks();
    // טעינת ציוני אפליקציות והצגת כוכבים
    if (typeof initAppTracker === 'function') {
        initAppTracker();
    }
}

// --- Firebase Auth listener ---

auth.onAuthStateChanged((user) => {
    if (user) {
        // משתמש מחובר
        currentUser = user.uid;
        currentDisplayName = user.displayName || user.email.split('@')[0];
        currentEmail = user.email;

        // הסרת מסך ההתחברות אם קיים
        const overlay = document.getElementById("user-select-overlay");
        if (overlay) overlay.remove();

        initHomework();
    } else {
        // לא מחובר — הצג מסך התחברות
        currentUser = null;
        currentDisplayName = null;
        currentEmail = null;
        showLoginScreen();
    }
});
