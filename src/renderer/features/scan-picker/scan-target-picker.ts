import { LitElement, css, html } from 'lit';
import { pickScanTarget, scanStore, subscribeScanStore } from '../../stores/scan-store';

export class ScanTargetPicker extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-top: 1.5rem;
    }

    .panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      max-width: 36rem;
      margin: 0 auto;
      padding: 1rem 1.25rem;
      border: 1px solid #dadce0;
      border-radius: 0.75rem;
      background: #ffffff;
      text-align: left;
    }

    button {
      border: none;
      border-radius: 999px;
      padding: 0.625rem 1.25rem;
      font: inherit;
      font-weight: 600;
      color: #ffffff;
      background: #1a73e8;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    button:not(:disabled):hover {
      background: #185abc;
    }

    .path-label {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #5f6368;
    }

    .path-value {
      margin: 0;
      font-size: 0.9375rem;
      color: #202124;
      word-break: break-all;
    }

    .placeholder {
      margin: 0;
      font-size: 0.9375rem;
      color: #80868b;
      font-style: italic;
    }

    .error {
      margin: 0;
      font-size: 0.875rem;
      color: #b3261e;
    }
  `;

  private unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = subscribeScanStore(() => {
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private handleSelectFolder = (): void => {
    void pickScanTarget();
  };

  render() {
    const isSelecting = scanStore.status === 'selecting-target';
    const selectedPath = scanStore.selectedPath;
    const pickerError = scanStore.pickerError;

    return html`
      <section class="panel" aria-labelledby="scan-target-heading">
        <h2 id="scan-target-heading" class="path-label">Scan target</h2>
        <button type="button" ?disabled=${isSelecting} @click=${this.handleSelectFolder}>
          ${isSelecting ? 'Opening folder picker…' : 'Select folder'}
        </button>
        ${selectedPath
          ? html`<p class="path-value" data-testid="selected-path">${selectedPath}</p>`
          : html`<p class="placeholder">No folder selected yet.</p>`}
        ${pickerError ? html`<p class="error" role="alert">${pickerError}</p>` : null}
      </section>
    `;
  }
}

customElements.define('scan-target-picker', ScanTargetPicker);

declare global {
  interface HTMLElementTagNameMap {
    'scan-target-picker': ScanTargetPicker;
  }
}
