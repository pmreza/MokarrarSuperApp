import urllib.request
import urllib.parse
import json

BASE = 'https://mokarrar-backend.onrender.com/api/v1'

def test_rbac():
    print("================ TESTING RBAC & USERS ================")
    
    # 1. Test Preset Logins
    test_accounts = [
        ("admin@mokarrar.com", "qazwsxedc", "Admin / Dev"),
        ("ceo", "MokarrarCeo2026!", "Managing Director (CEO)"),
        ("supervisor", "MokarrarLine2026!", "Line Supervisor"),
        ("warehouse", "MokarrarStore2026!", "Warehouse Manager"),
        ("technician", "MokarrarTech2026!", "Factory Technician"),
    ]

    admin_token = None

    for username, password, label in test_accounts:
        try:
            data = urllib.parse.urlencode({'username': username, 'password': password}).encode()
            req = urllib.request.Request(f'{BASE}/login/access-token', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                token = res.get('access_token')
                if username == 'admin@mokarrar.com':
                    admin_token = token
                print(f"[PASS] Login as {label:<25} ({username}) -> Token OK")
        except Exception as e:
            print(f"[FAIL] Login as {label} ({username}) -> Error: {e}")

    # 2. Check /users/me for CEO
    try:
        data = urllib.parse.urlencode({'username': 'ceo', 'password': 'MokarrarCeo2026!'}).encode()
        req = urllib.request.Request(f'{BASE}/login/access-token', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(req) as resp:
            ceo_token = json.loads(resp.read().decode())['access_token']
        
        req = urllib.request.Request(f'{BASE}/users/me', headers={'Authorization': f'Bearer {ceo_token}'})
        with urllib.request.urlopen(req) as resp:
            me = json.loads(resp.read().decode())
            print(f"[PASS] CEO Profile: Name='{me.get('full_name')}', Role='{me.get('role_title')}', Perms={len(me.get('permissions_list', []))}")
    except Exception as e:
        print(f"[FAIL] CEO Profile check: {e}")

    # 3. Test that public signup is BLOCKED (403 Forbidden)
    try:
        signup_data = json.dumps({'email': 'intruder@test.com', 'password': 'password123', 'full_name': 'Hacker'}).encode()
        req = urllib.request.Request(f'{BASE}/users/signup', data=signup_data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        print("[FAIL] Public signup succeeded (should have been blocked!)")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("[PASS] Public signup is strictly BLOCKED with 403 Forbidden.")
        else:
            print(f"[FAIL] Signup returned {e.code}")

    # 4. Test Roles Metadata
    try:
        req = urllib.request.Request(f'{BASE}/users/roles/metadata', headers={'Authorization': f'Bearer {admin_token}'})
        with urllib.request.urlopen(req) as resp:
            meta = json.loads(resp.read().decode())
            print(f"[PASS] Metadata: {len(meta.get('roles', []))} roles and {len(meta.get('permissions', []))} granular permissions loaded.")
    except Exception as e:
        print(f"[FAIL] Metadata load: {e}")

    # 5. Test Admin creating a new user (e.g. Modir Amel 2)
    test_new_user = f"modir_test_{int(urllib.request.time.time())}"
    try:
        new_user_data = json.dumps({
            'email': test_new_user,
            'full_name': 'مدیر تست موقت',
            'password': 'TempPassword2026!',
            'role': 'ceo',
            'permissions': json.dumps(['tasks:view', 'procurement:approve']),
            'is_active': True
        }).encode()
        req = urllib.request.Request(f'{BASE}/users/', data=new_user_data, headers={'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            created = json.loads(resp.read().decode())
            print(f"[PASS] Admin created new user: '{created.get('email')}' (Role: {created.get('role_title')})")
            
            # Delete the temporary test user
            del_req = urllib.request.Request(f'{BASE}/users/{created.get("id")}', headers={'Authorization': f'Bearer {admin_token}'}, method='DELETE')
            urllib.request.urlopen(del_req)
            print(f"[PASS] Temporary user cleaned up successfully.")
    except Exception as e:
        print(f"[FAIL] User creation/deletion test: {e}")

    print("=======================================================")

if __name__ == '__main__':
    test_rbac()
