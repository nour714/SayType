/**
 * Toast — lightweight badge unlock and notification celebration banners.
 */
export class Toast {
  constructor(containerId = 'toast-container') {
    this.containerId = containerId;
    this.container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
  }

  /**
   * Display an animated notification banner.
   * @param {{ icon?: string, title: string, subtitle?: string, duration?: number }} options
   */
  show({ icon = '🏅', title, subtitle, duration = 4000 }) {
    if (!this.container && typeof document !== 'undefined') {
      this.container = document.getElementById(this.containerId);
    }
    if (!this.container || typeof document === 'undefined') return;

    const el = document.createElement('div');
    el.className = 'toast-banner';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <span class="toast-icon"></span>
      <div class="toast-text">
        <div class="toast-title"></div>
        <div class="toast-subtitle"></div>
      </div>`;

    el.querySelector('.toast-icon').textContent = icon;
    el.querySelector('.toast-title').textContent = title;
    el.querySelector('.toast-subtitle').textContent = subtitle || '';

    this.container.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('is-visible');
      });
    });

    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }
}
