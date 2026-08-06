/* ==========================================================================
   <pl-hero-stage>
   The 1 → 2 → 3 product rotation, its dots, and the scroll/pointer parallax on
   the product group.

   Everything is scoped to the element and set up in connectedCallback, so a
   second hero on the page, or a hero re-rendered by the theme editor, works on
   its own. The prototype reached for #hstage / #hdots / #heroProd by id, which
   breaks the moment there is more than one.
   ========================================================================== */
if (!customElements.get('pl-hero-stage')) {
  customElements.define(
    'pl-hero-stage',
    class PurelaneHeroStage extends HTMLElement {
      connectedCallback() {
        this.slides = Array.from(this.querySelectorAll('[data-pl-slide]'));
        this.dots = Array.from(this.querySelectorAll('[data-pl-dot]'));
        this.index = 0;
        this.timer = null;
        this.frameId = null;
        this.mouseX = 0;
        this.mouseY = 0;

        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.interval = parseInt(this.dataset.interval, 10) || 3800;
        this.autoplay = this.dataset.autoplay !== 'false';

        this.onScroll = this.onScroll.bind(this);
        this.onMouse = this.onMouse.bind(this);
        this.render = this.render.bind(this);

        this.bindRotation();
        this.bindParallax();
        this.bindEditor();

        this.go(0);
        this.render();
      }

      disconnectedCallback() {
        this.stop();
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
        window.removeEventListener('mousemove', this.onMouse);
        if (this.visibility) this.visibility.disconnect();
        if (this.drift) this.drift.cancel();
      }

      /* ------------------------------------------------------------ slides */

      bindRotation() {
        if (this.slides.length < 2) return;

        this.dots.forEach((dot, i) => {
          dot.addEventListener('click', () => {
            this.stop();
            this.go(i);
            this.play();
          });
        });

        this.addEventListener('mouseenter', () => this.stop());
        this.addEventListener('mouseleave', () => this.play());
        this.addEventListener('focusin', () => this.stop());
        this.addEventListener('focusout', () => this.play());

        if ('IntersectionObserver' in window) {
          this.visibility = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => (entry.isIntersecting ? this.play() : this.stop()));
            },
            { threshold: 0.2 }
          );
          this.visibility.observe(this);
        } else {
          this.play();
        }
      }

      go(n) {
        if (!this.slides.length) return;
        this.index = (n + this.slides.length) % this.slides.length;

        this.slides.forEach((slide, i) => {
          var active = i === this.index;
          slide.classList.toggle('is-on', active);
          /* Inactive slides sit on top of each other at opacity 0. Hiding them
             keeps them out of the tab order and off the accessibility tree. */
          slide.toggleAttribute('inert', !active);
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        });

        this.dots.forEach((dot, i) => {
          var active = i === this.index;
          dot.classList.toggle('is-on', active);
          dot.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      play() {
        if (this.timer || !this.autoplay || this.reduce.matches) return;
        if (this.slides.length < 2) return;
        this.timer = setInterval(() => this.go(this.index + 1), this.interval);
      }

      stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
      }

      /* ---------------------------------------------------------- parallax */

      bindParallax() {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll);

        if (window.matchMedia('(min-width: 1024px)').matches && !this.reduce.matches) {
          window.addEventListener('mousemove', this.onMouse, { passive: true });
        }

        if (!this.reduce.matches && typeof this.animate === 'function') {
          this.drift = this.animate(
            [
              { filter: 'drop-shadow(0 34px 54px rgba(2,20,19,.6))' },
              { filter: 'drop-shadow(0 42px 68px rgba(2,20,19,.68))' },
              { filter: 'drop-shadow(0 34px 54px rgba(2,20,19,.6))' },
            ],
            { duration: 7000, iterations: Infinity, easing: 'ease-in-out' }
          );
        }
      }

      onScroll() {
        if (this.frameId) return;
        this.frameId = requestAnimationFrame(this.render);
      }

      onMouse(event) {
        this.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        this.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        this.onScroll();
      }

      render() {
        this.frameId = null;
        if (this.reduce.matches) return;

        var y = window.scrollY || window.pageYOffset;
        var f = Math.min(y / 700, 1);

        this.style.transform =
          'translate3d(' +
          (this.mouseX * -16).toFixed(2) +
          'px,' +
          (-f * 54 + this.mouseY * -10).toFixed(2) +
          'px,0) scale(' +
          (1 - f * 0.06).toFixed(3) +
          ')';
        this.style.opacity = (1 - f * 0.55).toFixed(3);
      }

      /* ------------------------------------------------------------ editor */

      bindEditor() {
        if (!window.Shopify || !window.Shopify.designMode) return;

        /* Selecting a slide block in the theme editor should show that slide. */
        document.addEventListener('shopify:block:select', (event) => {
          var slide = this.slides.indexOf(event.target);
          if (slide === -1) return;
          this.stop();
          this.go(slide);
        });

        document.addEventListener('shopify:block:deselect', () => this.play());
      }
    }
  );
}
