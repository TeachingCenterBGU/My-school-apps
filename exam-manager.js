// ==============================================
// exam-manager.js
// ניהול מבחנים אוטומטי — עיצוב, באנרים, ותפוגה
// 
// שימוש:
// 1. על <details class="subject-box">:
//    data-exam-date="2026-04-20"          ← תאריך המבחן
//    data-exam-title="מבחן Unit 3"        ← כותרת (אופציונלי)
//    data-exam-desc="אותיות, צלילים..."   ← פירוט (אופציונלי)
//
// 2. על כרטיסים שקשורים למבחן:
//    data-for-exam                        ← סימון כרטיס למבחן
//
// הכל אוטומטי — אחרי שהתאריך עובר, הכל חוזר לרגיל.
// ==============================================

(function() {
    'use strict';

    // --- הזרקת CSS ---
    const EXAM_CSS = `
        /* באנר מבחן */
        .exam-alert {
            background: linear-gradient(135deg, #fff5f5, #ffe0e0);
            border: 2px solid #e53935;
            border-radius: 14px;
            padding: 14px 18px;
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: exam-pulse 2s ease-in-out;
        }
        .exam-alert-icon { font-size: 2em; flex-shrink: 0; }
        .exam-alert-text { flex: 1; }
        .exam-alert-title { font-weight: bold; color: #c62828; font-size: 1.1em; }
        .exam-alert-date {
            display: inline-block;
            background: #e53935;
            color: white;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 8px;
        }
        .exam-alert-desc { color: #555; font-size: 0.9em; margin-top: 4px; }

        /* באדג' על כותרת המקצוע */
        .subject-badge.exam {
            background: #e53935;
            color: white;
            font-size: 0.7em;
            padding: 2px 8px;
            border-radius: 10px;
            margin-right: 8px;
            font-weight: bold;
        }

        /* כרטיס למבחן - משחק */
        .card.for-exam {
            border: 2px solid #e53935;
            background: #fff8f8;
        }
        .card.for-exam:hover {
            border-color: #c62828;
            box-shadow: 0 10px 18px rgba(229,57,53,0.12);
        }
        .card.for-exam .card-title { color: #c62828; }
        .card.for-exam .exam-tag {
            display: inline-block;
            background: #e53935;
            color: white;
            font-size: 0.65em;
            padding: 2px 7px;
            border-radius: 8px;
            font-weight: bold;
            margin-bottom: 6px;
        }

        /* כרטיס למבחן - דף עבודה */
        .card.worksheet.for-exam {
            border: 2px solid #1976d2;
            border-top: 4px solid #1976d2;
            background: #f0f6ff;
        }
        .card.worksheet.for-exam:hover {
            border-color: #1565c0;
            box-shadow: 0 10px 18px rgba(25,118,210,0.12);
        }
        .card.worksheet.for-exam .card-title { color: #1565c0; }
        .card.worksheet.for-exam .exam-tag { background: #1976d2; }

        /* קו הפרדה "תרגולים נוספים" */
        .exam-section-divider { padding: 0; margin: 16px 0 12px 0; }
        .exam-section-divider-line { border: 0; border-top: 1px dashed #ddd; margin: 0; }
        .exam-section-divider-label { font-size: 0.8em; color: #aaa; text-align: center; margin-top: 6px; }

        @keyframes exam-pulse {
            0% { transform: scale(0.97); opacity: 0.7; }
            50% { transform: scale(1.01); }
            100% { transform: scale(1); opacity: 1; }
        }

        /* דארק מוד */
        @media (prefers-color-scheme: dark) {
            .exam-alert {
                background: linear-gradient(135deg, #3c1515, #4a1a1a);
                border-color: #c62828;
            }
            .exam-alert-desc { color: #bbb; }
            .card.for-exam {
                background: #2a1515;
                border-color: #c62828;
            }
            .card.worksheet.for-exam {
                background: #151f2a;
                border-color: #1565c0;
            }
        }
    `;

    function injectStyles() {
        if (document.getElementById('exam-manager-css')) return;
        const style = document.createElement('style');
        style.id = 'exam-manager-css';
        style.textContent = EXAM_CSS;
        document.head.appendChild(style);
    }

    // --- פורמט תאריך בעברית ---
    function formatExamDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${dayName} ${day}.${month}`;
    }

    // --- בדיקת תאריך ---
    function isExamUpcoming(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const examDate = new Date(dateStr + 'T00:00:00');
        // המבחן עדיין רלוונטי עד סוף יום המבחן
        return examDate >= today;
    }

    function daysUntilExam(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const examDate = new Date(dateStr + 'T00:00:00');
        return Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    }

    // --- יצירת באנר מבחן ---
    function createExamBanner(dateStr, title, desc) {
        const formattedDate = formatExamDate(dateStr);
        const days = daysUntilExam(dateStr);
        
        let urgencyIcon = '📝';
        if (days <= 1) urgencyIcon = '🔥';
        else if (days <= 3) urgencyIcon = '⏰';

        const banner = document.createElement('div');
        banner.className = 'exam-alert';
        banner.setAttribute('data-exam-generated', 'true');

        let html = `
            <span class="exam-alert-icon">${urgencyIcon}</span>
            <div class="exam-alert-text">
                <div class="exam-alert-title">
                    <span class="exam-alert-date">${formattedDate}</span>
                    ${title || 'מבחן קרוב'}
                </div>`;
        
        if (desc) {
            html += `<div class="exam-alert-desc">${desc}</div>`;
        }
        
        if (days === 0) {
            html += `<div class="exam-alert-desc" style="color:#c62828; font-weight:bold; margin-top:4px;">היום המבחן! בהצלחה! 🍀</div>`;
        } else if (days === 1) {
            html += `<div class="exam-alert-desc" style="color:#e65100; font-weight:bold; margin-top:4px;">מחר המבחן! 💪</div>`;
        } else if (days <= 3) {
            html += `<div class="exam-alert-desc" style="color:#e65100; margin-top:4px;">עוד ${days} ימים למבחן</div>`;
        }

        html += `</div>`;
        banner.innerHTML = html;
        return banner;
    }

    // --- יצירת באדג' על כותרת מקצוע ---
    function createExamBadge(dateStr) {
        const formattedDate = formatExamDate(dateStr);
        const badge = document.createElement('span');
        badge.className = 'subject-badge exam';
        badge.setAttribute('data-exam-generated', 'true');
        badge.textContent = `📅 מבחן ${formattedDate.split(' ')[1]}`;
        return badge;
    }

    // --- הוספת תג "למבחן" לכרטיס ---
    function addExamTagToCard(card) {
        if (card.querySelector('.exam-tag')) return;
        card.classList.add('for-exam');
        
        const cardMain = card.querySelector('.card-main');
        if (!cardMain) return;
        
        const tag = document.createElement('span');
        tag.className = 'exam-tag';
        tag.setAttribute('data-exam-generated', 'true');
        tag.textContent = 'למבחן';
        
        // מוסיפים את התג לפני האייקון
        const icon = cardMain.querySelector('.icon');
        if (icon) {
            cardMain.insertBefore(tag, icon);
        } else {
            cardMain.prepend(tag);
        }
    }

    // --- הוספת קו הפרדה "תרגולים נוספים" ---
    function addSectionDivider(subjectBox) {
        const examCards = subjectBox.querySelectorAll('.card[data-for-exam]');
        const allCards = subjectBox.querySelectorAll('.card');
        const nonExamCards = Array.from(allCards).filter(c => !c.hasAttribute('data-for-exam'));
        
        if (examCards.length === 0 || nonExamCards.length === 0) return;

        // מוצאים את הכרטיס האחרון למבחן
        const lastExamCard = examCards[examCards.length - 1];
        const lastExamGrid = lastExamCard.closest('.apps-grid');
        
        // בודקים אם כבר יש divider
        if (subjectBox.querySelector('.exam-section-divider')) return;

        // מחפשים את ה-grid הבא אחרי ה-grid של הכרטיסים למבחן
        const grids = subjectBox.querySelectorAll('.apps-grid');
        if (grids.length < 2) return;
        
        const divider = document.createElement('div');
        divider.className = 'exam-section-divider';
        divider.setAttribute('data-exam-generated', 'true');
        divider.innerHTML = `
            <hr class="exam-section-divider-line">
            <div class="exam-section-divider-label">תרגולים נוספים</div>
        `;
        
        grids[1].parentNode.insertBefore(divider, grids[1]);
    }

    // --- ניקוי כל העיצובים שנוצרו ---
    function cleanupExamStyling(subjectBox) {
        // מסירים אלמנטים שנוצרו
        subjectBox.querySelectorAll('[data-exam-generated]').forEach(el => el.remove());
        
        // מסירים class מכרטיסים
        subjectBox.querySelectorAll('.card.for-exam').forEach(card => {
            card.classList.remove('for-exam');
        });
    }

    // --- עיבוד ראשי ---
    function processExams() {
        injectStyles();

        const subjects = document.querySelectorAll('.subject-box[data-exam-date]');
        
        subjects.forEach(subjectBox => {
            const examDate = subjectBox.getAttribute('data-exam-date');
            const examTitle = subjectBox.getAttribute('data-exam-title') || '';
            const examDesc = subjectBox.getAttribute('data-exam-desc') || '';

            // תמיד ננקה קודם (למקרה שהסקריפט רץ שוב)
            cleanupExamStyling(subjectBox);

            if (!isExamUpcoming(examDate)) {
                // המבחן עבר — הכל נשאר רגיל
                return;
            }

            // --- המבחן עדיין רלוונטי ---

            // 1. פותחים את ה-details
            subjectBox.open = true;

            // 2. מוסיפים באדג' לכותרת המקצוע
            const summary = subjectBox.querySelector('.subject-title');
            if (summary) {
                summary.appendChild(createExamBadge(examDate));
            }

            // 3. מוסיפים באנר אחרי ה-summary
            const banner = createExamBanner(examDate, examTitle, examDesc);
            summary.insertAdjacentElement('afterend', banner);

            // 4. מעצבים כרטיסים למבחן
            subjectBox.querySelectorAll('.card[data-for-exam]').forEach(card => {
                addExamTagToCard(card);
            });

            // 5. מוסיפים קו הפרדה אם יש גם כרטיסים רגילים
            addSectionDivider(subjectBox);
        });
    }

    // --- הרצה ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processExams);
    } else {
        processExams();
    }
})();
