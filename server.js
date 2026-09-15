const express = require('express');
const session = require('express-session');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const UPLOAD_DIR = path.join(ROOT, 'assets', 'products');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

if (!fs.existsSync(DATA_FILE)) {
  const legacy = fs.existsSync(path.join(ROOT, 'products.js')) ? fs.readFileSync(path.join(ROOT, 'products.js'), 'utf8') : '';
  const match = legacy.match(/const PRODUCTS\s*=\s*(\[[\s\S]*\]);?\s*$/);
  let products = [];
  if (match) { try { products = Function('return ' + match[1])(); } catch {} }
  writeJson(DATA_FILE, products);
}
if (!fs.existsSync(ORDERS_FILE)) writeJson(ORDERS_FILE, []);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// Trust Render's proxy so secure cookies work on HTTPS
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  }
}));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP or AVIF images are allowed.'));
  }
});

function products() { return readJson(DATA_FILE, []); }
function saveProducts(p) { writeJson(DATA_FILE, p); }
function nextId(items) { return items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1; }
function adminOnly(req, res, next) {
  if (req.session.admin) return next();
  res.status(401).json({ error: 'Admin login required.' });
}

app.get('/api/brands', (_req, res) => {
  const set = new Set(products().map(p => p.brand).filter(Boolean));
  const defaults = ['Sapphire','Alkaram','Khaadi','Nishat Linen','Bonanza Satrangi','Ethnic','Sana Safinaz','Limelight','Gul Ahmed'];
  res.json([...new Set([...set, ...defaults])].sort());
});

app.get('/api/products', (req, res) => {
  let items = products();
  const brand = (req.query.brand || '').trim();
  const q = (req.query.q || '').trim().toLowerCase();
  const category = (req.query.category || '').trim();
  if (brand) items = items.filter(p => String(p.brand).toLowerCase() === brand.toLowerCase());
  if (category) items = items.filter(p => String(p.category).toLowerCase() === category.toLowerCase());
  if (q) items = items.filter(p => `${p.brand} ${p.name} ${p.code} ${p.category}`.toLowerCase().includes(q));
  res.json(items);
});

app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  if (!body.customer || !body.items?.length) return res.status(400).json({ error: 'Customer and cart items are required.' });
  const orderList = readJson(ORDERS_FILE, []);
  const order = { id: `BOF-${Date.now()}`, createdAt: new Date().toISOString(), status: 'New', ...body };
  orderList.unshift(order);
  writeJson(ORDERS_FILE, orderList);
  res.status(201).json({ ok: true, orderId: order.id });
});

app.post('/api/admin/login', (req, res) => {
  const username = (process.env.ADMIN_USER || 'fatima').trim();
  const password = (process.env.ADMIN_PASSWORD || 'Fatima786').trim();
  if (req.body.username.trim() === username && req.body.password.trim() === password) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid username or password.' });
});
app.post('/api/admin/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/admin/me', (req, res) => res.json({ loggedIn: !!req.session.admin }));
app.get('/api/admin/orders', adminOnly, (_req, res) => res.json(readJson(ORDERS_FILE, [])));

app.post('/api/admin/products', adminOnly, upload.single('image'), (req, res) => {
  const all = products();
  const p = req.body;
  if (!p.brand || !p.name) return res.status(400).json({ error: 'Brand and product name are required.' });
  const item = {
    id: nextId(all),
    brand: p.brand.trim(), name: p.name.trim(), code: (p.code || '').trim(),
    category: (p.category || 'Unstitched').trim(),
    image: req.file ? `assets/products/${req.file.filename}` : (p.image || ''),
    original: p.original ? Number(p.original) : null,
    sale: p.sale ? Number(p.sale) : null,
    stock: p.stock === '' || p.stock == null ? 0 : Number(p.stock),
    badge: (p.badge || 'NEW').trim()
  };
  all.unshift(item); saveProducts(all); res.status(201).json(item);
});

app.put('/api/admin/products/:id', adminOnly, upload.single('image'), (req, res) => {
  const all = products();
  const idx = all.findIndex(p => String(p.id) === String(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Product not found.' });
  const p = req.body;
  const old = all[idx];
  const updated = { ...old,
    brand: p.brand?.trim() || old.brand, name: p.name?.trim() || old.name,
    code: p.code?.trim() ?? old.code, category: p.category?.trim() || old.category,
    original: p.original === '' ? null : (p.original != null ? Number(p.original) : old.original),
    sale: p.sale === '' ? null : (p.sale != null ? Number(p.sale) : old.sale),
    stock: p.stock === '' ? 0 : (p.stock != null ? Number(p.stock) : old.stock),
    badge: p.badge?.trim() ?? old.badge
  };
  if (req.file) updated.image = `assets/products/${req.file.filename}`;
  all[idx] = updated; saveProducts(all); res.json(updated);
});

app.delete('/api/admin/products/:id', adminOnly, (req, res) => {
  const all = products();
  const item = all.find(p => String(p.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Product not found.' });
  saveProducts(all.filter(p => String(p.id) !== String(req.params.id)));
  res.json({ ok: true });
});

app.use(express.static(ROOT));
app.get('/admin', (_req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || 'Request failed.' }));
app.listen(PORT, () => console.log(`Branded Outlet by Fatima running at http://localhost:${PORT}`));
