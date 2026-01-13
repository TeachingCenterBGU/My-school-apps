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
    "יעל": 3,      
    "מעיין": 5     
}
# ------------------

BASE_URL = "https://web.mashov.info/api"

def login_and_get_homework():
    session = requests.Session()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    print(f"🔄 מנסה להתחבר למשוב (שנה {YEAR})...")
    
    # 1. קבלת טוקן ראשוני
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers={"User-Agent": user_agent})
        # מנסים למצוא את הטוקן בכל מקום אפשרי
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
    
    # הגדרת כותרות קבועות לכל הסשן
    session.headers.update({
        "User-Agent": user_agent,
        "Content-Type": "application/json"
    })
    
    if csrf_token:
        session.headers.update({"X-Csrf-Token": csrf_token})

    login_resp = session.post(f"{BASE_URL}/login", json=login_data)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code}): {login_resp.text}")
        return []

    print("✅ התחברות הצליחה! בודק עוגיות...")

    # --- דיבאג: הדפסת כל העוגיות שהתקבלו כדי להבין איפה הטוקן ---
    print("🍪 עוגיות שהתקבלו מהשרת:")
    for cookie in session.cookies:
        print(f"   - {cookie.name}: {cookie.value[:10]}...") # מדפיס רק התחלה לביטחון
    
    # נסיון חכם יותר למצוא את הטוקן החדש
    new_csrf = session.cookies.get("csrf_token") or login_resp.headers.get("X-Csrf-Token") or login_resp.cookies.get("csrf_token")
    
    if new_csrf:
        session.headers.update({"X-Csrf-Token": new_csrf})
        print("🔄 עודכן CSRF Token חדש!")
    else:
        print("⚠️ לא נמצא טוקן חדש, מנסה להמשיך עם הישן...")

    print("🔎 מנסה לשלוף רשימת תלמידים...")
    
    students_resp = session.get(f"{BASE_URL}/students")
    
    if students_resp.status_code != 200:
         print(f"❌ שגיאה בשליפת תלמידים (קוד {students_resp.status_code}): {students_resp.text}")
         return []
    
    children = students_resp.json()
    print(f"✅ נמצאו {len(children)} תלמידים ברשימה.")
    
    all_tasks = []

    for child in children:
        name = child['privateName']
        child_id = child.get('childGuid') or child.get('studentId')
        
        grade = KIDS_MAPPING.get(name)
        
        if not grade:
            print(f"⚠️ מדלג על: '{name}' (לא במיפוי)")
            continue

        print(f"🔎 מושך שיעורים עבור {name} (כיתה {grade})...")
        
        try:
            hw_url = f"{BASE_URL}/students/{child_id}/homework"
            hw_resp = session.get(hw_url)
            
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
                print(f"❌ שגיאה (קוד {hw_resp.status_code})")
                
        except Exception as e:
            print(f"❌ שגיאה טכנית: {e}")

    return all_tasks

if __name__ == "__main__":
    tasks = login_and_get_homework()
    
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"💾 הקובץ עודכן עם {len(tasks)} משימות.")
    else:
        print("📁 הקובץ עודכן (רשימה ריקה).")
