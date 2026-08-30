"""Dong goi MOT nguon thoi:  python pack-one.py goctruyentranh

Dung khi sua o may va muon cai file zip thang vao VBook (khong qua GitHub),
vi du sau khi dan token ca nhan vao src/config.js.
"""
import json
import os
import re
import sys
import zipfile


def pack(name):
    src = os.path.join(name, 'src')
    if not os.path.isdir(src):
        sys.exit('Khong thay %s/src' % name)

    out = os.path.join(name, 'plugin.zip')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(name, 'icon.png'), 'icon.png')
        z.write(os.path.join(name, 'plugin.json'), 'plugin.json')
        # Entry thu muc src/ la BAT BUOC — thieu no VBook cai that bai im lang
        zi = zipfile.ZipInfo('src/')
        zi.external_attr = 0o040755 << 16
        z.writestr(zi, '')
        for f in sorted(os.listdir(src)):
            if f.endswith('.js') or f.endswith('.json'):
                z.write(os.path.join(src, f), 'src/' + f)

    z = zipfile.ZipFile(out)
    names = z.namelist()
    assert 'src/' in names, 'THIEU entry src/'
    ver = json.loads(z.read('plugin.json').decode('utf-8'))['metadata']['version']
    print('Da dong goi %s  (v%s)' % (out, ver))
    print('  ' + ', '.join(names))

    # Canh bao neu co bi mat da duoc dien vao ma file van nam trong git
    for f in names:
        if not f.endswith('.js'):
            continue
        body = z.read(f).decode('utf-8', 'replace')
        for m in re.finditer(r'var\s+(\w*TOKEN\w*)\s*=\s*[\'"]([^\'"]+)[\'"]', body):
            print('')
            print('  !! %s trong %s DANG CO GIA TRI (%d ky tu).' % (m.group(1), f, len(m.group(2))))
            print('  !! Day la thong tin dang nhap — DUNG commit/push file nay len GitHub cong khai.')
            print('  !! Cai file zip nay thang vao VBook, va giu gia tri do chi o may.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Dung: python pack-one.py <ten-nguon>')
    pack(sys.argv[1])
