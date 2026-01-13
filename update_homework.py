import requests
import json
import os

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
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://web.mashov.info/students/main",
        "Origin": "https://web.mashov.info",
        "Accept": "application/json, text/plain, */*"
    }
    
    print("🔄 מתחבר למשוב (שנה 2026)...")

    # 1. קריאה ראשונית (CSRF)
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    if csrf: headers["X-Csrf-Token"] = csrf
    headers["Content-Type"] = "application/json"
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    # 2. ביצוע Login
    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות הצליחה! מפענח נתונים...")
    
    # --- התיקון הגדול: שימוש ב-Access Token ---
    try:
        login_json = login_resp.json()
        
        # 1. שליפת ה-Token והוספתו לכותרות
        access_token = login_json.get('accessToken')
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}" # התוספת הקריטית!
            print("🔑 Access Token נמצא והוסף לכותרות.")
        
        # 2. שליפת ה-User ID (אולי צריך אותו בשביל הכתובת)
        credential = login_json.get('credential', {})
        user_id = credential.get('userId')
        print(f"🆔 זיהינו את ה-User ID שלך: {user_id}")
        
    except:
        print("⚠️ לא הצלחנו לקרוא את ה-JSON של ההתחברות.")

    # עדכון CSRF אם השתנה
    new_csrf = session.cookies.get("csrf_token") or login_resp.headers.get("X-Csrf-Token")
    if new_csrf: headers["X-Csrf-Token"] = new_csrf

    # --- ניסיונות שליפה עם הכוח החדש (הטוקן) ---
    
    # נסיון 1: רגיל
    print("🔎 נסיון 1: שליפה דרך /students...")
    resp = session.get(f"{BASE_URL}/students", headers=headers)
    if resp.status_code == 200:
        return process_homework(session, resp.json(), headers)
    else:
        print(f"   ❌ נכשל (קוד {resp.status_code})")

    # נסיון 2: דרך ה-ID של המשתמש (לפעמים הכתובת היא /user/{id}/students)
    if user_id:
        print(f"🔎 נסיון 2: שליפה דרך /users/{user_id}/children...")
        resp = session.get(f"{BASE_URL}/users/{user_id}/children", headers=headers)
        if resp.status_code == 200:
            return process_homework(session, resp.json(), headers)
        else:
             print(f"   ❌ נכשל (קוד {resp.status_code})")

    return []

def process_homework(session, children, headers):
    all_tasks = []
    print(f"🎉 הצלחנו! נמצאו {len(children)} רשומות ילדים.")
    
    for child in children:
        name = child['privateName']
        # ננסה למצוא את המזהה בכל דרך אפשרית
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
        grade = KIDS_MAPPING.get(name)
        if not grade:
            print(f"   ⚠️ מצאנו את {name}, אבל השם לא מופיע במיפוי בקוד.")
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
    print(f"\n💾 סיימנו.")
