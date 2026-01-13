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
    if not isinstance(s, str): return False # אם זה לא טקסט, זה לא בטוח
    try:
        s.encode('latin-1')
        return True
    except UnicodeEncodeError:
        return False

def debug_login_and_fetch():
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

    if csrf and is_safe_ascii(csrf): 
        headers["X-Csrf-Token"] = csrf
    
    login_data = {"semel": MASHOV_SEMEL, "year": 2026, "username": MASHOV_ID, "password": MASHOV_PASS, "loginType": 1}
    
    login_resp = dirty_session.post(f"{BASE_URL}/login", json=login_data, headers=headers)

    if login_resp.status_code != 200:
        print(f"❌ ההתחברות נכשלה (קוד {login_resp.status_code})")
        return []

    print("✅ התחברות הצליחה. מנתח מפתחות...")
    
    access_token = None
    user_id = None
    try:
        login_json = login_resp.json()
        raw_token = login_json.get('accessToken')
        
        # --- התיקון הגדול: טיפול בטוקן שהוא "קופסה" ---
        if isinstance(raw_token, dict):
            print(f"📦 ה-Token הוא אובייקט עם המפתחות: {list(raw_token.keys())}")
            # ננסה לנחש איפה הטוקן מתחבא
            access_token = raw_token.get('token') or raw_token.get('value') or raw_token.get('accessToken')
        else:
            access_token = raw_token # זה כבר מחרוזת רגילה
            
        user_id = login_json.get('credential', {}).get('userId')
    except:
        pass

    # --- שלב ב: יצירת סשן סטרילי ---
    print("✨ [שלב 2] יוצר סשן סטרילי...")
    clean_session = requests.Session()
    
    # הוספת טוקן רק אם הוא חולץ בהצלחה והוא תקין
    if access_token and is_safe_ascii(access_token):
        clean_session.headers["Authorization"] = f"Bearer {access_token}"
        print("🔑 Access Token תקין ונוסף לכותרות.")
    elif access_token:
        print("⚠️ ה-Token עדיין לא תקין (אולי עברית?) - מדלג עליו.")
    else:
        print("⚠️ לא נמצא Access Token, ממשיך בלי (אולי ה-CSRF יספיק).")
    
    if csrf and is_safe_ascii(csrf):
        clean_session.headers["X-Csrf-Token"] = csrf

    clean_session.headers["User-Agent"] = headers["User-Agent"]

    # --- שלב ג: שליפה ---
    print("🔎 מנסה לשלוף רשימת ת
