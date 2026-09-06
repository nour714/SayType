/**
 * SyncService — orchestrates progress sync between local ProgressService
 * and Supabase user_progress table.
 *
 * Conflict rule:
 * - If no server row exists → insert local data (first-login migration).
 * - If server row exists → server wins, overwrite local state.
 * - After initial sync, listens to ProgressService 'change' and pushes updates.
 */
export class SyncService {
  /**
   * @param {import('./ProgressService.js').ProgressService} progressService
   * @param {import('./AuthService.js').AuthService} authService
   */
  constructor(progressService, authService) {
    this._progressService = progressService;
    this._authService = authService;
    this._syncing = false;
    this._onChangeBound = this._onChange.bind(this);
    this._debounceTimer = null;
  }

  /**
   * Wire up auth events — call once during bootstrap.
   */
  init() {
    this._authService.on('auth:signedIn', ({ userId }) => {
      this._syncFromServer(userId);
    });

    this._authService.on('auth:signedOut', () => {
      this._stopPushing();
    });
  }

  /**
   * Pull or push progress on sign-in.
   * @private
   */
  async _syncFromServer(userId) {
    if (this._syncing) return;
    this._syncing = true;

    try {
      const client = this._authService.getClient();
      if (!client) return;

      const { data, error } = await client
        .from('user_progress')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('SyncService: failed to query user_progress:', error.message);
        return;
      }

      if (!data) {
        // First-ever login for this account: upload local state
        await this._pushToServer(userId);
      } else {
        // Server has a record: server wins — overwrite local
        this._progressService.replaceAll(data.data);
      }

      // Start listening to local changes and pushing
      this._progressService.on('change', this._onChangeBound);
    } catch (err) {
      console.warn('SyncService: sync error:', err);
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Handle local progress changes — debounced push to server.
   * @private
   */
  _onChange() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      const userId = this._authService.userId;
      if (userId) {
        this._pushToServer(userId);
      }
    }, 1000);
  }

  /**
   * Push current local progress to the server row.
   * @private
   */
  async _pushToServer(userId) {
    const client = this._authService.getClient();
    if (!client || !userId) return;

    const payload = {
      user_id: userId,
      data: this._progressService.data,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('SyncService: failed to push progress:', error.message);
    }
  }

  /**
   * Stop listening to local changes (on sign-out).
   * @private
   */
  _stopPushing() {
    this._progressService.off('change', this._onChangeBound);
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }
}
