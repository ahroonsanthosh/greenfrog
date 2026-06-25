/* ==========================================================================
   NECTAR COFFEE HOUSE — interactions
   Vanilla JS, no dependencies. Every effect degrades gracefully and
   respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --------------------------------------------------------------------- */
  /* Preloader                                                             */
  /* --------------------------------------------------------------------- */
  (function preloader() {
    var el = $("#preloader");
    if (!el) return;
    var done = false;
    function hide() {
      if (done) return; done = true;
      el.classList.add("is-done");
      setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 750);
    }
    window.addEventListener("load", function () { setTimeout(hide, reduceMotion ? 0 : 450); });
    // Failsafe — never trap the page if `load` is slow or blocked.
    setTimeout(hide, 3500);
  })();

  /* --------------------------------------------------------------------- */
  /* Footer year                                                           */
  /* --------------------------------------------------------------------- */
  $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* --------------------------------------------------------------------- */
  /* Header: shadow on scroll + hide on scroll-down / show on scroll-up    */
  /* --------------------------------------------------------------------- */
  (function header() {
    var hdr = $("[data-header]");
    if (!hdr) return;
    var last = window.pageYOffset, ticking = false;
    function update() {
      var y = window.pageYOffset;
      hdr.classList.toggle("is-scrolled", y > 24);
      if (!document.body.classList.contains("menu-open")) {
        if (y > last && y > 360) hdr.classList.add("is-hidden");
        else hdr.classList.remove("is-hidden");
      }
      last = y; ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* --------------------------------------------------------------------- */
  /* Mobile navigation                                                     */
  /* --------------------------------------------------------------------- */
  (function mobileNav() {
    var toggle = $("#nav-toggle");
    var nav = $("#mobile-nav");
    var scrim = $("#nav-scrim");
    if (!toggle || !nav) return;

    function open() {
      document.body.classList.add("menu-open", "is-locked");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      nav.setAttribute("aria-hidden", "false");
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add("is-shown"); });
    }
    function close() {
      document.body.classList.remove("menu-open", "is-locked");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      nav.setAttribute("aria-hidden", "true");
      scrim.classList.remove("is-shown");
      setTimeout(function () { scrim.hidden = true; }, 500);
    }
    function toggleNav() {
      document.body.classList.contains("menu-open") ? close() : open();
    }
    toggle.addEventListener("click", toggleNav);
    scrim.addEventListener("click", close);
    $$(".mobile-nav__link", nav).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) close();
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Scroll reveals (IntersectionObserver) with per-group stagger          */
  /* --------------------------------------------------------------------- */
  (function reveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    // Stagger siblings that share a parent.
    var groups = new Map();
    items.forEach(function (el) {
      var p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach(function (list) {
      list.forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", Math.min(i * 75, 450) + "ms");
      });
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* --------------------------------------------------------------------- */
  /* Menu tabs (accessible: click + arrow-key roving)                      */
  /* --------------------------------------------------------------------- */
  (function menuTabs() {
    var wrap = $("[data-menu-tabs]");
    if (!wrap) return;
    var tabs = $$(".menu__tab", wrap);
    var panels = $$(".menu__panel");

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (p) {
        var show = p.id === tab.getAttribute("aria-controls");
        p.classList.toggle("is-active", show);
        p.hidden = !show;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
                : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
        else if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Open-now status + highlight today's hours                             */
  /* --------------------------------------------------------------------- */
  (function openStatus() {
    // Minutes-from-midnight, keyed by JS day index (0 = Sunday).
    var HOURS = {
      0: [510, 1020], // Sun 08:30–17:00
      1: [450, 1050], // Mon 07:30–17:30
      2: [450, 1050],
      3: [450, 1050],
      4: [450, 1050],
      5: [450, 1050],
      6: [480, 1050]  // Sat 08:00–17:30
    };
    function fmt(min) {
      var h = Math.floor(min / 60), m = min % 60;
      return h + ":" + (m < 10 ? "0" + m : m);
    }
    function dublinNow() {
      try {
        var parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Dublin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
        }).formatToParts(new Date());
        var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
        var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        var day = days[map.weekday];
        var hour = parseInt(map.hour, 10) % 24;
        return { day: day, mins: hour * 60 + parseInt(map.minute, 10) };
      } catch (e) {
        var d = new Date();
        return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
      }
    }
    function nextOpenDay(day) {
      for (var i = 1; i <= 7; i++) { var d = (day + i) % 7; if (HOURS[d]) return { d: d, open: HOURS[d][0] }; }
      return null;
    }

    var now = dublinNow();
    var today = HOURS[now.day];
    var isOpen = today && now.mins >= today[0] && now.mins < today[1];
    var text;
    if (isOpen) {
      text = "Open now · til " + fmt(today[1]);
    } else if (today && now.mins < today[0]) {
      text = "Closed · opens " + fmt(today[0]);
    } else {
      var nx = nextOpenDay(now.day);
      var names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      text = nx ? "Closed · opens " + names[nx.d] + " " + fmt(nx.open) : "Closed";
    }

    $$("[data-open-badge]").forEach(function (b) {
      b.classList.toggle("is-open", !!isOpen);
      b.classList.toggle("is-closed", !isOpen);
      var t = $("[data-open-text]", b);
      if (t) t.textContent = text;
    });

    var row = $('.hours__row[data-day="' + now.day + '"]');
    if (row) row.classList.add("is-today");
  })();

  /* --------------------------------------------------------------------- */
  /* Count-up stats                                                        */
  /* --------------------------------------------------------------------- */
  (function counters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var pre = el.getAttribute("data-prefix") || "";
      var suf = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = pre + target + suf; return; }
      var start = performance.now(), dur = 1400;
      (function tick(t) {
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * eased) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* --------------------------------------------------------------------- */
  /* Subtle parallax on stacked photos                                     */
  /* --------------------------------------------------------------------- */
  (function parallax() {
    if (reduceMotion || !finePointer) return;
    var els = $$("[data-parallax]");
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var center = r.top + r.height / 2;
        var delta = (vh / 2 - center) * parseFloat(el.getAttribute("data-parallax"));
        el.style.setProperty("--py", Math.max(-40, Math.min(40, delta)).toFixed(1) + "px");
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* --------------------------------------------------------------------- */
  /* Magnetic buttons                                                      */
  /* --------------------------------------------------------------------- */
  (function magnetic() {
    if (reduceMotion || !finePointer) return;
    $$("[data-magnetic]").forEach(function (el) {
      var strength = 0.32;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Active nav link (scroll-spy)                                          */
  /* --------------------------------------------------------------------- */
  (function scrollSpy() {
    var links = $$(".nav__link");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
    var sections = $$("section[id]").filter(function (s) { return map[s.id]; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          if (map[e.target.id]) map[e.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  })();

  /* --------------------------------------------------------------------- */
  /* Lightbox gallery                                                      */
  /* --------------------------------------------------------------------- */
  (function lightbox() {
    var box = $("#lightbox");
    var triggers = $$("[data-lightbox]");
    if (!box || !triggers.length) return;
    var imgEl = $("[data-lightbox-img]", box);
    var capEl = $("[data-lightbox-caption]", box);
    var index = 0, lastFocus = null;

    var slides = triggers.map(function (t) {
      return { full: t.getAttribute("data-full"), caption: t.getAttribute("data-caption") || "",
               alt: (t.querySelector("img") || {}).alt || "" };
    });
    function show(i) {
      index = (i + slides.length) % slides.length;
      var s = slides[index];
      imgEl.src = s.full; imgEl.alt = s.alt; capEl.textContent = s.caption;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      $("[data-lightbox-close]", box).focus();
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i); });
    });
    $("[data-lightbox-close]", box).addEventListener("click", close);
    $("[data-lightbox-next]", box).addEventListener("click", function () { show(index + 1); });
    $("[data-lightbox-prev]", box).addEventListener("click", function () { show(index - 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "ArrowLeft") show(index - 1);
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Click-to-load map (keeps initial load light & private)                */
  /* --------------------------------------------------------------------- */
  (function lazyMap() {
    var btn = $("[data-map-load]");
    var holder = $("[data-map]");
    var placeholder = $("[data-map-placeholder]");
    if (!btn || !holder) return;
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.title = "Map showing Nectar Coffee House, 26 Parnell Place, Cork";
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.src = "https://www.openstreetmap.org/export/embed.html?bbox=-8.4760%2C51.8945%2C-8.4630%2C51.9015&layer=mapnik&marker=51.8983%2C-8.4695";
      holder.appendChild(iframe);
      if (placeholder) placeholder.style.display = "none";
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Newsletter (front-end demo — wire to your provider to go live)        */
  /* --------------------------------------------------------------------- */
  (function newsletter() {
    var form = $("[data-newsletter]");
    if (!form) return;
    var msg = $("[data-newsletter-msg]", form);
    var input = $(".newsletter__input", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!valid) { msg.textContent = "Please pop in a valid email."; msg.style.color = "var(--coral)"; return; }
      msg.textContent = "Thanks — you're on the list! ☕";
      msg.style.color = "var(--yellow)";
      input.value = "";
    });
  })();

  /* --------------------------------------------------------------------- */
  /* Back to top                                                           */
  /* --------------------------------------------------------------------- */
  (function backToTop() {
    var btn = $("#to-top");
    if (!btn) return;
    var ticking = false;
    function update() {
      var show = window.pageYOffset > window.innerHeight * 0.9;
      btn.hidden = false;
      btn.classList.toggle("is-shown", show);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    update();
  })();

  /* --------------------------------------------------------------------- */
  /* Cinematic hero — the cup grows as you scroll, then the page continues */
  /* --------------------------------------------------------------------- */
  (function cinematicHero() {
    var section = $("[data-cine]");
    if (!section) return;
    var scaleEl = $("[data-cine-scale]", section);
    var content = $("[data-cine-text]", section);
    var scrim = $(".cine__scrim", section);
    var cup = $("[data-cine-cup]", section);
    var cue = $("[data-cine-cue]", section);

    // Reduced motion → leave it as a calm, static hero (no pin, no zoom).
    if (reduceMotion) return;
    section.classList.add("is-cinematic");

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    var ticking = false;
    function update() {
      var rect = section.getBoundingClientRect();
      var distance = section.offsetHeight - window.innerHeight;
      var p = clamp(-rect.top / (distance || 1), 0, 1);

      if (scaleEl) scaleEl.style.transform = "scale(" + (1 + 2.0 * p).toFixed(3) + ")";
      if (scrim) scrim.style.opacity = clamp(1 - p / 0.42, 0, 1).toFixed(3);
      if (cue) cue.style.opacity = clamp(1 - p / 0.06, 0, 1).toFixed(3);
      if (cup) cup.style.opacity = (p > 0.9 ? 1 - ((p - 0.9) / 0.1) * 0.3 : 1).toFixed(3);
      if (content) {
        var c = clamp(1 - p / 0.34, 0, 1);
        content.style.opacity = c.toFixed(3);
        content.style.transform = "translateY(" + (-44 * p).toFixed(1) + "px) scale(" + (1 - 0.06 * p).toFixed(3) + ")";
        content.style.pointerEvents = c < 0.05 ? "none" : "auto";
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

})();
