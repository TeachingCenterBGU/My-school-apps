import requests
import json
import os
import datetime

# --- קריאת נתונים מהכספת ---
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]

# שינוי קריטי: המערכת הפנימית עובדת לפי שנת ההתחלה (2025) ולא הסיום (2026)
YEAR = 2025  

# --- ודאי שהשמות כאן זהים בדיוק למה שמופיע במשוב ---
KIDS_MAPPING = {
    "יעל": 3,  
    "מעיין": 5   
}
# ----------------------------------------------------

BASE_URL = "https://web.mashov.info/api"

def login_and_get_homework():
    session = requests.Session()
    # התחפושת לדפדפן (כדי שלא יחסמו אותנו)
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    print(f"🔄 מנסה להתחבר למשוב (שנה {YEAR})...")
    
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers={"User-Agent": user_agent})
        csrf_token = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

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

    print("✅ התחברות הצליחה! מנסה לשלוף ילדים...")

    # שליפת רשימת הילדים
    children_resp = session.get(f"{BASE_URL}/user/children", headers=headers)
    
    if children_resp.status_code != 200:
         # כאן נראה את השגיאה האמיתית אם זה נכשל
         print(f"❌ שגיאה בשליפת ילדים (Status {children_resp.status_code}):")
         print(children_resp.text)
         return []
    
    try:
        children = children_resp.json()
    except:
        print(f"❌ התקבל תוכן שאינו JSON: {children_resp.text}")
        return []

    print(f"✅ נמצאו {len(children)} ילדים. מתחיל לעבור עליהם...")
    
    all_tasks = []

    for child in children:
        name = child['privateName']
        grade = KIDS_MAPPING.get(name) # כאן אנחנו בודקים אם השם קיים ברשימה שלנו
        
        if not grade:
            print(f"⚠️ מדלג על הילד/ה: '{name}' (כי השם הזה לא מופיע ב-KIDS_MAPPING)")
            continue

        print(f"🔎 מושך שיעורים עבור {name} (כיתה {grade})...")
        
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child['childGuid']}/homework", headers=headers)
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"   found {len(hw_list)} tasks") # נראה כמה משימות הוא מצא
                
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
    
    if tasks:
        js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
        with open("homework_data.js", "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"🎉 הצלחנו! הקובץ homework_data.js עודכן עם {len(tasks)} משימות.")
    else:
        print("⚠️ התהליך הסתיים ללא משימות (או שהייתה שגיאה, או שבאמת אין שיעורים).")
