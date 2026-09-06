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

let downloads = [];

function normalize(str) { return str.toLowerCase().replace(/[^a-z0-9]/g, ''); }

baseProducts.forEach(p => {
    let pType = p.type;
    // For each color in p.colors, find the corresponding image URL in astraProducts
    if (p.colors) {
        p.colors.forEach(c => {
            let apiImage = null;
            // Search all astraProducts for this exact color title
            for (let a of astraProducts) {
                if (a.colors) {
                    let matchingColor = a.colors.find(ac => ac.title === c.name);
                    if (matchingColor && matchingColor.image) {
                        apiImage = matchingColor.image;
                        break;
                    }
                }
            }
            if (apiImage) {
                let filename = `foto unit\\${pType} - ${c.name}.jpg`.replace(/[:*?"<>|/]/g, '_');
                downloads.push({ url: apiImage, path: filename });
            }
        });
    }
});

downloads.forEach(d => {
    if (!fs.existsSync(d.path)) {
        console.log("Downloading " + d.path);
        https.get(d.url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(d.path));
            }
        }).on('error', () => {});
    }
});
console.log('Background downloading started.');
