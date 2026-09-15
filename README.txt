BRANDED OUTLET BY FATIMA — BRAND FILTER + BACKEND VERSION

WHAT CHANGED
1. The store now has a proper SHOP BY BRAND area and BRANDS dropdown.
2. Sapphire has its own collection URL: /?brand=Sapphire#shop
3. Alkaram has its own collection URL: /?brand=Alkaram#shop
4. Khaadi, Nishat Linen, Bonanza Satrangi, Ethnic, Sana Safinaz, Limelight and Gul Ahmed are already available as brand choices. They will show products automatically when you add them from Admin.
5. The product grid displays the complete product image using contain, so the full uploaded product card remains visible.
6. Product search, category filtering, sale filtering, sorting, cart and checkout are retained.

BACKEND INCLUDED
- server.js: Express backend/API
- data/products.json: product database
- data/orders.json: order database
- admin.html/admin.js/admin.css: admin panel
- Product image uploads are stored in assets/products/
- Admin can ADD, EDIT and DELETE products.
- Admin fields: brand, name, code, category, original price, sale price, stock, badge and image.
- Orders submitted through checkout are stored in data/orders.json.

RUN LOCALLY (RECOMMENDED)
1. Install Node.js LTS on Windows.
2. Open this folder in VS Code.
3. Open Terminal in this folder.
4. Run: npm install
5. Run: npm start
6. Open: http://localhost:5500
7. Admin: http://localhost:5500/admin

DEFAULT LOCAL ADMIN
Username: admin
Password: ChangeMe123!

IMPORTANT: Change the password before putting the site online. You can set:
ADMIN_USER=your_username
ADMIN_PASSWORD=your_strong_password
SESSION_SECRET=your_long_random_secret

WINDOWS SHORTCUT
Double-click start.bat. It installs dependencies on first run and starts the server.

ADDING A NEW BRAND
You do NOT need to edit code. Open /admin, log in, type the brand name (for example Khaadi or Nishat Linen), upload the product image, enter prices/stock, and save. The brand automatically appears in the brand menu and its own filtered collection.

PRODUCTION NOTE
This is a real working local backend with a JSON data store. For a public production store, replace the JSON store with a proper database (PostgreSQL/Supabase/MySQL), use HTTPS, a persistent session store, a strong admin password/secret, and connect a transactional email/payment provider. The frontend/API structure is already separated so this upgrade is straightforward.

CONTACT
Phone/WhatsApp: 0334 5581169
Email: brandedoutletbyfatima786@gmail.com
