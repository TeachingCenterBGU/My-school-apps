# הוראות הפעלת נוטיפיקציות

## מה צריך לעשות (פעם אחת)

### שלב 1 — יצירת מפתח אינטרנט בפיירבייס

1. נכנסים ל-[Firebase Console](https://console.firebase.google.com/)
2. בוחרים את הפרויקט `homework-barad`
3. לוחצים על גלגל השיניים (⚙️) → **Project Settings**
4. עוברים ללשונית **Cloud Messaging**
5. גוללים למטה ל-**Web Push certificates**
6. לוחצים **Generate key pair**
7. מעתיקים את המפתח שנוצר (רצף ארוך של אותיות)

עכשיו פותחים את הקובץ `notification-manager.js` ומחליפים את:
```
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';
```
במפתח שהעתקתם:
```
const VAPID_KEY = 'BGrK4j... (המפתח שלכם)';
```

### שלב 2 — יצירת מפתח שרת (לגיטהאב)

1. באותו עמוד הגדרות בפיירבייס, עוברים ללשונית **Service accounts**
2. לוחצים **Generate new private key**
3. נוריד קובץ JSON — **אל תשתפו אותו עם אף אחד!**
4. פותחים את הקובץ עם פנקס רשימות ומעתיקים את כל התוכן

### שלב 3 — הוספת המפתח לגיטהאב

1. נכנסים לגיטהאב → ריפו של הפרויקט
2. **Settings** → **Secrets and variables** → **Actions**
3. לוחצים **New repository secret**
4. שם: `FIREBASE_SERVICE_ACCOUNT`
5. ערך: מדביקים את כל תוכן קובץ ה-JSON
6. לוחצים **Add secret**

### שלב 4 — עדכון תהליך הגיטהאב

בקובץ של ה-workflow (`.github/workflows/...`) מוסיפים שלב אחרי עדכון המשימות:

```yaml
    - name: Send notifications
      env:
        FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
      run: |
        pip install firebase-admin
        python send_notifications.py
```

### שלב 5 — העלאת הקבצים

מעלים לגיטהאב את הקבצים החדשים/המעודכנים:
- `notification-manager.js` (חדש)
- `send_notifications.py` (חדש)
- `sw.js` (מעודכן)
- `firebase-homework.js` (מעודכן)
- `grade-3.html` (מעודכן)
- `grade-5.html` (מעודכן)

### שלב 6 — הרשאות בפיירבייס (חשוב!)

צריך לוודא שהסקריפט יכול לקרוא את רשימת המשתמשים.
בפיירבייס → **Realtime Database** → **Rules**, לוודא שיש:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    }
  }
}
```

הערה: הסקריפט בגיטהאב משתמש ב-Admin SDK שעוקף את כללי האבטחה,
אז הוא תמיד יכול לקרוא — בלי לפגוע באבטחה.

---

## איך זה עובד

```
כל יום:
  גיטהאב מריץ את update_homework.py       → מעדכן משימות
  גיטהאב מריץ את send_notifications.py     → שולח הודעות
                                               ↓
                              ילדה 1: "📝 יש 5 משימות לכיתה ג'"
                              ילדה 2: "📝 יש 3 משימות לכיתה ה'"
```

הילדות מקבלות הודעה בטלפון — גם אם הדפדפן סגור!
לחיצה על ההודעה פותחת את האפליקציה.

---

## עלות

**אפס.** הכל רץ בחינם:
- גיטהאב נותן 2,000 דקות חינם בחודש (הסקריפט צורך ~10 שניות ביום)
- שליחת הודעות בפיירבייס (FCM) היא חינמית ללא הגבלה
- פיירבייס נשאר בתוכנית החינמית (Spark)
