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

pack_plugin('truyenvi')
pack_plugin('metruyen')
