// VivaSpace common script (carousel + flow + HD-ready assets)
(function(){
  function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
  function qsa(sel, ctx){ return [...(ctx||document).querySelectorAll(sel)]; }

  // Load optional config for external assets base (HD images/CDN)
  let assetBase = null;
  fetch('assets/config.json', {cache:'no-store'}).then(r=>r.ok?r.json():null).then(cfg=>{
    if(cfg && cfg.base){ assetBase = cfg.base.replace(/\/$/,''); }
    init(); // run after we know config (or lack thereof)
  }).catch(()=>init());

  // Run again when returning from bfcache
  window.addEventListener('pageshow', ev=>{ if(ev.persisted){ init(true); } });

  function init(fromBF){
    // Nav toggle
    const nav = qs('.nav');
    const toggle = qs('.nav-toggle');
    if(toggle && !toggle._bound){
      toggle.addEventListener('click', ()=>nav.classList.toggle('open'));
      toggle._bound = true;
    }

    // Set slide backgrounds (prefer .webp if exists; fallback .jpg). If assetBase given, swap base url.
    const slides = qsa('.slide');
    slides.forEach((sl,idx)=>{
      const i = idx+1;
      const rel = `assets/hero${i}.jpg`;
      const srcJpg = assetBase ? `${assetBase}/hero${i}.jpg` : rel;
      const srcWebp = (assetBase ? `${assetBase}/hero${i}.webp` : rel.replace('.jpg','.webp'));
      // Test webp first, then jpg
      if(!sl._bgSet){
        const test = new Image();
        test.onload = ()=>{ sl.style.backgroundImage = `url('${srcWebp}')`; sl._bgSet=true; };
        test.onerror = ()=>{ sl.style.backgroundImage = `url('${srcJpg}')`; sl._bgSet=true; };
        test.src = srcWebp;
        // Preload next slide lightly
        if(i<slides.length){
          const pre = new Image();
          pre.src = (assetBase ? `${assetBase}/hero${i+1}.webp` : `assets/hero${i+1}.webp`);
        }
      }
    });

    // Carousel (bfcache-safe). Avoid multiple timers.
    if(window._carouselTimer){ clearInterval(window._carouselTimer); window._carouselTimer=null; }
    if(slides.length){
      // Ensure first active if none
      if(!slides.some(s=>s.classList.contains('active'))) slides[0].classList.add('active');
      let cur = slides.findIndex(s=>s.classList.contains('active'));
      if(cur<0) cur = 0;
      window._carouselTimer = setInterval(()=>{
        slides[cur].classList.remove('active');
        cur = (cur+1) % slides.length;
        slides[cur].classList.add('active');
      }, 4500);
    }

    // Service toggles
    qsa('[data-toggle]').forEach(btn=>{
      if(btn._bound) return;
      btn.addEventListener('click',()=>{
        const id = btn.getAttribute('data-toggle');
        const el = qs('#'+id);
        if(el){ el.classList.toggle('hidden'); }
      });
      btn._bound = true;
    });

    // Reserva pre-fill + price
    const params = new URLSearchParams(location.search);
    const servicioParam = params.get('servicio');
    const selServicio = qs('#servicio');
    if(selServicio && servicioParam){ selServicio.value = servicioParam; }

    const form = qs('#reservaForm');
    if(form && !form._bound){
      const precioEl = qs('#precio');
      const precioMap = {'depilacion':1400,'facial':1200,'corporal':1300,'alquiler-consultorio':900,'alquiler-sala':1200};
      const updatePrice = ()=>{
        const v = (selServicio? selServicio.value : form.servicio.value) || 'depilacion';
        if(precioEl) precioEl.textContent = '$'+(precioMap[v]||1400).toLocaleString('es-UY');
      };
      form.addEventListener('change', updatePrice);
      updatePrice();
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const v = data.servicio || 'depilacion';
        data.precio = precioMap[v] || 1400;
        data.id = 'VS' + Math.random().toString(36).slice(2,10).toUpperCase();
        localStorage.setItem('viva_temp_reserva', JSON.stringify(data));
        location.href='pagos.html';
      });
      form._bound = true;
    }

    // Pagos (demo)
    qsa('.pay').forEach(btn=>{
      if(btn._bound) return;
      btn.addEventListener('click',()=>{
        const tmp = JSON.parse(localStorage.getItem('viva_temp_reserva')||'{}');
        tmp.metodo = btn.dataset.metodo; tmp.paid=true; tmp.access_code = Math.random().toString(36).slice(2,10).toUpperCase();
        localStorage.setItem('viva_last_reserva', JSON.stringify(tmp));
        localStorage.removeItem('viva_temp_reserva');
        window.open('datos-envio.html','_blank');
        location.href='confirmacion.html';
      });
      btn._bound = true;
    });

    // Confirmación
    if(qs('#confirmCard')){
      const res = JSON.parse(localStorage.getItem('viva_last_reserva')||'{}');
      const S = (res.servicio||'Servicio') + ' · ' + (res.metodo||'Pago');
      const set = (id, val)=>{ const e=qs(id); if(e) e.textContent = val; };
      set('#confServicio', S);
      set('#confFecha', res.fecha||'-');
      set('#confHora', res.hora||'-');
      set('#confId', res.id||'-');
      const qr = qs('#qr'); if(qr) qr.textContent = res.access_code || 'QR';
    }

    // Datos post-pago
    const contactForm = qs('#contactForm');
    if(contactForm && !contactForm._bound){
      contactForm.addEventListener('submit', e=>{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(contactForm).entries());
        const res = JSON.parse(localStorage.getItem('viva_last_reserva')||'{}');
        res.contact = data;
        localStorage.setItem('viva_last_reserva', JSON.stringify(res));
        const ok = qs('#ok'); if(ok) ok.style.display='block';
        setTimeout(()=>window.close(), 1200);
      });
      contactForm._bound = true;
    }
  }

  // Fallback: if CSS only (no JS), show first slide via CSS rule. (Ensure CSS has .slide:first-child{opacity:1})
})();