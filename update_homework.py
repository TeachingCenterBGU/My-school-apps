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

    # 1. קריאה ראשונית
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
    
    # --- שליפת ה-Token ---
    user_id = None
    try:
        login_json = login_resp.json()
        access_token = login_json.get('accessToken')
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
            print("🔑 Access Token נמצא והוסף לכותרות.")
        
        credential = login_json.get('credential', {})
        user_id = credential.get('userId')
        print(f"🆔 User ID: {user_id}")
    except:
        print("⚠️ לא הצלחנו לקרוא את ה-JSON של ההתחברות.")

    # עדכון CSRF
    new_csrf = session.cookies.get("csrf_token") or login_resp.headers.get("X-Csrf-Token")
    if new_csrf: headers["X-Csrf-Token"] = new_csrf

    # --- התיקון: ניקוי עוגיות בעייתיות (עברית) ---
    print("🧹 מנקה עוגיות עם תווים בעברית כדי למנוע קריסה...")
    cookies_to_remove = []
    for cookie in session.cookies:
        try:
            # בדיקה: האם הערך של העוגייה הוא באנגלית בלבד?
            cookie.value.encode('latin-1')
        except UnicodeEncodeError:
            print(f"   🗑️ מוחק עוגייה בעייתית: {cookie.name}")
            cookies_to_remove.append(cookie)
    
    # מחיקה בפועל
    for cookie in cookies_to_remove:
        session.cookies.clear(domain=cookie.domain, path=cookie.path, name=cookie.name)
    # ---------------------------------------------

    # נסיון שליפה
    print("🔎 נסיון 1: שליפה דרך /students...")
    resp = session.get(f"{BASE_URL}/students", headers=headers)
    if resp.status_code == 200:
        return process_homework(session, resp.json(), headers)
    else:
        print(f"   ❌ נכשל (קוד {resp.status_code})")

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
        # שיפור: ניקוי רווחים מיותרים בשם כדי למנוע אי-התאמה
        clean_name = name.strip()
        
        # מציאת המזהה
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
        # בדיקה גמישה יותר לשמות
        grade = None
        for mapped_name, mapped_grade in KIDS_MAPPING.items():
            if mapped_name in clean_name: # אם השם מהמיפוי מוכל בשם מהמשוב
                grade = mapped_grade
                break
        
        if not grade:
            print(f"   ⚠️ מדלג על {clean_name} (לא במיפוי)")
            continue

        print(f"   🔎 מושך שיעורים ל{clean_name}...")
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
