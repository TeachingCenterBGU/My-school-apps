/*  remember-name.js
 *  סקריפט משותף לשמירת שם הילד/ה ב-localStorage.
 *
 *  שימוש:
 *  1. הוסיפי <script src="remember-name.js"></script> לפני </body>
 *  2. בדפי עבודה: שימי <input id="student-name"> — יתמלא אוטומטית
 *  3. במשחקים: שימי <span id="greeting"></span> — תופיע ברכה
 *
 *  אם אין שם שמור, יופיע דיאלוג חמוד לשאול.
 */

(function () {
    const STORAGE_KEY = 'studentName';

    function getSavedName() {
        try { return localStorage.getItem(STORAGE_KEY) || ''; }
        catch (e) { return ''; }
    }

    function saveName(name) {
        try { localStorage.setItem(STORAGE_KEY, name.trim()); }
        catch (e) { /* localStorage not available */ }
    }

    // --- Prompt dialog (shows only once if no name saved) ---
    function createPromptDialog() {
        // Don't show if name already exists
        if (getSavedName()) return;

        const overlay = document.createElement('div');
        overlay.id = 'name-prompt-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.4);
            display:flex; align-items:center; justify-content:center;
            z-index:9999; font-family:'Segoe UI',Tahoma,sans-serif;
        `;

        overlay.innerHTML = `
            <div style="
                background:white; border-radius:20px; padding:30px 35px;
                box-shadow:0 10px 30px rgba(0,0,0,0.25); text-align:center;
                max-width:340px; width:90%; border:3px solid #5c6bc0;
            ">
                <div style="font-size:2.5em; margin-bottom:10px;">👋</div>
                <div style="font-size:1.3em; font-weight:bold; color:#333; margin-bottom:5px;">
                    ?מה השם שלך
                </div>
                <div style="font-size:0.9em; color:#888; margin-bottom:18px;">
                    ככה נוכל לכתוב את השם שלך על דפי העבודה
                </div>
                <input id="name-prompt-input" type="text" placeholder="...הקלידי את השם שלך"
                    style="
                        width:85%; padding:10px 14px; font-size:1.15em;
                        border:2px solid #ddd; border-radius:12px;
                        text-align:center; outline:none; direction:ltr;
                        font-family:inherit;
                    "
                    autofocus
                >
                <br>
                <button id="name-prompt-ok" style="
                    margin-top:15px; background:#5c6bc0; color:white;
                    border:none; padding:10px 30px; border-radius:25px;
                    font-size:1.1em; font-weight:bold; cursor:pointer;
                    box-shadow:0 3px 8px rgba(92,107,192,0.3);
                ">!יאללה</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = document.getElementById('name-prompt-input');
        const okBtn = document.getElementById('name-prompt-ok');

        function submit() {
            const name = input.value.trim();
            if (!name) {
                input.style.borderColor = '#e53935';
                input.focus();
                return;
            }
            saveName(name);
            overlay.remove();
            applyName(name);
        }

        okBtn.addEventListener('click', submit);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        input.focus();
    }

    // --- Apply name to page elements ---
    function applyName(name) {
        if (!name) return;

        // Fill input fields (worksheets)
        const nameInput = document.getElementById('student-name');
        if (nameInput) {
            nameInput.value = name;
        }

        // Fill greeting spans (games)
        const greeting = document.getElementById('greeting');
        if (greeting) {
            greeting.textContent = `Hi ${name}! `;
        }

        // Fill any element with class "student-name-fill"
        document.querySelectorAll('.student-name-fill').forEach(el => {
            el.textContent = name;
        });
    }

    // --- Change name link (optional — add <a id="change-name"> anywhere) ---
    function setupChangeName() {
        const link = document.getElementById('change-name');
        if (!link) return;
        link.style.cursor = 'pointer';
        link.addEventListener('click', e => {
            e.preventDefault();
            const newName = prompt('?מה השם החדש');
            if (newName && newName.trim()) {
                saveName(newName.trim());
                applyName(newName.trim());
            }
        });
    }

    // --- Init on DOM ready ---
    function init() {
        const name = getSavedName();
        if (name) {
            applyName(name);
        } else {
            createPromptDialog();
        }
        setupChangeName();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
