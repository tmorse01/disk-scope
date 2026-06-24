import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../../components/ds-card.js';

@customElement('largest-files-view')
export class LargestFilesView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .empty {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }

    h2 {
      margin: 0;
      font: 500 1.5rem/2rem var(--ds-font-family, Roboto, sans-serif);
    }

    p {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font: 400 0.875rem/1.25rem var(--ds-font-family, Roboto, sans-serif);
    }
  `;

  render() {
    return html`
      <ds-card>
        <div class="empty">
          <h2>Largest Files</h2>
          <p>Individual file rankings will appear here after a scan completes.</p>
        </div>
      </ds-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'largest-files-view': LargestFilesView;
  }
}
