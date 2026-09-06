const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/const baseProducts = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

let baseProductsJs = match[1];
let baseProducts = [];
eval('baseProducts = ' + baseProductsJs);

const d = require('./products.json');
const astraProducts = d.data || d;

function normalize(str) { return str.toLowerCase().replace(/[^a-z0-9]/g, ''); }

baseProducts.forEach(p => {
    let typeUpper = p.type.toUpperCase();
    
    // Determine the exact Astra API product to pull from
    let apiModelName = null;
    let colorFilter = (cName) => true;

    if (typeUpper.includes('BEAT STREET')) {
        apiModelName = 'BeAT Street';
    } else if (typeUpper.includes('BEAT')) {
        apiModelName = 'BeAT';
        if (typeUpper.includes('STREET')) colorFilter = (c) => c.includes('Street');
        else if (typeUpper.includes('DLX') || typeUpper.includes('DELUXE')) colorFilter = (c) => c.includes('Deluxe');
        else if (typeUpper.includes('ISS')) colorFilter = (c) => c.includes('ISS');
        else colorFilter = (c) => c.includes('CBS') && !c.includes('ISS');
    } else if (typeUpper.includes('SCOOPY')) {
        apiModelName = 'Scoopy';
        if (typeUpper.includes('FASHION')) colorFilter = (c) => c.includes('Fashion') || c.includes('Energetic');
        else if (typeUpper.includes('PRESTIGE') || typeUpper.includes('STYLISH')) colorFilter = (c) => c.includes('Prestige') || c.includes('Stylish');
    } else if (typeUpper.includes('VARIO 125')) {
        apiModelName = 'Vario 125';
        if (typeUpper.includes('STREET')) colorFilter = (c) => c.includes('Street');
        else if (typeUpper.includes('ISS')) colorFilter = (c) => c.includes('Advance');
        else colorFilter = (c) => c.includes('Sporty');
    } else if (typeUpper.includes('VARIO 160')) {
        apiModelName = 'Vario Evo 160';
        if (typeUpper.includes('ABS')) colorFilter = (c) => c.includes('Ultimate');
        else if (typeUpper.includes('NITRO')) colorFilter = (c) => c.includes('Nitro');
        else colorFilter = (c) => c.includes('Glossy') && !c.includes('Ultimate') && !c.includes('Nitro');
    } else if (typeUpper.includes('PCX')) {
        apiModelName = 'New PCX 160';
        if (typeUpper.includes('ABS')) colorFilter = (c) => c.includes('Ultimate') || c.includes('Exceptional') || c.includes('Signature');
        else colorFilter = (c) => c.includes('Phenomenal') || c.includes('Marvelous');
    } else if (typeUpper.includes('ADV 160')) {
        apiModelName = 'NEW ADV 160';
        if (typeUpper.includes('ABS')) colorFilter = (c) => c.includes('Tough') || c.includes('SUV');
        else colorFilter = (c) => c.includes('Dynamic') || c.includes('Solid');
    } else if (typeUpper.includes('STYLO')) {
        apiModelName = 'STYLO 160';
        if (typeUpper.includes('ABS')) colorFilter = (c) => c.includes('Royal') || c.includes('Burgundy');
        else colorFilter = (c) => c.includes('Glam');
    } else if (typeUpper.includes('GENIO')) {
        apiModelName = 'Genio';
        if (typeUpper.includes('ISS')) colorFilter = (c) => c.includes('Fabulous');
        else colorFilter = (c) => c.includes('Radiant') || c.includes('Vibrant');
    } else if (typeUpper.includes('SUPRA X 125')) {
        apiModelName = 'Supra X 125 FI';
    } else if (typeUpper.includes('REVO')) {
        apiModelName = 'Revo';
        if (typeUpper.includes('FIT')) colorFilter = (c) => c.includes('Fit');
        else colorFilter = (c) => c.includes('X');
    } else if (typeUpper.includes('CBR150R')) {
        apiModelName = 'CBR150R';
        if (typeUpper.includes('ABS')) colorFilter = (c) => c.includes('ABS');
        else colorFilter = (c) => c.includes('STD') || (!c.includes('ABS'));
    }

    // Default fallback
    if (!apiModelName) {
        let firstWord = p.type.split(' ')[0].toLowerCase();
        let apiMatch = astraProducts.find(a => normalize(a.title || '').includes(firstWord));
        if (apiMatch) apiModelName = apiMatch.title;
    }

    if (apiModelName) {
        let exactMatch = astraProducts.find(a => normalize(a.title) === normalize(apiModelName));
        if (!exactMatch) exactMatch = astraProducts.find(a => normalize(a.title).includes(normalize(apiModelName)));
        
        if (exactMatch && exactMatch.colors) {
            let filteredColors = exactMatch.colors.filter(c => colorFilter(c.title || ''));
            
            // If strict filtering removed all, fallback to all colors of that variant
            if (filteredColors.length === 0) filteredColors = exactMatch.colors;

            let mappedColors = [];
            filteredColors.forEach(c => {
                let cTitle = c.title || 'Unknown';
                let hexColor = '#dc2626';
                let lt = cTitle.toLowerCase();
                if (lt.includes('black') || lt.includes('hitam')) hexColor = '#222222';
                else if (lt.includes('white') || lt.includes('putih')) hexColor = '#f8f9fa';
                else if (lt.includes('blue') || lt.includes('biru')) hexColor = '#3b82f6';
                else if (lt.includes('silver')) hexColor = '#9ca3af';
                else if (lt.includes('grey') || lt.includes('gray') || lt.includes('abu')) hexColor = '#6b7280';
                else if (lt.includes('brown') || lt.includes('coklat')) hexColor = '#78350f';
                else if (lt.includes('green') || lt.includes('hijau')) hexColor = '#22c55e';
                else if (lt.includes('yellow') || lt.includes('kuning')) hexColor = '#eab308';
                else if (lt.includes('red') || lt.includes('merah')) hexColor = '#d32f2f';
                else if (lt.includes('matte')) hexColor = '#4b5563';
                
                mappedColors.push({ name: cTitle, hex: hexColor });
            });
            
            if (mappedColors.length > 0) {
                p.colors = mappedColors;
            }
        }
    }
});

let newJsArray = JSON.stringify(baseProducts, null, 4);
let newHtml = html.replace(baseProductsJs, newJsArray);

fs.writeFileSync('index.html', newHtml);
console.log('Fixed colors array successfully.');
