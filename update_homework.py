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

def update_homework():
    print("Step 1: Connecting to Mashov...")
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    # 1. קריאה ראשונית (CSRF)
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"Error connecting: {e}")
        return []

    if csrf: headers["X-Csrf-Token"] = csrf
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    # 2. התחברות
    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"Login failed (Code {login_resp.status_code})")
        return []

    print("Login success! Extracting children directly from response...")

    # 3. חילוץ הילדים מתוך התשובה (השינוי הגדול!)
    children = []
    try:
        login_json = login_resp.json()
        # המידע נמצא בתוך accessToken שהוא בעצם אובייקט משתמש
        user_data = login_json.get('accessToken')
        if isinstance(user_data, dict):
            children = user_data.get('children', [])
        
        # גיבוי: לפעמים זה נמצא תחת credential
        if not children:
            children = login_json.get('credential', {}).get('children', [])
            
    except Exception as e:
        print(f"Error parsing login data: {e}")

    if not children:
        print("❌ Error: Could not find children list in login response.")
        # נסיון נואש אחרון לשלוף
        try:
            print("Trying fallback fetch...")
            resp = session.get(f"{BASE_URL}/students")
            if resp.status_code == 200:
                children = resp.json()
        except:
            pass
            
    if not children:
        return []

    print(f"🎉 Found {len(children)} children! Cleaning session cookies...")

    # 4. ניקוי עוגיות בעייתיות (הסרת עברית) מהסשן הקיים
    # אנחנו לא יוצרים סשן חדש, אלא מתקנים את הקיים
    bad_cookies = []
    for cookie in session.cookies:
        try:
            (cookie.name + cookie.value).encode('latin-1')
        except UnicodeEncodeError:
            print(f"   🗑️ Removing bad cookie: {cookie.name}")
            bad_cookies.append(cookie)
    
    # מחיקה בפועל
    for c in bad_cookies:
        session.cookies.clear(domain=c.domain, path=c.path, name=c.name)

    # 5. שליפת שיעורי הבית
    all_tasks = []
    for child in children:
        name = child['privateName']
        clean_name = name.strip()
        
        # מציאת המזהה
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
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
            # עדכון CSRF אם השתנה
            csrf = session.cookies.get("csrf_token")
            if csrf: headers["X-Csrf-Token"] = csrf
            
            hw_resp = session.get(f"{BASE_URL}/students/{child_id}/homework", headers=headers)
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"   Found {len(hw_list)} tasks.")
                for hw in hw_list:
                    all_tasks.append({
                        "id": str(hw['id']),
                        "grade": grade,
                        "subject": hw['subjectName'],
                        "task": hw['message']
                    })
            else:
                print(f"   Failed to fetch (Code {hw_resp.status_code})")
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
