import requests
import json
import os

# --- קריאת נתונים מהכספת ---
MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]

# --- המיפוי שלך ---
KIDS_MAPPING = {
    "יעל": 3,      
    "מעיין": 5     
}
# ------------------

BASE_URL = "https://web.mashov.info/api"

def get_session_and_login(year):
    """ פונקציית עזר שמבצעת התחברות עבור שנה ספציפית ומחזירה session פעיל """
    session = requests.Session()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    print(f"🔄 [שנה {year}] מתחיל תהליך התחברות...")
    
    # 1. קריאה ראשונית
    try:
        init_resp = session.get(f"{BASE_URL}/login", headers={"User-Agent": user_agent})
        csrf_token = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
    except Exception as e:
        print(f"   ❌ שגיאה בהתחברות ראשונית: {e}")
        return None

    # 2. Login
    login_data = {
        "semel": MASHOV_SEMEL,
        "year": year,
        "username": MASHOV_ID,
        "password": MASHOV_PASS,
        "loginType": 1 
    }
    
    headers = {
        "User-Agent": user_agent,
        "Content-Type": "application/json"
    }
    if csrf_token:
        headers["X-Csrf-Token"] = csrf_token

    login_resp = session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"   ❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return None

    # 3. עדכון טוקן
    # מנסים למצוא את הטוקן החדש בכל וריאציה אפשרית
    new_csrf = (session.cookies.get("Csrf-Token") or 
                session.cookies.get("csrf_token") or 
                login_resp.headers.get("X-Csrf-Token"))
    
    if new_csrf:
        session.headers.update({
            "User-Agent": user_agent,
            "X-Csrf-Token": new_csrf,
            "Content-Type": "application/json"
        })
        print("   ✅ התחברות הצליחה + טוקן עודכן.")
        return session
    else:
        print("   ⚠️ התחברות הצליחה אך לא נמצא טוקן חדש. מנסה להמשיך...")
        session.headers.update({"User-Agent": user_agent})
        return session

def fetch_children(session):
    """ מנסה לשלוף ילדים בכל הדרכים הידועות """
    endpoints = ["/students", "/user/children"]
    
    for endpoint in endpoints:
        print(f"   🔎 מנסה לשלוף דרך: {endpoint}...")
        resp = session.get(f"{BASE_URL}{endpoint}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    return data
            except:
                pass
        else:
            print(f"      (נכשל עם קוד {resp.status_code})")
            
    return None

def main_logic():
    # ננסה קודם את 2026, ואם לא ילך - את 2025
    years_to_try = [2026, 2025]
    
    for year in years_to_try:
        print(f"\n--- ניסיון לשנת {year} ---")
        session = get_session_and_login(year)
        
        if not session:
            continue # נכשל בהתחברות, עבור לשנה הבאה
            
        children = fetch_children(session)
        
        if children:
            print(f"🎉 יש! נמצאו {len(children)} ילדים בשנת {year}!")
            # אם הצלחנו, נמשיך למשיכת השיעורים ונסיים
            process_homework(session, children)
            return
        else:
            print(f"⚠️ לא נמצאו ילדים בשנת {year}.")
            
    print("\n❌ נכשלנו במציאת ילדים בכל השנים שנבדקו.")
    # ניצור קובץ ריק כדי לא לשבור את האתר
    save_file([])

def process_homework(session, children):
    all_tasks = []
    
    for child in children:
        name = child['privateName']
        child_id = child.get('childGuid') or child.get('studentId')
        
        grade = KIDS_MAPPING.get(name)
        if not grade:
            print(f"   ⚠️ מדלג על {name} (לא במיפוי)")
            continue

        print(f"   🔎 מושך שיעורים ל{name}...")
        try:
            # משיכת שיעורי בית
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

    save_file(all_tasks)

def save_file(tasks):
    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"\n💾 הקובץ עודכן סופית עם {len(tasks)} משימות.")

if __name__ == "__main__":
    main_logic()
