import requests
import json
import os

# קריאת נתונים מהכספת של גיטהאב
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]
YEAR = 2025 

# --- שימי לב: את החלק הזה את צריכה לערוך ---
# כתבי את השמות בדיוק כפי שהם מופיעים במשוב (בדרך כלל שם פרטי בלבד)
KIDS_MAPPING = {
    "יעל": 3,  
    "מעיין": 5   
}
# ------------------------------------------

BASE_URL = "https://web.mashov.info/api"

def login_and_get_homework():
    session = requests.Session()

    print("🔄 מתחבר למשוב...")
    init_resp = session.get(f"{BASE_URL}/login")
    csrf_token = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")

    login_data = {"semel": MASHOV_SEMEL, "year": YEAR, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    headers = {"X-Csrf-Token": csrf_token, "Content-Type": "application/json"}
    
    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)
    if login_resp.status_code != 200:
        print(f"❌ שגיאת התחברות: {login_resp.text}")
        exit(1)

    print("✅ מחובר. שולף נתונים...")
    children = session.get(f"{BASE_URL}/user/children", headers=headers).json()
    all_tasks = []

    for child in children:
        name = child['privateName']
        grade = KIDS_MAPPING.get(name)
        
        if not grade:
            print(f"⚠️ מדלג על {name} (לא ברשימה)")
            continue

        print(f"🔎 בודק שיעורים ל{name}...")
        hw_list = session.get(f"{BASE_URL}/students/{child['childGuid']}/homework", headers=headers).json()

        for hw in hw_list:
            # כאן אפשר להוסיף סינון תאריכים אם רוצים
            task_obj = {
                "id": str(hw['id']),
                "grade": grade,
                "subject": hw['subjectName'],
                "task": hw['message']
            }
            all_tasks.append(task_obj)

    return all_tasks

if __name__ == "__main__":
    tasks = login_and_get_homework()
    
    # יצירת קובץ ה-JS
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("✅ הקובץ homework_data.js עודכן בהצלחה.")
