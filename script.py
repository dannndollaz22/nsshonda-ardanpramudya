import json
import re
import os
import urllib.request

with open('products.json', 'r', encoding='utf-8') as f:
    astra_data = json.load(f)

astra_products = []
if 'data' in astra_data:
    data = astra_data['data']
    if isinstance(data, list):
        astra_products = data
    elif isinstance(data, dict) and 'data' in data:
        astra_products = data['data']
else:
    astra_products = astra_data

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r"const baseProducts = (\[.*?\]);", html, re.DOTALL)
if not match: exit(1)
base_products_js = match.group(1)

json_str = base_products_js.replace("'", '"')
json_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
base_products = json.loads(json_str)

os.makedirs('foto unit', exist_ok=True)

def normalize(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())

for product in base_products:
    p_type = product['type']
    norm_type = normalize(p_type)
    
    best_match = None
    for a_prod in astra_products:
        a_title = a_prod.get('title', '')
        if normalize(a_title) in norm_type or norm_type in normalize(a_title):
            best_match = a_prod
            break
            
    if not best_match:
        words = p_type.split()
        for a_prod in astra_products:
            if words[0].lower() in normalize(a_prod.get('title', '')):
                best_match = a_prod
                break
                
    if best_match:
        colors = best_match.get('colors', [])
        if colors and isinstance(colors, list):
            mapped_colors = []
            for c in colors:
                c_title = c.get('title', 'Unknown')
                c_img = c.get('image', '')
                if not c_img: continue
                
                hex_color = "#dc2626"
                lower_title = c_title.lower()
                if "black" in lower_title: hex_color = "#222222"
                elif "white" in lower_title: hex_color = "#f8f9fa"
                elif "blue" in lower_title: hex_color = "#3b82f6"
                elif "silver" in lower_title: hex_color = "#9ca3af"
                elif "grey" in lower_title or "gray" in lower_title: hex_color = "#6b7280"
                elif "brown" in lower_title: hex_color = "#78350f"
                elif "green" in lower_title: hex_color = "#22c55e"
                elif "yellow" in lower_title: hex_color = "#eab308"
                
                mapped_colors.append({"name": c_title, "hex": hex_color})
                
                filename = f"foto unit/{p_type} - {c_title}.jpg".replace("/", "_").replace("\\", "_").replace(":", "_")
                if not os.path.exists(filename):
                    print(f"Downloading {filename}...")
                    req = urllib.request.Request(c_img, headers={'User-Agent': 'Mozilla/5.0'})
                    try:
                        with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
                            out_file.write(response.read())
                    except: pass
            
            if mapped_colors: product['colors'] = mapped_colors

new_js_array = json.dumps(base_products, indent=4)
new_html = html.replace(base_products_js, new_js_array)
new_html = new_html.replace("colors: colorMap[p.category] || colorMap['Matic']", "colors: p.colors || colorMap[p.category] || colorMap['Matic']")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
