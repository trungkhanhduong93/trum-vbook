import zipfile, os

def pack_plugin(plugin_name):
    # Change to plugin directory
    os.chdir(plugin_name)
    
    with zipfile.ZipFile('plugin.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        z.write('icon.png', 'icon.png')
        z.write('plugin.json', 'plugin.json')
        
        # Explicit src/ directory entry — REQUIRED
        zi = zipfile.ZipInfo('src/')
        zi.external_attr = 0o040755 << 16
        z.writestr(zi, '')
        
        for f in sorted(os.listdir('src')):
            if f.endswith('.js') or f.endswith('.json'):
                z.write('src/' + f, 'src/' + f)
                
    print(f"Packed {plugin_name}/plugin.zip")
    print(zipfile.ZipFile('plugin.zip').namelist())
    
    # Change back
    os.chdir('..')

pack_plugin('minotruyen')
pack_plugin('minomanga')
pack_plugin('minohen')
pack_plugin('toptruyen')
pack_plugin('cuutruyen')
pack_plugin('zettruyen')
pack_plugin('luottruyen')
pack_plugin('luottruyennew')
pack_plugin('doctruyen3q')
pack_plugin('nettruyen')
pack_plugin('nhattruyen')
pack_plugin('goctruyentranh')
pack_plugin('truyenqq')
pack_plugin('mimimoe')
pack_plugin('truyenggvn')
pack_plugin('tcomic')

def pack_2ten():
    orig = os.getcwd()
    try:
        os.chdir('2ten/src')
        with zipfile.ZipFile('../2ten.zip', 'w', zipfile.ZIP_DEFLATED) as z:
            z.write('icon.png', 'icon.png')
            z.write('plugin.json', 'plugin.json')
            zi = zipfile.ZipInfo('src/')
            zi.external_attr = 0o040755 << 16
            z.writestr(zi, '')
            for f in sorted(os.listdir('src')):
                if f.endswith('.js') or f.endswith('.json'):
                    z.write('src/' + f, 'src/' + f)
        print("Packed 2ten/2ten.zip")
    finally:
        os.chdir(orig)

pack_2ten()


