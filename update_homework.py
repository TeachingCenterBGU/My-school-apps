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
    """ פונקציה שבודקת האם המחרוזת מכילה רק אנגלית ומספרים """
    if not s: return False
    try:
        s.encode('latin-1')
        return True
    except UnicodeEncodeError:
        return False

def debug_login_and_fetch():
    # שלב א: התחברות ראשונית
    print("🔄 [שלב 1] מתחבר למשוב...")
    dirty_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    try:
        init_resp = dirty_session.get(f"{BASE_URL}/login", headers=headers)
        csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"❌ שגיאה בהתחברות ראשונית: {e}")
        return []

    # אם ה-CSRF בטוח, נוסיף אותו
    if csrf and is_safe_ascii(csrf): 
        headers["X-Csrf-Token"] = csrf
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות הצליחה. מנתח מפתחות...")
    
    # חילוץ נתונים
    access_token = None
    user_id = None
    try:
        login_json = login_resp.json()
        access_token = login_json.get('accessToken')
        user_id = login_json.get('credential', {}).get('userId')
    except:
        pass

    if not access_token:
        print("❌ לא התקבל Access Token.")
        return []

    # --- שלב ב: יצירת סשן סטרילי ---
    print("✨ [שלב 2] יוצר סשן סטרילי (ללא עוגיות, רק כותרות תקינות)...")
    clean_session = requests.Session()
    
    # בדיקת כשרות ל-Access Token (כאן הייתה הנפילה!)
    if is_safe_ascii(access_token):
        clean_session.headers["Authorization"] = f"Bearer {access_token}"
        print("🔑 Access Token תקין (אנגלית בלבד) ונוסף.")
    else:
        print("⚠️ ה-Access Token מכיל עברית! מנסה לשלוח ללא Authorization...")
    
    # הוספת CSRF רק אם הוא תקין
    if csrf and is_safe_ascii(csrf):
        clean_session.headers["X-Csrf-Token"] = csrf

    # הוספת User-Agent
    clean_session.headers["User-Agent"] = headers["User-Agent"]

    # שימי לב: אני בכוונה *לא* מעתיק עוגיות בשלב הזה.
    # אנחנו מנסים לעבוד רק עם הטוקן כדי למנוע את הקריסה.

    # --- שלב ג: שליפה ---
    print("🔎 מנסה לשלוף רשימת תלמידים (בלי עוגיות)...")
    
    # נסיון 1: נתיב רגיל
    resp = clean_session.get(f"{BASE_URL}/students")
    
    if resp.status_code == 200:
        return process_homework(clean_session, resp.json())
    
    print(f"   ⚠️ נסיון ראשון נכשל (קוד {resp.status_code}).")

    # אם נכשלנו בגלל חוסר הרשאות (401/403), אולי בכל זאת חייבים עוגיות?
    # רק במקרה כזה, ננסה להעתיק עוגיות בזהירות קיצונית
    if resp.status_code in [401, 403]:
        print("🍪 חייבים עוגיות. מעתיק רק עוגיות בטוחות...")
        for cookie in dirty_session.cookies:
            if is_safe_ascii(cookie.name) and is_safe_ascii(cookie.value):
                clean_session.cookies.set(cookie.name, cookie.value)
        
        print("🔎 מנסה שוב עם עוגיות...")
        resp = clean_session.get(f"{BASE_URL}/students")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())

    # נסיון אחרון דרך ID
    if user_id:
        print(f"🔎 נסיון אחרון דרך UserID...")
        resp = clean_session.get(f"{BASE_URL}/users/{user_id}/children")
        if resp.status_code == 200:
            return process_homework(clean_session, resp.json())

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
    
    if tasks:
        print(f"\n💾 הצלחה! {len(tasks)} משימות נשמרו.")
    else:
        print("\n📁 הסתיים ללא משימות.")
