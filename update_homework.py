import requests
import json
import os
from datetime import datetime, timedelta

MASHOV_ID = os.environ["MASHOV_ID"]
MASHOV_PASS = os.environ["MASHOV_PASS"]
MASHOV_SEMEL = os.environ["MASHOV_SEMEL"]

KIDS_MAPPING = {
    "יעל": 3,      
    "מעיין": 5     
}

BASE_URL = "https://web.mashov.info/api"

def is_safe_ascii(s):
    try:
        if not isinstance(s, str): return False
        s.encode('latin-1')
        return True
    except:
        return False

def parse_date(date_str):
    """ המרת תאריך של משוב למשהו שאפשר להשוות """
    try:
        # הפורמט של משוב הוא בדרך כלל: 2026-01-13T00:00:00
        return datetime.fromisoformat(date_str)
    except:
        return datetime.now()

def update_homework():
    print("🚀 Starting Homework Update Process...")
    
    # --- שלב 1: התחברות וקבלת נתונים ---
    dirty_session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    try:
        init_resp = dirty_session.get(f"{BASE_URL}/login", headers=headers)
        initial_csrf = init_resp.cookies.get("csrf_token") or init_resp.headers.get("X-Csrf-Token")
        if initial_csrf: headers["X-Csrf-Token"] = initial_csrf
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return []

    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        return []

    print("✅ Login success! Extracting data...")

    # חילוץ טוקן עדכני
    fresh_csrf = login_resp.headers.get("X-Csrf-Token") or login_resp.cookies.get("csrf_token") or initial_csrf
    
    # חילוץ רשימת הילדים
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

    print(f"✅ Found {len(children)} children. Switching to CLEAN session...")

    # --- שלב 2: סשן נקי ---
    clean_session = requests.Session()
    clean_session.headers.update(headers)
    
    if fresh_csrf and is_safe_ascii(fresh_csrf):
        clean_session.headers["X-Csrf-Token"] = fresh_csrf
        clean_session.cookies.set("csrf_token", fresh_csrf)

    for cookie in dirty_session.cookies:
        if is_safe_ascii(cookie.name) and is_safe_ascii(cookie.value):
            clean_session.cookies.set(cookie.name, cookie.value)

    # --- שלב 3: משיכת שיעורים וסינון ---
    all_tasks = []
    lookback_days = 30
    
    # תיקון הזחה כאן: השורות מיושרות לשמאל כמו lookback_days
    cutoff_date = datetime.now() - timedelta(days=lookback_days)
    cutoff_date = cutoff_date.replace(hour=0, minute=0, second=0, microsecond=0)  

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
            continue

        print(f"🔎 Fetching homework for {clean_name}...")
        try:
            hw_resp = clean_session.get(f"{BASE_URL}/students/{child_id}/homework")
            
            if hw_resp.status_code == 200:
                hw_list = hw_resp.json()
                print(f"   📥 Raw tasks found: {len(hw_list)}")
                
                count_added = 0 
                for hw in hw_list:
                    # 1. סינון לפי תאריך (רק מתאריך החיתוך והלאה)
                    task_date_str = hw.get('lessonDate')
                    if task_date_str:
                        task_date = parse_date(task_date_str)
                        
                        # תיקון לוגיקה: אם התאריך ישן מדי - דלג
                        if task_date < cutoff_date:
                            continue
                    
                    # 2. המרה למבנה שלנו
                    task_content = hw.get('homework') or hw.get('message') or "ללא פירוט"
                    if not task_content: continue # דילוג על משימות ריקות
                    
                    # עיצוב התאריך לתצוגה יפה (DD/MM)
                    display_date = task_date.strftime("%d/%m") if task_date_str else ""

                    all_tasks.append({
                        "id": str(hw.get('lessonId') or hw.get('id')),
                        "grade": grade,
                        "subject": hw.get('subjectName', 'כללי'),
                        "task": task_content,
                        "date": display_date 
                    })
                    count_added += 1
                
                print(f"   ✨ Added {count_added} relevant tasks (future/today).")
                
            else:
                print(f"   ❌ Failed to fetch (Code {hw_resp.status_code})")
        except Exception as e:
            print(f"   ⚠️ Error processing child: {e}")
            
    return all_tasks

if __name__ == "__main__":
    tasks = update_homework()
    
    # מיון המשימות לפי כיתה ואז לפי מקצוע
    tasks.sort(key=lambda x: (x['grade'], x['subject']))

    js_content = f"const homeworkData = {json.dumps(tasks, ensure_ascii=False, indent=4)};"
    with open("homework_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    if tasks:
        print(f"\n💾 SUCCESS! Saved {len(tasks)} tasks to homework_data.js")
    else:
        print("\n📁 Done. No future tasks found (File updated to empty list).")