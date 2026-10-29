// Draws the risograph-style SVG artwork for the Tidepool example site.
// Run it again after changing a drawing:  node scripts/tidepool-art.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'frontendexamples', 'tidepool-art');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  paper: '#f4efe6', deep: '#ebe3d5', ink: '#1d2440',
  pink: '#ff48b0', teal: '#00838a', yellow: '#ffb511', blue: '#3d5588'
};
const M = 'style="mix-blend-mode:multiply"';
const r1 = n => Math.round(n * 10) / 10;

// Seeded random so the art is the same every time it is generated
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function poster(body, bg = C.paper, w = 400, h = 500) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .11  0 0 0 0 .14  0 0 0 0 .25  0 0 0 .55 -.12"/></filter></defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
<g style="isolation:isolate">${body}</g>
<rect width="${w}" height="${h}" filter="url(#grain)" opacity=".55"/>
</svg>\n`;
}

const wave = (x, y, amp, period, count) =>
  `M${x} ${y} q${period / 2} ${-amp} ${period} 0` + ` t${period} 0`.repeat(count) + ` V520 H${x}Z`;

function star(cx, cy, outer, inner, rot) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = rot + (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    pts.push(`${r1(cx + r * Math.cos(a))},${r1(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

const files = {};

// ----- Low Tide -----
files['low-tide.svg'] = poster(`
<circle cx="200" cy="190" r="104" fill="${C.yellow}" ${M}/>
<circle cx="193" cy="184" r="104" fill="none" stroke="${C.pink}" stroke-width="3" ${M}/>
<path d="${wave(-50, 285, 34, 100, 5)}" fill="${C.pink}" opacity=".85" ${M}/>
<path d="${wave(0, 335, 30, 100, 4)}" fill="${C.teal}" opacity=".9" ${M}/>
<path d="${wave(-50, 395, 26, 100, 5)}" fill="${C.blue}" ${M}/>
${[300, 360, 420, 455].map((y, i) => `<path d="M${60 + i * 40} ${y} h${50 - i * 8}" stroke="${C.paper}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`).join('')}
${[0, 1, 2].map(i => `<path d="M${120 + i * 20} ${90 - i * 14} q10 -8 20 0 q10 -8 20 0" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`).join('')}
`);

// ----- Anemone -----
files['anemone.svg'] = poster(`
<circle cx="200" cy="250" r="150" fill="${C.blue}" ${M}/>
${Array.from({ length: 14 }, (_, i) => {
  const a = (Math.PI * 2 / 14) * i;
  return `<circle cx="${r1(200 + 100 * Math.cos(a))}" cy="${r1(250 + 100 * Math.sin(a))}" r="38" fill="${C.pink}" opacity=".9" ${M}/>`;
}).join('')}
${Array.from({ length: 14 }, (_, i) => {
  const a = (Math.PI * 2 / 14) * (i + 0.5);
  return `<circle cx="${r1(204 + 62 * Math.cos(a))}" cy="${r1(246 + 62 * Math.sin(a))}" r="7" fill="${C.paper}"/>`;
}).join('')}
<circle cx="200" cy="250" r="44" fill="${C.yellow}" ${M}/>
<circle cx="206" cy="244" r="44" fill="none" stroke="${C.ink}" stroke-width="2.5"/>
`);

// ----- Open Studio poster -----
files['open-studio.svg'] = poster(`
<circle cx="270" cy="170" r="130" fill="${C.pink}" ${M}/>
<path d="${wave(-50, 410, 30, 100, 5)}" fill="${C.teal}" ${M}/>
<path d="${wave(0, 440, 22, 100, 4)}" fill="${C.yellow}" opacity=".85" ${M}/>
<g font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="${C.ink}">
<text x="32" y="210" font-size="96" letter-spacing="-3">OPEN</text>
<text x="32" y="300" font-size="96" letter-spacing="-3" font-style="italic">Studio</text>
</g>
<g font-family="Helvetica, Arial, sans-serif" font-weight="700" fill="${C.ink}" letter-spacing="3">
<text x="36" y="60" font-size="14">TIDEPOOL PRINT STUDIO</text>
<text x="36" y="345" font-size="15">FIRST SATURDAYS · 10–3</text>
<text x="36" y="368" font-size="13" font-weight="400">WATCH A PRINT GET MADE</text>
</g>
<path d="M36 72 h150" stroke="${C.ink}" stroke-width="2"/>
`);

// ----- Kelp Forest -----
seed = 11;
const kelp = Array.from({ length: 7 }, (_, i) => {
  const x = 30 + i * 56 + rand() * 16;
  const color = i % 2 ? C.teal : C.blue;
  let d = `M${r1(x)} 520`;
  const leaves = [];
  for (let y = 520, k = 0; y > 90 + rand() * 60; y -= 60, k++) {
    const dx = (k % 2 ? 1 : -1) * 18;
    d += ` Q${r1(x + dx)} ${y - 30} ${r1(x)} ${y - 60}`;
    const side = k % 2 ? 1 : -1;
    leaves.push(`<ellipse cx="${r1(x + side * 16)}" cy="${y - 40}" rx="18" ry="7" transform="rotate(${side * -35} ${r1(x + side * 16)} ${y - 40})" fill="${color}" opacity=".85" ${M}/>`);
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${10 + (i % 3) * 3}" stroke-linecap="round" opacity=".9" ${M}/>${leaves.join('')}`;
}).join('');
files['kelp.svg'] = poster(`
<path d="M0 0 H400 V70 q-25 16 -50 0 t-50 0 t-50 0 t-50 0 t-50 0 t-50 0 t-50 0 t-50 0Z" fill="${C.yellow}" ${M}/>
${kelp}
${[[80, 150, 6], [300, 120, 4], [250, 220, 5], [140, 300, 3], [330, 330, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.pink}" stroke-width="2.5"/>`).join('')}
`);

// ----- Starfish Season -----
const starfishStyle = 'stroke-linejoin="round" stroke-width="16"';
files['starfish.svg'] = poster(`
<polygon points="${star(150, 190, 110, 44, 0.2)}" fill="${C.pink}" stroke="${C.pink}" ${starfishStyle} opacity=".9" ${M}/>
<polygon points="${star(255, 300, 115, 46, -0.35)}" fill="${C.yellow}" stroke="${C.yellow}" ${starfishStyle} ${M}/>
<polygon points="${star(140, 390, 70, 28, 0.6)}" fill="${C.teal}" stroke="${C.teal}" ${starfishStyle} opacity=".85" ${M}/>
${Array.from({ length: 40 }, () => {
  seed = (seed * 48271) % 2147483647;
  const a = rand() * Math.PI * 2, r = 15 + rand() * 70;
  return `<circle cx="${r1(255 + r * Math.cos(a))}" cy="${r1(300 + r * Math.sin(a))}" r="${r1(2 + rand() * 2.5)}" fill="${C.paper}" opacity=".8"/>`;
}).join('')}
<polygon points="${star(146, 186, 110, 44, 0.2)}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>
`);

// ----- Moon Jelly -----
const tentacles = Array.from({ length: 7 }, (_, i) => {
  const x = 120 + i * 27;
  const sway = i % 2 ? 22 : -22;
  return `<path d="M${x} 232 C${x + sway} 290 ${x - sway} 340 ${x + sway / 2} 400 S${x - sway} 460 ${x + sway} 490" fill="none" stroke="${C.blue}" stroke-width="${i === 3 ? 7 : 3.5}" stroke-linecap="round" ${M}/>`;
}).join('');
files['moon-jelly.svg'] = poster(`
<rect width="400" height="500" fill="${C.pink}" opacity=".45" ${M}/>
${tentacles}
<path d="M95 232 A105 105 0 0 1 305 232 Q280 250 250 240 Q225 254 200 242 Q175 254 150 240 Q120 250 95 232Z" fill="${C.blue}" opacity=".92" ${M}/>
${[[170, 190], [230, 190], [200, 165], [200, 215]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="none" stroke="${C.yellow}" stroke-width="6"/>`).join('')}
<path d="M88 226 A105 105 0 0 1 298 226" fill="none" stroke="${C.paper}" stroke-width="3" opacity=".7"/>
${[[60, 90, 8], [330, 70, 12], [320, 380, 6], [70, 420, 10], [345, 300, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.paper}" stroke-width="3"/>`).join('')}
`);

// ----- Sea Glass -----
seed = 23;
const glassColors = [C.teal, C.blue, C.yellow, C.pink, C.teal];
const glass = Array.from({ length: 19 }, (_, i) => {
  const w = 40 + rand() * 60, h = 30 + rand() * 40;
  const x = 20 + (i % 4) * 92 + rand() * 30, y = 30 + Math.floor(i / 4) * 92 + rand() * 30;
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2.2)}" transform="rotate(${Math.round(rand() * 180)} ${r1(x + w / 2)} ${r1(y + h / 2)})" fill="${glassColors[i % 5]}" opacity="${r1(0.55 + rand() * 0.35)}" ${M}/>`;
}).join('');
const sand = Array.from({ length: 70 }, () =>
  `<circle cx="${r1(rand() * 400)}" cy="${r1(rand() * 500)}" r="${r1(0.8 + rand() * 1.6)}" fill="${C.ink}" opacity=".45"/>`).join('');
files['sea-glass.svg'] = poster(glass + sand, C.deep);

// ----- Shell Study -----
const rings = [];
for (let i = 22; i >= 0; i--) {
  const R = 6 * Math.pow(1.13, i);
  const a = i * 0.62;
  const cx = 200 + R * Math.cos(a), cy = 245 + R * Math.sin(a);
  rings.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R * 0.78)}" fill="${i % 2 ? C.pink : C.yellow}" opacity=".8" ${M}/>`);
  rings.push(`<circle cx="${r1(cx + 3)}" cy="${r1(cy - 2)}" r="${r1(R * 0.78)}" fill="none" stroke="${C.ink}" stroke-width="1.5" opacity=".6"/>`);
}
files['shell.svg'] = poster(`
<circle cx="200" cy="245" r="165" fill="${C.paper}"/>
<g style="isolation:isolate">${rings.join('')}</g>
<g font-family="Helvetica, Arial, sans-serif" font-weight="700" fill="${C.paper}" letter-spacing="4" font-size="13">
<text x="200" y="456" text-anchor="middle">SHELL STUDY · NO. 4</text>
</g>
`, C.blue);

// ----- Studio (about portrait) -----
seed = 5;
const hanging = Array.from({ length: 5 }, (_, i) => {
  const colors = [C.pink, C.yellow, C.teal, C.blue, C.pink];
  const x = 30 + i * 56;
  return `<rect x="${x}" y="${62 + (i % 2) * 6}" width="44" height="56" fill="${C.paper}"/><rect x="${x + 6}" y="${70 + (i % 2) * 6}" width="32" height="32" rx="${i % 2 ? 16 : 3}" fill="${colors[i]}" opacity=".9" ${M}/><rect x="${x + 18}" y="${56 + (i % 2) * 6}" width="8" height="12" fill="${C.ink}"/>`;
}).join('');
files['studio.svg'] = poster(`
<rect x="0" y="0" width="400" height="500" fill="${C.deep}"/>
<rect x="290" y="150" width="90" height="140" rx="45" fill="${C.teal}" opacity=".55" ${M}/>
<circle cx="335" cy="200" r="22" fill="${C.yellow}" ${M}/>
<path d="M290 245 h90 M335 150 v140" stroke="${C.deep}" stroke-width="6"/>
<path d="M0 60 Q160 72 320 60" fill="none" stroke="${C.ink}" stroke-width="2"/>
${hanging}
<rect x="0" y="360" width="400" height="140" fill="${C.blue}" ${M}/>
<rect x="60" y="270" width="170" height="90" rx="10" fill="${C.ink}" opacity=".88"/>
<rect x="76" y="284" width="60" height="14" rx="3" fill="${C.teal}"/>
<circle cx="205" cy="291" r="6" fill="${C.pink}"/>
<path d="M90 270 l20 -60 h70 l20 60" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
<rect x="118" y="222" width="54" height="30" fill="${C.pink}" opacity=".8" ${M}/>
<rect x="250" y="320" width="34" height="40" rx="4" fill="${C.yellow}" ${M}/>
<path d="M267 320 q-20 -50 -6 -80 M267 320 q16 -40 30 -60 M267 320 q0 -40 -2 -70" fill="none" stroke="${C.teal}" stroke-width="5" stroke-linecap="round" ${M}/>
<path d="M0 360 H400" stroke="${C.ink}" stroke-width="3"/>
<g font-family="Helvetica, Arial, sans-serif" font-weight="700" fill="${C.paper}" letter-spacing="4" font-size="13"><text x="200" y="450" text-anchor="middle">MILL ST. STUDIOS · UNIT 3</text></g>
`);

// ----- Logo mark (no grain, transparent) -----
files['mark.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<defs><clipPath id="c"><circle cx="32" cy="32" r="30"/></clipPath></defs>
<g clip-path="url(#c)" style="isolation:isolate">
<rect width="64" height="64" fill="${C.paper}"/>
<circle cx="38" cy="24" r="14" fill="${C.yellow}" ${M}/>
<path d="M-8 38 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 V70 H-8Z" fill="${C.pink}" ${M}/>
<path d="M-4 46 q8 -6 16 0 t16 0 t16 0 t16 0 V70 H-4Z" fill="${C.teal}" ${M}/>
</g>
<circle cx="32" cy="32" r="30" fill="none" stroke="${C.ink}" stroke-width="3"/>
</svg>\n`;

files['starfish-mark.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
<g style="isolation:isolate">
<polygon points="${star(120, 124, 96, 40, 0.15)}" fill="${C.yellow}" stroke="${C.yellow}" stroke-width="14" stroke-linejoin="round" ${M}/>
<polygon points="${star(112, 118, 96, 40, 0.15)}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-linejoin="round" ${M}/>
${[0, 1, 2, 3, 4].map(k => {
  const a = 0.15 + (Math.PI * 2 / 5) * k - Math.PI / 2;
  return [30, 55].map(r => `<circle cx="${r1(120 + r * Math.cos(a))}" cy="${r1(124 + r * Math.sin(a))}" r="5" fill="${C.pink}" ${M}/>`).join('');
}).join('')}
<circle cx="120" cy="124" r="7" fill="${C.pink}" ${M}/>
</g>
</svg>\n`;

for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(name, svg.length, 'bytes');
}
