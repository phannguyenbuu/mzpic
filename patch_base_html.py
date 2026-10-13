with open('/opt/printagent/templates/base.html', 'r', encoding='utf-8') as f:
    content = f.read()

mzpic_nav = '''        <div class="sidebar-sep"></div>
        <a class="link {% if active_tab == 'mzpic' %}active{% endif %}" href="{{ url_for('mzpic_admin_page') }}"><span class="link-ico">🎨</span><span>MzPic</span></a>'''

if 'mzpic_admin_page' not in content:
    target = '''        <a class="link {% if active_tab == 'repairs' %}active{% endif %}" href="{{ url_for('repairs_page') }}"><span class="link-ico">&bull;</span><span>Tasks</span></a>'''
    if target in content:
        content = content.replace(target, target + '\n' + mzpic_nav, 1)
        with open('/opt/printagent/templates/base.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Successfully added MzPic navtab to base.html')
    else:
        print('Target repairs_page not found in base.html')
else:
    print('mzpic_admin_page already in base.html')
