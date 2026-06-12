// This file generates demo data for products, customers, orders, and order lines, then ingests it into Enterspeed via the API.
// configure API SOURCEKEYS at the top of the file, then run with `node demo-data.mjs` to generate and ingest the data. You can adjust the number of entities by changing the loop limits.
import https from 'https';

const SOURCEKEYS = {
  orders:    'source-xxx',
  orderLines:'source-xxx',
  products:  'source-xxx',
  customers: 'source-xxx',
};

const rand     = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat= (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
const randDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
};
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const CATEGORIES  = ['electronics','sports','home','fashion','beauty','books','toys','garden','automotive','food'];
const BRANDS      = ['NordBrand','VeloTech','ArcticLine','SunForge','PeakWave','BlueRidge','TerraForm','ZenCraft','IronPath','LumaByte'];
const COUNTRIES   = ['DK','SE','NO','DE','NL','FI','FR','GB','PL','ES'];
const SEGMENTS    = ['premium','standard','new','wholesale'];
const STATUSES    = ['completed','completed','completed','completed','refunded','cancelled','processing'];
const FIRST_NAMES = ['Anna','Lars','Maria','Tobias','Sofie','Erik','Nina','Jonas','Ida','Mikkel','Sara','Rasmus','Lea','Christian','Emma','Oliver','Julie','Andreas','Freja','Mads'];
const LAST_NAMES  = ['Møller','Eriksson','Svensson','Koch','Andersen','Nielsen','Hansen','Pedersen','Jensen','Larsen','Christensen','Poulsen','Madsen','Jørgensen','Olsen','Rasmussen','Petersen','Thomsen','Dahl','Holm'];
const PRODUCT_NAMES = {
  electronics: ['Wireless headphones','Smart speaker','USB-C hub','Mechanical keyboard','Webcam HD','LED desk lamp','Portable charger','Bluetooth mouse','Noise cancelling earbuds','Smart watch'],
  sports:      ['Yoga mat','Running shoes','Resistance bands','Water bottle','Foam roller','Gym gloves','Jump rope','Cycling helmet','Sports bag','Compression socks'],
  home:        ['Coffee grinder','Pour-over kettle','Bamboo cutting board','Cast iron pan','Candle set','Linen throw','Wall organiser','Aroma diffuser','Ceramic mug set','Kitchen scale'],
  fashion:     ['Merino wool scarf','Canvas tote bag','Leather belt','Cotton t-shirt','Wool beanie','Sunglasses','Silk tie','Denim jacket','Ankle boots','Linen trousers'],
  beauty:      ['Face serum','Lip balm set','Natural shampoo','Body lotion','Eye cream','Tinted moisturiser','Beard oil','Exfoliating scrub','Nail care kit','Rose water mist'],
  books:       ['Design thinking guide','JavaScript handbook','Nordic cookbook','Mindfulness journal','History of typography','Product management primer','UX research methods','Stoic philosophy','Data viz workbook','Climate fiction anthology'],
  toys:        ['Building blocks set','Wooden puzzle','Remote control car','Craft kit','Card game','Play-doh set','Marble run','Board game classic','Science experiment kit','Plush dinosaur'],
  garden:      ['Seed starter kit','Pruning shears','Herb planter','Garden kneeler','Watering can','Compost bin','Plant labels','Trowel set','Grow light','Worm farm'],
  automotive:  ['Car phone mount','Tyre inflator','Dash cam','Microfibre cloth set','Car vacuum','Jump starter','Seat organiser','Sunshade','USB car charger','Ice scraper'],
  food:        ['Artisan honey','Cold brew kit','Pasta variety pack','Hot sauce trio','Granola mix','Olive oil premium','Nut butter set','Spice collection','Tea sampler','Dark chocolate box'],
};

// ── 100 products ─────────────────────────────────────────────────────────────
console.log('Generating 100 products...');
const products = [];
for (let i = 1; i <= 100; i++) {
  const category = CATEGORIES[(i - 1) % CATEGORIES.length];
  const names    = PRODUCT_NAMES[category];
  const name     = names[(i - 1) % names.length];
  products.push({
    originId: `product-${i}`,
    type: 'product',
    properties: {
      name,
      category,
      brand:         rand(BRANDS),
      sku:           `SKU-${String(i).padStart(4,'0')}`,
      price:         randFloat(9.99, 299.99),
      marginPercent: randInt(20, 65),
      inStock:       Math.random() > 0.15,
      stockQty:      randInt(0, 500),
      rating:        randFloat(3.0, 5.0, 1),
      reviewCount:   randInt(0, 2400),
      tags:          [category, rand(BRANDS).toLowerCase(), Math.random() > 0.5 ? 'bestseller' : 'new-arrival'],
    },
  });
}

// ── 500 customers ─────────────────────────────────────────────────────────────
console.log('Generating 500 customers...');
const customers = [];
for (let i = 1; i <= 500; i++) {
  const firstName = rand(FIRST_NAMES);
  const lastName  = rand(LAST_NAMES);
  customers.push({
    originId: `customer-${i}`,
    type: 'customer',
    properties: {
      firstName,
      lastName,
      email:            `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      country:          rand(COUNTRIES),
      segment:          rand(SEGMENTS),
      joinedDate:       randDate(new Date('2019-01-01'), new Date('2024-06-01')),
      acceptsMarketing: Math.random() > 0.3,
    },
  });
}

// ── 1000 orders + 5000 order lines ───────────────────────────────────────────
// Strategy: distribute exactly 5000 lines across 1000 orders (avg 5 per order).
// Pre-assign line counts so they sum to exactly 5000.
console.log('Generating 1000 orders and 5000 order lines...');

const productIds  = products.map(p => p.originId);
const productMap  = Object.fromEntries(products.map(p => [p.originId, p.properties]));
const customerIds = customers.map(c => c.originId);

// Distribute 5000 lines across 1000 orders: start each at 3, then randomly
// add the remaining 2000 one at a time, capped at 9 lines per order.
const lineCounts = new Array(1000).fill(3);
let remaining = 5000 - 3000;
while (remaining > 0) {
  const idx = randInt(0, 999);
  if (lineCounts[idx] < 9) { lineCounts[idx]++; remaining--; }
}

const orders     = [];
const orderLines = [];
let lineId = 1;

for (let i = 1; i <= 1000; i++) {
  const orderId    = `order-${i}`;
  const customerId = rand(customerIds);
  const status     = rand(STATUSES);
  const orderDate  = randDate(new Date('2023-01-01'), new Date('2024-12-31'));
  const count      = lineCounts[i - 1];

  // Pick `count` distinct products for this order
  const shuffled = [...productIds].sort(() => Math.random() - 0.5).slice(0, count);
  let orderTotal = 0;

  for (const pid of shuffled) {
    const prod      = productMap[pid];
    const qty       = randInt(1, 4);
    const unitPrice = parseFloat((prod.price * randFloat(0.9, 1.05)).toFixed(2));
    orderTotal     += qty * unitPrice;

    orderLines.push({
      originId: `order-line-${lineId}`,
      type: 'orderLine',
      properties: {
        lineId:    `line-${String(lineId).padStart(5,'0')}`,
        orderId,
        productId: pid,
        sku:       prod.sku,
        name:      prod.name,
        category:  prod.category,
        qty,
        unitPrice,
        lineTotal: parseFloat((qty * unitPrice).toFixed(2)),
      },
    });
    lineId++;
  }

  orders.push({
    originId: orderId,
    type: 'order',
    properties: {
      orderId:    `ORD-${String(i).padStart(5,'0')}`,
      customerId,
      status,
      orderDate,
      orderTotal: parseFloat(orderTotal.toFixed(2)),
      currency:   'EUR',
      lineCount:  count,
    },
  });
}

console.log(`  Orders: ${orders.length}, Order lines: ${orderLines.length}`);

// ── Bulk ingest ───────────────────────────────────────────────────────────────
function ingestBatch(entities, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(entities);
    const options = {
      hostname: 'api.enterspeed.com',
      path:     '/ingest/v2',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Api-Key':      apiKey,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function ingestAll(label, entities, apiKey) {
  const batches = chunk(entities, 50);
  let changed = 0, unchanged = 0, errorBatches = 0;
  process.stdout.write(`Ingesting ${entities.length} ${label} in ${batches.length} batches`);
  for (let b = 0; b < batches.length; b++) {
    const result = await ingestBatch(batches[b], apiKey);
    if (result.status === 200) {
      changed   += (result.body.changedSourceEntities   || []).length;
      unchanged += (result.body.unchangedSourceEntities || []).length;
    } else {
      errorBatches++;
      if (errorBatches <= 2) {
        console.error(`\n  Batch ${b+1} error (HTTP ${result.status}):`, JSON.stringify(result.body).slice(0, 200));
      }
    }
    if ((b + 1) % 10 === 0) process.stdout.write('.');
    await new Promise(r => setTimeout(r, 60));
  }
  console.log(` done. Changed: ${changed}, Unchanged: ${unchanged}, Error batches: ${errorBatches}`);
}

(async () => {
  console.log('\n=== Starting Enterspeed ingest ===\n');
  await ingestAll('products',    products,    SOURCEKEYS.products);
  await ingestAll('customers',   customers,   SOURCEKEYS.customers);
  await ingestAll('orders',      orders,      SOURCEKEYS.orders);
  await ingestAll('order lines', orderLines,  SOURCEKEYS.orderLines);
  console.log('\n=== All done ===');
})();
