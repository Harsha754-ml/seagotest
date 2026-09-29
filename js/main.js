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
