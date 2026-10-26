import os
import urllib.request
import json
import base64
import hmac
import hashlib
import time

JWT_SECRET = os.environ.get('JWT_SECRET', 'test-jwt-signing-secret')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')
BASE = os.environ.get('PORTAL_BASE_URL', 'http://127.0.0.1:3000')

def b64url_encode(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def create_jwt(payload, secret=JWT_SECRET, alg='HS256'):
    header = {'alg': alg, 'typ': 'JWT'}
    h_b64 = b64url_encode(json.dumps(header))
    p_b64 = b64url_encode(json.dumps(payload))
    signing_input = f'{h_b64}.{p_b64}'.encode('utf-8')
    if alg == 'HS256':
        sig = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
        return f'{h_b64}.{p_b64}.{sig_b64}'
    elif alg == 'none':
        return f'{h_b64}.{p_b64}.'
    return f'{h_b64}.{p_b64}.fakesig'

def make_req(url, method='GET', headers=None, body=None):
    if headers is None:
        headers = {}
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 999, str(e)

print('==================================================================')
print('=== E2E AUDIT: RBAC, AUTH FAIL-CLOSED & SECURITY (VM 208) ===')
print('==================================================================\n')

# 1. Skenario 1: Tanpa Token
print('[Skenario 1: Tanpa Token / Unauthenticated]')
endpoints_s1 = [
    ('/api/me/context', 'GET', None),
    ('/api/deploy', 'POST', {}),
    ('/api/announcements', 'POST', {'title': 'Test', 'description': 'Test'}),
    ('/api/announcements/test-id', 'DELETE', None),
    ('/api/webhooks/event', 'POST', {'type': 'system.reboot', 'title': 'Test Reboot'})
]
for ep, m, body in endpoints_s1:
    st, _ = make_req(BASE + ep, m, body=body)
    print(f'  {m:6} {ep:30} -> HTTP {st} (Expected: 401)')

# 2. Skenario 2: Token Asal-Asalan / alg:none / Forged Signature
print('\n[Skenario 2: Token Forgery / alg:none / Invalid Sig]')
none_token = create_jwt({'sub': 'attacker', 'realm_access': {'roles': ['admin']}, 'exp': time.time() + 3600}, alg='none')
fake_token = create_jwt({'sub': 'attacker', 'realm_access': {'roles': ['admin']}, 'exp': time.time() + 3600}, secret='wrong-secret')

for t, name in [(none_token, 'alg:none token'), (fake_token, 'Forged signature token')]:
    h = {'Authorization': f'Bearer {t}'}
    s_ctx, _ = make_req(BASE + '/api/me/context', 'GET', headers=h)
    s_ann, _ = make_req(BASE + '/api/announcements', 'POST', headers=h, body={'title': 'X', 'description': 'X'})
    print(f'  {name:25} -> /api/me/context: HTTP {s_ctx}, /api/announcements: HTTP {s_ann} (Expected: 401)')

# 3. Skenario 3: Token Siswa (Role: student)
print('\n[Skenario 3: Token Siswa - Hak Akses Terbatas]')
student_payload = {
    'sub': 'siswa1',
    'preferred_username': 'siswa1',
    'name': 'Budi Santoso',
    'email': 'siswa1@s4ras.site',
    'realm_access': {'roles': ['student']},
    'exp': time.time() + 3600
}
student_token = create_jwt(student_payload)
s_headers = {'Authorization': f'Bearer {student_token}'}

s_ctx, ctx_body = make_req(BASE + '/api/me/context', 'GET', headers=s_headers)
u_info = json.loads(ctx_body).get('user', {}) if s_ctx == 200 else {}
print(f'  GET    /api/me/context                -> HTTP {s_ctx} (User: {u_info.get("username")}, Roles: {u_info.get("roles")})')

s_ann, _ = make_req(BASE + '/api/announcements', 'POST', headers=s_headers, body={'title': 'Ilegal', 'description': 'Hacked'})
print(f'  POST   /api/announcements             -> HTTP {s_ann} (Expected: 403 Forbidden)')

s_del, _ = make_req(BASE + '/api/announcements/ann-1', 'DELETE', headers=s_headers)
print(f'  DELETE /api/announcements/ann-1       -> HTTP {s_del} (Expected: 403 Forbidden)')

s_dep, _ = make_req(BASE + '/api/deploy', 'POST', headers=s_headers, body={})
print(f'  POST   /api/deploy                    -> HTTP {s_dep} (Expected: 403 Forbidden)')

s_ev, _ = make_req(BASE + '/api/webhooks/event', 'POST', headers=s_headers, body={'type': 'system.reboot', 'title': 'Simulate Crash'})
print(f'  POST   /api/webhooks/event (system.*) -> HTTP {s_ev} (Expected: 403 Forbidden)')

# 4. Skenario 4: Token Admin (Role: admin)
print('\n[Skenario 4: Token Admin - Hak Akses Penuh]')
admin_payload = {
    'sub': 'admin',
    'preferred_username': 'admin',
    'name': 'Administrator S4RAS',
    'email': 'admin@s4ras.site',
    'realm_access': {'roles': ['admin']},
    'exp': time.time() + 3600
}
admin_token = create_jwt(admin_payload)
a_headers = {'Authorization': f'Bearer {admin_token}'}

a_ctx, _ = make_req(BASE + '/api/me/context', 'GET', headers=a_headers)
print(f'  GET    /api/me/context                -> HTTP {a_ctx} (Expected: 200 OK)')

a_ann, ann_res = make_req(BASE + '/api/announcements', 'POST', headers=a_headers, body={'title': 'Audit Pengumuman', 'description': 'Pengumuman Resmi Admin'})
print(f'  POST   /api/announcements             -> HTTP {a_ann} (Expected: 201 Created)')
new_id = json.loads(ann_res).get('announcement', {}).get('id', 'ann-test')

a_del, _ = make_req(BASE + f'/api/announcements/{new_id}', 'DELETE', headers=a_headers)
print(f'  DELETE /api/announcements/{new_id} -> HTTP {a_del} (Expected: 200 OK)')

a_ev, _ = make_req(BASE + '/api/webhooks/event', 'POST', headers=a_headers, body={'type': 'system.reboot', 'title': 'Admin Simulation', 'message': 'Admin test'})
print(f'  POST   /api/webhooks/event (system.*) -> HTTP {a_ev} (Expected: 200 OK)')

# Test with ADMIN_TOKEN header
adm_hdr = {'x-admin-token': ADMIN_TOKEN}
t_ann, t_res = make_req(BASE + '/api/announcements', 'POST', headers=adm_hdr, body={'title': 'Token Admin', 'description': 'Header Token OK'})
print(f'  POST   /api/announcements (x-admin)   -> HTTP {t_ann} (Expected: 201 Created)')
try:
    t_id = json.loads(t_res).get('announcement', {}).get('id')
    if t_id:
        t_del, _ = make_req(BASE + f'/api/announcements/{t_id}', 'DELETE', headers=adm_hdr)
        print(f'  DELETE /api/announcements/{t_id} (x-admin) -> HTTP {t_del} (Expected: 200 OK)')
except Exception as e:
    pass

print('\n==================================================================')
print('=== AUDIT TELEMETRY, REDIS & MICROSERVICES (VM 208) ===')
print('==================================================================\n')
for ep in ['/api/health', '/api/summary', '/api/telemetry']:
    s, b = make_req(BASE + ep, 'GET')
    try:
        data = json.loads(b)
        extra = f"status={data.get('status') or 'ok'}"
    except:
        extra = ''
    print(f'  GET {ep:20} -> HTTP {s} ({extra})')
