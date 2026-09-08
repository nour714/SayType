import { EventEmitter } from '../core/EventEmitter.js';

/**
 * AuthService — email/password auth via Supabase Auth.
 * Emits:
 * - 'auth:signedIn' with { userId, email }
 * - 'auth:signedOut'
 */
export class AuthService extends EventEmitter {
  /**
   * @param {Promise<import('@supabase/supabase-js').SupabaseClient|null>} clientPromise
   */
  constructor(clientPromise) {
    super();
    this._clientPromise = clientPromise;
    this._client = null;
    this._userId = null;
    this._email = null;
  }

  /**
   * Initialize — resolves the Supabase client and restores any existing session.
   */
  async init() {
    this._client = await this._clientPromise;
    if (!this._client) return;

    // Restore existing session
    const {
      data: { session }
    } = await this._client.auth.getSession();
    if (session?.user) {
      this._userId = session.user.id;
      this._email = session.user.email;
      this.emit('auth:signedIn', { userId: this._userId, email: this._email });
    }

    // Listen for auth state changes (token refresh, sign out in another tab, etc.)
    this._client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const prevId = this._userId;
        this._userId = session.user.id;
        this._email = session.user.email;
        if (prevId !== this._userId) {
          this.emit('auth:signedIn', {
            userId: this._userId,
            email: this._email
          });
        }
      } else if (this._userId) {
        this._userId = null;
        this._email = null;
        this.emit('auth:signedOut');
      }
    });
  }

  /** @returns {boolean} */
  get isAuthenticated() {
    return !!this._userId;
  }

  /** @returns {string|null} */
  get userId() {
    return this._userId;
  }

  /** @returns {string|null} */
  get email() {
    return this._email;
  }

  /**
   * Sign up with email + password.
   * @param {string} email
   * @param {string} password
   * @returns {{ error?: string }}
   */
  async signUp(email, password) {
    if (!this._client) return { error: 'Sync not available.' };
    const { error } = await this._client.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // onAuthStateChange will emit auth:signedIn
    return {};
  }

  /**
   * Sign in with email + password.
   * @param {string} email
   * @param {string} password
   * @returns {{ error?: string }}
   */
  async signIn(email, password) {
    if (!this._client) return { error: 'Sync not available.' };
    const { error } = await this._client.auth.signInWithPassword({
      email,
      password
    });
    if (error) return { error: error.message };
    return {};
  }

  /**
   * Sign out.
   * @returns {{ error?: string }}
   */
  async signOut() {
    if (!this._client) return {};
    const { error } = await this._client.auth.signOut();
    if (error) return { error: error.message };
    // onAuthStateChange will emit auth:signedOut
    return {};
  }

  /**
   * Get the raw Supabase client for direct queries (used by SyncService).
   * @returns {import('@supabase/supabase-js').SupabaseClient|null}
   */
  getClient() {
    return this._client;
  }
}
