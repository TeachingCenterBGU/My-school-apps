import requests
import json
import os
import datetime

# --- קריאת נתונים מהכספת ---
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]
YEAR = 2026  # עדכנתי ל-2026 כי אנחנו בינואר 2026 (שנת הלימודים תשפ"ו)

# --- מיפוי שמות (אנא ודאי שהשמות כאן זהים למשוב!) ---
KIDS_MAPPING = {
    "שם_ילדה_בכיתה_ג": 3,  
    "שם_ילדה_בכיתה_ה": 5   
}
# ----------------------------------------------------

BASE_URL = "https://web.mashov.info/api"

def login_and_get_homework():
    session = requests.Session()
    
    # התחפושת: אנחנו דפדפן כרום
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    print("🔄 מנסה להתחבר למשוב...")
    
    # 1. קבלת CSRF Token
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

    print("✅ התחברות הצליחה! מושך רשימת ילדים...")

    # 3. קבלת רשימת הילדים
    try:
        children_resp = session.get(f"{BASE_URL}/user/children", headers=headers)
        # כאן הייתה הנפילה קודם - עכשיו נראה מה חוזר אם זה נכשל
        if children_resp.status_code != 200:
             print(f"❌ שגיאה בשליפת ילדים: {children_resp.text}")
             return []
             
        children = children_resp.json()
    except Exception as e:
        print(f"❌ שגיאה בפענוח נתוני ילדים: {e}")
        print(f"התוכן שהתקבל: {children_resp.text[:200]}...") # נדפיס קצת כדי להבין מה הבעיה
        return []
    
    all_tasks = []

    # 4. מעבר על הילדים
    for child in children:
        name = child['privateName']
        grade = KIDS_MAPPING.get(name)
        
        if not grade:
            print(f"⚠️ מדלג על {name} (לא מוגדרת במיפוי)")
            continue

        print(f"🔎 מושך שיעורים עבור {name} (כיתה {grade})...")
        
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child['childGuid']}/homework", headers=headers)
            hw_list = hw_resp.json()

            for hw in hw_list:
                # סינון: רק משימות לעתיד או מהיום
                # אפשר להוסיף לוגיקת תאריכים כאן
                
                task_obj = {
                    "id": str(hw['id']),
                    "grade": grade,
                    "subject": hw['subjectName'],
                    "task": hw['message']
                }
                all_tasks.append(task_obj)
        except Exception as e:
            print(f"❌ שגיאה במשיכת שיעורים ל{name}: {e}")

    return all_tasks

if __name__ == "__main__":
    tasks = login_and_get_homework()
    
    if tasks:
        # שמירה לקובץ
        js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
        with open("homework_data.js", "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"✅ הצלחנו! הקובץ homework_data.js עודכן עם {len(tasks)} משימות.")
    else:
        print("⚠️ התהליך הסתיים ללא משימות (אולי הייתה שגיאה או שבאמת אין שיעורים).")
