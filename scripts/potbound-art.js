// Draws the flat plant illustrations for the Potbound example shop, and
// writes the sample products to import into Sanity.
//   node scripts/potbound-art.js
// The product pictures go to Sanity as PNGs. After changing one, turn each
// potbound-seed/*.svg into an 800x800 .png (for example, open it in Chrome
// and take a screenshot). Then, from the Studio folder:
//   npx sanity dataset import <this repo>/scripts/potbound-seed/seed.ndjson --dataset production --replace
const fs = require('fs');
const path = require('path');

const ART = path.join(__dirname, '..', 'public', 'frontendexamples', 'potbound-art');
const SEED = path.join(__dirname, 'potbound-seed');
fs.mkdirSync(ART, { recursive: true });
fs.mkdirSync(SEED, { recursive: true });

const C = {
  ink: '#151515', clay: '#d7774b', clayDark: '#b85f37', cream: '#efe6d6',
  leaf: '#2f6b3f', leafDark: '#1f4d30', leafLight: '#5ea566', lime: '#d7f36b',
  sage: '#dfe8d6', sand: '#f1e4cf', sky: '#d6e4ec', blush: '#f3d4c8', butter: '#f6e7a1'
};
const r1 = n => Math.round(n * 10) / 10;

const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${body}
</svg>\n`;

// A pot centered on x = cx with its rim at y = top
function pot(cx, top, w = 260, color = C.clay, rim = C.clayDark) {
  const bottom = top + 170, inset = w * 0.12;
  return `<ellipse cx="${cx}" cy="${bottom + 8}" rx="${w * 0.5}" ry="16" fill="${C.ink}" opacity=".12"/>
<path d="M${cx - w / 2 + 6} ${top + 34} L${cx - w / 2 + inset} ${bottom} H${cx + w / 2 - inset} L${cx + w / 2 - 6} ${top + 34}Z" fill="${color}"/>
<rect x="${cx - w / 2 - 12}" y="${top}" width="${w + 24}" height="44" rx="10" fill="${rim}"/>`;
}

// A leaf shape pointing up from (0, 0), length s
const leafPath = (s, wide = 0.55) =>
  `M0 0 C${r1(-s * wide)} ${r1(-s * 0.25)} ${r1(-s * wide)} ${r1(-s * 0.8)} 0 ${-s} C${r1(s * wide)} ${r1(-s * 0.8)} ${r1(s * wide)} ${r1(-s * 0.25)} 0 0Z`;
const leaf = (x, y, s, rot, color, wide) =>
  `<path d="${leafPath(s, wide)}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})" fill="${color}"/>`;

// ----- One drawing per product, on an 800x800 canvas -----
const draw = {};

draw.snake = () => {
  const blades = [[-80, 300, -10], [-40, 400, -4], [0, 460, 1], [45, 380, 6], [85, 290, 12], [-110, 220, -18], [115, 210, 20]];
  return blades.map(([x, h, tilt], i) => {
    const x0 = 400 + x, top = 560 - h;
    return `<path d="M${x0 - 26} 560 C${x0 - 34} ${top + h * 0.5} ${x0 - 8 + tilt} ${top + 40} ${x0 + tilt * 3} ${top} C${x0 + 18 + tilt} ${top + 60} ${x0 + 34} ${top + h * 0.55} ${x0 + 26} 560Z" fill="${i % 2 ? C.leafDark : C.leaf}" stroke="${C.butter}" stroke-width="6"/>
<path d="M${x0 - 14} ${top + h * 0.45} q14 -10 28 0 M${x0 - 16} ${top + h * 0.7} q16 -10 32 0" stroke="${C.leafLight}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  }).join('') + pot(400, 540);
};

draw.pothos = () => {
  const vine = (d, leaves) => `<path d="${d}" stroke="${C.leafDark}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    leaves.map(([x, y, rot, s]) => leaf(x, y, s, rot, C.leafLight) + `<path d="M${x} ${y} l${r1(Math.sin(rot * Math.PI / 180) * s * 0.6)} ${r1(-Math.cos(rot * Math.PI / 180) * s * 0.6)}" stroke="${C.butter}" stroke-width="5" stroke-linecap="round"/>`).join('');
  return vine('M290 540 C220 600 200 680 230 770', [[250, 600, -120, 70], [215, 680, -60, 64], [235, 760, -150, 58]]) +
    vine('M510 540 C590 600 600 690 560 780', [[560, 610, 120, 72], [590, 700, 60, 64], [560, 770, 150, 56]]) +
    [[320, 545, -52, 175], [480, 545, 50, 175], [400, 545, 0, 215], [355, 545, -24, 160], [445, 545, 26, 165]]
      .map(([x, y, rot, s], i) => leaf(x, y, s, rot, i % 2 ? C.leafLight : C.leaf)).join('') +
    pot(400, 520, 240, C.cream, '#ddd0ba');
};

// bg: the color behind the plant, used for the cuts in the leaves
draw.monstera = (bg = C.sky) => {
  // Big round leaves, with background-colored cuts for the famous splits
  const big = (x, y, s, rot, bg) => {
    const cuts = [-60, -30, 0, 30, 60].map(a => `<path d="M0 ${-s * 0.45} L${r1(Math.sin(a * Math.PI / 180) * s)} ${r1(-s * 0.45 - Math.cos(a * Math.PI / 180) * s)}" stroke="${bg}" stroke-width="${s * 0.07}" stroke-linecap="round"/>`).join('');
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 V${-s * 0.4}" stroke="${C.leafDark}" stroke-width="10"/>
<path d="M0 ${-s * 0.4} C${-s * 0.75} ${-s * 0.4} ${-s * 0.8} ${-s * 1.35} 0 ${-s * 1.35} C${s * 0.8} ${-s * 1.35} ${s * 0.75} ${-s * 0.4} 0 ${-s * 0.4}Z" fill="${C.leaf}"/>
<g transform="translate(0 ${-s * 0.4})">${cuts.replace(/-s/g, '')}</g>
<path d="M0 ${-s * 0.45} V${-s * 1.25}" stroke="${C.leafLight}" stroke-width="5"/></g>`;
  };
  return [[330, 560, -35, 250], [470, 560, 32, 240], [400, 560, 0, 300]].map(([x, y, rot, s]) => big(x, y, s, rot, bg)).join('') + pot(400, 540, 280);
};

draw.zz = () => {
  const stems = [[-90, -25, 330], [-40, -10, 400], [10, 4, 430], [60, 16, 380], [100, 30, 300]];
  return stems.map(([x, tilt, h]) => {
    const x0 = 400 + x, dx = Math.sin(tilt * Math.PI / 180) * h, top = 560 - h;
    const leaflets = [];
    for (let k = 1; k <= 6; k++) {
      const t = k / 7, lx = x0 + dx * t, ly = 560 - h * t;
      leaflets.push(leaf(lx, ly, 62, tilt - 55, k % 2 ? C.leafDark : C.leaf, 0.42), leaf(lx, ly, 62, tilt + 55, k % 2 ? C.leaf : C.leafDark, 0.42));
    }
    return `<path d="M${x0} 560 L${r1(x0 + dx)} ${top}" stroke="${C.leafDark}" stroke-width="9" stroke-linecap="round"/>${leaflets.join('')}${leaf(x0 + dx, top + 4, 60, tilt, C.leaf, 0.42)}`;
  }).join('') + pot(400, 540, 250, C.ink, '#2c2c2c');
};

draw.fiddle = () => {
  const leaves = [[-70, 250, -40], [75, 300, 42], [-60, 380, -55], [70, 420, 55], [0, 190, -4], [-20, 470, -70]];
  return `<path d="M400 560 C395 450 405 330 400 200" stroke="#6b4a2f" stroke-width="16" fill="none" stroke-linecap="round"/>` +
    leaves.map(([x, y, rot]) => `<g transform="translate(${400 + x * 0.3} ${y}) rotate(${rot})"><path d="M0 0 C-80 -20 -70 -110 -40 -140 C-20 -165 20 -165 40 -140 C70 -110 80 -20 0 0Z" fill="${rot < 0 ? C.leaf : C.leafDark}"/><path d="M0 -8 V-140" stroke="${C.leafLight}" stroke-width="5"/></g>`).join('') +
    pot(400, 540, 230, C.cream, '#ddd0ba');
};

draw.pearls = () => {
  const strand = (x, len, sway) => {
    const pearls = [];
    for (let i = 0; i < len; i++) {
      const y = 560 + i * 26, px = x + Math.sin(i * 0.6) * sway;
      pearls.push(`<circle cx="${r1(px)}" cy="${y}" r="12" fill="${i % 3 ? C.leafLight : C.leaf}"/>`);
    }
    return `<path d="M${x} 545 V${560 + len * 26}" stroke="${C.leafDark}" stroke-width="3"/>` + pears(pearls);
  };
  const pears = list => list.join('');
  const top = [];
  for (let i = 0; i < 39; i++) {
    const row = Math.floor(i / 13);
    top.push(`<circle cx="${262 + (i % 13) * 23 + row * 6}" cy="${540 - row * 22 - (i % 2) * 7}" r="15" fill="${i % 3 ? C.leaf : C.leafLight}"/>`);
  }
  return pot(400, 540, 260, C.clay, C.clayDark) + [[290, 7, 6], [330, 9, 8], [470, 8, 7], [510, 6, 5], [370, 4, 4]].map(([x, l, s]) => strand(x, l, s)).join('') + top.join('');
};

draw.pot = () => `<rect x="190" y="700" width="420" height="34" rx="17" fill="${C.clayDark}"/>
${pot(400, 520, 300)}
<g fill="${C.cream}" opacity=".35"><circle cx="330" cy="620" r="5"/><circle cx="420" cy="660" r="4"/><circle cx="470" cy="600" r="6"/><circle cx="370" cy="680" r="4"/></g>
${pot(400, 330, 160)}`;

draw.mister = () => `<ellipse cx="400" cy="720" rx="140" ry="14" fill="${C.ink}" opacity=".12"/>
<path d="M300 520 C300 440 500 440 500 520 V690 Q500 716 474 716 H326 Q300 716 300 690Z" fill="#c9a24a"/>
<path d="M330 520 C340 480 380 470 400 470" stroke="#e7c873" stroke-width="10" fill="none" stroke-linecap="round"/>
<rect x="370" y="380" width="60" height="80" rx="8" fill="#c9a24a"/>
<path d="M350 300 H440 Q460 300 460 320 V380 H340 V310 Q340 300 350 300Z" fill="${C.ink}"/>
<path d="M340 330 H280" stroke="${C.ink}" stroke-width="18" stroke-linecap="round"/>
<path d="M440 330 C500 340 500 400 470 420" stroke="${C.ink}" stroke-width="12" fill="none" stroke-linecap="round"/>
<g fill="${C.ink}" opacity=".35">${[[240, 320, 6], [215, 300, 5], [225, 345, 4], [190, 325, 5], [200, 280, 3], [175, 355, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;

// ----- Products -----
// How many of each are in stock. The fiddle leaf fig starts sold out, and
// the monstera and string of pearls are low, to show off those labels.
const STOCK = { snake: 12, pothos: 20, monstera: 3, zz: 8, fiddle: 0, pearls: 2, pot: 25, mister: 6 };

const PRODUCTS = [
  ['snake', 'Snake plant', 'Plants', 28, 'Low light', 'Stands up straight, forgives forgotten waterings, and cleans the air.', C.sage, 'A tall snake plant with striped, yellow-edged leaves in a terracotta pot'],
  ['pothos', 'Golden pothos', 'Plants', 18, 'Beginner', 'Trailing vines that grow fast and tell you when they’re thirsty.', C.butter, 'A golden pothos with trailing vines spilling over a cream pot'],
  ['monstera', 'Monstera', 'Plants', 45, 'Statement', 'Big split leaves that make any corner feel like a jungle.', C.sky, 'A monstera with three large split leaves in a terracotta pot'],
  ['zz', 'ZZ plant', 'Plants', 32, 'Low light', 'Glossy leaves that look fake but aren’t. Water once a month.', C.blush, 'A ZZ plant with upright stems of glossy oval leaves in a black pot'],
  ['fiddle', 'Fiddle leaf fig', 'Plants', 55, 'Bright light', 'The tall, dramatic one. Likes a sunny window and no moving around.', C.sand, 'A fiddle leaf fig with large violin-shaped leaves in a cream pot'],
  ['pearls', 'String of pearls', 'Plants', 22, 'Pet caution', 'Strands of little green beads that hang over the edge of a shelf.', C.lime, 'A string of pearls plant with beaded strands hanging from a terracotta pot'],
  ['pot', 'Terracotta pot set', 'Pots & tools', 12, 'Set of 2', 'Classic clay pots with drainage holes and a matching saucer.', C.sky, 'Two stacked terracotta pots on a saucer'],
  ['mister', 'Brass plant mister', 'Pots & tools', 16, 'Gift idea', 'A fine mist for tropical plants that like a little humidity.', C.sand, 'A brass plant mister spraying a fine mist']
];

// Drawings sit low on their canvas, so lift and enlarge them a little for the product photos
for (const [key, , , , , , bg] of PRODUCTS) {
  fs.writeFileSync(path.join(SEED, `${key}.svg`), svg(800, 800, `<g transform="translate(400 400) scale(1.08) translate(-400 -440)">${draw[key]()}</g>`, bg));
}

// ----- Site art -----
const nest = (key, x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale}) translate(-400 -400)">${draw[key](C.lime)}</g>`;
fs.writeFileSync(path.join(ART, 'hero.svg'), svg(900, 760,
  `<rect width="900" height="760" rx="48" fill="${C.lime}"/>` +
  nest('monstera', 470, 300, 0.78) + nest('snake', 200, 380, 0.66) + nest('pothos', 690, 400, 0.66)));
fs.writeFileSync(path.join(ART, 'logo.svg'), svg(64, 64,
  `<rect width="64" height="64" rx="16" fill="${C.ink}"/>
<path d="M32 36 C31 28 33 22 32 16" stroke="${C.lime}" stroke-width="3" fill="none" stroke-linecap="round"/>
${leaf(32, 26, 14, -55, C.lime, 0.5)}${leaf(32, 22, 12, 50, C.lime, 0.5)}
<path d="M19 36 H45 L42 52 H22Z" fill="${C.clay}"/><rect x="17" y="34" width="30" height="6" rx="2" fill="${C.clayDark}"/>`));

// ----- Sample content for Sanity -----
// IDs use dashes, not dots: Sanity hides documents with a dot in the ID from public queries
const docs = PRODUCTS.map(([key, name, category, price, tag, description, , alt], i) => ({
  _id: `product-${key}`,
  _type: 'product',
  name, category, price, tag, description, soldOut: false, stock: STOCK[key], order: i,
  image: { _type: 'image', _sanityAsset: `image@file://${path.join(SEED, `${key}.png`)}`, alt }
}));
fs.writeFileSync(path.join(SEED, 'seed.ndjson'), docs.map(doc => JSON.stringify(doc)).join('\n') + '\n');
console.log(`Wrote 2 site drawings, ${PRODUCTS.length} product drawings, and scripts/potbound-seed/seed.ndjson`);
