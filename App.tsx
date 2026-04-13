
import React, { useState, useCallback, useEffect } from 'react';
import { MenuItem, CartItem, OrderType, Order, ViewState, TableInfo } from './types';
import { MENU_ITEMS, TAX_RATE, SERVICE_FEE } from './constants';
import { Language, t, formatCurrency } from './i18n';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Menu');
  const [orders, setOrders] = useState<Order[]>([]);

  const [userDetails, setUserDetails] = useState({ name: '', phone: '', address: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  const [adminView, setAdminView] = useState<'dashboard' | 'orders' | 'menu' | 'analytics' | 'settings'>('dashboard');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Admin States
  const [orderFilter, setOrderFilter] = useState('All');
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [taxRate, setTaxRate] = useState(TAX_RATE);
  const [appServiceFee, setAppServiceFee] = useState(SERVICE_FEE);
  const [tables, setTables] = useState<TableInfo[]>([
    { id: 't1', number: '1', status: 'free' },
    { id: 't2', number: '2', status: 'free' },
    { id: 't3', number: '3', status: 'free' },
    { id: 't4', number: '4', status: 'free' },
    { id: 't5', number: '5', status: 'free' },
  ]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const typeParam = params.get('type');
    
    if (tableParam && typeParam === 'dinein') {
      setTableNumber(tableParam);
      setOrderType(OrderType.DINE_IN);
      setView('menu');
    }
  }, []);

  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i);
      }
      if (quantity <= 0) return prev;
      return [...prev, { ...item, cartId: crypto.randomUUID(), quantity }];
    });
  }, []);

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartId === cartId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax + (subtotal > 0 ? appServiceFee : 0);

  const finalizeOrder = () => {
    if (orderType === OrderType.DELIVERY && (!userDetails.name || !userDetails.phone || !userDetails.address)) {
      alert('Please fill in all required delivery details: Name, Phone, and Address.');
      return;
    }
    if (orderType === OrderType.COLLECTION && (!userDetails.name || !userDetails.phone)) {
      alert('Please fill in all required collection details: Name and Phone.');
      return;
    }
    // DINE_IN allows optional name/phone.

    const now = new Date().toISOString();

    const newOrder: Order = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: userDetails.name,
      phone: userDetails.phone,
      address: userDetails.address,
      tableNumber: orderType === OrderType.DINE_IN && tableNumber ? tableNumber : undefined,
      notes: orderNotes,
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      serviceFee: subtotal > 0 ? SERVICE_FEE : 0,
      total: total,
      type: orderType as OrderType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    setOrders(prev => [newOrder, ...prev]);
    setView('success');
    setCart([]);
    // Only reset orderType and tableNumber if we are NOT locked to Table mode, but we can just leave tableNumber and reset orderType for now. 
    // Actually, keeping them is fine if they stay on table.
    // If tableNumber exists, we keep DINE_IN.
    if (!tableNumber) {
        setOrderType(null);
    } else {
        setOrderType(OrderType.DINE_IN);
    }
    setUserDetails({ name: '', phone: '', address: '' });
    setOrderNotes('');
  };

  if (view === 'landing') {
    return (
      <div className="bg-background-dark text-white min-h-screen overflow-y-auto selection:bg-primary/30">
        <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/5 py-4 md:py-6 px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <span className="material-icons-round text-primary text-2xl md:text-3xl">restaurant</span>
            <span className="text-xl md:text-2xl font-black tracking-tighter">{t(lang, 'brand.name')}</span>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-gray-300">
            <a href="#" className="hover:text-primary transition-colors">{t(lang, 'nav.home')}</a>
            <button onClick={() => setView('menu')} className="hover:text-primary transition-colors">{t(lang, 'nav.menu')}</button>
            <a href="#" className="hover:text-primary transition-colors">{t(lang, 'nav.about')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t(lang, 'nav.contact')}</a>
            <button onClick={() => setView('login')} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-all">
              {t(lang, 'nav.staffLogin')}
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
               <button onClick={() => setLang('en')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'en' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>EN</button>
               <button onClick={() => setLang('fr')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'fr' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>FR</button>
               <button onClick={() => setLang('ar')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'ar' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>AR</button>
            </div>

            <button onClick={() => setView('menu')} className="hidden sm:flex bg-primary hover:bg-red-600 px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95">
              {t(lang, 'nav.orderNow')}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
            >
              <span className="material-icons-round">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 top-[73px] bg-background-dark/95 z-50 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
              <button
                onClick={() => {
                  setView('menu');
                  setIsMobileMenuOpen(false);
                }}
                className="text-2xl font-black text-start flex items-center justify-between group"
              >
                {t(lang, 'nav.menu')} <span className="material-icons-round text-primary group-hover:translate-x-2 transition-transform">east</span>
              </button>
              <a href="#" className="text-2xl font-black text-start" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'nav.about')}</a>
              <a href="#" className="text-2xl font-black text-start" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'nav.contact')}</a>
              <div className="mt-auto pt-8 border-t border-white/10 space-y-4">
                <button onClick={() => setView('login')} className="w-full bg-white/5 p-5 rounded-2xl font-bold flex items-center justify-center gap-3">
                  <span className="material-icons-round">lock</span> {t(lang, 'nav.staffLogin')}
                </button>
                <button onClick={() => setView('menu')} className="w-full bg-primary p-5 rounded-2xl font-black flex items-center justify-center gap-3">
                  {t(lang, 'nav.orderNow')} <span className="material-icons-round">east</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        <section className="relative h-[90vh] md:h-screen flex flex-col items-center justify-center text-center px-4 md:px-6">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=2000"
              className="w-full h-full object-cover opacity-30 scale-105"
              alt="Hero Background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background-dark/20 via-background-dark/40 to-background-dark"></div>
          </div>

          <div className="relative z-10 max-w-4xl space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full">
              <span className="material-icons-round text-primary text-xs md:text-sm">stars</span>
              <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">{t(lang, 'hero.voted')}</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95] md:leading-[0.9]">
              {t(lang, 'hero.title1')} <br className="hidden md:block" />
              <span className="text-primary">{t(lang, 'hero.title2')}</span>
            </h1>

            <p className="text-gray-400 text-base md:text-lg lg:text-xl max-w-2xl mx-auto font-medium leading-relaxed px-4 text-center">
              {t(lang, 'hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-6 md:px-0">
              <button onClick={() => setView('menu')} className="w-full sm:w-auto bg-primary hover:bg-red-600 px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-black text-base lg:text-lg shadow-2xl shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-95">
                <span className="material-icons-round">local_mall</span>
                {t(lang, 'hero.placeOrder')}
              </button>
              <button onClick={() => setView('menu')} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-black text-base lg:text-lg border border-white/10 transition-all backdrop-blur-sm active:scale-95">
                {t(lang, 'hero.viewMenu')}
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: 'eco', title: t(lang, 'feat.fresh'), desc: t(lang, 'feat.freshSub') },
            { icon: 'schedule', title: t(lang, 'feat.fast'), desc: t(lang, 'feat.fastSub') },
            { icon: 'restaurant', title: t(lang, 'feat.family'), desc: t(lang, 'feat.familySub') },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-3xl flex items-center gap-4 md:gap-6 group hover:bg-white/10 transition-all text-start">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                <span className="material-icons-round text-2xl md:text-3xl">{f.icon}</span>
              </div>
              <div>
                <h3 className="font-black text-lg md:text-xl mb-0.5 md:mb-1">{f.title}</h3>
                <p className="text-gray-400 text-xs md:text-sm font-medium">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="py-16 md:py-24 px-6 md:px-12 space-y-12 md:space-y-16">
          <div className="text-center space-y-3 md:space-y-4">
            <h4 className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{t(lang, 'menu.favorites')}</h4>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t(lang, 'menu.popular')}</h2>
            <div className="w-16 md:w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {MENU_ITEMS.slice(0, 4).map(item => (
              <div key={item.id} className="bg-surface-dark rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-5 border border-white/5 space-y-3 md:space-y-4 group">
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-black/40 relative">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                  {item.isPopular && (
                    <div className="absolute top-4 end-4 bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {t(lang, 'menu.spicy')}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-base md:text-lg leading-tight">{t(lang, `menu.item.${item.id}.name` as any)}</h3>
                  <span className="text-primary font-black text-base md:text-lg">{formatCurrency(item.price, lang)}</span>
                </div>
                <p className="text-gray-400 text-[10px] md:text-xs font-medium line-clamp-2">{t(lang, `menu.item.${item.id}.desc` as any)}</p>
                <button
                  onClick={() => {
                    setView('menu');
                    addToCart(item);
                  }}
                  className="w-full bg-white/5 hover:bg-primary py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round text-base">shopping_cart</span>
                  {t(lang, 'menu.addToOrder')}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => setView('menu')} className="text-gray-400 hover:text-primary font-bold text-xs md:text-sm uppercase tracking-widest transition-colors inline-flex items-center gap-2">
              {t(lang, 'menu.viewFull')} <span className="material-icons-round text-base rotate-0 rtl:rotate-180">east</span>
            </button>
          </div>
        </section>

        <section className="bg-primary/90 py-16 md:py-24 px-6 md:px-12 mx-6 md:mx-12 rounded-[2rem] md:rounded-[3rem] mb-16 md:mb-24 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              {t(lang, 'app.title1')} <br className="hidden md:block" /> {t(lang, 'app.title2')}
            </h2>
            <p className="text-white/80 font-medium max-w-md mx-auto md:mx-0 text-sm md:text-base">
              {t(lang, 'app.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
                <span className="material-icons-round text-2xl md:text-3xl">apple</span>
                <div className="text-start">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase">{t(lang, 'app.store')}</p>
                  <p className="text-base md:text-lg font-black leading-none">App Store</p>
                </div>
              </button>
              <button className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
                <span className="material-icons-round text-2xl md:text-3xl">play_arrow</span>
                <div className="text-start">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase">{t(lang, 'app.play')}</p>
                  <p className="text-base md:text-lg font-black leading-none">Google Play</p>
                </div>
              </button>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-xs md:max-w-sm">
            <img
              src="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600"
              className="rounded-2xl md:rounded-3xl shadow-2xl md:rotate-3"
              alt="App Preview"
            />
          </div>
        </section>

        <footer className="bg-black/50 border-t border-white/5 pt-16 md:pt-24 pb-12 px-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-primary text-2xl md:text-3xl">restaurant</span>
                <span className="text-xl md:text-2xl font-black tracking-tighter">{t(lang, 'brand.name')}</span>
              </div>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {t(lang, 'footer.desc')}
              </p>
            </div>

            <div>
              <h4 className="font-black text-lg mb-6 md:mb-8">{t(lang, 'footer.hours')}</h4>
              <div className="space-y-4 text-xs md:text-sm font-bold">
                <div className="flex justify-between text-gray-500"><span>{t(lang, 'footer.monThu')}</span><span className="text-white">11:00 AM - 10:00 PM</span></div>
                <div className="flex justify-between text-gray-500"><span>{t(lang, 'footer.friSat')}</span><span className="text-white">11:00 AM - 11:00 PM</span></div>
                <div className="flex justify-between text-gray-500"><span>{t(lang, 'footer.sun')}</span><span className="text-white">12:00 PM - 10:00 PM</span></div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-lg mb-6 md:mb-8">{t(lang, 'footer.contact')}</h4>
              <div className="space-y-4 text-xs md:text-sm font-bold text-gray-500">
                <div className="flex gap-3"><span className="material-icons-round text-primary text-lg">location_on</span><span>{t(lang, 'admin.settings.address')}</span></div>
                <div className="flex gap-3"><span className="material-icons-round text-primary text-lg">phone</span><span>(212) 555-0199</span></div>
                <div className="flex gap-3"><span className="material-icons-round text-primary text-lg">email</span><span>hello@goldendragon.com</span></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl md:rounded-3xl p-2 h-40 md:h-48 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400"
                className="w-full h-full object-cover rounded-xl md:rounded-2xl opacity-50"
                alt="Map"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-white text-black px-4 py-2 rounded-lg text-[10px] md:text-xs font-black shadow-xl">{t(lang, 'footer.directions')}</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 md:pt-12 border-t border-white/5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-600 gap-4 text-center md:text-start">
            <p>{t(lang, 'footer.rights')}</p>
            <div className="flex gap-6 md:gap-8">
              <a href="#" className="hover:text-primary transition-colors">{t(lang, 'footer.privacy')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t(lang, 'footer.terms')}</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'login') {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginPassword === 'admin123') {
        setView('admin');
      } else {
        setLoginError(true);
        setTimeout(() => setLoginError(false), 2000);
      }
    };

    return (
      <div className="bg-background-dark min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-dark border border-white/10 rounded-[2.5rem] p-12 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-icons-round text-4xl">lock</span>
            </div>
            <h1 className="text-3xl font-black">{t(lang, 'nav.staffLogin')}</h1>
            <p className="text-gray-400 font-medium">{t(lang, 'login.desc')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t(lang, 'login.pass')}</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full bg-black/40 border-2 ${loginError ? 'border-red-500' : 'border-white/5'} rounded-2xl py-4 px-6 focus:border-primary transition-all outline-none text-xl tracking-widest text-center`}
                placeholder="••••••••"
                autoFocus
              />
              {loginError && <p className="text-red-500 text-xs font-bold text-center animate-bounce">{t(lang, 'login.incorrect')}</p>}
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 text-lg group">
              <span>{t(lang, 'admin.staffPanel')}</span>
              <span className="material-icons-round group-hover:translate-x-1 transition-transform">login</span>
            </button>
          </form>

          <button onClick={() => setView('landing')} className="w-full text-gray-500 font-bold text-sm uppercase tracking-widest hover:text-white transition-colors">
            {t(lang, 'success.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    const updateOrderStatus = (id: string, status: Order['status']) => {
      setOrders(prev => prev.map(o => {
        if (o.id === id) {
          const now = new Date().toISOString();
          const updates: Partial<Order> = { status, updatedAt: now };
          if (status === 'ready') updates.readyAt = now;
          if (status === 'completed') updates.completedAt = now;
          return { ...o, ...updates };
        }
        return o;
      }));
    };

    const handleMenuItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof MenuItem) => {
      if (!editingMenuItem) return;
      let val: any = e.target.value;
      if (e.target.type === 'number') val = parseFloat(val) || 0;
      if (e.target.type === 'checkbox') val = (e.target as HTMLInputElement).checked;
      setEditingMenuItem({ ...editingMenuItem, [field]: val });
    };

    const saveMenuItem = () => {
      if (!editingMenuItem || !editingMenuItem.name) return;
      if (editingMenuItem.id) {
         setMenuItems(prev => prev.map(i => i.id === editingMenuItem.id ? editingMenuItem as MenuItem : i));
      } else {
         const newItem = { 
             ...editingMenuItem, 
             id: editingMenuItem.name.toLowerCase().replace(/\s+/g, '-'), 
             price: editingMenuItem.price || 0,
             isAvailable: editingMenuItem.isAvailable ?? true
         } as MenuItem;
         setMenuItems(prev => [newItem, ...prev]);
      }
      setEditingMenuItem(null);
    };

    const deleteMenuItem = (id: string) => {
      if(window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الصنف؟' : lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet article ?' : 'Are you sure you want to delete this item?')) {
        setMenuItems(prev => prev.filter(i => i.id !== id));
      }
    };
    
    const todaysOrders = orders;
    const revenue = todaysOrders.reduce((acc, o) => acc + o.total, 0);
    const pendingCount = todaysOrders.filter(o => o.status === 'pending').length;
    const occupiedTables = new Set(todaysOrders.filter(o => o.type === OrderType.DINE_IN && o.status !== 'completed' && o.status !== 'cancelled' && o.tableNumber).map(o => o.tableNumber)).size;

    const filteredOrders = orderFilter === 'All' ? orders : orders.filter(o => {
      if (orderFilter === 'New') return o.status === 'pending';
      return o.status === orderFilter.toLowerCase();
    });

    return (
      <div className="bg-background-dark min-h-screen flex flex-col lg:flex-row text-white overflow-hidden">
        <header className="lg:hidden h-16 shrink-0 border-b border-white/5 bg-surface-dark px-4 flex items-center justify-between z-50 gap-4">
          <div className="flex items-center gap-2" onClick={() => setView('landing')}>
            <span className="material-icons-round text-primary">restaurant</span>
            <span className="font-black tracking-tighter shrink-0">{t(lang, 'admin.staffPanel')}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0 scale-90">
               <button onClick={() => setLang('en')} className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
               <button onClick={() => setLang('fr')} className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'fr' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>FR</button>
               <button onClick={() => setLang('ar')} className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'ar' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>AR</button>
            </div>

            <button onClick={() => setIsAdminSidebarOpen(!isAdminSidebarOpen)} className="p-2 hover:bg-white/5 rounded-xl shrink-0">
              <span className="material-icons-round">{isAdminSidebarOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </header>

        <aside
          className={`
            fixed lg:relative inset-y-0 start-0 z-40
            w-72 lg:w-72 border-r border-white/5 bg-background-dark p-8 space-y-12
            transition-transform duration-300 lg:translate-x-0
            ${isAdminSidebarOpen ? 'translate-x-0 pt-24 lg:pt-8' : '-translate-x-full rtl:translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <span className="material-icons-round text-primary text-3xl">restaurant</span>
            <span className="text-2xl font-black tracking-tighter">{t(lang, 'admin.staffPanel')}</span>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: 'dashboard', label: t(lang, 'admin.dashboard') },
              { id: 'orders', icon: 'list_alt', label: t(lang, 'admin.orders') },
              { id: 'menu', icon: 'restaurant_menu', label: t(lang, 'admin.menuEditor') },
              { id: 'analytics', icon: 'insights', label: t(lang, 'admin.analytics') },
              { id: 'settings', icon: 'settings', label: t(lang, 'admin.settings') },
            ].map(n => (
              <button
                key={n.id}
                onClick={() => {
                  setAdminView(n.id as typeof adminView);
                  setIsAdminSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${adminView === n.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="material-icons-round">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
            <button onClick={() => setView('landing')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-all">
              <span className="material-icons-round">logout</span>
              {t(lang, 'admin.logout')}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
          {adminView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <h1 className="text-4xl font-black tracking-tight">{t(lang, 'admin.dashboard')}</h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: t(lang, 'admin.dashboard.totalOrders'), value: todaysOrders.length, icon: 'receipt_long', color: 'bg-blue-500' },
                  { label: t(lang, 'admin.totalRevenue'), value: formatCurrency(revenue, lang), icon: 'attach_money', color: 'bg-green-500' },
                  { label: t(lang, 'admin.dashboard.pendingOrders'), value: pendingCount, icon: 'hourglass_top', color: 'bg-orange-500' },
                  { label: t(lang, 'admin.dashboard.occupied'), value: occupiedTables, icon: 'deck', color: 'bg-purple-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-dark border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-4">
                    <div className={`w-12 h-12 ${stat.color}/20 rounded-2xl flex items-center justify-center ${stat.color.replace('bg-', 'text-')}`}>
                      <span className="material-icons-round text-2xl">{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-bold mt-8 mb-4">{t(lang, 'admin.dashboard.recent')}</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="bg-surface-dark border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-lg">{o.id}</span>
                      <span className="mx-4 text-sm text-gray-400">{o.customerName || (o.tableNumber ? `${t(lang, 'success.table')} ${o.tableNumber}` : t(lang, 'admin.status.new'))}</span>
                    </div>
                    <span className="text-primary font-bold">{formatCurrency(o.total, lang)}</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-gray-500 text-sm">{t(lang, 'admin.noOrders')}</p>}
              </div>
            </div>
          )}

          {adminView === 'orders' && (
            <div className="animate-in fade-in">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 md:mb-12">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">{t(lang, 'admin.orders.active')}</h2>
                  <div className="flex bg-white/5 rounded-xl p-1">
                    {['All', 'New', 'Preparing', 'Ready', 'Completed'].map(f => (
                      <button
                        key={f}
                        onClick={() => setOrderFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orderFilter === f ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {t(lang, `admin.status.${f.toLowerCase()}` as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-6">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] h-96 flex flex-col items-center justify-center text-gray-500">
                    <span className="material-icons-round text-6xl mb-4">hourglass_empty</span>
                    <p className="font-bold text-xl">{t(lang, 'admin.noOrders')}</p>
                  </div>
                ) : (
                  filteredOrders.map(o => (
                    <div key={o.id} className={`bg-surface-dark border ${o.status === 'pending' ? 'border-primary shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-primary/50' : 'border-white/5'} rounded-[2.5rem] p-6 md:p-8 flex flex-col xl:flex-row items-center gap-8 group hover:border-primary/20 transition-all`}>
                      <div className="flex items-center gap-6 shrink-0 w-full xl:w-auto">
                        <div className={`w-16 h-16 ${o.status === 'pending' ? 'bg-primary text-white animate-pulse' : 'bg-primary/10 text-primary'} rounded-2xl flex items-center justify-center font-black text-xl shrink-0`}>
                          {o.id.replace('#', '')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-xl font-black tracking-tight">{o.customerName || 'Guest'}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${o.type === OrderType.DINE_IN ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {o.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] flex gap-3">
                            <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {o.tableNumber && <span className="text-primary">{t(lang, 'success.table')} {o.tableNumber}</span>}
                          </p>
                          {o.notes && <p className="text-yellow-500 text-xs mt-2 font-medium">Note: {o.notes}</p>}
                        </div>
                      </div>

                      <div className="flex-1 border-y xl:border-y-0 xl:border-x border-white/5 py-6 xl:py-0 px-0 xl:px-8 space-y-2 w-full">
                        <div className="flex flex-wrap gap-2">
                          {o.items.map(i => (
                            <span key={i.cartId} className="bg-white/5 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/5 flex gap-2">
                              <span className="text-primary">{i.quantity}x</span> {i.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="w-full xl:w-auto shrink-0 flex flex-col md:flex-row xl:flex-col items-center justify-between xl:justify-center gap-4">
                        <p className="text-2xl font-black text-primary">{formatCurrency(o.total, lang)}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">{t(lang, 'admin.action.accept')}</button>}
                          {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">{t(lang, 'admin.action.markReady')}</button>}
                          {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'completed')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">{t(lang, 'admin.action.complete')}</button>}
                          {o.status !== 'completed' && o.status !== 'cancelled' && <button onClick={() => updateOrderStatus(o.id, 'cancelled')} className="bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 px-4 py-2 rounded-xl font-bold transition-all text-xs">{t(lang, 'admin.action.cancel')}</button>}
                          {(o.status === 'completed' || o.status === 'cancelled') && <span className="text-gray-500 font-bold text-xs uppercase px-2 py-1 bg-white/5 rounded-md">{o.status}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminView === 'menu' && (
            <div className="animate-in fade-in space-y-8">
              <div className="flex justify-between items-end">
                <h1 className="text-4xl font-black tracking-tight">{t(lang, 'admin.menuEditor')}</h1>
                <button onClick={() => setEditingMenuItem({ name: '', price: 0, description: '', category: 'Starters', image: '' })} className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex gap-2 items-center">
                  <span className="material-icons-round text-sm">add</span> {t(lang, 'admin.addItem')}
                </button>
              </div>

              {editingMenuItem && (
                <div className="bg-surface-dark border border-primary/30 rounded-[2rem] p-6 md:p-8 space-y-6">
                  <h3 className="text-2xl font-bold">{editingMenuItem.id ? t(lang, 'admin.editItem') : t(lang, 'admin.menu.newItem')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.name')}</label>
                      <input type="text" value={editingMenuItem.name || ''} onChange={e => handleMenuItemChange(e, 'name')} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.price')}</label>
                      <input type="number" step="0.01" value={editingMenuItem.price || 0} onChange={e => handleMenuItemChange(e, 'price')} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.category')}</label>
                      <input type="text" value={editingMenuItem.category || ''} onChange={e => handleMenuItemChange(e, 'category')} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.image')}</label>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={editingMenuItem.image || ''} onChange={e => handleMenuItemChange(e, 'image')} placeholder="https://..." className="flex-1 min-w-0 bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-3 rounded-xl transition-all flex items-center justify-center shrink-0">
                          <span className="material-icons-round text-lg text-gray-300">upload_file</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setEditingMenuItem({...editingMenuItem, image: event.target?.result as string});
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.description')}</label>
                      <textarea value={editingMenuItem.description || ''} onChange={e => handleMenuItemChange(e, 'description')} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm h-24" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" id="isAvailable" checked={editingMenuItem.isAvailable !== false} onChange={e => handleMenuItemChange(e, 'isAvailable')} className="w-5 h-5 accent-primary" />
                      <label htmlFor="isAvailable" className="text-sm font-bold text-gray-300">{t(lang, 'admin.available')}</label>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button onClick={saveMenuItem} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold transition-all">{t(lang, 'admin.save')}</button>
                    <button onClick={() => setEditingMenuItem(null)} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all">{t(lang, 'admin.action.cancel')}</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div key={item.id} className="bg-surface-dark border border-white/5 rounded-[2rem] p-4 flex gap-4 group hover:border-primary/20 transition-all">
                    <div className="w-24 h-24 rounded-xl bg-gray-800 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';}} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold truncate text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-400 truncate">{item.category}</p>
                        <p className="text-primary font-black mt-1 text-sm">{formatCurrency(item.price, lang)}</p>
                      </div>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingMenuItem(item)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold">{t(lang, 'admin.editItem')}</button>
                        <button onClick={() => deleteMenuItem(item.id)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all">{t(lang, 'cart.delete')}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView === 'settings' && (
            <div className="animate-in fade-in space-y-8 max-w-2xl">
              <h1 className="text-4xl font-black tracking-tight">{t(lang, 'admin.settings')}</h1>
              
              <div className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-xl font-bold border-b border-white/10 pb-4">{t(lang, 'admin.settings.resInfo')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.settings.resName')}</label>
                    <input type="text" defaultValue="Golden Dragon" className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.settings.address')}</label>
                    <input type="text" defaultValue="123 Dragon Way, Chinatown, New York, NY 10013" className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-xl font-bold border-b border-white/10 pb-4">{t(lang, 'admin.settings.fees')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.settings.taxRate')}</label>
                    <div className="relative">
                      <input type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                      <span className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-500">{t(lang, 'admin.settings.taxRate')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t(lang, 'admin.settings.serviceFee')}</label>
                    <input type="number" step="0.01" value={appServiceFee} onChange={e => setAppServiceFee(parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border-transparent rounded-xl py-3 px-4 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-8">
                <h3 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">{t(lang, 'admin.tableManagement')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tables.map(t_item => (
                    <div key={t_item.id} className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center group">
                      <div className="w-32 h-32 bg-white rounded-xl mb-4 p-2 relative overflow-hidden group-hover:scale-105 transition-transform">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '?type=dinein&table=' + t_item.number)}`} alt={`${t(lang, 'success.table')} ${t_item.number} QR`} className="w-full h-full object-contain" />
                      </div>
                      <h4 className="font-black text-xl mb-1 mt-2">{t(lang, 'success.table')} {t_item.number}</h4>
                      <div className="flex gap-2">
                         <span className="text-xs text-gray-400 capitalize bg-white/5 px-3 py-1 rounded-full">{t_item.status}</span>
                         <a href={`?type=dinein&table=${t_item.number}`} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full flex items-center hover:bg-primary/20 transition-colors">
                           <span className="material-icons-round text-[10px] me-1">link</span> {t(lang, 'admin.test')}
                         </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminView === 'analytics' && (() => {
            const completedOrders = orders.filter(o => o.status === 'completed');
            const totalOrdersCount = completedOrders.length;
            const totalRev = completedOrders.reduce((a, b) => a + b.total, 0);
            
            const prepTimes = completedOrders
               .filter(o => o.readyAt && o.createdAt)
               .map(o => (new Date(o.readyAt!).getTime() - new Date(o.createdAt).getTime()) / 60000);
            const avgPrepTime = prepTimes.length ? (prepTimes.reduce((a,b)=>a+b,0) / prepTimes.length).toFixed(1) + ' min' : 'N/A';

            const itemCounts: Record<string, number> = {};
            completedOrders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity }));
            const topItems = Object.entries(itemCounts).sort((a,b)=>b[1]-a[1]).slice(0, 5);

            return (
              <div className="animate-in fade-in space-y-8">
                <h1 className="text-4xl font-black tracking-tight">{t(lang, 'admin.analytics.title')}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-dark border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><span className="material-icons-round text-sm">attach_money</span> {t(lang, 'admin.totalRevenue')}</p>
                    <h3 className="text-4xl font-black mt-2 text-green-500">{formatCurrency(totalRev, lang)}</h3>
                  </div>
                  <div className="bg-surface-dark border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><span className="material-icons-round text-sm">receipt_long</span> {t(lang, 'admin.completedOrders')}</p>
                    <h3 className="text-4xl font-black mt-2">{totalOrdersCount}</h3>
                  </div>
                  <div className="bg-surface-dark border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><span className="material-icons-round text-sm">timer</span> {t(lang, 'admin.avgPrepTime')}</p>
                    <h3 className="text-4xl font-black mt-2 text-yellow-500">{avgPrepTime}</h3>
                  </div>
                </div>

                <div className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-icons-round text-primary">trending_up</span> {t(lang, 'admin.topSelling')}</h3>
                  <div className="space-y-4">
                    {topItems.map(([name, count], idx) => (
                      <div key={name} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                        <span className="font-bold flex items-center gap-4 text-base">
                          <span className="text-gray-500 font-black text-xl w-6">#{idx+1}</span>
                          {name}
                        </span>
                        <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-xl text-sm font-black text-center min-w-[80px]">{count} {t(lang, 'admin.analytics.sold')}</span>
                      </div>
                    ))}
                    {topItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                        <span className="material-icons-round text-4xl mb-2">analytics</span>
                        <p className="text-sm font-bold">{t(lang, 'admin.analytics.noOrders')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    );
  }

  if (view === 'success') {
    const lastOrder = orders[0];
    return (
      <div className="h-screen bg-background-dark flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <span className="material-icons-round text-6xl">check</span>
        </div>
        <h1 className="text-5xl font-bold mb-4">{t(lang, 'success.title')}</h1>
        <p className="text-gray-400 max-w-md text-lg mb-8">{t(lang, 'success.subtitle')}</p>
        
        {lastOrder && (
          <div className="bg-surface-dark border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-sm mb-12 space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t(lang, 'success.orderId')}</span>
              <span className="font-black text-xl text-primary">{lastOrder.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t(lang, 'success.type')}</span>
              <span className="font-bold flex items-center gap-2">
                <span className="material-icons-round text-sm">{lastOrder.type === OrderType.DINE_IN ? 'restaurant' : lastOrder.type === OrderType.DELIVERY ? 'moped' : 'local_mall'}</span>
                {lastOrder.type === OrderType.DINE_IN ? t(lang, 'order.type.dineIn') : lastOrder.type === OrderType.DELIVERY ? t(lang, 'order.type.delivery') : t(lang, 'order.type.collection')}
              </span>
            </div>
            {lastOrder.tableNumber && (
               <div className="flex justify-between items-center bg-primary/10 p-3 rounded-xl mt-2">
                 <span className="text-primary font-bold uppercase tracking-widest text-xs">{t(lang, 'success.table')}</span>
                 <span className="font-black text-primary text-xl">{lastOrder.tableNumber}</span>
               </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t(lang, 'success.status')}</span>
              <span className="text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-full text-xs">{t(lang, 'admin.status.new')}</span>
            </div>
          </div>
        )}

        <button onClick={() => setView('landing')} className="bg-primary hover:bg-red-600 px-12 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-primary/40">
          {t(lang, 'success.backHome')}
        </button>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = activeCategory === 'All' ? menuItems : menuItems.map(item => item).filter(item => item.category === activeCategory);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 h-screen overflow-hidden flex flex-col">
      <header className="h-16 md:h-20 shrink-0 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark px-4 md:px-6 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3 md:gap-6">
          <button className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full" onClick={() => setView('landing')}>
            <span className="material-icons-round text-xl md:text-2xl">arrow_back</span>
          </button>

          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-icons-round text-sm md:text-base">restaurant</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="font-bold text-base md:text-xl tracking-tight leading-none">{t(lang, 'brand.name')}</h1>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{t(lang, 'brand.tagline')}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 md:mx-8">
          <div className="relative">
            <span className="absolute start-3 md:start-4 top-1/2 -translate-y-1/2 text-gray-400 material-icons-round text-sm md:text-base">search</span>
            <input className="w-full bg-gray-100 dark:bg-black/20 border-transparent rounded-xl py-2 md:py-3 ps-9 md:ps-12 pe-4 text-xs md:text-sm" placeholder={t(lang, 'menu.search')} type="text" />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 shrink-0 scale-90 md:scale-100">
             <button onClick={() => setLang('en')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'en' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>EN</button>
             <button onClick={() => setLang('fr')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'fr' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>FR</button>
             <button onClick={() => setLang('ar')} className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${lang === 'ar' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>AR</button>
          </div>
          <img className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary/20" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="User" />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background-light dark:bg-background-dark">
          {view === 'menu' ? (
            <>
              <div className="px-4 md:px-8 py-4 md:py-6 shrink-0 overflow-x-auto hide-scroll">
                <div className="flex items-center gap-2 md:gap-3 min-w-max">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`${activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-card-dark border border-gray-200 dark:border-white/5'} px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm transition-all active:scale-95`}
                    >
                      {cat === 'All' ? t(lang, 'menu.all') : t(lang, `cat.${cat}` as any)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{activeCategory === 'All' ? t(lang, 'menu.all') : t(lang, `cat.${activeCategory}` as any)}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="group bg-white dark:bg-card-dark rounded-2xl md:rounded-3xl p-3 md:p-4 hover:shadow-2xl transition-all border dark:border-white/5 flex flex-col h-full relative overflow-hidden">
                      <div className="aspect-square rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-4 bg-gray-800 relative">
                        <img className={`w-full h-full object-cover transition-transform duration-700 ${item.isAvailable === false ? 'opacity-50 grayscale' : 'group-hover:scale-110'}`} src={item.image} alt={t(lang, `menu.item.${item.id}.name` as any)} />
                        {item.isAvailable === false ? (
                          <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <span className="bg-red-500/90 text-white font-black px-4 py-2 text-xs rounded-xl uppercase tracking-widest border border-red-400">{t(lang, 'menu.soldOut')}</span>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} className="absolute bottom-2 md:bottom-3 right-2 md:right-3 bg-white dark:bg-surface-dark text-primary p-2 md:p-3 rounded-full shadow-2xl opacity-100 lg:opacity-0 group-hover:opacity-100 lg:translate-y-2 group-hover:translate-y-0 transition-all hover:bg-primary hover:text-white">
                            <span className="material-icons-round text-sm md:text-base">add</span>
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base md:text-lg mb-0.5 md:mb-1">{t(lang, `menu.item.${item.id}.name` as any)}</h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2 md:mb-4 line-clamp-2">{t(lang, `menu.item.${item.id}.desc` as any)}</p>
                        <span className="font-bold text-lg md:text-2xl text-primary">{formatCurrency(item.price, lang)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center md:text-left">{t(lang, 'checkout.title')}</h2>
              <div className="space-y-6 bg-white dark:bg-card-dark p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl">
                {!tableNumber && (
                   <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-black/20 rounded-2xl mb-4">
                     <button onClick={() => setOrderType(OrderType.COLLECTION)} className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all ${orderType === OrderType.COLLECTION ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>
                       {t(lang, 'order.type.collection')}
                     </button>
                     <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all ${orderType === OrderType.DELIVERY ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>
                       {t(lang, 'order.type.delivery')}
                     </button>
                   </div>
                )}
                {tableNumber && (
                   <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                     <div>
                       <p className="text-primary font-black uppercase text-xs tracking-widest mb-1">{t(lang, 'checkout.dineInOrder')}</p>
                       <p className="font-bold">{t(lang, 'checkout.orderingForTable')} {tableNumber}</p>
                     </div>
                     <span className="material-icons-round text-primary text-3xl">restaurant</span>
                   </div>
                )}

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 px-1 tracking-widest">{t(lang, 'checkout.name')} {(orderType === OrderType.DINE_IN || !orderType) && t(lang, 'checkout.optional')}</label>
                    <input type="text" value={userDetails.name} onChange={e => setUserDetails({ ...userDetails, name: e.target.value })} className="w-full bg-gray-50 dark:bg-black/30 border-transparent rounded-2xl py-3 md:py-4 px-5 md:px-6 focus:ring-primary focus:border-primary transition-all text-sm md:text-base" placeholder={t(lang, 'checkout.namePlaceholder')} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 px-1 tracking-widest">{t(lang, 'checkout.phone')} {(orderType === OrderType.DINE_IN || !orderType) && t(lang, 'checkout.optional')}</label>
                    <input type="tel" value={userDetails.phone} onChange={e => setUserDetails({ ...userDetails, phone: e.target.value })} className="w-full bg-gray-50 dark:bg-black/30 border-transparent rounded-2xl py-3 md:py-4 px-5 md:px-6 focus:ring-primary focus:border-primary transition-all text-sm md:text-base" placeholder={t(lang, 'checkout.phonePlaceholder')} />
                  </div>

                  {orderType === OrderType.DELIVERY && (
                    <div className="animate-in fade-in slide-in-from-top-4">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 px-1 tracking-widest">{t(lang, 'checkout.address')}</label>
                      <textarea rows={2} value={userDetails.address} onChange={e => setUserDetails({ ...userDetails, address: e.target.value })} className="w-full bg-gray-50 dark:bg-black/30 border-transparent rounded-2xl py-3 md:py-4 px-5 md:px-6 focus:ring-primary focus:border-primary transition-all text-sm md:text-base" placeholder={t(lang, 'checkout.addressPlaceholder')} />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 px-1 tracking-widest">{t(lang, 'checkout.notes')}</label>
                    <textarea rows={2} value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="w-full bg-gray-50 dark:bg-black/30 border-transparent rounded-2xl py-3 md:py-4 px-5 md:px-6 focus:ring-primary focus:border-primary transition-all text-sm md:text-base" placeholder={t(lang, 'checkout.notesPlaceholder')} />
                  </div>
                </div>

                <div className="pt-4 md:pt-6 border-t border-gray-100 dark:border-white/5">
                  <button onClick={finalizeOrder} className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 md:py-5 rounded-2xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 text-base md:text-lg">
                    <span>{t(lang, 'checkout.confirm')} • {formatCurrency(total, lang)}</span>
                    <span className="material-icons-round">check_circle</span>
                  </button>
                  <button onClick={() => setView('menu')} className="w-full mt-4 md:mt-6 text-xs md:text-sm text-gray-500 font-medium hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <span className="material-icons-round text-sm">arrow_back</span> {t(lang, 'checkout.return')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden fixed bottom-8 right-6 z-40 w-16 h-16 bg-white dark:bg-card-dark text-primary rounded-full shadow-2xl flex items-center justify-center border border-primary/20 active:scale-95 transition-all"
          >
            <div className="relative">
              <span className="material-icons-round text-3xl">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-card-dark">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </div>
          </button>
        </div>

        <aside
          className={`
            fixed lg:relative inset-y-0 end-0 z-50 lg:z-0
            w-full lg:w-[440px] h-full
            bg-white dark:bg-card-dark border-l border-gray-100 dark:border-white/5
            flex flex-col shadow-2xl lg:shadow-none
            transition-transform duration-500 ease-in-out
            ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-6 md:p-8 border-b dark:border-white/5 flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
              {t(lang, 'cart.basket')}
              <span className="bg-primary/10 text-primary text-sm font-black px-3 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </h2>
            <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
              <span className="material-icons-round">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4 opacity-50">
                <span className="material-icons-round text-6xl md:text-7xl">shopping_cart</span>
                <p className="font-bold">{t(lang, 'cart.empty')}</p>
                <p className="text-sm text-center">{t(lang, 'cart.emptySub')}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="flex gap-4 md:gap-5 group animate-in slide-in-from-right-4">
                  <div className="w-20 md:w-24 h-20 md:h-24 rounded-2xl overflow-hidden bg-gray-800 shrink-0 shadow-lg">
                    <img className="w-full h-full object-cover" src={item.image} alt={t(lang, `menu.item.${item.id}.name` as any)} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm md:text-base leading-tight ps-2">{t(lang, `menu.item.${item.id}.name` as any)}</h4>
                      <span className="font-black text-sm md:text-base">{formatCurrency(item.price * item.quantity, lang)}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center bg-gray-50 dark:bg-black/20 rounded-xl p-1 border dark:border-white/5">
                        <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1.5 md:p-2 hover:text-primary transition-colors">
                          <span className="material-icons-round text-xs md:text-base">remove</span>
                        </button>
                        <span className="text-xs md:text-sm font-black w-6 md:w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1.5 md:p-2 hover:text-primary transition-colors">
                          <span className="material-icons-round text-xs md:text-base">add</span>
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest px-2">
                        {t(lang, 'cart.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 md:p-8 bg-gray-50 dark:bg-card-dark border-t dark:border-white/10">
            {!tableNumber ? (
              <div className="flex gap-3 mb-6 md:mb-8">
                <button onClick={() => setOrderType(OrderType.COLLECTION)} className={`flex-1 flex flex-col items-center justify-center p-3 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-2 transition-all ${orderType === OrderType.COLLECTION ? 'border-primary bg-primary/5 shadow-inner' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark'}`}>
                  <span className="material-icons-round text-2xl md:text-3xl mb-1">local_mall</span>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t(lang, 'order.type.collection')}</span>
                </button>
                <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`flex-1 flex flex-col items-center justify-center p-3 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-2 transition-all ${orderType === OrderType.DELIVERY ? 'border-primary bg-primary/5 shadow-inner' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark'}`}>
                  <span className="material-icons-round text-2xl md:text-3xl mb-1">moped</span>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{t(lang, 'order.type.delivery')}</span>
                </button>
              </div>
            ) : (
               <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between mb-6 md:mb-8">
                 <div>
                   <p className="text-primary font-black uppercase text-xs tracking-widest mb-1">{t(lang, 'checkout.dineInOrder')}</p>
                   <p className="font-bold">{t(lang, 'success.table')} {tableNumber}</p>
                 </div>
                 <span className="material-icons-round text-primary text-3xl">restaurant</span>
               </div>
            )}

            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <div className="flex justify-between text-xs md:text-sm text-gray-500 font-bold"><span>{t(lang, 'cart.subtotal')}</span><span>{formatCurrency(subtotal, lang)}</span></div>
              <div className="flex justify-between text-xs md:text-sm text-gray-500 font-bold"><span>{t(lang, 'cart.tax')}</span><span>{formatCurrency(tax + (subtotal > 0 ? SERVICE_FEE : 0), lang)}</span></div>
              <div className="flex justify-between items-end pt-3 md:pt-4 border-t dark:border-white/10">
                <span className="text-base md:text-lg font-black uppercase tracking-tighter">{t(lang, 'cart.total')}</span>
                <span className="text-2xl md:text-3xl font-black text-primary">{formatCurrency(total, lang)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setView('details');
                setIsMobileCartOpen(false);
              }}
              disabled={cart.length === 0}
              className={`w-full font-black py-4 md:py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 text-base md:text-lg uppercase tracking-widest ${cart.length > 0 ? 'bg-primary hover:bg-red-600 text-white shadow-primary/40' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}
            >
              <span>{t(lang, 'cart.checkout')}</span>
              <span className="material-icons-round">east</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
