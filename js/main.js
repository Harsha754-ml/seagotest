/* =====================================================================
   Seagö — Homepage v1 — interaction layer
   ===================================================================== */
(function(){
  "use strict";

  /* ---------- staggered reveal-on-scroll (with no-JS / failsafe fallback) ---------- */
  var groups = document.querySelectorAll('[data-stagger]');
  groups.forEach(function(group){
    var items = group.querySelectorAll('.reveal');
    items.forEach(function(el, i){ el.style.setProperty('--d', (i * 90) + 'ms'); });
  });

  var els = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }
  // failsafe: guarantee every section is visible even if the observer misses one
  setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2500);

  /* ---------- scroll progress bar + nav shadow ---------- */
  var bar = document.getElementById('progressBar');
  var nav = document.querySelector('header.nav');
  var scrollTicking = false;
  function updateScrollUi(){
    var h = document.documentElement;
    var maxScroll = h.scrollHeight - h.clientHeight;
    var pct = maxScroll > 0 ? (h.scrollTop / maxScroll) * 100 : 0;
    if(bar) bar.style.width = pct + '%';
    if(nav) nav.style.boxShadow = h.scrollTop > 12 ? '0 8px 24px -12px rgba(0,0,0,.5)' : 'none';
    scrollTicking = false;
  }
  window.addEventListener('scroll', function(){
    if(scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollUi);
  }, { passive:true });
  updateScrollUi();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  if(burger && menu){
    burger.addEventListener('click', function(){
      burger.classList.toggle('open');
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ burger.classList.remove('open'); menu.classList.remove('open'); });
    });
  }

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var counted = false;
  function runCount(){
    if(counted) return; counted = true;
    counters.forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1300, t0 = null;
      function step(ts){
        if(!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var statsWrap = document.querySelector('.hero-stats');
  if(statsWrap){
    if('IntersectionObserver' in window){
      var statsIo = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ runCount(); statsIo.disconnect(); } });
      }, { threshold: 0.4 });
      statsIo.observe(statsWrap);
    } else { runCount(); }
  }

  /* ---------- case-study image galleries ---------- */
  document.querySelectorAll('.case-gallery').forEach(function(gallery){
    var images = gallery.querySelectorAll('img');
    var current = 0;
    if(images.length < 2) return;
    setInterval(function(){
      images[current].classList.remove('is-active');
      current = (current + 1) % images.length;
      images[current].classList.add('is-active');
    }, 4000);
  });

  /* ---------- Web3Forms: Request a Quote (contact page) ---------- */
  var quoteForm = document.getElementById('quoteForm');
  if(quoteForm){
    quoteForm.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = document.getElementById('formMsg');
      var btn = quoteForm.querySelector('.form-submit');
      var label = btn.querySelector('.btn-label');
      var accessKey = quoteForm.querySelector('[name="access_key"]').value;

      // Guard: the site owner must swap in a real Web3Forms access key (web3forms.com) before this goes live.
      if(!accessKey || accessKey.indexOf('YOUR_') === 0){
        msg.textContent = "This form isn't fully connected yet — a Web3Forms access key still needs to be added. Please reach us on WhatsApp or email sales@seago.in in the meantime.";
        msg.className = 'form-msg is-error';
        return;
      }

      // Honeypot: if this hidden field got filled in, silently drop the submission.
      var honeypot = quoteForm.querySelector('[name="botcheck"]');
      if(honeypot && honeypot.checked) return;

      btn.disabled = true;
      var originalLabel = label.textContent;
      label.textContent = 'Sending…';
      msg.textContent = '';
      msg.className = 'form-msg';

      var formData = new FormData(quoteForm);
      var payload = {};
      formData.forEach(function(value, key){ payload[key] = value; });

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function(res){ return res.json(); })
        .then(function(data){
          if(data && data.success){
            msg.textContent = "Thanks — we've received your request and will get back to you within one business day.";
            msg.className = 'form-msg is-success';
            quoteForm.reset();
          } else {
            msg.textContent = (data && data.message) || 'Something went wrong sending your request. Please try again or email us directly.';
            msg.className = 'form-msg is-error';
          }
        })
        .catch(function(){
          msg.textContent = 'Something went wrong sending your request. Please try again or email us directly at sales@seago.in.';
          msg.className = 'form-msg is-error';
        })
        .finally(function(){
          btn.disabled = false;
          label.textContent = originalLabel;
        });
    });
  }

  /* ---------- outboard HP switcher + catalog PDF modal (products page) ---------- */
  var OUTBOARD_DATA = {
    '3':  { power:'3 HP',  rated:'2.2 kW',  voltage:'48 V',  motor:'Magnetic Synchronous', control:'Tiller',          cooling:'Air',                    rpm:'4500–5000', weight:'13.5 kg',     file:'SEAGÖ - 3HP.pdf' },
    '7':  { power:'7 HP',  rated:'5.2 kW',  voltage:'144 V', motor:'PMSM',                 control:'Grip / Wheel',    cooling:'Water',                  rpm:'4500–5500', weight:'45 kg',        file:'SEAGÖ - 7 HP.pdf' },
    '10': { power:'10 HP', rated:'7.3 kW',  voltage:'72 V',  motor:'PMSM',                 control:'Tiller / Remote', cooling:'Water',                  rpm:'4250',      weight:'37.5–38 kg',  file:'SEAGÖ - 10 HP.pdf' },
    '15': { power:'15 HP', rated:'11 kW',   voltage:'72 V',  motor:'PMSM',                 control:'Tiller / Remote', cooling:'Water',                  rpm:'4650–4700', weight:'38–39.5 kg',  file:'SEAGÖ - 15 HP.pdf' },
    '20': { power:'20 HP', rated:'15 kW',   voltage:'96 V',  motor:'PMSM',                 control:'Tiller / Remote', cooling:'Water',                  rpm:'5800',      weight:'45–48 kg',    file:'SEAGÖ - 20HP.pdf' },
    '30': { power:'30 HP', rated:'22 kW',   voltage:'96 V',  motor:'Water-cooled PMSM',    control:'Tiller / Remote', cooling:'Water',                  rpm:'5800',      weight:'52.7 kg',      file:'SEAGÖ - 30 HP.pdf' },
    '40': { power:'40 HP', rated:'29.4 kW', voltage:'144 V', motor:'PMSM',                 control:'Grip / Wheel',    cooling:'Water',                  rpm:'5000–6000', weight:'89 kg',        file:'SEAGÖ - 40 HP.pdf' },
    '60': { power:'60 HP', rated:'44.1 kW', voltage:'144 V', motor:'PMSM',                 control:'Grip / Wheel',    cooling:'Water',                  rpm:'5000–6000', weight:'115 kg',       file:'SEAGÖ - 60 HP.pdf' },
    '90': { power:'90 HP', rated:'66 kW',   voltage:'144 V', motor:'PMSM',                 control:'Grip / Wheel',    cooling:'Freshwater closed-loop', rpm:'4500–5500', weight:'115 kg',       file:'SEAGÖ - 90 HP.pdf' }
  };
  var hpSelect = document.getElementById('hpSelect');
  var outboardBadge = document.getElementById('outboardBadge');
  var outboardSpecs = document.getElementById('outboardSpecs');
  var outboardQuoteBtn = document.getElementById('outboardQuoteBtn');
  var moreInfoBtn = document.getElementById('moreInfoBtn');
  var pdfModal = document.getElementById('pdfModal');
  var pdfFrame = document.getElementById('pdfFrame');
  var pdfTitle = document.getElementById('pdfModalTitle');
  var pdfOpenNew = document.getElementById('pdfOpenNew');
  var pdfDownload = document.getElementById('pdfDownload');

  function currentHp(){ return hpSelect ? hpSelect.value : '3'; }
  function catalogUrl(hp){
    var d = OUTBOARD_DATA[hp];
    return d ? encodeURI('Catelog/' + d.file) : '#';
  }
  function renderHp(hp){
    var d = OUTBOARD_DATA[hp];
    if(!d) return;
    if(outboardBadge) outboardBadge.textContent = d.power + ' · ' + d.rated + ' · ' + d.voltage;
    if(outboardSpecs){
      var map = { power:d.power, rated:d.rated, voltage:d.voltage, motor:d.motor, control:d.control, cooling:d.cooling, rpm:d.rpm, weight:d.weight };
      Object.keys(map).forEach(function(k){
        var el = outboardSpecs.querySelector('[data-spec="' + k + '"]');
        if(el) el.textContent = map[k];
      });
    }
    if(outboardQuoteBtn) outboardQuoteBtn.setAttribute('href', 'contact.html?motor=outboard-' + hp + 'hp');
  }
  function openPdfModal(){
    var hp = currentHp();
    var d = OUTBOARD_DATA[hp];
    if(!d || !pdfModal) return;
    var url = catalogUrl(hp);
    if(pdfTitle) pdfTitle.textContent = 'Seagö ' + d.power + ' Outboard — Catalog';
    if(pdfFrame) pdfFrame.setAttribute('src', url);
    if(pdfOpenNew) pdfOpenNew.setAttribute('href', url);
    if(pdfDownload) pdfDownload.setAttribute('href', url);
    pdfModal.classList.add('open');
    pdfModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = pdfModal.querySelector('.pdf-modal__close');
    if(closeBtn) closeBtn.focus();
  }
  function closePdfModal(){
    if(!pdfModal) return;
    pdfModal.classList.remove('open');
    pdfModal.setAttribute('aria-hidden', 'true');
    if(pdfFrame) pdfFrame.setAttribute('src', '');
    document.body.style.overflow = '';
    if(moreInfoBtn) moreInfoBtn.focus();
  }
  if(hpSelect){
    renderHp(currentHp());
    hpSelect.addEventListener('change', function(){ renderHp(currentHp()); });
  }
  if(moreInfoBtn) moreInfoBtn.addEventListener('click', openPdfModal);
  if(pdfModal){
    pdfModal.querySelectorAll('[data-close-pdf]').forEach(function(el){
      el.addEventListener('click', closePdfModal);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && pdfModal.classList.contains('open')) closePdfModal();
    });
  }

  /* ---------- desktop-only motion: magnetic buttons, hero parallax, cursor glow, card tilt ---------- */
  if(window.matchMedia('(hover:hover)').matches){

    document.querySelectorAll('.magnetic').forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.35) + 'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform = 'translate(0,0)'; });
    });

    var hero = document.querySelector('.hero');
    var glow = document.querySelector('.cursor-glow');
    if(hero){
      var depthEls = hero.querySelectorAll('[data-depth]');
      hero.addEventListener('mousemove', function(e){
        var r = hero.getBoundingClientRect();
        var mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
        depthEls.forEach(function(el){
          var d = parseFloat(el.getAttribute('data-depth'));
          el.style.transform = 'translate(' + (mx * d) + 'px,' + (my * d) + 'px)';
        });
        if(glow){ glow.style.left = (e.clientX - r.left) + 'px'; glow.style.top = (e.clientY - r.top) + 'px'; }
      });
    }

    document.querySelectorAll('.tilt').forEach(function(wrap){
      var card = wrap.querySelector('.card, .case-card');
      if(!card) return;
      wrap.addEventListener('mousemove', function(e){
        var r = wrap.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'translateY(-6px) rotateX(' + (py * -6) + 'deg) rotateY(' + (px * 8) + 'deg)';
      });
      wrap.addEventListener('mouseleave', function(){ card.style.transform = 'translateY(0) rotateX(0) rotateY(0)'; });
    });
  }
})();
