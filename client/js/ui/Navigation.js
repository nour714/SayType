import { EventEmitter } from '../core/EventEmitter.js';

export class Navigation extends EventEmitter {
  constructor() {
    super();
    this.desktopNav = document.getElementById('desktop-nav');
    this.mobileNav = document.getElementById('mobile-nav');
    this._bindEvents();
  }

  _bindEvents() {
    if (this.desktopNav) {
      this.desktopNav.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
          e.preventDefault();
          const route = link.getAttribute('href')?.replace('#', '') || '/';
          this.emit('navigate', { route });
        }
      });
    }

    if (this.mobileNav) {
      this.mobileNav.addEventListener('click', (e) => {
        const link = e.target.closest('.mobile-nav-item');
        if (link) {
          e.preventDefault();
          const route = link.getAttribute('href')?.replace('#', '') || '/';
          this.emit('navigate', { route });
        }
      });
    }
  }

  setActive(route) {
    if (this.desktopNav) {
      this.desktopNav.querySelectorAll('.nav-link').forEach((link) => {
        const href = link.getAttribute('href')?.replace('#', '') || '/';
        link.classList.toggle('is-active', href === route);
        if (href === route) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    if (this.mobileNav) {
      this.mobileNav.querySelectorAll('.mobile-nav-item').forEach((link) => {
        const href = link.getAttribute('href')?.replace('#', '') || '/';
        link.classList.toggle('is-active', href === route);
        if (href === route) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
  }
}
