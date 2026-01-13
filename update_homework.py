import requests
import json
import os

# --- קריאת נתונים ---
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]

KIDS_MAPPING = {
    "יעל": 3,      
    "מעיין": 5     
}

BASE_URL = "https://web.mashov.info/api"

def debug_login_and_fetch():
    session = requests.Session()
    
    # כותרות משופרות - נראות בדיוק כמו דפדפן אמיתי
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://web.mashov.info/students/main",
        "Origin": "https://web.mashov.info",
        "Accept": "application/json, text/plain, */*"
    }
    
    # ננסה את שנת 2026 (הכי סביר)
    YEAR = 2026
    print(f"🔄 מנסה להתחבר (שנה {YEAR}) עם כותרות משופרות...")

    # 1. קריאה ראשונית
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    # 2. Login
    if csrf: headers["X-Csrf-Token"] = csrf
    headers["Content-Type"] = "application/json"
    
    login_data = {"semel": MASHOV_SEMEL, "year": YEAR, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות הצליחה!")
    
    # עדכון טוקן
    new_csrf = session.cookies.get("csrf_token") or login_resp.headers.get("X-Csrf-Token")
    if new_csrf: 
        headers["X-Csrf-Token"] = new_csrf
        print("🔄 טוקן עודכן.")

    # --- בדיקה 1: האם הילדים בתוך ה-Login? ---
    try:
        login_json = login_resp.json()
        # נדפיס את המפתחות כדי לראות מה קיבלנו (בלי לחשוף פרטים אישיים)
        print(f"📦 מידע שהתקבל בהתחברות מכיל את השדות: {list(login_json.keys())}")
        
        # נחפש רשימת תלמידים בתוך התשובה
        potential_students = login_json.get('students') or login_json.get('children')
        if potential_students:
            print(f"🎉 בינגו! מצאנו {len(potential_students)} תלמידים בתוך ה-Login!")
            return process_homework(session, potential_students, headers)
    except:
        print("⚠️ לא ניתן לפענח את תשובת ה-Login כ-JSON.")

    # --- בדיקה 2: ננסה שוב את /students עם הכותרות החדשות ---
    print("🔎 מנסה לשלוף רשימת תלמידים דרך /students...")
    students_resp = session.get(f"{BASE_URL}/students", headers=headers)
    
    if students_resp.status_code == 200:
        students = students_resp.json()
        print(f"🎉 הצלחנו! נמצאו {len(students)} תלמידים.")
        return process_homework(session, students, headers)
    else:
        print(f"❌ נכשל (קוד {students_resp.status_code}): {students_resp.text}")

    # --- בדיקה 3: ניסיון אחרון דרך פרטי משתמש ---
    print("🔎 מנסה דרך /user...")
    user_resp = session.get(f"{BASE_URL}/user", headers=headers)
    if user_resp.status_code == 200:
        print("   ✅ הצלחנו לגשת לפרטי משתמש. בודק אם יש שם ילדים...")
        # כאן אפשר להוסיף לוגיקה אם נראה שזה עובד
    
    return []

def process_homework(session, children, headers):
    all_tasks = []
    for child in children:
        name = child['privateName']
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
        grade = KIDS_MAPPING.get(name)
        if not grade:
            print(f"   ⚠️ מדלג על {name}")
            continue

        print(f"   🔎 מושך שיעורים ל{name}...")
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child_id}/homework", headers=headers)
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"      נמצאו {len(hw_list)} משימות.")
                for hw in hw_list:
                    all_tasks.append({
                        "id": str(hw['id']),
                        "grade": grade,
                        "subject": hw['subjectName'],
                        "task": hw['message']
                    })
        except Exception as e:
            print(f"      שגיאה: {e}")
    return all_tasks

if __name__ == "__main__":
    tasks = debug_login_and_fetch()
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"\n💾 סיכום: נשמרו {len(tasks)} משימות.")
