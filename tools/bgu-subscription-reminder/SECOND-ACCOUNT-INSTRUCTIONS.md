# הנחיות לחשבון השני — תזכורת מעבר למנוי (פרויקטים אישיים של inbaltsa)

העתיקי את כל הטקסט הזה והדביקי אותו לסשן **מקומי** (This computer) של החשבון
השני. זו גרסת המראה של ההוק שכבר קיים בחשבון הראשון.

---

## מה לבנות

הוק ל-Claude Code שמזכיר לי לעבור למנוי האחר בכל פעם שאני עובדת על פרויקט
**אישי** — כלומר ה-git remote (origin) שלו מכיל `inbaltsa`. בכל פרויקט אחר
(למשל של BGUTeachingCenter) — לשתוק לגמרי.

התזכורת צריכה לקפוץ בשני מקרים:
1. **SessionStart** — בכל פתיחת/חידוש סשן.
2. **UserPromptSubmit** — רק כשההודעה מכילה את המילה **"חזרתי"** (בשביל חזרה
   לסשנים ישנים).

הזיהוי הוא **לפי ה-git remote בלבד** (`git remote get-url origin`), לא לפי שם
החשבון.

## איפה זה חי (חשוב!)

להתקין **רק** בהגדרות המשתמש האישיות: `~/.claude/settings.json`
(ב-Windows: `C:\Users\<user>\.claude\settings.json`). **לא** להכניס שום דבר
לתוך אף repo — כי זה ישפיע על שאר המשתמשים בפרויקטים המשותפים.

> הערה: זה חייב לרוץ בסשן שרץ **מקומית על המחשב**, לא בענן — בענן ה-`~/.claude`
> נמחק בכל סשן.

## מימוש ל-Windows (PowerShell — בלי תלות ב-bash או jq)

צרי קובץ `C:\Users\<user>\.claude\bgu-personal-reminder.ps1` עם התוכן:

```powershell
$ErrorActionPreference = 'SilentlyContinue'
$raw = [Console]::In.ReadToEnd()
try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$eventName = $data.hook_event_name
$prompt    = $data.prompt
$cwd       = $data.cwd
if ([string]::IsNullOrEmpty($cwd)) { $cwd = (Get-Location).Path }

$remote = (git -C $cwd remote get-url origin 2>$null)
if (-not $remote) { exit 0 }

# מזהה פרויקטים אישיים (inbaltsa). כל דבר אחר -> שקט.
if ($remote -notmatch '(?i)inbaltsa') { exit 0 }

# ב-UserPromptSubmit מזכירים רק כשכתבתי "חזרתי".
if ($eventName -eq 'UserPromptSubmit' -and $prompt -notmatch 'חזרתי') { exit 0 }

$msg = '🔔 הפרויקט הזה שייך ל-inbaltsa (אישי) — כדאי לעבור למנוי האחר לפני שממשיכים.'
$out = @{ systemMessage = $msg; suppressOutput = $true } | ConvertTo-Json -Compress
[Console]::Out.Write($out)
exit 0
```

ואז מוסיפים ל-`~/.claude/settings.json` (בלי למחוק מה שכבר קיים שם):

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\<user>\\.claude\\bgu-personal-reminder.ps1\"" } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\<user>\\.claude\\bgu-personal-reminder.ps1\"" } ] }
    ]
  }
}
```

> להחליף `<user>` בשם המשתמש האמיתי (למשל `inbaltsa`). אם קיימת התקנת `pwsh`
> (PowerShell 7) אפשר להשתמש בה במקום `powershell`.

## אם זה על Mac/Linux ולא Windows

אותה לוגיקה בדיוק בסקריפט bash — כמו הקובץ `bgu-subscription-reminder.sh`
בחשבון הראשון, רק שמחליפים את שורת הזיהוי מ-`grep -qi 'teachingcenter'`
ל-`grep -qi 'inbaltsa'` ומעדכנים את הודעת התזכורת.

## בדיקה שזה עובד

אחרי ההתקנה, לפתוח את התפריט `/hooks` פעם אחת (או להפעיל מחדש), ואז לבדוק:

```powershell
$T = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath() + [guid]::NewGuid())
git -C $T.FullName init -q
git -C $T.FullName remote add origin https://github.com/inbaltsa/My-school-apps.git
'{"hook_event_name":"SessionStart","cwd":"' + $T.FullName.Replace('\','\\') + '"}' | powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\<user>\.claude\bgu-personal-reminder.ps1"
Remove-Item -Recurse -Force $T.FullName
```

אם חוזרת שורת `systemMessage` עם ה-🔔 — הכול מחווט נכון.

---

**סיכום ההבדל מהחשבון הראשון:** שם מזהים `teachingcenter` ומזכירים; כאן מזהים
`inbaltsa` ומזכירים. כל השאר זהה.
