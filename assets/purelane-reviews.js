/* ==========================================================================
   <pl-marquee>
   Pause control for the reviews rail.

   A custom element rather than a startup query: connectedCallback runs again
   every time the theme editor re-renders the section, so the control keeps
   working after a merchant changes a setting, reorders sections, or drops a
   second reviews rail onto the page.
   ========================================================================== */
if (!customElements.get('pl-marquee')) {
  customElements.define(
    'pl-marquee',
    class PurelaneMarquee extends HTMLElement {
      connectedCallback() {
        this.toggle = this.querySelector('[data-pl-toggle]');
        if (!this.toggle || this.bound) return;

        this.bound = true;
        this.labelPlay = this.toggle.getAttribute('data-label-play') || 'Play';
        this.labelPause = this.toggle.getAttribute('data-label-pause') || 'Pause';
        this.iconPlay = this.querySelector('[data-pl-icon-play]');
        this.iconPause = this.querySelector('[data-pl-icon-pause]');

        this.toggle.addEventListener('click', this.onToggle.bind(this));

        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.setPaused(this.reduce.matches);

        if (typeof this.reduce.addEventListener === 'function') {
          this.reduce.addEventListener('change', () => this.setPaused(this.reduce.matches));
        }
      }

      onToggle() {
        this.setPaused(!this.classList.contains('is-paused'));
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
