import urllib.request
import urllib.parse
import json

BASE = 'https://mokarrar-backend.onrender.com/api/v1'

def run_tests():
    results = {}
    
    # 1. Health check
    try:
        with urllib.request.urlopen(f'{BASE}/utils/health-check/') as resp:
            results['health_check'] = (resp.status == 200, resp.read().decode())
    except Exception as e:
        results['health_check'] = (False, str(e))

    # 2. Login to get token
    token = None
    try:
        data = urllib.parse.urlencode({'username': 'admin@mokarrar.com', 'password': 'qazwsxedc'}).encode()
        req = urllib.request.Request(f'{BASE}/login/access-token', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode())
            token = res_json.get('access_token')
            results['login'] = (resp.status == 200, f'Token acquired: {token[:15]}...')
    except Exception as e:
        results['login'] = (False, str(e))

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # 3. /users/me
    try:
        req = urllib.request.Request(f'{BASE}/users/me', headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            results['users_me'] = (resp.status == 200, data.get('email'))
    except Exception as e:
        results['users_me'] = (False, str(e))

    # 4. /tasks/
    try:
        req = urllib.request.Request(f'{BASE}/tasks/', headers=headers)
        with urllib.request.urlopen(req) as resp:
            tasks = json.loads(resp.read().decode())
            results['tasks_list'] = (resp.status == 200, f'{len(tasks)} tasks returned')
    except Exception as e:
        results['tasks_list'] = (False, str(e))

    # 5. /procurement/requests
    try:
        req = urllib.request.Request(f'{BASE}/procurement/requests', headers=headers)
        with urllib.request.urlopen(req) as resp:
            prs = json.loads(resp.read().decode())
            results['procurement_list'] = (resp.status == 200, f'{len(prs)} PR requests returned')
    except Exception as e:
        results['procurement_list'] = (False, str(e))

    # 6. /inventory/parts
    try:
        req = urllib.request.Request(f'{BASE}/inventory/parts', headers=headers)
        with urllib.request.urlopen(req) as resp:
            parts = json.loads(resp.read().decode())
            results['inventory_parts'] = (resp.status == 200, f'{len(parts)} inventory parts returned')
    except Exception as e:
        results['inventory_parts'] = (False, str(e))

    # 7. /dashboard/kpis
    try:
        req = urllib.request.Request(f'{BASE}/dashboard/kpis', headers=headers)
        with urllib.request.urlopen(req) as resp:
            kpis = json.loads(resp.read().decode())
            results['dashboard_kpis'] = (resp.status == 200, f'Tasks: {kpis.get("tasks", {}).get("total")}, Proc: {kpis.get("procurement", {}).get("pending_count")}')
    except Exception as e:
        results['dashboard_kpis'] = (False, str(e))

    # 8. Bale Bot Webhook
    try:
        body = json.dumps({'update_id': 999, 'message': {'message_id': 1, 'text': '/start', 'chat': {'id': 12345}}}).encode()
        req = urllib.request.Request(f'{BASE}/bot/bale/webhook', data=body, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            results['bale_webhook'] = (resp.status == 200, resp.read().decode())
    except Exception as e:
        results['bale_webhook'] = (False, str(e))

    print("\n================ LIVE API TEST REPORT ================")
    all_ok = True
    for k, v in results.items():
        status = 'PASS [OK]' if v[0] else 'FAIL [ERR]'
        if not v[0]:
            all_ok = False
        print(f'{status} {k:<18}: {v[1]}')
    print("=======================================================")
    print("ALL API ENDPOINTS HEALTHY:", all_ok)

if __name__ == '__main__':
    run_tests()
