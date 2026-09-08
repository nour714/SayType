import { EventEmitter } from '../core/EventEmitter.js';

export class SettingsScreen extends EventEmitter {
  constructor() {
    super();
    this.el = document.getElementById('page-settings');
  }

  render({ settingsService }) {
    if (!this.el) return;

    const settings = settingsService.getAll();
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    this.el.innerHTML = `
      <div class="settings-page">
        <div class="page-header">
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Customize your learning experience</p>
        </div>

        <div class="settings-list">
          <div class="settings-group">
            <h2 class="settings-group-title">Typing</h2>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">Typing Mode</span>
                <span class="settings-item-desc">Strict stops on errors · Free allows correction</span>
              </div>
              <select id="setting-typing-mode" class="settings-select" aria-label="Typing mode">
                <option value="strict" ${settings.typingMode === 'strict' ? 'selected' : ''}>Strict</option>
                <option value="free" ${settings.typingMode === 'free' ? 'selected' : ''}>Free</option>
              </select>
            </div>
          </div>

          <div class="settings-group">
            <h2 class="settings-group-title">Audio</h2>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">Speech Rate</span>
                <span class="settings-item-desc">Speed of pronunciation playback</span>
              </div>
              <select id="setting-speech-rate" class="settings-select" aria-label="Speech rate">
                <option value="0.5" ${settings.speechRate === 0.5 ? 'selected' : ''}>0.5x</option>
                <option value="0.75" ${settings.speechRate === 0.75 ? 'selected' : ''}>0.75x</option>
                <option value="1" ${settings.speechRate === 1 || !settings.speechRate ? 'selected' : ''}>1x</option>
                <option value="1.25" ${settings.speechRate === 1.25 ? 'selected' : ''}>1.25x</option>
                <option value="1.5" ${settings.speechRate === 1.5 ? 'selected' : ''}>1.5x</option>
              </select>
            </div>
          </div>

          <div class="settings-group">
            <h2 class="settings-group-title">Appearance</h2>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">Theme</span>
                <span class="settings-item-desc">Currently: ${isDark ? 'Dark' : 'Light'}</span>
              </div>
              <button id="setting-theme-toggle" class="settings-toggle ${isDark ? 'is-on' : ''}" role="switch" aria-checked="${isDark}" aria-label="Toggle theme">
                <span class="settings-toggle-thumb"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindSettings(settingsService);
  }

  _bindSettings(settingsService) {
    const typingMode = document.getElementById('setting-typing-mode');
    const speechRate = document.getElementById('setting-speech-rate');
    const themeToggle = document.getElementById('setting-theme-toggle');

    if (typingMode) {
      typingMode.addEventListener('change', () => {
        settingsService.set('typingMode', typingMode.value);
        this.emit('setting:typingMode', { value: typingMode.value });
      });
    }

    if (speechRate) {
      speechRate.addEventListener('change', () => {
        const val = parseFloat(speechRate.value);
        settingsService.set('speechRate', val);
        this.emit('setting:speechRate', { value: val });
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.emit('setting:theme');
        const isDark =
          document.documentElement.getAttribute('data-theme') === 'dark';
        themeToggle.classList.toggle('is-on', !isDark);
        themeToggle.setAttribute('aria-checked', String(!isDark));
        const desc = this.el?.querySelector('.settings-item-desc');
        if (desc) desc.textContent = `Currently: ${isDark ? 'Light' : 'Dark'}`;
      });
    }
  }
}
