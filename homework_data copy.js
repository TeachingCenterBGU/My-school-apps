import json
import os

def save_homework_file(tasks_list):
    """
    מקבלת רשימה של משימות ושומרת אותן לקובץ JS
    """
    # 1. יצירת תוכן הקובץ בפורמט JavaScript
    # ensure_ascii=False חשוב מאוד כדי שהעברית תישמר כקריאה ולא כג'יבריש
    js_content = f"const homeworkData = {json.dumps(tasks_list, ensure_ascii=False, indent=4)};"
    
    # 2. שמירת הקובץ באותה תיקייה שבה נמצא ה-HTML שלך
    # שימי לב: ודאי שהנתיב כאן הוא הנתיב שבו שמרת את index.html
    filename = "homework_data.js"
    
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"✅ הקובץ {filename} נוצר בהצלחה!")
    except Exception as e:
        print(f"❌ שגיאה ביצירת הקובץ: {e}")

# --- דוגמה לשימוש (ככה הנתונים צריכים להיראות בסוף השליפה מהמשוב) ---
# את צריכה לייצר רשימה כזו מתוך הנתונים של המשוב
example_data = [
    {
        "id": "12345",              # מזהה ייחודי למשימה (מהמשוב)
        "grade": 3,                 # לאיזו ילדה זה שייך (3 או 5)
        "subject": "חשבון",         # המקצוע
        "task": "עמוד 10 תרגילים 1-5" # תוכן השיעורים
    },
    {
        "id": "67890",
        "grade": 5,
        "subject": "אנגלית",
        "task": "לסיים את ה-Worksheet"
    }
]

# הפעלה של הפונקציה (רק בשביל הבדיקה)
if __name__ == "__main__":
    save_homework_file(example_data)