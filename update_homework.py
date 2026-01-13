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
    # שלב א: התחברות "מלוכלכת" (מקבלים עוגיות בעברית)
    dirty_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://web.mashov.info/students/main",
        "Origin": "https://web.mashov.info",
        "Accept": "application/json, text/plain, */*"
    }
    
    print("🔄 [שלב 1] מתחבר למשוב כדי להשיג מפתח...")

    try:
        init_resp = dirty_session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    if csrf: headers["X-Csrf-Token"] = csrf
    headers["Content-Type"] = "application/json"
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות ראשונית הצליחה. מחלץ מפתחות...")
    
    # חילוץ הטוקן
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
        print("❌ לא נמצא Access Token בתשובה. אי אפשר להמשיך.")
        return []

    print("🔑 מפתח (Token) חולץ בהצלחה.")

    # --- שלב ב: יצירת סשן נקי לחלוטין ---
    print("✨ [שלב 2] יוצר סשן חדש ונקי (ללא עוגיות בעברית)...")
    clean_session = requests.Session()
    
    # מעבירים לסשן החדש רק את הכותרות ההכרחיות
    clean_session.headers.update({
        "User-Agent": headers["User-Agent"],
        "Authorization": f"Bearer {access_token}", # זה המפתח החשוב
        "X-Csrf-Token": csrf
    })

    # העתקת עוגיות: מעבירים רק את מה שבטוח באנגלית!
    print("🍪 מסנן עוגיות...")
    count = 0
    for cookie in dirty_session.cookies:
        try:
            # בדיקה: האם השם והערך הם באנגלית בלבד?
            (cookie.name + cookie.value).encode('latin-1')
            clean_session.cookies.set(cookie.name, cookie.value)
            count += 1
        except:
            print(f"   🗑️ זורק לפח עוגייה בעייתית: {cookie.name}")

    print(f"✅ הסשן הנקי מוכן (הועתקו {count} עוגיות תקינות).")

    # --- שלב ג: שליפת הנתונים עם הסשן הנקי ---

    print("🔎 מנסה לשלוף רשימת תלמידים...")
    
    # נסיון 1: נתיב רגיל
    resp = clean_session.get(f"{BASE_URL}/students")
    
    if resp.status_code == 200:
        return process_homework(clean_session, resp.json())
    
    print(f"   ⚠️ נתיב רגיל נכשל (קוד {resp.status_code}). מנסה נתיב אלטרנטיבי...")

    # נסיון 2: נתיב עם ID
    if user_id:
        resp = clean_session.get(f"{BASE_URL}/users/{user_id}/children")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())
        else:
             print(f"   ❌ נתיב אלטרנטיבי נכשל (קוד {resp.status_code})")

    return []

def process_homework(session, children):
    all_tasks = []
    print(f"🎉 הצלחנו! נמצאו {len(children)} רשומות ילדים.")
    
    for child in children:
        name = child['privateName']
        clean_name = name.strip() # ניקוי רווחים
        
        child_id = child.get('childGuid') or child.get('studentId') or child.get('userId')
        
        grade = None
        # בדיקת התאמה חכמה לשמות
        for mapped_name, mapped_grade in KIDS_MAPPING.items():
            if mapped_name in clean_name:
                grade = mapped_grade
                break
        
        if not grade:
            print(f"   ⚠️ מדלג על '{clean_name}' (לא נמצא במיפוי שמות)")
            continue

        print(f"   🔎 מושך שיעורים ל{clean_name}...")
        try:
            hw_resp = session.get(f"{BASE_URL}/students/{child_id}/homework")
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
    
    # יצירת קובץ התוצאה
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"\n💾 הצלחה! הקובץ עודכן עם {len(tasks)} משימות.")
    else:
        print("\n📁 התהליך הסתיים ללא משימות.")
