# תזכורת מעבר למנוי – פרויקטים של BGUTeachingCenter

הוק ל-Claude Code שמזכיר לך **לעבור למנוי השני** בכל פעם שאת עובדת על פרויקט
ששייך ל-BGUTeachingCenter.

## מה הוא עושה

מזהה את הפרויקט **לפי ה-git remote** (הכתובת של `origin`). אם היא מכילה
`BGUTeachingCenter` — מוצגת לך תזכורת. בכל פרויקט אחר ההוק שותק לגמרי.

התזכורת קופצת בשני מקרים:

| אירוע | מתי | מה קורה |
|-------|-----|----------|
| `SessionStart` | בכל פתיחת סשן חדש (וגם בהמשך/resume של סשן) | תזכורת אם זה פרויקט BGU |
| `UserPromptSubmit` | כשאת כותבת הודעה שמכילה **"חזרתי"** | תזכורת אם זה פרויקט BGU |

הטריגר של "חזרתי" נועד בדיוק למקרה שחוזרים לסשן ישן ולא נפתח סשן חדש.

## איפה זה חי (וחשוב!)

ההוק מותקן ב**הגדרות המשתמש הפרטיות שלך** (`~/.claude/settings.json`) —
**לא** בתוך אף repo. כך אף אחד מהמשתמשים האחרים בפרויקטים המשותפים של המרכז
לא מושפע מזה, וזה עובד אצלך בכל הפרויקטים בלי לגעת בקוד שלהם.

> ⚠️ **על Claude Code on the web:** בסביבת ה-web הקונטיינר נבנה מחדש בכל סשן,
> ולכן `~/.claude/settings.json` **לא נשמר** בין סשנים. ההוק נועד לרוץ על
> ההתקנה **המקומית** שלך (CLI / דסקטופ), שם ההגדרות האישיות נשמרות. הקבצים
> כאן ב-repo הם רק המקור להתקנה — הם לא הוק פעיל ולא רצים לאף אחד אוטומטית.

## התקנה

בכל מכונה שבה את מריצה Claude Code מקומית, פעם אחת:

```bash
bash tools/bgu-subscription-reminder/install.sh
```

ואז פותחים את התפריט `/hooks` פעם אחת בתוך Claude Code (או מפעילים מחדש) כדי
שההגדרה תיטען. הסקריפט:

- מעתיק את `bgu-subscription-reminder.sh` ל-`~/.claude/`
- מוסיף את שני ההוקים ל-`~/.claude/settings.json` (עם גיבוי, בלי למחוק כלום)
- בטוח להרצה חוזרת — לא ייווצרו כפילויות

דרישה: `jq` מותקן (`brew install jq` או `apt install jq`).

### Windows (PowerShell)

ב-Windows אין צורך ב-bash או ב-jq — יש גרסת PowerShell מלאה. מריצים פעם אחת
מתוך תיקיית הפרויקט:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\bgu-subscription-reminder\install.ps1
```

זה מעתיק את `bgu-subscription-reminder.ps1` ל-`C:\Users\<user>\.claude\`, מוסיף
את שני ההוקים ל-`settings.json` (עם גיבוי, בלי כפילויות), ואז פותחים `/hooks`
פעם אחת (או מפעילים מחדש). בדיקה מהירה:

```powershell
$T = New-Item -ItemType Directory ([IO.Path]::GetTempPath() + [guid]::NewGuid())
git -C $T.FullName init -q
git -C $T.FullName remote add origin https://github.com/BGUTeachingCenter/x.git
'{"hook_event_name":"SessionStart","cwd":"' + $T.FullName.Replace('\','\\') + '"}' |
  powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\bgu-subscription-reminder.ps1"
Remove-Item -Recurse -Force $T.FullName
```

אם חוזרת שורת `systemMessage` עם 🔔 — הכול מחווט נכון.

### התקנה ידנית (בלי הסקריפט)

מעתיקים את `bgu-subscription-reminder.sh` ל-`~/.claude/`, ומוסיפים ל-
`~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "$HOME/.claude/bgu-subscription-reminder.sh" } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "$HOME/.claude/bgu-subscription-reminder.sh" } ] }
    ]
  }
}
```

## התאמות אפשריות

- **טקסט התזכורת** — משנים את המשתנה `msg` בתוך `bgu-subscription-reminder.sh`.
- **מילות טריגר נוספות** מעבר ל"חזרתי" — משנים את השורה
  `grep -q 'חזרתי'` (למשל `grep -qE 'חזרתי|חזרנו'`).
- **ארגון אחר / כמה ארגונים** — משנים את `grep -qi 'bguteachingcenter'`.

## הסרה

מוחקים את שני הבלוקים מ-`~/.claude/settings.json` (או משחזרים מהגיבוי
`settings.json.bak.*`) ומוחקים את `~/.claude/bgu-subscription-reminder.sh`.
