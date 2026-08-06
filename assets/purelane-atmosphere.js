/* ==========================================================================
   Purelane atmosphere
   Drives three things off a single rAF-throttled scroll handler:
     1. which of the four scene gradients is showing (and the water depth),
     2. the caustic parallax,
     3. the progress rail.

   The rail is generated from the Purelane sections present in the DOM, and the
   whole index is rebuilt on shopify:section:load / :unload / :reorder, so the
   theme editor cannot desync it. The prototype hardcoded the rail markup and
   read section offsets once.
   ========================================================================== */
(function () {
  'use strict';

  var stage = document.querySelector('[data-pl-scenes]');
  var rail = document.querySelector('[data-pl-rail]');
  if (!stage && !rail) return;

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointerQuery = window.matchMedia('(min-width: 1024px)');

  var scenes = stage ? Array.prototype.slice.call(stage.querySelectorAll('.pl-scene')) : [];
  var layers = stage ? Array.prototype.slice.call(stage.querySelectorAll('.pl-wl')) : [];
  var depths = [0.05, 0.09, 0.03, 0.02];

  var zones = [];
  var railLinks = [];
  var currentScene = 0;
  var currentRail = -1;
  var frameId = null;
  var mouseX = 0;
  var mouseY = 0;

  function topOf(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  /* ---------------------------------------------------------------- index */

  function buildZones() {
    zones = Array.prototype.slice.call(document.querySelectorAll('[data-pl-scene]')).map(function (el) {
      return { el: el, scene: parseInt(el.getAttribute('data-pl-scene'), 10) || 1 };
    });
  }

  function buildRail() {
    if (!rail) return;

    rail.textContent = '';
    railLinks = [];

    var sections = document.querySelectorAll('[data-pl-rail-label]');
    if (sections.length < 2) return;

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var label = section.getAttribute('data-pl-rail-label');
      if (!label) continue;

      var target = section.id || (section.parentNode && section.parentNode.id);
      if (!target) continue;

      var link = document.createElement('a');
      link.href = '#' + target;
      link.setAttribute('aria-label', label);
      rail.appendChild(link);
      railLinks.push({ link: link, section: section });
    }

    currentRail = -1;
  }

  function rebuild() {
    buildZones();
    buildRail();
    currentScene = 0;
    schedule();
  }

  /* --------------------------------------------------------------- render */

  function setScene(n) {
    if (n === currentScene) return;
    currentScene = n;

    for (var i = 0; i < scenes.length; i++) {
      scenes[i].classList.toggle('is-on', i + 1 === n);
    }

    if (stage) stage.setAttribute('data-pl-depth', String(n));
  }

  function pickScene() {
    if (!stage) return;

    var focus = window.scrollY + window.innerHeight * 0.5;
    var scene = 1;

    for (var i = 0; i < zones.length; i++) {
      if (topOf(zones[i].el) <= focus) scene = zones[i].scene;
    }

    setScene(scene);
  }

  function syncRail() {
    if (!railLinks.length) return;

    var mid = window.scrollY + window.innerHeight * 0.42;
    var index = 0;

    for (var i = 0; i < railLinks.length; i++) {
      if (topOf(railLinks[i].section) <= mid) index = i;
    }

    if (index === currentRail) return;
    currentRail = index;

    for (var j = 0; j < railLinks.length; j++) {
      railLinks[j].link.classList.toggle('is-on', j === index);
      if (j === index) railLinks[j].link.setAttribute('aria-current', 'true');
      else railLinks[j].link.removeAttribute('aria-current');
    }
  }

  function parallax() {
    if (reduceQuery.matches) return;

    var y = window.scrollY;

    for (var i = 0; i < layers.length; i++) {
      var d = depths[i] || 0.05;
      layers[i].style.setProperty('--pl-px', (mouseX * d * 130).toFixed(1) + 'px');
      layers[i].style.setProperty('--pl-py', (-y * d + mouseY * d * 90).toFixed(1) + 'px');
    }
  }

  function frame() {
    frameId = null;
    parallax();
    pickScene();
    syncRail();
  }

  function schedule() {
    if (frameId) return;
    frameId = requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------------- events */

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  if (pointerQuery.matches && !reduceQuery.matches) {
    window.addEventListener(
      'mousemove',
      function (event) {
        mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        schedule();
      },
      { passive: true }
    );
  }

  ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder'].forEach(function (name) {
    document.addEventListener(name, rebuild);
  });

  if (typeof reduceQuery.addEventListener === 'function') {
    reduceQuery.addEventListener('change', function () {
      if (!reduceQuery.matches) return;
      for (var i = 0; i < layers.length; i++) {
        layers[i].style.removeProperty('--pl-px');
        layers[i].style.removeProperty('--pl-py');
      }
    });
  }

  rebuild();
  window.addEventListener('load', schedule);
})();
