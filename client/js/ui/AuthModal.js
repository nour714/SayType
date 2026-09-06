import { EventEmitter } from '../core/EventEmitter.js';

/**
 * AuthModal — lightweight sign-up / log-in modal for Supabase auth.
 * Emits:
 * - 'auth:submit' with { email, password, mode: 'signup'|'login' }
 * - 'auth:dismiss'
 */
export class AuthModal extends EventEmitter {
  constructor() {
    super();

    this.backdrop = document.getElementById('auth-modal');
    this.emailInput = document.getElementById('auth-email');
    this.passwordInput = document.getElementById('auth-password');
    this.errorEl = document.getElementById('auth-error');
    this.submitBtn = document.getElementById('auth-submit-btn');
    this.toggleBtn = document.getElementById('auth-toggle-btn');
    this.dismissBtn = document.getElementById('auth-dismiss-btn');
    this._mode = 'login';

    this._bindEvents();
  }

  _bindEvents() {
    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => this.close());
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this._mode = this._mode === 'login' ? 'signup' : 'login';
        this._renderMode();
      });
    }

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this._handleSubmit());
    }

    if (this.emailInput) {
      this.emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.passwordInput?.focus();
        }
      });
    }

    if (this.passwordInput) {
      this.passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._handleSubmit();
        }
      });
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }
  }

  _handleSubmit() {
    const email = this.emailInput?.value?.trim();
    const password = this.passwordInput?.value;
    if (!email || !password) {
      this.showError('Please enter both email and password.');
      return;
    }
    this.clearError();
    this.emit('auth:submit', { email, password, mode: this._mode });
  }

  _renderMode() {
    if (this.submitBtn) {
      this.submitBtn.textContent = this._mode === 'signup' ? 'Create Account' : 'Log In';
    }
    if (this.toggleBtn) {
      this.toggleBtn.textContent = this._mode === 'signup'
        ? 'Already have an account? Log In'
        : "Don't have an account? Sign Up";
    }
  }

  open() {
    if (this.backdrop) {
      this.backdrop.classList.add('is-open');
      this.backdrop.setAttribute('aria-hidden', 'false');
    }
    this.clearError();
    this.emailInput?.focus();
  }

  close() {
    if (this.backdrop) {
      this.backdrop.classList.remove('is-open');
      this.backdrop.setAttribute('aria-hidden', 'true');
    }
    this.emit('auth:dismiss');
  }

  isOpen() {
    return this.backdrop?.classList.contains('is-open') ?? false;
  }

  showError(message) {
    if (this.errorEl) {
      this.errorEl.textContent = message;
      this.errorEl.hidden = false;
    }
  }

  clearError() {
    if (this.errorEl) {
      this.errorEl.textContent = '';
      this.errorEl.hidden = true;
    }
  }

  setSubmitting(submitting) {
    if (this.submitBtn) {
      this.submitBtn.disabled = submitting;
      this.submitBtn.textContent = submitting ? 'Please wait...' : (this._mode === 'signup' ? 'Create Account' : 'Log In');
    }
  }
}
