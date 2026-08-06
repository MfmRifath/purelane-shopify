/* ==========================================================================
   Purelane chrome
   <pl-header>  the fixed nav's scroll state and its mobile disclosure
   <pl-ticker>  pause control for the announcement marquee

   Custom elements so the theme editor can add, remove and reconfigure the
   header and announcement bar without leaving dead listeners behind.
   ========================================================================== */

if (!customElements.get('pl-header')) {
  customElements.define(
    'pl-header',
    class PurelaneHeader extends HTMLElement {
      connectedCallback() {
        this.toggle = this.querySelector('[data-pl-menu-toggle]');
        this.panel = this.querySelector('[data-pl-menu]');

        this.onScroll = this.onScroll.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);

        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.onScroll();

        if (this.toggle && this.panel) {
          this.toggle.addEventListener('click', () => this.setOpen(!this.isOpen));
          document.addEventListener('keydown', this.onKeydown);
          document.addEventListener('click', this.onDocumentClick);
        }
      }

      disconnectedCallback() {
        window.removeEventListener('scroll', this.onScroll);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('click', this.onDocumentClick);
        if (this.frame) cancelAnimationFrame(this.frame);
      }

      get isOpen() {
        return this.panel && this.panel.classList.contains('is-open');
      }

      onScroll() {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          this.classList.toggle('is-up', (window.scrollY || window.pageYOffset) > 90);
        });
      }

      setOpen(open) {
        if (!this.panel || !this.toggle) return;
        this.panel.classList.toggle('is-open', open);
        this.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) this.toggle.focus();
      }

      onKeydown(event) {
        if (event.key === 'Escape' && this.isOpen) this.setOpen(false);
      }

      onDocumentClick(event) {
        if (!this.isOpen) return;
        if (this.contains(event.target)) return;
        this.setOpen(false);
      }
    }
  );
}

if (!customElements.get('pl-ticker')) {
  customElements.define(
    'pl-ticker',
    class PurelaneTicker extends HTMLElement {
      connectedCallback() {
        this.toggle = this.querySelector('[data-pl-toggle]');
        if (!this.toggle || this.bound) return;

        this.bound = true;
        this.labelPlay = this.toggle.getAttribute('data-label-play') || 'Play';
        this.labelPause = this.toggle.getAttribute('data-label-pause') || 'Pause';
        this.iconPlay = this.querySelector('[data-pl-icon-play]');
        this.iconPause = this.querySelector('[data-pl-icon-pause]');

        this.toggle.addEventListener('click', () => this.setPaused(!this.classList.contains('is-paused')));

        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.setPaused(this.reduce.matches);
      }

      setPaused(paused) {
        this.classList.toggle('is-paused', paused);
        this.toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        this.toggle.setAttribute('aria-label', paused ? this.labelPlay : this.labelPause);
        if (this.iconPlay) this.iconPlay.hidden = !paused;
        if (this.iconPause) this.iconPause.hidden = paused;
      }
    }
  );
}
