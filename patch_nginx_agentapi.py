with open('/etc/nginx/sites-available/agentapi.quanlymay.com.conf', 'r', encoding='utf-8') as f:
    conf = f.read()

mzpic_block = '''    # ── MzPic Admin Portal (/mzpic) ──
    location /mzpic {
        root /var/www/mzpic_admin;
        try_files $uri $uri/ /mzpic/index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
'''

if 'location /mzpic' not in conf:
    target = '    # ── Static JS/CSS Assets for SPA ──'
    conf = conf.replace(target, mzpic_block + '\n' + target, 1)
    with open('/etc/nginx/sites-available/agentapi.quanlymay.com.conf', 'w', encoding='utf-8') as f:
        f.write(conf)
    print('Added /mzpic location to agentapi.quanlymay.com.conf')
else:
    print('Already present in agentapi.quanlymay.com.conf')
