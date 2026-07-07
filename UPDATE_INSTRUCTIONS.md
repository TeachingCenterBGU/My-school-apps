# עדכוני סוף תשפו תחילת תשפז — מה מעלים ומה מעדכנים

## קבצים חדשים (העלאה לשורש הריפו)
- `grade-1.html` — כיתה א' 🌱 (ירוק)
- `grade-4.html` — כיתה ד' 🐬 (טורקיז)
- `grade-6.html` — כיתה ו' 🚀 (סגול)

## קבצים שמחליפים קיימים
- `index.html` — עמוד הפתיחה עם שני מקטעים: "לקראת שנת הלימודים הבאה" ו"מהשנה שעברה"
- `.github/workflows/daily_update.yml` — העדכון האוטומטי מהמשו"ב **מושבת** (ה-schedule בהערה). הרצה ידנית דרך Actions עדיין אפשרית.

## עדכון 1 — להוסיף בסוף style.css

```css
/* --- צבעים לכיתות החדשות (תשפ"ז) --- */
.grade-col.grade-1 h2.grade-title { background: #43a047; box-shadow: 0 4px 10px rgba(67, 160, 71, 0.3); }
.grade-col.grade-1 .homework-box { border-color: #43a047; background: #e8f5e9; }

.grade-col.grade-4 h2.grade-title { background: #00897b; box-shadow: 0 4px 10px rgba(0, 137, 123, 0.3); }
.grade-col.grade-4 .homework-box { border-color: #00897b; background: #e0f2f1; }

.grade-col.grade-6 h2.grade-title { background: #8e24aa; box-shadow: 0 4px 10px rgba(142, 36, 170, 0.3); }
.grade-col.grade-6 .homework-box { border-color: #8e24aa; background: #f3e5f5; }
```

## עדכון 2 — firebase-homework.js: זיהוי העמודים החדשים

להחליף את הפונקציה `detectPageGrade` בגרסה הזו (חשוב: הבדיקה של
`grade-6` חייבת להיות מסודרת כך שלא תתנגש, וכל בדיקה עצמאית):

```javascript
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
```

הערה: בעמודים החדשים קופסת שיעורי הבית קיימת אבל מוסתרת
(`style="display:none"` על `hw-container-1/4/6`) — כך שהתשתית מוכנה
ולא מוצג כלום עד שמפעילים מחדש.

## צ'ק-ליסט להפעלה מחדש בתחילת שנה"ל (ספטמבר 2026)

1. **workflow**: להסיר את ההערות משלוש שורות ה-`schedule` ב-`daily_update.yml`
2. **update_homework.py**: לעדכן את `KIDS_MAPPING` לכיתות החדשות:
   ```python
   KIDS_MAPPING = {
       "יעל": 4,
       "מעיין": 6,
       # להוסיף את העולה לכיתה א' אם יש לה משו"ב
   }
   ```
3. **update_homework.py**: לעדכן `"year": 2027` בבקשת ההתחברות (`login_data`)
4. **עמודי הכיתות החדשים**: להסיר את `style="display:none;"` מ-`hw-container-1/4/6`
5. **firebase-homework.js**: לעדכן גם את מסך בחירת הכיתה (`showGradeSelection` / `selectGrade`)
   ואת המילון `gradeNames` בתוך `renderHomework` כך שיכללו את הכיתות החדשות
   (כרגע יש שם רק ג' ו-ה')
6. **send_notifications.py**: לוודא שהוא עובד לפי מספרי הכיתות החדשים (הוא קורא grade מהמשימות, אז אמור לעבוד אוטומטית)
