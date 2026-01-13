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
    """ בודק אם הטקסט בטוח לשליחה (אנגלית בלבד). לא קורס אם מקבלים מילון. """
    if not isinstance(s, str): return False 
    try:
        s.encode('latin-1')
        return True
    except UnicodeEncodeError:
        return False

def debug_login_and_fetch():
    print("Step 1: Connecting to Mashov...") # שיניתי לאנגלית כדי למנוע בעיות תצוגה
    dirty_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    try:
        init_resp = dirty_session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"Error connecting: {e}")
        return []

    if csrf and is_safe_ascii(csrf): 
        headers["X-Csrf-Token"] = csrf
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"Login failed (Code {login_resp.status_code})")
        return []

    print("Login success. Analyzing keys...")
    
    access_token = None
    user_id = None
    try:
        login_json = login_resp.json()
        raw_token = login_json.get('accessToken')
        
        # טיפול בטוקן שהוא אובייקט
        if isinstance(raw_token, dict):
            print(f"Token is an object with keys: {list(raw_token.keys())}")
            access_token = raw_token.get('token') or raw_token.get('value') or raw_token.get('accessToken')
        else:
            access_token = raw_token 
            
        user_id = login_json.get('credential', {}).get('userId')
    except:
        pass

    # --- שלב ב: יצירת סשן סטרילי ---
    print("Step 2: Creating clean session...")
    clean_session = requests.Session()
    
    if access_token and is_safe_ascii(access_token):
        clean_session.headers["Authorization"] = f"Bearer {access_token}"
        print("Access Token added successfully.")
    elif access_token:
        print("Warning: Access Token contains non-ascii characters. Skipping it.")
    else:
        print("Warning: No Access Token found.")
    
    if csrf and is_safe_ascii(csrf):
        clean_session.headers["X-Csrf-Token"] = csrf

    clean_session.headers["User-Agent"] = headers["User-Agent"]

    # --- שלב ג: שליפה ---
    print("Step 3: Fetching students...")
    
    # נסיון 1
    resp = clean_session.get(f"{BASE_URL}/students")
    if resp.status_code == 200:
        return process_homework(clean_session, resp.json())
    
    print(f"Attempt 1 failed (Code {resp.status_code}).")

    # נסיון 2: העתקת עוגיות זהירה
    if resp.status_code in [401, 403]:
        print("Copying safe cookies only...")
        for cookie in dirty_session.cookies:
            if is_safe_ascii(cookie.name) and is_safe_ascii(cookie.value):
                clean_session.cookies.set(cookie.name, cookie.value)
        
        resp = clean_session.get(f"{BASE_URL}/students")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())

    # נסיון אחרון דרך ID
    if user_id:
        print(f"Trying via UserID ({user_id})...")
        resp = clean_session.get(f"{BASE_URL}/users/{user_id}/children")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())

    return []

def process_homework(session, children):
    all_tasks = []
    print(f"Success! Found {len(children)} children.")
    
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
            print(f"Skipping {clean_name} (not in mapping)")
            continue

        print(f"Fetching homework for {clean_name}...")
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child_id}/homework")
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"Found {len(hw_list)} tasks.")
                for hw in hw_list:
                    all_tasks.append({
                        "id": str(hw['id']),
                        "grade": grade,
                        "subject": hw['subjectName'],
                        "task": hw['message']
                    })
        except Exception as e:
            print(f"Error: {e}")
            
    return all_tasks

if __name__ == "__main__":
    tasks = debug_login_and_fetch()
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"\nDone! Saved {len(tasks)} tasks.")
    else:
        print("\nDone. No tasks found.")
