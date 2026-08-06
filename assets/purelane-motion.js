/* ==========================================================================
   Purelane motion
   Scroll-reveal for anything carrying `.pl-rv`.

   Theme-editor contract: every entry point re-scans, so sections and blocks
   added, reordered or reconfigured after first paint animate exactly like the
   ones that were there on load. The prototype ran a single querySelectorAll at
   startup, which left every re-rendered section stuck at opacity 0.
   ========================================================================== */
(function () {
  'use strict';

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observer = null;

  function show(el) {
    el.classList.add('is-in');
  }

  function getObserver() {
    if (observer) return observer;
    if (!('IntersectionObserver' in window)) return null;

    observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          show(entries[i].target);
          observer.unobserve(entries[i].target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    return observer;
  }

  function collect(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = Array.prototype.slice.call(scope.querySelectorAll('.pl-rv:not(.is-in)'));

    if (scope !== document && scope.classList && scope.classList.contains('pl-rv')) {
      nodes.push(scope);
    }

    return nodes;
  }

  function scan(root) {
    var nodes = collect(root);
    var io = reduceQuery.matches ? null : getObserver();

    for (var i = 0; i < nodes.length; i++) {
      if (io) {
        io.observe(nodes[i]);
      } else {
        show(nodes[i]);
      }
    }
  }

  function showAll(root) {
    var nodes = collect(root);
    for (var i = 0; i < nodes.length; i++) show(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scan(document);
    });
  } else {
    scan(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    scan(event.target);
  });

  /* Selecting a section or block in the editor scrolls it into view in a way
     IntersectionObserver sometimes misses. Reveal it outright rather than
     showing the merchant a blank panel. */
  document.addEventListener('shopify:section:select', function (event) {
    showAll(event.target);
  });

  document.addEventListener('shopify:block:select', function (event) {
    showAll(event.target);
  });

  if (typeof reduceQuery.addEventListener === 'function') {
    reduceQuery.addEventListener('change', function () {
      if (reduceQuery.matches) showAll(document);
      else scan(document);
    });
  }

  window.PurelaneMotion = { scan: scan, showAll: showAll };
})();
