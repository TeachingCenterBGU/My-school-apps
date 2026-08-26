// ==============================================
// firebase-homework.js
// שמירת שיעורי בית ב-Firebase
// אימות משתמש באמצעות Google/Gmail
// רישום כיתה אישי — כל ילדה רואה רק את המשימות שלה
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
const SOFT_DELETE_DAYS = 7;

// --- זיהוי משתמש ---
let currentUser = null;       // Firebase UID
let currentDisplayName = null;
let currentEmail = null;
let currentUserGrade = null;  // הכיתה הרשומה של המשתמש
let isGuest = false;

// --- זיהוי עמוד נוכחי ---
function detectPageGrade() {
    const path = window.location.pathname;
    if (path.includes('grade-1')) return 1;
    if (path.includes('grade-3')) return 3;
    if (path.includes('grade-4')) return 4;
    if (path.includes('grade-5')) return 5;
    if (path.includes('grade-6')) return 6;
    if (path.includes('kindergarten')) return 0;
    return null;
}

// --- מצב אורח ---

window.continueAsGuest = function() {
    isGuest = true;
    currentUser = null;
    currentDisplayName = "אורח/ת";
    currentEmail = null;
    currentUserGrade = null;

    const overlay = document.getElementById("user-select-overlay");
    if (overlay) overlay.remove();

    // הסתרת כל קוביות שיעורי הבית
    document.querySelectorAll('.homework-box').forEach(box => {
        box.style.display = 'none';
    });

    showGuestBadge();
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

// ==============================================
// בחירת כיתה — מוצג רק פעם אחת אחרי ההתחברות
// ==============================================

function showGradeSelection() {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.id = "grade-select-overlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 9998;
        `;

        overlay.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 30px 25px; text-align: center; max-width: 340px; width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2); direction: rtl;">
                <div style="font-size: 2.5em; margin-bottom: 8px;">🎒</div>
                <h2 style="margin: 0 0 6px 0; font-size: 1.3em; color: #333;">שלום ${currentDisplayName}!</h2>
                <p style="margin: 0 0 22px 0; color: #666; font-size: 0.95em;">באיזו כיתה את/ה?</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="selectGrade(1)" class="grade-select-btn" style="
                        padding: 14px; font-size: 1.15em; border: 2px solid #66bb6a;
                        border-radius: 14px; background: #e8f5e9; color: #2e7d32;
                        cursor: pointer; font-family: inherit; font-weight: bold;
                        transition: all 0.2s;
                    ">כיתה א' 🌱</button>
                    <button onclick="selectGrade(4)" class="grade-select-btn" style="
                        padding: 14px; font-size: 1.15em; border: 2px solid #29b6f6;
                        border-radius: 14px; background: #e1f5fe; color: #0277bd;
                        cursor: pointer; font-family: inherit; font-weight: bold;
                        transition: all 0.2s;
                    ">כיתה ד' 🐬</button>
                    <button onclick="selectGrade(6)" class="grade-select-btn" style="
                        padding: 14px; font-size: 1.15em; border: 2px solid #7e57c2;
                        border-radius: 14px; background: #ede7f6; color: #4527a0;
                        cursor: pointer; font-family: inherit; font-weight: bold;
                        transition: all 0.2s;
                    ">כיתה ו' 🚀</button>
                </div>
                <p style="margin: 18px 0 0 0; color: #aaa; font-size: 0.8em;">
                    אפשר לשנות אחר כך דרך הלחיצה על השם
                </p>
            </div>
        `;

        document.body.appendChild(overlay);

        // שמירת ה-resolve כדי לקרוא לו כשבוחרים כיתה
        window._gradeSelectResolve = resolve;
    });
}

window.selectGrade = async function(grade) {
    if (!currentUser) return;

    // שמירה ב-Firebase
    await db.ref('users/' + currentUser + '/grade').set(grade);
    currentUserGrade = grade;

    // שמירה גם ב-localStorage כגיבוי מהיר
    try { localStorage.setItem('userGrade_' + currentUser, grade); } catch(e) {}

    // הסרת המסך
    const overlay = document.getElementById("grade-select-overlay");
    if (overlay) overlay.remove();

    // המשך אתחול
    if (window._gradeSelectResolve) {
        window._gradeSelectResolve(grade);
        window._gradeSelectResolve = null;
    }
};

// --- קריאת כיתת המשתמש מ-Firebase ---
async function loadUserGrade() {
    if (!currentUser) return null;

    // ניסיון מהיר מ-localStorage
    try {
        const cached = localStorage.getItem('userGrade_' + currentUser);
        if (cached) {
            currentUserGrade = parseInt(cached);
        }
    } catch(e) {}

    // קריאה מ-Firebase (מקור אמת)
    try {
        const snapshot = await db.ref('users/' + currentUser + '/grade').once('value');
        const grade = snapshot.val();
        if (grade) {
            currentUserGrade = grade;
            try { localStorage.setItem('userGrade_' + currentUser, grade); } catch(e) {}
            return grade;
        }
    } catch(e) {
        console.error("Error loading user grade:", e);
    }

    return currentUserGrade; // יכול להיות null
}

// --- שינוי כיתה (מתוך badge המשתמש) ---
async function changeGrade() {
    const overlay = document.createElement("div");
    overlay.id = "grade-change-overlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9998;
    `;

    const gradeNames = { 1: "א'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'" };
    const currentGradeName = gradeNames[currentUserGrade] || "?";

    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 25px; text-align: center; max-width: 300px; width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2); direction: rtl;">
            <h3 style="margin: 0 0 6px 0;">🔄 שינוי כיתה</h3>
            <p style="color: #666; font-size: 0.9em; margin: 0 0 18px 0;">
                עכשיו רשומה לכיתה ${currentGradeName}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="doChangeGrade(1)" style="
                    padding: 10px 18px; border: 2px solid #66bb6a; border-radius: 12px;
                    background: ${currentUserGrade === 1 ? '#66bb6a' : '#e8f5e9'};
                    color: ${currentUserGrade === 1 ? 'white' : '#2e7d32'};
                    cursor: pointer; font-family: inherit; font-weight: bold; font-size: 1em;
                ">א' 🌱</button>
                <button onclick="doChangeGrade(4)" style="
                    padding: 10px 18px; border: 2px solid #29b6f6; border-radius: 12px;
                    background: ${currentUserGrade === 4 ? '#29b6f6' : '#e1f5fe'};
                    color: ${currentUserGrade === 4 ? 'white' : '#0277bd'};
                    cursor: pointer; font-family: inherit; font-weight: bold; font-size: 1em;
                ">ד' 🐬</button>
                <button onclick="doChangeGrade(6)" style="
                    padding: 10px 18px; border: 2px solid #7e57c2; border-radius: 12px;
                    background: ${currentUserGrade === 6 ? '#7e57c2' : '#ede7f6'};
                    color: ${currentUserGrade === 6 ? 'white' : '#4527a0'};
                    cursor: pointer; font-family: inherit; font-weight: bold; font-size: 1em;
                ">ו' 🚀</button>
            </div>
            <button onclick="document.getElementById('grade-change-overlay').remove()" style="
                margin-top: 14px; border: none; background: none; color: #999;
                cursor: pointer; font-size: 0.9em; font-family: inherit;
            ">ביטול</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

window.doChangeGrade = async function(grade) {
    if (!currentUser) return;

    await db.ref('users/' + currentUser + '/grade').set(grade);
    currentUserGrade = grade;
    try { localStorage.setItem('userGrade_' + currentUser, grade); } catch(e) {}

    const overlay = document.getElementById("grade-change-overlay");
    if (overlay) overlay.remove();

    // רענון הצגת שיעורי בית
    renderHomeworkForUser();
    // עדכון badge
    showUserBadge();
};

// --- Badge משתמש (עם כיתה + אפשרות שינוי) ---

function showUserBadge() {
    if (!currentDisplayName) return;

    const existing = document.getElementById("user-badge");
    if (existing) existing.remove();

    const gradeNames = { 1: "א'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'" };
    const gradeLabel = currentUserGrade ? ` · כיתה ${gradeNames[currentUserGrade] || currentUserGrade}` : '';

    const badge = document.createElement("div");
    badge.id = "user-badge";
    badge.style.cssText = `
        position: fixed; top: 10px; left: 10px; background: #5c6bc0; color: white;
        padding: 6px 14px; border-radius: 20px; font-size: 0.85em; z-index: 999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; direction: rtl;
        display: flex; align-items: center; gap: 6px;
    `;
    badge.title = "לחצי לאפשרויות";
    badge.innerHTML = `<span style="font-size: 0.9em;">👤</span> ${currentDisplayName}${gradeLabel}`;
    
    badge.addEventListener("click", () => {
        showUserMenu();
    });
    document.body.appendChild(badge);
}

function showUserMenu() {
    // תפריט קטן עם אפשרויות
    const existing = document.getElementById("user-menu-popup");
    if (existing) { existing.remove(); return; }

    const menu = document.createElement("div");
    menu.id = "user-menu-popup";
    menu.style.cssText = `
        position: fixed; top: 45px; left: 10px; background: white; color: #333;
        border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000; direction: rtl; overflow: hidden;
        border: 1px solid #eee; min-width: 160px;
    `;

    menu.innerHTML = `
        <button onclick="changeGrade(); document.getElementById('user-menu-popup').remove();" style="
            display: block; width: 100%; padding: 12px 16px; border: none;
            background: white; text-align: right; cursor: pointer; font-family: inherit;
            font-size: 0.95em; border-bottom: 1px solid #f0f0f0;
        ">🔄 שינוי כיתה</button>
        <button onclick="doLogout()" style="
            display: block; width: 100%; padding: 12px 16px; border: none;
            background: white; text-align: right; cursor: pointer; font-family: inherit;
            font-size: 0.95em; color: #e53935;
        ">🚪 התנתקות</button>
    `;

    document.body.appendChild(menu);

    // סגירה בלחיצה מחוץ לתפריט
    setTimeout(() => {
        document.addEventListener("click", function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        });
    }, 100);
}

window.doLogout = async function() {
    const menu = document.getElementById("user-menu-popup");
    if (menu) menu.remove();
    if (confirm("להתנתק?")) {
        await auth.signOut();
        location.reload();
    }
};

// --- פונקציות Firebase ---

function saveTaskDone(taskId, taskInfo) {
    if (!currentUser) return;

    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL') + ' ' + now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

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

async function cleanupExpiredTasks() {
    return;
}

// --- רינדור שיעורי בית ---

async function renderHomework(grade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // אם המשתמש רשום לכיתה אחרת — לא מציגים שיעורי בית כאן
    if (currentUserGrade && currentUserGrade !== grade) {
        const gradeNames = { 1: "א'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'" };
        const pageName = gradeNames[grade] || grade;
        const myGradeName = gradeNames[currentUserGrade] || currentUserGrade;
        const myGradeLink = 'grade-' + currentUserGrade + '.html';
        container.innerHTML = `
            <p style="text-align:center; color:#888; margin:0; font-size: 0.95em;">
                🔒 את/ה רשומה לכיתה ${myGradeName}
                <br>
                <a href="${myGradeLink}" style="color: #5c6bc0; font-weight: bold;">
                    לחצי כאן לעבור לכיתה שלך →
                </a>
            </p>
        `;
        return;
    }

    container.innerHTML = '<p style="text-align:center; color:#888;">⏳ טוען שיעורי בית...</p>';

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual);

    const doneData = await getDoneData();

    const pendingTasks = [];
    const completedTasks = [];

    tasks.filter(t => t.grade === grade).forEach(task => {
        const doneInfo = doneData[task.id];
        if (!doneInfo) {
            pendingTasks.push(task);
        } else {
            const completedAt = typeof doneInfo === 'object' ? doneInfo.completedAt : null;
            const completedDisplay = typeof doneInfo === 'object' ? doneInfo.completedAtDisplay : null;
            
            if (completedAt && !isExpired(completedAt)) {
                completedTasks.push({ ...task, completedAt, completedDisplay });
            }
        }
    });

    if (pendingTasks.length === 0 && completedTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; margin:0;">אין שיעורי בית 🎉</p>';
        return;
    }

    let html = '';

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

    if (completedTasks.length > 0) {
        html += '<details class="hw-completed-section">';
        html += '<summary class="hw-completed-title">✅ הושלמו (' + completedTasks.length + ')</summary>';
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
        html += '</details>';
    }

    container.innerHTML = html;
}

// --- סימון משימה ---

window.markHomeworkDone = function(id) {
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual);
    const taskInfo = tasks.find(t => t.id === id) || {};

    saveTaskDone(id, taskInfo);

    const taskItem = document.getElementById("task-" + id);
    if (taskItem) {
        taskItem.style.transition = "all 0.5s ease";
        
        setTimeout(() => {
            taskItem.classList.add("hw-done");
            const btn = taskItem.querySelector(".hw-done-btn");
            if (btn) {
                const icon = document.createElement("span");
                icon.className = "hw-done-icon";
                icon.textContent = "✔️";
                btn.replaceWith(icon);
            }
            const infoDiv = taskItem.querySelector(".homework-info div:last-child");
            if (infoDiv) {
                infoDiv.classList.add("hw-done-text");
            }
        }, 300);
    }
};

// --- רינדור שיעורי בית לפי כיתת המשתמש ---

function renderHomeworkForUser() {
    renderHomework(3, 'hw-container-3');
    renderHomework(5, 'hw-container-5');
}

// --- חישוב משימות פתוחות (לנוטיפיקציות) ---

window.getPendingTasksCount = async function() {
    if (!currentUser || !currentUserGrade) return 0;

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual).filter(t => t.grade === currentUserGrade);

    const doneData = await getDoneData();
    
    let count = 0;
    tasks.forEach(task => {
        if (!doneData[task.id]) count++;
    });
    return count;
};

window.getPendingTasksSummary = async function() {
    if (!currentUser || !currentUserGrade) return null;

    const auto = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const manual = (typeof manualTasks !== 'undefined') ? manualTasks : [];
    const tasks = auto.concat(manual).filter(t => t.grade === currentUserGrade);

    const doneData = await getDoneData();
    
    const pending = [];
    tasks.forEach(task => {
        if (!doneData[task.id]) {
            pending.push(task);
        }
    });

    if (pending.length === 0) return null;

    // קיבוץ לפי מקצוע
    const bySubject = {};
    pending.forEach(t => {
        if (!bySubject[t.subject]) bySubject[t.subject] = 0;
        bySubject[t.subject]++;
    });

    const subjects = Object.entries(bySubject)
        .map(([subj, count]) => `${subj} (${count})`)
        .join(', ');

    return {
        count: pending.length,
        subjects: subjects,
        grade: currentUserGrade
    };
};

// --- הפעלה ---

async function initHomework() {
    showUserBadge();
    renderHomeworkForUser();
    cleanupExpiredTasks();
    if (typeof initAppTracker === 'function') {
        initAppTracker();
    }
    // אתחול נוטיפיקציות
    if (typeof initNotifications === 'function') {
        initNotifications();
    }
}

// --- Firebase Auth listener ---

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user.uid;
        currentDisplayName = user.displayName || user.email.split('@')[0];
        currentEmail = user.email;

        const overlay = document.getElementById("user-select-overlay");
        if (overlay) overlay.remove();

        // טעינת כיתת המשתמש
        const grade = await loadUserGrade();

        if (!grade) {
            // אין כיתה — מציגים מסך בחירה
            await showGradeSelection();
        }

        initHomework();
    } else {
        currentUser = null;
        currentDisplayName = null;
        currentEmail = null;
        currentUserGrade = null;
        showLoginScreen();
    }
});
