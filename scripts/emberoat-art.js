// Draws the line-art SVGs for the Ember & Oat example site, and writes the
// sample menu and journal posts to import into Sanity.
//   node scripts/emberoat-art.js
// The post drawings go to Sanity as PNGs. After changing one, turn each
// emberoat-seed/*.svg into a 1200x800 .png (for example, open it in Chrome
// and take a screenshot). Then, from the Studio folder:
//   npx sanity dataset import <this repo>/scripts/emberoat-seed/seed.ndjson --dataset production --replace
const fs = require('fs');
const path = require('path');

const ART = path.join(__dirname, '..', 'public', 'frontendexamples', 'emberoat-art');
const SEED = path.join(__dirname, 'emberoat-seed');
fs.mkdirSync(ART, { recursive: true });
fs.mkdirSync(SEED, { recursive: true });

const C = {
  cream: '#f3ecdf', oat: '#e6dccb', forest: '#1e3329', moss: '#2f4a3b',
  crust: '#b5562f', butter: '#e9b949', berry: '#8e2f3c', ink: '#1b1a17'
};

// Every drawing is one stroke color with round ends, like a pen sketch
const pen = (color, width = 3) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

function svg(w, h, body, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}
${body}
</svg>\n`;
}

// ----- Drawings, each centered on (0, 0) so they can be placed anywhere -----

function loaf(color) {
  return `<g ${pen(color)}>
<path d="M-150 40 C-160 -40 -90 -95 0 -95 C90 -95 160 -40 150 40 C145 70 120 80 0 80 C-120 80 -145 70 -150 40Z"/>
<path d="M-95 -40 q25 -25 55 -30 M-35 -55 q30 -25 60 -28 M30 -55 q30 -22 60 -22"/>
<path d="M-120 55 q120 18 240 0" stroke-dasharray="2 12"/>
</g>`;
}

function croissant(color) {
  return `<g ${pen(color)}>
<path d="M-150 30 C-140 -20 -100 -60 -60 -70 C-40 -100 40 -100 60 -70 C100 -60 140 -20 150 30 C120 10 90 5 60 20 C40 45 -40 45 -60 20 C-90 5 -120 10 -150 30Z"/>
<path d="M-60 -70 C-70 -30 -65 0 -60 20 M60 -70 C70 -30 65 0 60 20 M0 -92 C-8 -40 -8 0 0 38"/>
<path d="M-105 -40 q10 25 -5 55 M105 -40 q-10 25 5 55"/>
</g>`;
}

function cup(color) {
  return `<g ${pen(color)}>
<path d="M-80 -30 H80 L65 80 Q60 95 45 95 H-45 Q-60 95 -65 80Z"/>
<path d="M80 -5 C125 -5 125 55 72 55"/>
<path d="M-115 105 H115"/>
<path d="M-30 -55 c-15 -20 15 -35 0 -55 M10 -55 c-15 -20 15 -35 0 -55 M50 -55 c-15 -20 15 -35 0 -55"/>
</g>`;
}

function wheat(color) {
  const grains = [];
  for (let i = 0; i < 6; i++) {
    const y = -110 + i * 26;
    grains.push(`<path d="M0 ${y + 18} q-24 -6 -26 -30 q24 4 26 30Z"/><path d="M0 ${y + 18} q24 -6 26 -30 q-24 4 -26 30Z"/>`);
  }
  return `<g ${pen(color, 2.6)}><path d="M0 -125 V140"/>${grains.join('')}<path d="M0 -125 l-8 -22 M0 -125 l8 -22"/></g>`;
}

function berries(color) {
  const spots = [[-40, 10], [0, -20], [40, 15], [-10, 40], [25, 55]];
  return `<g ${pen(color)}>${spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22"/><path d="M${x - 5} ${y - 14} l5 6 5 -6"/>`).join('')}
<path d="M0 -42 c-10 -40 -40 -50 -70 -45 c20 15 45 25 70 45 c10 -30 40 -45 70 -40 c-25 15 -45 25 -70 40"/></g>`;
}

// ----- Site art -----
const files = {};

files['logo.svg'] = svg(64, 64, `
<circle cx="32" cy="32" r="30" fill="${C.forest}"/>
<g transform="translate(32 34) scale(.13)">${wheat(C.butter).replace(/stroke-width="2.6"/, 'stroke-width="14"')}</g>`);

files['hero-loaf.svg'] = svg(520, 420, `
<ellipse cx="260" cy="340" rx="210" ry="26" fill="${C.moss}"/>
<g transform="translate(260 250) scale(1.35)">${loaf(C.cream)}</g>
<g transform="translate(95 135) rotate(-20) scale(.42)">${wheat(C.butter)}</g>
<g ${pen(C.butter, 2)}><path d="M200 90 l8 -14 M260 72 v-18 M320 90 l-8 -14"/></g>`);

files['croissant.svg'] = svg(360, 240, `<g transform="translate(180 130)">${croissant(C.forest)}</g>`);
files['cup.svg'] = svg(360, 280, `<g transform="translate(180 160)">${cup(C.forest)}</g>`);

// ----- Journal post photos (imported into Sanity, not served by us) -----
const POST_ART = {
  'cranberry.svg': svg(1200, 800, `
<g transform="translate(430 430) scale(1.9)">${loaf(C.cream)}</g>
<g transform="translate(860 360) scale(1.7)">${berries(C.cream)}</g>`, C.berry),
  'croissant-class.svg': svg(1200, 800, `
<g transform="translate(600 420) scale(2.4)">${croissant(C.forest)}</g>
<g transform="translate(160 400) rotate(-15) scale(1.1)">${wheat(C.forest)}</g>
<g transform="translate(1040 400) rotate(15) scale(1.1)">${wheat(C.forest)}</g>`, C.butter),
  'starter.svg': svg(1200, 800, `
<g ${pen(C.cream, 5)}>
<path d="M480 230 H720 M470 230 Q450 230 450 260 V600 Q450 650 500 650 H700 Q750 650 750 600 V260 Q750 230 730 230"/>
<path d="M455 420 C520 390 560 450 620 420 C680 390 720 440 745 420"/>
<circle cx="530" cy="500" r="10"/><circle cx="600" cy="560" r="14"/><circle cx="670" cy="490" r="8"/><circle cx="560" cy="600" r="6"/>
<path d="M500 180 H700" stroke-width="8"/>
</g>
<g transform="translate(940 420) scale(1.3)">${wheat(C.butter)}</g>`, C.forest),
  'coffee.svg': svg(1200, 800, `
<g transform="translate(600 430) scale(2.3)">${cup(C.cream)}</g>`, C.crust)
};

for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(ART, name), content);
for (const [name, content] of Object.entries(POST_ART)) fs.writeFileSync(path.join(SEED, name), content);

// ----- Sample content for Sanity -----
// IDs use dashes, not dots: Sanity hides documents with a dot in the ID from public queries
const menu = [
  ['Bread', 'Country sourdough', 9, 'Our everyday loaf. Three-day ferment, crackly crust.'],
  ['Bread', 'Seeded rye', 10, 'Sunflower, flax, and caraway. Dense in the best way.'],
  ['Bread', 'Cranberry walnut', 11, 'Back for the fall. Toast it, then add butter.'],
  ['Bread', 'Olive fougasse', 7, 'Leaf-shaped, olive oil, rosemary, sea salt.', true],
  ['Pastry', 'Butter croissant', 4.25, 'Laminated over two days with cultured butter.'],
  ['Pastry', 'Pain au chocolat', 4.75, 'Two bars of dark chocolate in every one.'],
  ['Pastry', 'Maple pecan bun', 5, 'Sticky, warm, gone by 10am most days.', true],
  ['Pastry', 'Ham & gruyère danish', 6.5, 'Savory, flaky, with a little Dijon.'],
  ['Sweets', 'Brown butter cookie', 3.25, 'Chewy middle, flaky salt on top.'],
  ['Sweets', 'Apple cider donut', 2.75, 'Rolled in cinnamon sugar, Saturdays only.'],
  ['Sweets', 'Lemon olive oil cake', 4.5, 'By the slice, with a crackly glaze.'],
  ['Drinks', 'Drip coffee', 3, 'From a roaster down the street.'],
  ['Drinks', 'Oat milk latte', 5.25, 'Hot or iced. Ask for maple.'],
  ['Drinks', 'Chai', 4.75, 'House-spiced, simmered every morning.'],
  ['Drinks', 'Hot cider', 3.5, 'Local apples, cinnamon stick.']
].map(([section, name, price, description, soldOut = false], i) => ({
  _id: `menuItem-${name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}`,
  _type: 'menuItem', name, section, price, description, soldOut, order: i
}));

const image = (file, alt) => ({
  _type: 'image',
  _sanityAsset: `image@file://${path.join(SEED, file.replace('.svg', '.png'))}`,
  alt
});

const posts = [
  {
    slug: 'cranberry-walnut-is-back', category: 'News', date: '2026-10-27',
    title: 'Cranberry walnut is back for the season',
    image: image('cranberry.svg', 'A drawing of a round loaf of bread next to a handful of cranberries'),
    body: `It's officially fall, which means our cranberry walnut loaf is back on the shelf starting this week.

We bake it every Tuesday, Thursday, and Saturday. It's a sourdough base with toasted walnuts and dried cranberries folded in by hand, so every slice is a little different.

Want one held for you? Call before 9am and we'll set it aside with your name on it.`
  },
  {
    slug: 'croissant-class-november', category: 'Events', date: '2026-10-20',
    title: 'Learn to laminate: croissant class in November',
    image: image('croissant-class.svg', 'A drawing of a croissant between two stalks of wheat'),
    body: `We're opening the kitchen on Sunday, November 15 for a hands-on croissant class.

You'll learn how to fold butter into dough, how to roll and shape croissants, and why the whole thing takes two days. You'll go home with a dozen to bake in your own oven.

The class is $65 and has room for 8 people. Stop by the counter or give us a call to save a spot.`
  },
  {
    slug: 'meet-our-starter', category: 'Behind the counter', date: '2026-10-08',
    title: 'Meet Gus, our seven-year-old sourdough starter',
    image: image('starter.svg', 'A drawing of a glass jar of bubbly sourdough starter'),
    body: `Every loaf we bake starts with Gus. Gus is a jar of flour, water, and wild yeast that we've been feeding twice a day since 2019.

A starter is what makes sourdough rise and gives it that tangy flavor. Ours lives on the top shelf by the oven, where it's warm. On a busy weekend Gus gets fed four times.

Want to start your own? Bring a clean jar on any Saturday and we'll give you a scoop of Gus for free.`
  },
  {
    slug: 'new-coffee-partner', category: 'News', date: '2026-09-24',
    title: 'New coffee, same neighborhood',
    image: image('coffee.svg', 'A drawing of a steaming cup of coffee'),
    body: `We've switched our drip coffee to beans from a small roaster just a few blocks away.

It's a medium roast with notes of chocolate and cherry, and it goes really well with a maple pecan bun. You can also buy bags to brew at home.

Thanks to everyone who came to the tasting last month and helped us pick.`
  }
].map(post => ({
  _id: `post-${post.slug}`,
  _type: 'post',
  title: post.title,
  slug: { _type: 'slug', current: post.slug },
  category: post.category,
  publishedAt: `${post.date}T13:00:00.000Z`,
  image: post.image,
  body: post.body
}));

fs.writeFileSync(path.join(SEED, 'seed.ndjson'), [...menu, ...posts].map(doc => JSON.stringify(doc)).join('\n') + '\n');
console.log(`Wrote ${Object.keys(files).length} site drawings, ${Object.keys(POST_ART).length} post drawings,`);
console.log(`and ${menu.length} menu items + ${posts.length} posts to scripts/emberoat-seed/seed.ndjson`);
