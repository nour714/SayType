/**
 * DictionaryTooltip — owns the lexical word-inspection tooltip popover.
 * Composed inside TrainingScreen (not inherited): TrainingScreen keeps
 * showTooltip/hideTooltip/isTooltipVisible delegates so its public API
 * and event contract are unchanged.
 */
export class DictionaryTooltip {
  constructor() {
    // Word Tooltip Popover Elements
    this.wordTooltip = document.getElementById('word-tooltip');
    this.tooltipWord = document.getElementById('tooltip-word');
    this.tooltipPos = document.getElementById('tooltip-pos');
    this.tooltipPronunciation = document.getElementById(
      'tooltip-pronunciation'
    );
    this.tooltipTranslation = document.getElementById('tooltip-translation');
    this.tooltipExample = document.getElementById('tooltip-example');

    /**
     * Sentence the inspected word appears in, used for the example line.
     * Set by TrainingScreen on every renderSentence().
     * @type {object|null}
     */
    this.currentSentence = null;
  }

  /**
   * Display lexical word tooltip near target element rect.
   * @param {{ word: string, translation: string, pronunciation: string, partOfSpeech: string }} info
   * @param {DOMRect} targetRect
   */
  showTooltip(info, targetRect) {
    if (!this.wordTooltip || !info) return;

    if (this.tooltipWord) this.tooltipWord.textContent = info.word;
    if (this.tooltipPos) this.tooltipPos.textContent = info.partOfSpeech || '';
    if (this.tooltipPronunciation)
      this.tooltipPronunciation.textContent = info.pronunciation || '';
    if (this.tooltipTranslation)
      this.tooltipTranslation.textContent = info.translation || '';

    // Example line: the sentence this word appears in (educational context).
    if (this.tooltipExample) {
      const exampleText = this.currentSentence
        ? this.currentSentence.text_en || this.currentSentence.english || ''
        : '';
      if (exampleText && /[a-z]/i.test(exampleText)) {
        this.tooltipExample.textContent = `"${exampleText}"`;
        this.tooltipExample.style.display = '';
      } else {
        this.tooltipExample.style.display = 'none';
      }
    }

    this.wordTooltip.classList.add('is-visible');
    this.wordTooltip.setAttribute('aria-hidden', 'false');

    const tooltipRect = this.wordTooltip.getBoundingClientRect();
    let top = targetRect.top - tooltipRect.height - 8;
    if (top < 10) {
      top = targetRect.bottom + 8;
    }
    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(
      12,
      Math.min(left, window.innerWidth - tooltipRect.width - 12)
    );

    this.wordTooltip.style.top = `${Math.round(top)}px`;
    this.wordTooltip.style.left = `${Math.round(left)}px`;
  }

  /**
   * Hide lexical word inspection tooltip.
   */
  hideTooltip() {
    if (this.wordTooltip && this.wordTooltip.classList.contains('is-visible')) {
      this.wordTooltip.classList.remove('is-visible');
      this.wordTooltip.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Whether the word tooltip is currently visible.
   * @returns {boolean}
   */
  isTooltipVisible() {
    return Boolean(
      this.wordTooltip && this.wordTooltip.classList.contains('is-visible')
    );
  }

  /**
   * Whether the tooltip is currently showing this exact word.
   * Used for the mobile tap-toggle (tap a visible word to dismiss it).
   * @param {string} word
   * @returns {boolean}
   */
  isShowingWord(word) {
    return this.isTooltipVisible() && this.tooltipWord?.textContent === word;
  }
}
