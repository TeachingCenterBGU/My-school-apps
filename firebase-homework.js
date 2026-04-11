// ==============================================
// firebase-homework.js
// שמירת שיעורי בית ב-Firebase, עם זיהוי לפי שם
// זוכרים את השם לשעה, אחרי זה שואלים שוב
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
if (firebase.appCheck) {
    const appCheck = firebase.appCheck();
    appCheck.activate('6Lc3ybEsAAAAAJpdWESSOGNXCqW764S9qIpsbc0k', true);
}
// --- הגדרות ---
const SESSION_DURATION_MS = 60 * 60 * 1000; // שעה אחת

// --- זיהוי לפי שם עם טיימר ---

let currentUser = null;
let currentDisplayName = null;

function getSavedUser() {
    const saved = localStorage.getItem("hw_session");
    if (!saved) return null;

    try {
        const session = JSON.parse(saved);
        const elapsed = Date.now() - session.timestamp;
        if (elapsed > SESSION_DURATION_MS) {
            localStorage.removeItem("hw_session");
            return null; // עברה שעה — שואלים שוב
        }
        return session;
    } catch (e) {
        return null;
    }
}

function saveSession(safeId, displayName) {
    localStorage.setItem("hw_session", JSON.stringify({
        id: safeId,
        name: displayName,
        timestamp: Date.now()
    }));
}

// --- מסך כניסה ---

function showLoginScreen() {
    const overlay = document.createElement("div");
    overlay.id = "user-select-overlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
    `;

    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; max-width: 300px; width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2); direction: rtl;">
            <h2 style="margin: 0 0 8px 0; font-size: 1.4em;">👋 שלום!</h2>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 0.95em;">כתבי את השם שלך כדי להתחיל</p>
            <input type="text" id="hw-name-input" placeholder="השם שלי..." style="
                width: 100%; padding: 12px; font-size: 1.1em; border: 2px solid #ddd;
                border-radius: 10px; text-align: center; box-sizing: border-box;
                outline: none; font-family: inherit;
            " autofocus>
            <button id="hw-name-btn" onclick="submitUserName()" style="
                display: block; width: 100%; padding: 12px; margin-top: 12px;
                font-size: 1.1em; border: none; border-radius: 10px;
                background: #5c6bc0; color: white; cursor: pointer;
                font-weight: bold; font-family: inherit;
            ">יאללה! 🚀</button>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        const input = document.getElementById("hw-name-input");
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") submitUserName();
            });
            input.focus();
        }
    }, 100);
}

window.submitUserName = function() {
    const input = document.getElementById("hw-name-input");
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        input.style.borderColor = "#e53935";
        input.placeholder = "צריך לכתוב שם...";
        return;
    }

    const safeId = name.replace(/\s+/g, "_");
    currentUser = safeId;
    currentDisplayName = name;
    saveSession(safeId, name);

    const overlay = document.getElementById("user-select-overlay");
    if (overlay) overlay.remove();

    initHomework();
};

function showUserBadge() {
    if (!currentDisplayName) return;

    const badge = document.createElement("div");
    badge.style.cssText = `
        position: fixed; top: 10px; left: 10px; background: #5c6bc0; color: white;
        padding: 6px 14px; border-radius: 20px; font-size: 0.85em; z-index: 999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; direction: rtl;
    `;
    badge.title = "לחצי להחלפת משתמש";
    badge.textContent = "👤 " + currentDisplayName;
    badge.addEventListener("click", () => {
        localStorage.removeItem("hw_session");
        location.reload();
    });
    document.body.appendChild(badge);
}

// --- פונקציות Firebase ---

function saveTaskDone(taskId, taskInfo) {
    if (!currentUser) return;

    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL') + ' ' + now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

    db.ref('done/' + currentUser + '/' + taskId).set(true);

    db.ref('log/' + currentUser + '/' + taskId).set({
        completedAt: now.toISOString(),
        completedAtDisplay: displayDate,
        subject: taskInfo.subject || '',
        task: taskInfo.task || '',
        grade: taskInfo.grade || '',
        userName: currentDisplayName
    });
}

async function getDoneIds() {
    if (!currentUser) return new Set();

    const snapshot = await db.ref('done/' + currentUser).once('value');
    const data = snapshot.val();
    return data ? new Set(Object.keys(data)) : new Set();
}

// --- רינדור שיעורי בית ---

async function renderHomework(grade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#888;">⏳ טוען שיעורי בית...</p>';

    const tasks = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const doneIds = await getDoneIds();

    const pendingTasks = tasks.filter(t => t.grade === grade && !doneIds.has(t.id));

    if (pendingTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; margin:0;">אין שיעורי בית 🎉</p>';
        return;
    }

    let html = '<h3 style="margin:0 0 10px 0; font-size:1.1em;">📝 שיעורי בית:</h3>';

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
    container.innerHTML = html;
}

// --- סימון משימה ---

window.markHomeworkDone = function(id) {
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    const tasks = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const taskInfo = tasks.find(t => t.id === id) || {};

    saveTaskDone(id, taskInfo);

    const taskItem = document.getElementById("task-" + id);
    if (taskItem) {
        taskItem.style.transition = "all 0.5s ease";
        taskItem.style.opacity = "0";
        taskItem.style.transform = "translateX(50px)";

        setTimeout(() => {
            const parent = taskItem.parentElement;
            taskItem.remove();
            if (parent && parent.querySelectorAll('.homework-item').length === 0) {
                parent.innerHTML = '<p style="text-align:center; color:#888; margin:0;">אין שיעורי בית 🎉</p>';
            }
        }, 500);
    }
};

// --- הפעלה ---

function initHomework() {
    showUserBadge();
    renderHomework(3, 'hw-container-3');
    renderHomework(5, 'hw-container-5');
}

document.addEventListener('DOMContentLoaded', () => {
    const saved = getSavedUser();
    if (saved) {
        currentUser = saved.id;
        currentDisplayName = saved.name;
        // מחדשים את הטיימר בכל כניסה
        saveSession(saved.id, saved.name);
        initHomework();
    } else {
        showLoginScreen();
    }
});
