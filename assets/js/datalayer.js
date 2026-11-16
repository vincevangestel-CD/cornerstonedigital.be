/* Cornerstone Digital - dataLayer voor interactie-events.
   Het page_view-event wordt inline in de <head> gepusht, voor Tag Manager laadt.
   Elk event hieronder krijgt page_type en page_language mee. Parameters die niet
   bij een event horen worden expliciet op undefined gezet, zodat waarden van een
   vorig event niet blijven hangen in Tag Manager. */
(function () {
  var dl = (window.dataLayer = window.dataLayer || []);
  var page = window.cdPage || {};
  // Sectienamen zijn taalonafhankelijk, zodat NL en EN in dezelfde rapporten vallen.
  var SECTIONS = { diensten: 'services', services: 'services', aanpak: 'approach', approach: 'approach',
                   tools: 'tools', over: 'about', about: 'about', contact: 'contact', privacy: 'privacy', top: 'top' };
  var EMPTY = { nav_item: undefined, nav_location: undefined, cta_id: undefined, cta_text: undefined,
                click_location: undefined, contact_method: undefined, language_from: undefined,
                language_to: undefined, section_id: undefined, section_index: undefined };

  function push(name, params) {
    var e = { event: name, page_type: page.page_type, page_language: page.page_language };
    var k;
    for (k in EMPTY) e[k] = EMPTY[k];
    for (k in params) e[k] = params[k];
    dl.push(e);
  }
  function text(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function locationOf(el) {
    if (el.closest('.consent-wrap, .consent')) return 'consent_dialog';
    if (el.closest('header.top')) return 'header';
    if (el.closest('.foot')) return 'footer';
    if (el.closest('.hero')) return 'hero';
    var s = el.closest('section[id], footer[id]');
    return s ? (SECTIONS[s.id] || s.id) : 'content';
  }
  function targetOf(href) {
    if (!href) return 'unknown';
    var hash = href.split('#')[1];
    if (hash) return SECTIONS[hash] || hash;
    if (/privacy\.html/.test(href)) return 'privacy';
    return 'home';
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('a, button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var where = locationOf(el);

    if (el.closest('.lang')) {
      return push('language_switch', { language_from: page.page_language, language_to: el.getAttribute('hreflang') });
    }
    if (href.indexOf('mailto:') === 0) {
      return push('contact_click', { contact_method: 'email', click_location: where });
    }
    if (href.indexOf('linkedin.com') > -1) {
      return push('contact_click', { contact_method: 'linkedin', click_location: where });
    }
    if (el.id === 'consent-open') {
      return push('consent_preferences_open', { click_location: where });
    }
    if (el.id === 'consent-yes' || el.id === 'consent-no') return; // consent_update wordt apart gepusht
    if (el.classList.contains('btn')) {
      var id = where === 'header' ? 'header_contact'
             : where === 'hero' ? (el.classList.contains('ghost') ? 'hero_secondary' : 'hero_primary')
             : where + '_cta';
      return push('cta_click', { cta_id: id, cta_text: text(el), click_location: where });
    }
    if (el.tagName === 'A' && el.target !== '_blank') {
      var item = el.classList.contains('logo') ? 'logo' : targetOf(href);
      return push('navigation_click', { nav_item: item, nav_location: where });
    }
  });

  // section_view: een sectie telt als bekeken wanneer minstens 40% ervan een seconde lang in beeld is,
  // een keer per paginaweergave. De wachttijd voorkomt valse hits bij het voorbijscrollen na een ankerklik.
  if ('IntersectionObserver' in window) {
    var nodes = document.querySelectorAll('main section[id], footer[id]');
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = SECTIONS[en.target.id] || en.target.id;
        if (!en.isIntersecting) { clearTimeout(timers[id]); return; }
        timers[id] = setTimeout(function () {
          push('section_view', { section_id: id, section_index: Array.prototype.indexOf.call(nodes, en.target) + 1 });
          io.unobserve(en.target);
        }, 1000);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }
})();
