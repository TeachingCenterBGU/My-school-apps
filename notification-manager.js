// ==============================================
// notification-manager.js
// רישום הטלפון לקבלת הודעות (FCM)
// 
// מה זה עושה:
// 1. מבקש מהילדה הרשאה לקבל הודעות
// 2. מקבל "כתובת" ייחודית לטלפון שלה
// 3. שומר את הכתובת בפיירבייס
// 4. הסקריפט בגיטהאב שולח הודעות לכתובת הזאת
//
// ⚠️ צריך להחליף את VAPID_KEY במפתח האמיתי!
//    Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// ==============================================

(function() {
    'use strict';

    // ========================================
    // ⚠️ החליפי את זה במפתח האמיתי מפיירבייס!
    // ========================================
    const VAPID_KEY = 'BEr6nDOQBKDLftzaE6EYGMgnPnNlDGkReBRxWPsrIMGrFGZ1ejN6t8xl88p2Sl0myUnoileED96Qd9oU_sRYLs8';

    // --- בדיקה שהכל מוכן ---
    function isSupported() {
        return (
            'Notification' in window &&
            'serviceWorker' in navigator &&
            typeof firebase !== 'undefined' &&
            typeof firebase.messaging === 'function' &&
            VAPID_KEY !== 'YOUR_VAPID_KEY_HERE'
        );
    }

    // --- שמירת כתובת ההודעות בפיירבייס ---
    async function saveToken(token) {
        if (!firebase.auth().currentUser) return;
        
        const uid = firebase.auth().currentUser.uid;
        const tokenKey = token.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
        
        try {
            await firebase.database().ref('users/' + uid + '/fcmTokens/' + tokenKey).set({
                token: token,
                createdAt: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 100)
            });
            console.log('🔔 FCM token saved');
        } catch (e) {
            console.error('Error saving FCM token:', e);
        }
    }

    // --- רישום לקבלת הודעות ---
    async function registerForNotifications() {
        try {
            const messaging = firebase.messaging();
            
            const token = await messaging.getToken({
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
            });

            if (token) {
                console.log('🔔 FCM token received');
                await saveToken(token);
                return true;
            }
            return false;
        } catch (e) {
            console.error('FCM registration error:', e);
            return false;
        }
    }

    // --- האזנה להודעות כשהדף פתוח ---
    function listenForMessages() {
        try {
            const messaging = firebase.messaging();
            messaging.onMessage((payload) => {
                console.log('📨 Message received:', payload);
                
                const title = payload.notification?.title || 'שיעורי בית';
                const body = payload.notification?.body || '';
                
                if (Notification.permission === 'granted') {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification(title, {
                            body: body,
                            icon: 'icon192.png',
                            badge: 'icon192.png',
                            tag: 'homework-reminder',
                            renotify: true,
                            vibrate: [200, 100, 200]
                        });
                    });
                }
            });
        } catch (e) {
            console.error('Message listener error:', e);
        }
    }

    // --- באנר בקשת הרשאה ---
    function showPermissionBanner() {
        if (Notification.permission !== 'default') return;
        if (document.getElementById('notif-permission-banner')) return;
        try { if (sessionStorage.getItem('notifDismissed')) return; } catch(e) {}

        const banner = document.createElement('div');
        banner.id = 'notif-permission-banner';
        banner.style.cssText = `
            position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
            background: white; border: 2px solid #5c6bc0; border-radius: 16px;
            padding: 14px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9990; direction: rtl; max-width: 350px; width: 90%;
            display: flex; align-items: center; gap: 12px;
            animation: notifSlideUp 0.4s ease;
        `;

        banner.innerHTML = `
            <span style="font-size: 1.8em; flex-shrink: 0;">🔔</span>
            <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 0.95em; color: #333; margin-bottom: 4px;">
                    רוצה תזכורת יומית?
                </div>
                <div style="font-size: 0.85em; color: #666;">
                    נשלח לך הודעה עם שיעורי הבית שנשארו
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button id="notif-allow-btn" style="
                        background: #5c6bc0; color: white; border: none;
                        padding: 7px 16px; border-radius: 10px; cursor: pointer;
                        font-family: inherit; font-size: 0.9em; font-weight: bold;
                    ">כן, תזכירו לי!</button>
                    <button id="notif-dismiss-btn" style="
                        background: #f5f5f5; color: #999; border: none;
                        padding: 7px 12px; border-radius: 10px; cursor: pointer;
                        font-family: inherit; font-size: 0.85em;
                    ">לא עכשיו</button>
                </div>
            </div>
        `;

        if (!document.getElementById('notif-slide-style')) {
            const style = document.createElement('style');
            style.id = 'notif-slide-style';
            style.textContent = `
                @keyframes notifSlideUp {
                    from { transform: translateX(-50%) translateY(30px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(banner);

        document.getElementById('notif-allow-btn').addEventListener('click', async () => {
            const btn = document.getElementById('notif-allow-btn');
            btn.textContent = '...רגע';
            btn.disabled = true;

            const permission = await Notification.requestPermission();
            banner.remove();

            if (permission === 'granted') {
                const success = await registerForNotifications();
                if (success) {
                    listenForMessages();
                    // הודעה קטנה
                    const toast = document.createElement('div');
                    toast.style.cssText = `
                        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                        background: #4caf50; color: white; padding: 10px 20px;
                        border-radius: 12px; font-size: 0.9em; z-index: 9999;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    `;
                    toast.textContent = '🔔 מעולה! תקבלי הודעות על שיעורי בית';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                }
            }
        });

        document.getElementById('notif-dismiss-btn').addEventListener('click', () => {
            banner.remove();
            try { sessionStorage.setItem('notifDismissed', 'true'); } catch(e) {}
        });
    }

    // --- אתחול (נקרא מ-firebase-homework.js) ---
    window.initNotifications = function() {
        if (!isSupported()) {
            if (VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
                console.log('🔔 Notifications: VAPID_KEY not configured yet');
            }
            return;
        }

        if (Notification.permission === 'granted') {
            registerForNotifications();
            listenForMessages();
        } else if (Notification.permission === 'default') {
            setTimeout(() => showPermissionBanner(), 4000);
        }
    };
})();
