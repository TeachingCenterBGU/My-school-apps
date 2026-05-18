# ==============================================
# send_notifications.py
# שליחת נוטיפיקציות לילדות אחרי עדכון שיעורי בית
# רץ בגיטהאב מיד אחרי update_homework.py
#
# דרישות:
#   pip install firebase-admin
#
# משתני סביבה (GitHub Secrets):
#   FIREBASE_SERVICE_ACCOUNT — תוכן קובץ JSON של Service Account
# ==============================================

import json
import os
import re
import firebase_admin
from firebase_admin import credentials, db, messaging
from datetime import datetime, timedelta

# --- אתחול Firebase Admin ---

def init_firebase():
    """אתחול חיבור לפיירבייס באמצעות מפתח שרת"""
    cred_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT', '')
    if not cred_json:
        print("❌ Missing FIREBASE_SERVICE_ACCOUNT environment variable")
        return False

    try:
        cred_data = json.loads(cred_json)
        cred = credentials.Certificate(cred_data)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://homework-barad-default-rtdb.europe-west1.firebasedatabase.app'
        })
        print("✅ Firebase Admin initialized")
        return True
    except Exception as e:
        print(f"❌ Firebase init failed: {e}")
        return False


# --- קריאת נתוני שיעורי בית ---

def load_homework_from_file(filename):
    """קריאת משימות מקובץ JS (homework_data.js או homework_manual.js)"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # חילוץ המערך מתוך הקובץ: const xxxData = [...];
        match = re.search(r'=\s*(\[.*\])\s*;', content, re.DOTALL)
        if match:
            return json.loads(match.group(1))
    except FileNotFoundError:
        print(f"   ⚠️ File not found: {filename}")
    except Exception as e:
        print(f"   ⚠️ Error reading {filename}: {e}")
    
    return []


def get_all_tasks():
    """טעינת כל המשימות — אוטומטיות + ידניות"""
    auto = load_homework_from_file('homework_data.js')
    manual = load_homework_from_file('homework_manual.js')
    print(f"   📋 Loaded {len(auto)} auto + {len(manual)} manual tasks")
    return auto + manual


# --- בדיקת משימות פתוחות לכל משתמש ---

def get_pending_tasks(all_tasks, grade, done_data):
    pending = []
    for task in all_tasks:
        if task.get('grade') != grade:
            continue
        task_id = str(task.get('id', ''))
        if done_data.get(task_id):
            continue
        pending.append(task)
    return pending


def summarize_tasks(pending_tasks):
    """סיכום המשימות לפי מקצוע — לטקסט ההודעה"""
    if not pending_tasks:
        return None
    
    by_subject = {}
    for task in pending_tasks:
        subj = task.get('subject', 'כללי')
        if subj not in by_subject:
            by_subject[subj] = 0
        by_subject[subj] += 1
    
    parts = [f"{subj} ({count})" for subj, count in by_subject.items()]
    return ', '.join(parts)


# --- שליחת הודעות ---

def send_notification(token, title, body):
    """שליחת הודעה בודדת לטלפון"""
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(
                title=title,
                body=body,
                icon='https://inbalbar.github.io/My-school-apps/icon192.png',
                badge='https://inbalbar.github.io/My-school-apps/icon192.png',
                tag='homework-reminder',
                renotify=True,
            ),
            fcm_options=messaging.WebpushFCMOptions(
                link='https://inbalbar.github.io/My-school-apps/'
            )
        ),
        token=token
    )
    
    try:
        response = messaging.send(message)
        print(f"      ✅ Sent: {response}")
        return True
    except messaging.UnregisteredError:
        print(f"      ⚠️ Token expired — will be cleaned up")
        return False
    except Exception as e:
        print(f"      ❌ Send failed: {e}")
        return False


def cleanup_expired_token(uid, token_key):
    """מחיקת טוקן שפג תוקף"""
    try:
        db.reference(f'users/{uid}/fcmTokens/{token_key}').delete()
        print(f"      🧹 Cleaned up expired token")
    except:
        pass


# --- תהליך ראשי ---

def main():
    print("\n🔔 Starting Notification Process...")
    
    # 1. אתחול
    if not init_firebase():
        return
    
    # 2. טעינת משימות
    all_tasks = get_all_tasks()
    if not all_tasks:
        print("📭 No tasks found — skipping notifications")
        return
    
    # 3. קריאת כל המשתמשים מפיירבייס
    print("👥 Loading users from Firebase...")
    try:
        users_data = db.reference('users').get() or {}
    except Exception as e:
        print(f"❌ Failed to load users: {e}")
        return
    
    if not users_data:
        print("📭 No registered users — skipping")
        return
    
    print(f"   Found {len(users_data)} users")
    
    sent_count = 0
    skip_count = 0
    
    grade_names = {3: "ג'", 5: "ה'"}
    
    for uid, user_info in users_data.items():
        grade = user_info.get('grade')
        fcm_tokens = user_info.get('fcmTokens', {})
        
        if not grade:
            print(f"   ⏭️ User {uid[:8]}... has no grade — skipping")
            skip_count += 1
            continue
        
        if not fcm_tokens:
            print(f"   ⏭️ User {uid[:8]}... has no notification tokens — skipping")
            skip_count += 1
            continue
        
        # טעינת משימות שבוצעו
        try:
            done_data = db.reference(f'done/{uid}').get() or {}
        except:
            done_data = {}
        
        # חישוב משימות פתוחות
        pending = get_pending_tasks(all_tasks, grade, done_data)
        
        if not pending:
            print(f"   🎉 User {uid[:8]}... (grade {grade}) — all done!")
            # שולחים הודעת כל הכבוד
            for token_key, token_data in fcm_tokens.items():
                token = token_data.get('token') if isinstance(token_data, dict) else token_data
                if token:
                    send_notification(
                        token,
                        'כל הכבוד! 🌟',
                        'סיימת את כל שיעורי הבית!'
                    )
                    sent_count += 1
            continue
        
        # יש משימות פתוחות — שליחת הודעה
        summary = summarize_tasks(pending)
        grade_name = grade_names.get(grade, str(grade))
        title = f"📝 יש {len(pending)} משימות לכיתה {grade_name}"
        body = summary
        
        print(f"   📨 User {uid[:8]}... — {len(pending)} pending tasks")
        
        for token_key, token_data in fcm_tokens.items():
            token = token_data.get('token') if isinstance(token_data, dict) else token_data
            if not token:
                continue
            
            success = send_notification(token, title, body)
            if success:
                sent_count += 1
            else:
                cleanup_expired_token(uid, token_key)
    
    print(f"\n📊 Summary: {sent_count} notifications sent, {skip_count} users skipped")
    print("✅ Notification process complete!")


if __name__ == "__main__":
    main()
