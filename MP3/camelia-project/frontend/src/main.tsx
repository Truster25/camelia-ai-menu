import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Coffee, Leaf, Menu as MenuIcon, Sparkles, X } from 'lucide-react';
import './styles.css';

type Dish = { id: number; name: string; category: string; description: string; price: number; tag: string; tone: string };
function App() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [open, setOpen] = useState(false);
  useEffect(() => { fetch('/api/menu').then(r => { if (!r.ok) throw new Error('API error'); return r.json(); }).then(data => { setDishes(data.items); setStatus('ready'); }).catch(() => setStatus('error')); }, []);
  const close = () => setOpen(false);
  return <>
    <div className="announcement">A LITTLE MORE TO LOVE <span>✳</span> EVERY DAY AT CAMELLIA</div>
    <header className="header" id="top">
      <a href="#top" className="brand" aria-label="Camellia home"><img src="/images/camellia-orange.png" alt="Camellia Café and Restaurant Kigali" /></a>
      <nav className={open ? 'nav is-open' : 'nav'} aria-label="Main navigation">
        <a className="active" href="#top" onClick={close}>Home</a><a href="#menu" onClick={close}>Our menu</a><a href="#story" onClick={close}>Our story</a><a href="#discover" onClick={close}>Discover</a>
      </nav>
      <a className="header-cta" href="#menu">Explore the menu <ArrowUpRight size={15}/></a>
      <button className="mobile-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <MenuIcon/>}</button>
    </header>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><div className="eyebrow"><span className="line"/> GOOD FOOD. GOOD MOMENTS.</div>
          <h1 id="hero-title">Made for<br/>moments <em>worth<br/>savouring.</em></h1>
          <p>From your first coffee to your favourite plate, find a little something to love at Camellia.</p>
          <a className="primary-link" href="#menu"><span className="circle"><ArrowRight size={19}/></span><span>EXPLORE OUR MENU</span></a>
          <a href="#menu" className="scroll"><span className="scroll-circle"><ArrowDown size={14}/></span><span>SCROLL TO EXPLORE</span></a>
        </div>
        <div className="hero-image" role="img" aria-label="A plated meal in a dark restaurant setting"><div className="image-ring"/><div className="image-caption">THE CAMELLIA EXPERIENCE <span>01 / 03</span></div></div>
        <aside className="hero-aside"><div><span className="aside-label">A PLACE TO BELONG</span><h2>Good food tastes even better together.</h2><span className="short-line"/><p>Come for the flavours.<br/>Stay for the feeling.</p></div><div className="aside-bottom"><span className="star">✳</span><span>CAFÉ & RESTAURANT<br/><strong>KIGALI, RWANDA</strong></span></div></aside>
        <span className="hero-number">01 — 03</span>
      </section>
      <section className="intro" id="story"><div className="section-kicker"><span className="line"/> WELCOME TO CAMELLIA</div><div><h2>Good food has a way of <em>bringing us together.</em></h2><p>A place for the everyday catch-ups, long lunches, and the dishes you can't stop thinking about. Pull up a chair and make yourself at home.</p></div><div className="intro-mark"><Coffee size={34} strokeWidth={1}/><span>THOUGHTFULLY<br/>SERVED</span></div></section>
      <section className="menu-section" id="menu"><div className="section-heading"><div><div className="section-kicker"><span className="line"/> SOMETHING FOR EVERY CRAVING</div><h2>A taste of <em>Camellia.</em></h2></div><p>Explore a little of what’s on the table. Your next favourite might be waiting right here.</p></div>
        <div className="demo-note"><Sparkles size={15}/> Preview only: these dishes and prices are sample data, not the restaurant’s confirmed menu.</div>
        {status === 'loading' && <p className="state" role="status">Loading the sample menu…</p>}{status === 'error' && <p className="state" role="alert">The menu API is unavailable. Start the backend to see sample dishes.</p>}
        {status === 'ready' && <div className="cards">{dishes.map((dish, i) => <article className="dish-card" key={dish.id}><div className={'dish-art '+dish.tone}><span className="dish-index">0{i+1} / THE MENU</span>{i===0 ? <Leaf size={58} strokeWidth={0.8}/> : i===1 ? <span className="art-star">✳</span> : <Coffee size={58} strokeWidth={0.8}/>}<span className="dish-tag">{dish.tag}</span></div><div className="dish-meta"><span>{dish.category}</span><span>RWF {dish.price.toLocaleString()}</span></div><h3>{dish.name}</h3><p>{dish.description}</p></article>)}</div>}
      </section>
      <section className="discover" id="discover"><div className="discover-icon"><Sparkles size={24}/></div><div><div className="section-kicker">MADE A LITTLE MORE PERSONAL</div><h2>Not sure what to order?</h2><p>Personalised recommendations are coming in the next stages of our build.</p></div><a href="#menu">Explore the sample menu <ArrowRight size={16}/></a></section>
    </main>
    <footer><div><img src="/images/camellia-orange.png" alt="Camellia Café and Restaurant Kigali"/><p>Good food. Good moments.</p></div><div className="footer-links"><a href="#top">Home</a><a href="#menu">Our menu</a><a href="#story">Our story</a></div><span>PROJECT PREVIEW · SAMPLE DATA</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
