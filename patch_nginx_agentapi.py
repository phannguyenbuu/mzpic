with open('/etc/nginx/sites-available/agentapi.quanlymay.com.conf', 'r', encoding='utf-8') as f:
    conf = f.read()

mzpic_block = '''    # ── MzPic Admin Portal (/mzpic) ──
    location /mzpic {
        root /var/www/mzpic_admin;
        try_files $uri $uri/ /mzpic/index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
'''

if mzpic_block in conf:
    conf = conf.replace(mzpic_block + '\n', '')
    conf = conf.replace(mzpic_block, '')
    with open('/etc/nginx/sites-available/agentapi.quanlymay.com.conf', 'w', encoding='utf-8') as f:
        f.write(conf)
    print('Removed static /mzpic location block from nginx conf')
else:
    print('Block not found or already removed')
