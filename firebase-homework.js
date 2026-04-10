// ==============================================
// firebase-homework.js
// מחליף את localStorage בשמירה ל-Firebase
// ==============================================

// --- אתחול Firebase ---
// (ה-SDK נטען מה-HTML לפני הקובץ הזה)

const firebaseConfig = {
    // ⬇️ ענבל: החליפי את הערכים האלה בערכים מה-Firebase Console שלך
    apiKey: "AIzaSyAi0YrEfLEr7GK2VRjJ9FOuhz4066_7T5M",
    authDomain: "homework-barad.firebaseapp.com",
    databaseURL: "https://homework-barad-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "homework-barad",
    storageBucket: "homework-barad.firebasestorage.app",
    messagingSenderId: "324035760311",
    appId: "1:324035760311:web:2b9793e3924cc2840a3d32",
    measurementId: "G-HHGQZ2WX3Q"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- פונקציות עזר ---

// שומרת שמשימה הושלמה (עם תאריך וזמן)
function saveTaskDone(taskId, taskInfo) {
    const now = new Date();
    const timestamp = now.toISOString();
    const displayDate = now.toLocaleDateString('he-IL') + ' ' + now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
    
    // שומרים בשני מקומות:
    // 1. רשימת "בוצע" (לבדיקה מהירה)
    db.ref('done/' + taskId).set(true);
    
    // 2. לוג מלא (היסטוריה)
    db.ref('log/' + taskId).set({
        completedAt: timestamp,
        completedAtDisplay: displayDate,
        subject: taskInfo.subject || '',
        task: taskInfo.task || '',
        grade: taskInfo.grade || ''
    });
}

// בודקת אם משימה כבר בוצעה
async function isTaskDone(taskId) {
    const snapshot = await db.ref('done/' + taskId).once('value');
    return snapshot.val() === true;
}

// מושכת את כל המשימות שבוצעו (set של IDs)
async function getAllDoneIds() {
    const snapshot = await db.ref('done').once('value');
    const data = snapshot.val();
    return data ? new Set(Object.keys(data)) : new Set();
}

// --- רינדור שיעורי בית (מחליף את renderHomework הישן) ---

async function renderHomework(grade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // טוענים loading
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

// --- סימון משימה כ"בוצעה" (מחליף את markHomeworkDone הישן) ---

window.markHomeworkDone = function(id) {
    // 1. קונפטי
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    // 2. מוצאים את פרטי המשימה ללוג
    const tasks = (typeof homeworkData !== 'undefined') ? homeworkData : [];
    const taskInfo = tasks.find(t => t.id === id) || {};

    // 3. שומרים ב-Firebase (במקום localStorage)
    saveTaskDone(id, taskInfo);

    // 4. אנימציית העלמות
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

// --- הפעלה אוטומטית ---
document.addEventListener('DOMContentLoaded', () => {
    renderHomework(3, 'hw-container-3');
    renderHomework(5, 'hw-container-5');
});
