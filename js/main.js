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

  /* ---------- active nav link (highlight the page you're on) ---------- */
  (function(){
    var path = window.location.pathname;
    var current = (path.substring(path.lastIndexOf('/') + 1) || 'index.html').toLowerCase();
    if(!/\.html$/.test(current)) current = 'index.html';
    if(current.indexOf('contact') === 0) return; // contact has no nav entry of its own

    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(link){
      var href = (link.getAttribute('href') || '').split('#')[0].split('?')[0];
      if(!href) return;
      var file = href.substring(href.lastIndexOf('/') + 1).toLowerCase();
      if(file === current){
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

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

  /* ---------- Web3Forms: Request a Quote (inline form on contact page + modal everywhere) ---------- */
  /* OWNER SETUP: paste your Web3Forms access key (web3forms.com → Settings → Access Request) between the quotes. */
  var WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
  document.querySelectorAll('form.quote-form [name="access_key"]').forEach(function(el){
    el.value = WEB3FORMS_ACCESS_KEY;
  });

  function bindQuoteForm(form){
    if(!form) return;
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('.form-submit');
    var label = btn ? btn.querySelector('.btn-label') : null;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var keyInput = form.querySelector('[name="access_key"]');
      var accessKey = WEB3FORMS_ACCESS_KEY || (keyInput ? keyInput.value : '');

      // Guard: the site owner must swap in a real Web3Forms access key (web3forms.com) before this goes live.
      if(!accessKey || accessKey.indexOf('YOUR_') === 0){
        if(msg){
          msg.textContent = "This form isn't fully connected yet — a Web3Forms access key still needs to be added. Please reach us on WhatsApp or email sales@seago.in in the meantime.";
          msg.className = 'form-msg is-error';
        }
        return;
      }

      // Honeypot: if this hidden field got filled in, silently drop the submission.
      var honeypot = form.querySelector('[name="botcheck"]');
      if(honeypot && honeypot.checked) return;

      if(btn) btn.disabled = true;
      var originalLabel = label ? label.textContent : '';
      if(label) label.textContent = 'Sending…';
      if(msg){ msg.textContent = ''; msg.className = 'form-msg'; }

      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function(value, key){ payload[key] = value; });
      payload.access_key = accessKey;

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function(res){ return res.json(); })
        .then(function(data){
          if(data && data.success){
            if(msg){
              msg.textContent = "Thanks — we've received your request and will get back to you within one business day.";
              msg.className = 'form-msg is-success';
            }
            form.reset();
          } else {
            if(msg){
              msg.textContent = (data && data.message) || 'Something went wrong sending your request. Please try again or email us directly.';
              msg.className = 'form-msg is-error';
            }
          }
        })
        .catch(function(){
          if(msg){
            msg.textContent = 'Something went wrong sending your request. Please try again or email us directly at sales@seago.in.';
            msg.className = 'form-msg is-error';
          }
        })
        .finally(function(){
          if(btn) btn.disabled = false;
          if(label) label.textContent = originalLabel;
        });
    });
  }
  bindQuoteForm(document.getElementById('quoteForm'));
  bindQuoteForm(document.getElementById('quoteModalForm'));

  /* ---------- quote modal (opens from every "Request a Quote" button) ---------- */
  var quoteModal = document.getElementById('quoteModal');
  var quoteReturnFocus = null;
  function prefillMotor(trigger){
    var href = trigger ? (trigger.getAttribute('href') || '') : '';
    var hasMotor = /[?&]motor=/.test(href) || /[?&]motor=/.test(window.location.search);
    if(!hasMotor) return;
    document.querySelectorAll('select[name="product_interest"]').forEach(function(sel){ sel.value = 'Outboard Motor'; });
  }
  function openQuoteModal(trigger){
    if(!quoteModal) return;
    quoteReturnFocus = trigger || null;
    prefillMotor(trigger);
    quoteModal.classList.add('open');
    quoteModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var first = quoteModal.querySelector('.quote-modal__body input:not([type="hidden"]), .quote-modal__body select, .quote-modal__body textarea');
    if(first) first.focus();
  }
  function closeQuoteModal(){
    if(!quoteModal) return;
    quoteModal.classList.remove('open');
    quoteModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(quoteReturnFocus && quoteReturnFocus.focus) quoteReturnFocus.focus();
    quoteReturnFocus = null;
  }
  if(quoteModal){
    quoteModal.querySelectorAll('[data-close-quote]').forEach(function(el){
      el.addEventListener('click', closeQuoteModal);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && quoteModal.classList.contains('open')) closeQuoteModal();
    });
  }

  var inlineQuoteForm = document.getElementById('quoteForm');
  document.addEventListener('click', function(e){
    var trigger = e.target.closest('[data-quote-open]');
    if(!trigger) return;
    e.preventDefault();
    // On the contact page the real form is already on screen — scroll to it instead of stacking a modal on top.
    if(inlineQuoteForm){
      inlineQuoteForm.scrollIntoView({ behavior:'smooth', block:'center' });
      var focusTarget = inlineQuoteForm.querySelector('input:not([type="hidden"])');
      if(focusTarget) setTimeout(function(){ focusTarget.focus({ preventScroll:true }); }, 600);
      return;
    }
    openQuoteModal(trigger);
  });
  if(/[?&]motor=/.test(window.location.search)) prefillMotor(null);

  /* ---------- outboard HP switcher + catalog PDF modal (products page) ---------- */
  var OUTBOARD_DATA = {
    '3':  { power:'3 HP',  rated:'2.2 kW',  voltage:'48 V',  battery:'48V 50 AH LiFePO4 – Lithium Ferrous Phosphate',              motor:'Magnetic Synchronous Motor', control:'Tiller Control',                          sensor:'Magnetic Encoder', rpm:'4500 - 5000 RPM', gear:'2.08',          transom:'417mm',               weight:'13.5 Kg',               cooling:'Air Cooled',           gearpos:'Forward',                     file:'SEAGÖ - 3HP.pdf' },
    '7':  { power:'7 HP',  rated:'5.1 kW',  voltage:'48 V',  battery:'48V 100 AH or 48V 150 AH LiFePO4 – Lithium Ferrous Phosphate', motor:'PMSM',                     control:'Tiller Control',                          sensor:'Magnetic Encoder', rpm:'5000 - 5500 RPM', gear:'2.08',          transom:'S:440mm / L:568mm',   weight:'S:30 Kg / L:31 Kg',     cooling:'Water Cooled',         gearpos:'Forward/Neutral/Reverse',     file:'SEAGÖ - 7 HP.pdf' },
    '10': { power:'10 HP', rated:'7.3 kW',  voltage:'72 V',  battery:'72V 120 AH or 72V 200 AH LiFePO4 – Lithium Ferrous Phosphate', motor:'PMSM',                     control:'Tiller / Remote Control',                 sensor:'Magnetic Encoder', rpm:'4250 RPM',        gear:'2.08 (27/13)', transom:'S:440mm / L:567mm',   weight:'S:37.5 Kg / L:38 Kg',   cooling:'Water Cooled',         gearpos:'Forward/Neutral/Reverse',     file:'SEAGÖ - 10 HP.pdf' },
    '15': { power:'15 HP', rated:'11 kW',   voltage:'72 V',  battery:'72V 200 AH or 72V 230 AH LiFePO4 – Lithium Ferrous Phosphate', motor:'PMSM',                     control:'Tiller / Remote Control',                 sensor:'Magnetic Encoder', rpm:'4650-4700 RPM',   gear:'2.08 (27/13)', transom:'S:440mm / L:567mm',   weight:'S:38 Kg / L:39.5 Kg',   cooling:'Water Cooled',         gearpos:'Forward/Neutral/Reverse',     file:'SEAGÖ - 15 HP.pdf' },
    '20': { power:'20 HP', rated:'15 kW',   voltage:'96 V',  battery:'96V 200 AH or 96V 230 AH LiFePO4 – Lithium Ferrous Phosphate', motor:'PMSM',                     control:'Tiller / Remote Control',                 sensor:'Magnetic Encoder', rpm:'5800 RPM',        gear:'2.08',          transom:'S:440mm / L:570mm',   weight:'S:45 Kg / L:48 Kg',     cooling:'Water Cooled',         gearpos:'Forward/Neutral/Reverse',     file:'SEAGÖ - 20HP.pdf' },
    '30': { power:'30 HP', rated:'22 kW',   voltage:'96 V',  battery:'96V 230 AH LiFePO4 – Lithium Ferrous Phosphate',              motor:'Water cooled PMSM',        control:'Infinitely variable speed',               sensor:'—',                rpm:'5800 RPM',        gear:'—',             transom:'550mm',               weight:'52.7 Kgs',               cooling:'Water Cooling',        gearpos:'Forward / Reverse (Switch)',  file:'SEAGÖ - 30 HP.pdf' },
    '40': { power:'40 HP', rated:'29.4 kW', voltage:'144 V', battery:'144V 200 AH LiFePO4 – Lithium Ferrous Phosphate',             motor:'PMSM',                     control:'Steering Grip - Steering Wheel Controls', sensor:'Magnetic Encoder', rpm:'5000-6000 RPM',   gear:'2.0',           transom:'508mm (max)',         weight:'89 Kg',                   cooling:'Water Cooled',         gearpos:'Forward / Neutral / Reverse', file:'SEAGÖ - 40 HP.pdf' },
    '60': { power:'60 HP', rated:'44.1 kW', voltage:'144 V', battery:'144V 300 AH LiFePO4 – Lithium Ferrous Phosphate',             motor:'PMSM',                     control:'Steering Grip - Steering Wheel Controls', sensor:'Magnetic Encoder', rpm:'5000-6000 RPM',   gear:'1.8 (24/13)',   transom:'508mm (max)',         weight:'115 Kg',                  cooling:'Water Cooled',         gearpos:'Forward / Neutral / Reverse', file:'SEAGÖ - 60 HP.pdf' },
    '90': { power:'90 HP', rated:'66 kW',   voltage:'144 V', battery:'144V 400 AH LiFePO4 – Lithium Ferrous Phosphate',             motor:'PMSM',                     control:'Steering Grip - Steering Wheel Controls', sensor:'Magnetic Encoder', rpm:'4500-5500 RPM',   gear:'1.85 (24:13)',  transom:'508mm (max)',         weight:'115 Kg',                  cooling:'Freshwater Closed-loop', gearpos:'Forward / Standing / Shift',  file:'SEAGÖ - 90 HP.pdf' }
  };
  var hpPicker = document.getElementById('hpPicker');
  var outboardModel = document.getElementById('outboardModel');
  var outboardBadge = document.getElementById('outboardBadge');
  var outboardSpecs = document.getElementById('outboardSpecs');
  var outboardQuoteBtn = document.getElementById('outboardQuoteBtn');
  var moreInfoBtn = document.getElementById('moreInfoBtn');
  var pdfModal = document.getElementById('pdfModal');
  var pdfFrame = document.getElementById('pdfFrame');
  var pdfTitle = document.getElementById('pdfModalTitle');
  var pdfOpenNew = document.getElementById('pdfOpenNew');
  var pdfDownload = document.getElementById('pdfDownload');

  var activeHp = '3';
  function catalogUrl(hp){
    var d = OUTBOARD_DATA[hp];
    return d ? encodeURI('catalog/' + d.file) : '#';
  }
  function renderHp(hp){
    var d = OUTBOARD_DATA[hp];
    if(!d) return;
    if(outboardBadge) outboardBadge.textContent = d.power + ' · ' + d.rated + ' · ' + d.voltage;
    if(outboardModel) outboardModel.textContent = 'SEAGÖ ' + d.power;
    if(outboardSpecs){
      var map = { rated:d.rated, voltage:d.voltage, battery:d.battery, motor:d.motor, sensor:d.sensor, control:d.control, rpm:d.rpm, gear:d.gear, transom:d.transom, weight:d.weight, cooling:d.cooling, gearpos:d.gearpos };
      Object.keys(map).forEach(function(k){
        var el = outboardSpecs.querySelector('[data-spec="' + k + '"]');
        if(el) el.textContent = map[k];
      });
    }
    if(outboardQuoteBtn) outboardQuoteBtn.setAttribute('href', 'contact.html?motor=outboard-' + hp + 'hp');
  }
  function selectHp(hp){
    if(!OUTBOARD_DATA[hp]) return;
    activeHp = hp;
    if(hpPicker){
      hpPicker.querySelectorAll('.hp-btn').forEach(function(btn){
        var on = btn.getAttribute('data-hp') === hp;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    renderHp(hp);
  }
  function openPdfModal(){
    var d = OUTBOARD_DATA[activeHp];
    if(!d || !pdfModal) return;
    var url = catalogUrl(activeHp);
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
  if(hpPicker){
    selectHp(activeHp);
    hpPicker.addEventListener('click', function(e){
      var btn = e.target.closest('.hp-btn');
      if(btn) selectHp(btn.getAttribute('data-hp'));
    });
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
