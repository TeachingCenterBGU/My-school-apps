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

def is_safe_ascii(s):
    """ בודק אם מחרוזת בטוחה (אנגלית בלבד) """
    try:
        if not isinstance(s, str): return False
        s.encode('latin-1')
        return True
    except:
        return False

def update_homework():
    print("Step 1: Login (Dirty Session)...")
    dirty_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    # CSRF ראשוני
    try:
        init_resp = dirty_session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
        if csrf: headers["X-Csrf-Token"] = csrf
    except Exception as e:
        print(f"Connection error: {e}")
        return []

    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    # התחברות
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.status_code}")
        return []

    print("Login success! Extracting children...")

    # חילוץ הילדים (זה עבד בפעם הקודמת!)
    children = []
    try:
        login_json = login_resp.json()
        user_data = login_json.get('accessToken')
        if isinstance(user_data, dict):
            children = user_data.get('children', [])
        
        if not children:
            children = login_json.get('credential', {}).get('children', [])
    except:
        pass

    if not children:
        print("❌ Could not find children list.")
        return []

    print(f"🎉 Found {len(children)} children! Switching to CLEAN session...")

    # --- יצירת סשן נקי והעתקת עוגיות בטוחות בלבד ---
    clean_session = requests.Session()
    clean_session.headers.update(headers)
    
    # עדכון CSRF עדכני מהסשן המלוכלך
    current_csrf = dirty_session.cookies.get("csrf_token")
    if current_csrf and is_safe_ascii(current_csrf):
        clean_session.headers["X-Csrf-Token"] = current_csrf

    # העתקת עוגיות: רק אנגלית!
    safe_cookies_count = 0
    for cookie in dirty_session.cookies:
        if is_safe_ascii(cookie.name) and is_safe_ascii(cookie.value):
            clean_session.cookies.set(cookie.name, cookie.value)
            safe_cookies_count += 1
        else:
            print(f"   🗑️ Skipping bad cookie: {cookie.name}")

    print(f"Clean session ready with {safe_cookies_count} safe cookies.")

    # --- משיכת שיעורים ---
    all_tasks = []
    for child in children:
        name = child['privateName']
        clean_name = name.strip()
        
        child_id = child.get('childGuid') or child.get('studentId')
        
        grade = None
        for mapped_name, mapped_grade in KIDS_MAPPING.items():
            if mapped_name in clean_name:
                grade = mapped_grade
                break
        
        if not grade:
            print(f"Skipping {clean_name}")
            continue

        print(f"Fetching homework for {clean_name}...")
        try:
            hw_resp = clean_session.get(f"{BASE_URL}/students/{child_id}/homework")
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"   ✅ Found {len(hw_list)} tasks!")
                for hw in hw_list:
                    all_tasks.append({
                        "id": str(hw['id']),
                        "grade": grade,
                        "subject": hw['subjectName'],
                        "task": hw['message']
                    })
            else:
                print(f"   ❌ Failed (Code {hw_resp.status_code}): {hw_resp.text}")
        except Exception as e:
            print(f"   Error: {e}")
            
    return all_tasks

if __name__ == "__main__":
    tasks = update_homework()
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"\n💾 DONE! Saved {len(tasks)} tasks.")
    else:
        print("\n📁 Done. No tasks found.")
