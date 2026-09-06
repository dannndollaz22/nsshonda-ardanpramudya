const fs = require('fs');
const https = require('https');

const astraData = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const astraProducts = astraData.data || astraData;

let html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/const baseProducts = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

let baseProductsJs = match[1];
let baseProducts = [];
eval('baseProducts = ' + baseProductsJs);

if (!fs.existsSync('foto unit')) fs.mkdirSync('foto unit');

function normalize(str) { return str.toLowerCase().replace(/[^a-z0-9]/g, ''); }

let downloads = [];

baseProducts.forEach(p => {
    let pType = p.type;
    let normType = normalize(pType);
    
    let bestMatch = astraProducts.find(a => {
        let aTitle = normalize(a.title || '');
        return aTitle.includes(normType) || normType.includes(aTitle);
    });
    
    if (!bestMatch) {
        let firstWord = pType.split(' ')[0].toLowerCase();
        bestMatch = astraProducts.find(a => normalize(a.title || '').includes(firstWord));
    }
    
    if (bestMatch && bestMatch.colors) {
        let mappedColors = [];
        bestMatch.colors.forEach(c => {
            let cTitle = c.title || 'Unknown';
            let cImg = c.image;
            if (!cImg) return;
            
            let hexColor = '#dc2626';
            let lt = cTitle.toLowerCase();
            if (lt.includes('black')) hexColor = '#222222';
            else if (lt.includes('white')) hexColor = '#f8f9fa';
            else if (lt.includes('blue')) hexColor = '#3b82f6';
            else if (lt.includes('silver')) hexColor = '#9ca3af';
            else if (lt.includes('grey') || lt.includes('gray')) hexColor = '#6b7280';
            else if (lt.includes('brown')) hexColor = '#78350f';
            else if (lt.includes('green')) hexColor = '#22c55e';
            else if (lt.includes('yellow')) hexColor = '#eab308';
            else if (lt.includes('red')) hexColor = '#d32f2f';
            else if (lt.includes('matte')) hexColor = '#4b5563';
            
            mappedColors.push({ name: cTitle, hex: hexColor });
            
            let filename = `foto unit/${pType} - ${cTitle}.jpg`.replace(/[:*?"<>|\\/]/g, '_');
            downloads.push({ url: cImg, path: filename });
        });
        if (mappedColors.length > 0) {
            p.colors = mappedColors;
        }
    }
});

let newJsArray = JSON.stringify(baseProducts, null, 4);
let newHtml = html.replace(baseProductsJs, newJsArray);
newHtml = newHtml.replace(/colors: colorMap\[p.category\] \|\| colorMap\['Matic'\]/g, "colors: p.colors || colorMap[p.category] || colorMap['Matic']");

fs.writeFileSync('index.html', newHtml);
console.log('index.html updated successfully.');

downloads.forEach(d => {
    if (!fs.existsSync(d.path)) {
        https.get(d.url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(d.path));
            }
        }).on('error', () => {});
    }
});
console.log('Downloading started in background.');
