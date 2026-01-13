import requests
import json
import os

# --- קריאת נתונים מהכספת ---
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]

YEAR = 2026

# --- המיפוי שלך ---
# ודאי שהשמות כאן תואמים בול למשוב
KIDS_MAPPING = {
    "יעל": 3,      # דוגמה - תחליפי לשם האמיתי
    "מעיין": 5     # דוגמה - תחליפי לשם האמיתי
}
# ------------------

BASE_URL = "https://web.mashov.info/api"

def login_and_get_homework():
    session = requests.Session()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    print(f"🔄 מנסה להתחבר למשוב (שנה {YEAR})...")
    
    # 1. התחברות ראשונית לקבלת טוקן זמני
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers={"User-Agent": user_agent})
        csrf_token = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    # 2. ביצוע Login
    login_data = {
        "semel": MASHOV_SEMEL,
        "year": YEAR,
        "username": MASHOV_ID,
        "password": MASHOV_PASS,
        "loginType": 1 
    }
    
    headers = {
        "User-Agent": user_agent,
        "X-Csrf-Token": csrf_token,
        "Content-Type": "application/json"
    }

    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code}): {login_resp.text}")
        return []

    print("✅ התחברות הצליחה! מעדכן כרטיס כניסה...")

    # --- התיקון הקריטי: עדכון ה-Token החדש לאחר ההתחברות ---
    # המשוב נותן עוגיה חדשה אחרי ה-Login, חייבים לקחת אותה לבקשות הבאות
    new_csrf = session.cookies.get("csrf_token")
    if new_csrf:
        headers["X-Csrf-Token"] = new_csrf
        print("🔄 עודכן CSRF Token חדש להמשך הפעילות.")
    else:
        print("⚠️ לא נמצא טוקן חדש, ממשיך עם הישן (עלול להיכשל).")
    # ---------------------------------------------------------

    print("🔎 מנסה לשלוף רשימת תלמידים...")
    
    # נסיון לשלוף דרך /students (יותר יציב מ-/user/children)
    students_resp = session.get(f"{BASE_URL}/students", headers=headers)
    
    if students_resp.status_code != 200:
         print(f"❌ שגיאה בשליפת תלמידים (קוד {students_resp.status_code}): {students_resp.text}")
         return []
    
    children = students_resp.json()
    print(f"✅ נמצאו {len(children)} תלמידים ברשימה.")
    
    all_tasks = []

    for child in children:
        name = child['privateName']
        child_id = child.get('childGuid') or child.get('studentId') # תמיכה בשני סוגי מזהים
        
        grade = KIDS_MAPPING.get(name)
        
        if not grade:
            print(f"⚠️ מדלג על: '{name}' (השם לא מופיע במיפוי)")
            continue

        print(f"🔎 מושך שיעורים עבור {name} (כיתה {grade})...")
        
        try:
            hw_url = f"{BASE_URL}/students/{child_id}/homework"
            hw_resp = session.get(hw_url, headers=headers)
            
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"   🎉 נמצאו {len(hw_list)} משימות!")
                
                for hw in hw_list:
                    task_obj = {
                        "id": str(hw['id']),
                        "grade": grade,
                        "subject": hw['subjectName'],
                        "task": hw['message']
                    }
                    all_tasks.append(task_obj)
            else:
                print(f"❌ שגיאה במשיכת שיעורים (קוד {hw_resp.status_code})")
                
        except Exception as e:
            print(f"❌ שגיאה טכנית במשיכת שיעורים ל{name}: {e}")

    return all_tasks

if __name__ == "__main__":
    tasks = login_and_get_homework()
    
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"💾 הקובץ עודכן בהצלחה עם {len(tasks)} משימות.")
    else:
        print("📁 הקובץ עודכן (רשימה ריקה).")
