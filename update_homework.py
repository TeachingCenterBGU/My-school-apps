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
    # סשן ראשון - רק בשביל ההתחברות
    first_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://web.mashov.info/students/main",
        "Origin": "https://web.mashov.info",
        "Accept": "application/json, text/plain, */*"
    }
    
    print("🔄 מתחבר למשוב (סשן ראשוני)...")

    # 1. קריאה ראשונית
    try:
        init_resp = first_session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    if csrf: headers["X-Csrf-Token"] = csrf
    headers["Content-Type"] = "application/json"
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    # 2. ביצוע Login
    login_resp = first_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות הצליחה! מחלץ מפתחות...")
    
    # שליפת המפתחות
    access_token = None
    user_id = None
    try:
        login_json = login_resp.json()
        access_token = login_json.get('accessToken')
        credential = login_json.get('credential', {})
        user_id = credential.get('userId')
    except:
        pass

    if not access_token:
        print("❌ לא נמצא Access Token. עוצר.")
        return []

    print("🔑 Access Token חולץ בהצלחה.")

    # --- הצעד הדרסטי: יצירת סשן חדש ונקי ---
    print("✨ יוצר סשן חדש ונקי (ללא עוגיות בעברית)...")
    clean_session = requests.Session()
    
    # מעבירים לסשן החדש רק את מה שבטוח תקין
    clean_session.headers.update({
        "User-Agent": headers["User-Agent"],
        "Authorization": f"Bearer {access_token}", # זה המפתח החשוב
        "X-Csrf-Token": csrf
    })

    # מעבירים רק עוגיות שהן 100% אנגלית
    for cookie in first_session.cookies:
        try:
            # בדיקה מחמירה: האם המפתח והערך הם באנגלית?
            (cookie.name + cookie.value).encode('ascii')
            clean_session.cookies.set(cookie.name, cookie.value)
        except:
            print(f"   🗑️ משאיר מאחור עוגייה בעייתית: {cookie.name}")

    # --- מעכשיו משתמשים רק ב-clean_session ---

    print("🔎 נסיון שליפה דרך /students (עם הסשן הנקי)...")
    resp = clean_session.get(f"{BASE_URL}/students")
    
    if resp.status_code == 200:
        return process_homework(clean_session, resp.json())
    else:
        print(f"   ❌ נכשל (קוד {resp.status_code}): {resp.text}")

    if user_id:
        print(f"🔎 נסיון שליפה דרך /users/{user_id}/children...")
        resp = clean_session.get(f"{BASE_URL}/users/{user_id}/children")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())
        else:
             print(f"   ❌ נכשל (קוד {resp.status_code})")

    return []

def process_homework(session, children):
    all_tasks = []
    print(f"🎉 הצלחנו! נמצאו {len(children)} רשומות ילדים.")
    
    for child in children:
        name = child['privateName']
        clean_name = name.strip()
        
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
        grade = None
        for mapped_name, mapped_grade in KIDS_MAPPING.items():
            if mapped_name in clean_name:
                grade = mapped_grade
                break
        
        if not grade:
            print(f"   ⚠️ מדלג על {clean_name}")
            continue

        print(f"   🔎 מושך שיעורים ל{clean_name}...")
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child_id}/homework")
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"      נמצאו {len(hw_list)} משימות.")
                for hw in hw_list:
                    all_tasks.append({
                        "id": str
