// ==============================================
// firebase-homework.js
// שמירת שיעורי בית ב-Firebase, לפי ילדה
// ==============================================

const firebaseConfig = {
    // ⬇️ ענבל: החליפי את הערכים האלה בערכים מה-Firebase Console שלך
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAi0YrEfLEr7GK2VRjJ9FOuhz4066_7T5M",
  authDomain: "homework-barad.firebaseapp.com",
  databaseURL: "https://homework-barad-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "homework-barad",
  storageBucket: "homework-barad.firebasestorage.app",
  messagingSenderId: "324035760311",
  appId: "1:324035760311:web:2b9793e3924cc2840a3d32",
  measurementId: "G-HHGQZ2WX3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- זיהוי הילדה ---

function getCurrentUser() {
    return localStorage.getItem("hw_user");
}

function setCurrentUser(name) {
    localStorage.setItem("hw_user", name);
}

function askForUser() {
    const overlay = document.createElement("div");
    overlay.id = "user-select-overlay";
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
    `;

    overlay.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; max-width: 300px; width: 90%; box-shadow: 0 8px 30px rgba(0,0,0,0.2);">
            <h2 style="margin: 0 0 20px 0; font-size: 1.3em;">מי את? 👋</h2>
            <button class="user-pick-btn" onclick="pickUser('child1')" style="
                display: block; width: 100%; padding: 12px; margin: 8px 0;
                font-size: 1.1em; border: 2px solid #ec407a; border-radius: 10px;
                background: #fce4ec; cursor: pointer; font-weight: bold;
            ">🍬 הילדה של כיתה ג'</button>
            <button class="user-pick-btn" onclick="pickUser('child2')" style="
                display: block; width: 100%; padding: 12px; margin: 8px 0;
                font-size: 1.1em; border: 2px solid #5c6bc0; border-radius: 10px;
                background: #e8eaf6; cursor: pointer; font-weight: bold;
            ">🦋 הילדה של כיתה ה'</button>
        </div>
    `;

    document.body.appendChild(overlay);
}

window.pickUser = function(name) {
    setCurrentUser(name);
    const overlay = document.getElementById("user-select-overlay");
    if (overlay) overlay.remove();
    renderHomework(3, 'hw-container-3');
    renderHomework(5, 'hw-container-5');
};

// --- פונקציות Firebase ---

function saveTaskDone(taskId, taskInfo) {
    const user = getCurrentUser();
    if (!user) return;

    const now = new Date();
    const timestamp = now.toISOString();
    const displayDate = now.toLocaleDateString('he-IL') + ' ' + now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

    db.ref('done/' + user + '/' + taskId).set(true);

    db.ref('log/' + user + '/' + taskId).set({
        completedAt: timestamp,
        completedAtDisplay: displayDate,
        subject: taskInfo.subject || '',
        task: taskInfo.task || '',
        grade: taskInfo.grade || ''
    });
}

async function getAllDoneIds() {
    const user = getCurrentUser();
    if (!user) return new Set();

    const snapshot = await db.ref('done/' + user).once('value');
    const data = snapshot.val();
    return data ? new Set(Object.keys(data)) : new Set();
}

// --- רינדור שיעורי בית ---

async function renderHomework(grade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const user = getCurrentUser();
    if (!user) return;

    container.innerHTML = '<p style="text-align:center; color:#888;">⏳ טוען שיעורי בית...</p>';

    const tasks = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const doneIds = await getAllDoneIds();

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
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        askForUser();
    } else {
        renderHomework(3, 'hw-container-3');
        renderHomework(5, 'hw-container-5');
    }
});
