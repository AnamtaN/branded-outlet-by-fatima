const DELIVERY = 250;
let PRODUCTS_LOCAL = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
let PRODUCTS = [...PRODUCTS_LOCAL];
let cart = JSON.parse(localStorage.getItem('bof_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('bof_wishlist') || '[]');
let activeBrand = new URLSearchParams(location.search).get('brand') || 'All';
let activeFilter = new URLSearchParams(location.search).get('filter') || 'all';
let query = '';

const $ = id => document.getElementById(id);
const money = n => n == null || n === '' || Number.isNaN(Number(n)) ? 'Price on request' : `Rs. ${Number(n).toLocaleString('en-PK')}`;
const escapeHtml = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function loadProducts(){
  try { const r=await fetch('/api/products'); if(!r.ok) throw new Error(); const data=await r.json(); if(Array.isArray(data) && data.length){ PRODUCTS=data; } else { PRODUCTS=[...PRODUCTS_LOCAL]; } } catch { PRODUCTS=[...PRODUCTS_LOCAL]; }
  await renderBrands(); render();
}
async function loadBrands(){
  try { const r=await fetch('/api/brands'); if(r.ok) return await r.json(); } catch {}
  return [...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))].sort();
}
function brandUrl(brand){ return brand==='All' ? './#shop' : `./?brand=${encodeURIComponent(brand)}#shop`; }
async function renderBrands(){
  const brands=await loadBrands();
  $('brandDropdown').innerHTML=brands.map(b=>`<a href="${brandUrl(b)}">${escapeHtml(b)}</a>`).join('');
  $('brandChips').innerHTML=`<a class="brand-chip ${activeBrand==='All'?'active':''}" href="index.html#shop">All Brands <small>${PRODUCTS.length}</small></a>`+brands.map(b=>{const n=PRODUCTS.filter(p=>p.brand===b).length;return `<a class="brand-chip ${activeBrand.toLowerCase()===b.toLowerCase()?'active':''}" href="${brandUrl(b)}">${escapeHtml(b)} <small>${n}</small></a>`}).join('');
  $('footerBrands').innerHTML=brands.map(b=>`<a href="${brandUrl(b)}">${escapeHtml(b)}</a>`).join('');
}
function filtered(){
  let a=[...PRODUCTS];
  if(activeBrand!=='All') a=a.filter(p=>String(p.brand).toLowerCase()===activeBrand.toLowerCase());
  if(activeFilter==='Sale') a=a.filter(p=>p.sale!=null && p.original!=null && Number(p.sale)<Number(p.original));
  else if(activeFilter!=='all') a=a.filter(p=>String(p.category).toLowerCase()===activeFilter.toLowerCase());
  if(query) a=a.filter(p=>`${p.brand} ${p.name} ${p.code} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  const s=$('sortSelect').value;
  if(s==='low') a.sort((x,y)=>(x.sale??Infinity)-(y.sale??Infinity));
  if(s==='high') a.sort((x,y)=>(y.sale??-1)-(x.sale??-1));
  if(s==='new') a.sort((x,y)=>(y.id||0)-(x.id||0));
  return a;
}
function card(p){
  const wished=wishlist.includes(Number(p.id));
  const discount=p.original&&p.sale?Math.round((1-p.sale/p.original)*100):null;
  const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : '/' + p.image.replace(/^\//,'')) : '';
  return `<article class="product-card"><div class="product-image"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.brand+' '+p.name)}" loading="lazy" onerror="this.style.display='none'"><span class="badge">${escapeHtml(p.badge||'NEW')}</span><button class="heart ${wished?'active':''}" data-wish="${p.id}">♡</button>${discount?`<span class="discount">-${discount}%</span>`:''}</div><div class="product-info"><p class="brand">${escapeHtml(p.brand)}</p><h3>${escapeHtml(p.name)}</h3><p class="code">${escapeHtml(p.code||'')}</p><div class="price">${p.original?`<del>${money(p.original)}</del>`:''}<strong>${money(p.sale)}</strong></div><div class="card-actions"><button class="btn outline" data-view="${p.id}">QUICK VIEW</button><button class="btn dark" data-add="${p.id}">ADD TO CART</button></div></div></article>`;
}
function render(){
  const a=filtered();
  const title=activeBrand==='All'?'Shop all products':`${activeBrand} Collection`;
  $('collectionTitle').textContent=title; $('collectionEyebrow').textContent=activeBrand==='All'?'OUR COLLECTION':activeBrand.toUpperCase();
  $('resultText').textContent=`${a.length} product${a.length===1?'':'s'}${query?' matching your search':''}`;
  $('productGrid').innerHTML=a.map(card).join(''); $('emptyState').hidden=a.length!==0;
  document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===activeFilter));
  $('wishCount').textContent=wishlist.length; $('cartCount').textContent=cart.reduce((n,i)=>n+i.qty,0); renderCart();
}
function save(){localStorage.setItem('bof_cart',JSON.stringify(cart));localStorage.setItem('bof_wishlist',JSON.stringify(wishlist));}
function add(id){const p=PRODUCTS.find(x=>Number(x.id)===Number(id)); if(!p)return; const found=cart.find(x=>Number(x.id)===Number(id)); if(found)found.qty++; else cart.push({id:Number(id),qty:1}); save(); render(); openCart();}
function toggleWish(id){id=Number(id);wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];save();render();}
function renderCart(){
  const items=cart.map(i=>({...i,p:PRODUCTS.find(p=>Number(p.id)===Number(i.id))})).filter(x=>x.p);
  const sub=items.reduce((n,i)=>n+(Number(i.p.sale)||0)*i.qty,0); const delivery=items.length?DELIVERY:0;
  $('cartItems').innerHTML=items.length?items.map(i=>`<div class="cart-item"><img src="${escapeHtml(i.p.image)}"><div><b>${escapeHtml(i.p.brand)}</b><h4>${escapeHtml(i.p.name)}</h4><small>${money(i.p.sale)}</small><div class="qty"><button data-qty="${i.id}" data-dir="-1">−</button><span>${i.qty}</span><button data-qty="${i.id}" data-dir="1">+</button><button class="remove" data-remove="${i.id}">Remove</button></div></div></div>`).join(''):'<p class="muted">Your cart is empty.</p>';
  $('subtotal').textContent=money(sub); $('delivery').textContent=money(delivery); $('grandTotal').textContent=money(sub+delivery); $('checkoutTotal').textContent=money(sub+delivery);
}
function openCart(){document.body.classList.add('drawer-open');}
function closeAll(){document.body.classList.remove('drawer-open','modal-open');document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));}
function openModal(id){$(id).classList.add('show');document.body.classList.add('modal-open');}
function view(id){const p=PRODUCTS.find(x=>Number(x.id)===Number(id));if(!p)return; $('productModalContent').innerHTML=`<div class="quick-grid"><div><img src="${escapeHtml(p.image)}" alt=""></div><div><p class="eyebrow">${escapeHtml(p.brand)}</p><h2>${escapeHtml(p.name)}</h2><p class="code">${escapeHtml(p.code)}</p><div class="price big">${p.original?`<del>${money(p.original)}</del>`:''}<strong>${money(p.sale)}</strong></div><p>Category: ${escapeHtml(p.category)}</p><button class="btn dark" data-add="${p.id}">ADD TO CART</button></div></div>`;openModal('productModal');}

document.querySelector('.brand-menu-btn').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();document.querySelector('.brand-menu').classList.toggle('open');});
document.addEventListener('click',e=>{if(!e.target.closest('.brand-menu'))document.querySelector('.brand-menu').classList.remove('open');
  const addBtn=e.target.closest('[data-add]'); if(addBtn){add(addBtn.dataset.add);return;}
  const wish=e.target.closest('[data-wish]'); if(wish){toggleWish(wish.dataset.wish);return;}
  const viewBtn=e.target.closest('[data-view]'); if(viewBtn){view(viewBtn.dataset.view);return;}
  const q=e.target.closest('[data-qty]'); if(q){const i=cart.find(x=>Number(x.id)===Number(q.dataset.qty));if(i){i.qty+=Number(q.dataset.dir);if(i.qty<1)cart=cart.filter(x=>x!==i);save();render();}return;}
  const rm=e.target.closest('[data-remove]'); if(rm){cart=cart.filter(x=>Number(x.id)!==Number(rm.dataset.remove));save();render();return;}
  if(e.target.matches('[data-close]')||e.target.id==='overlay')closeAll();
});

document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');render();}));
$('sortSelect').addEventListener('change',render);
$('searchBtn').addEventListener('click',()=>{query=$('searchInput').value.trim();document.querySelector('#shop').scrollIntoView({behavior:'smooth'});render();});
$('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){$('searchBtn').click();}});
$('cartBtn').addEventListener('click',openCart);$('wishlistBtn').addEventListener('click',()=>{activeFilter='all';query='';const ids=new Set(wishlist);const a=PRODUCTS.filter(p=>ids.has(Number(p.id)));$('collectionTitle').textContent='Wishlist';$('resultText').textContent=`${a.length} saved product${a.length===1?'':'s'}`;$('productGrid').innerHTML=a.map(card).join('');document.querySelector('#shop').scrollIntoView({behavior:'smooth'});});
$('accountBtn').addEventListener('click',()=>openModal('accountModal'));
$('checkoutBtn').addEventListener('click',()=>{if(!cart.length)return alert('Your cart is empty.');openModal('checkoutModal');});
$('checkoutForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);const items=cart.map(i=>({id:i.id,qty:i.qty}));const payload={customer:Object.fromEntries(fd.entries()),items,total:document.getElementById('checkoutTotal').textContent};try{const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(r.ok){const j=await r.json();alert(`Order received. Order ID: ${j.orderId}`);}else throw 0;}catch{alert('Order saved in this browser. Run the included Node backend to save orders to the server.');}cart=[];save();closeAll();render();});
$('newsletterForm').addEventListener('submit',e=>{e.preventDefault();alert('Thank you for subscribing.');e.target.reset();});$('footerNewsletter').addEventListener('submit',e=>{e.preventDefault();alert('Thank you for subscribing.');e.target.reset();});
$('mobileMenu').addEventListener('click',()=>document.body.classList.toggle('menu-open'));
loadProducts();
