import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../../components/ds-card.js';
import '../scan-picker/index.js';

@customElement('overview-view')
export class OverviewView extends LitElement {
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
      color: var(--md-sys-color-on-surface);
    }

    p {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font: 400 0.875rem/1.25rem var(--ds-font-family, Roboto, sans-serif);
    }

    scan-target-picker {
      margin-top: 1rem;
    }
  `;

  @property() message = 'Run a scan to see disk usage summary and top metrics.';

  render() {
    return html`
      <ds-card>
        <div class="empty">
          <h2>Overview</h2>
          <p>${this.message}</p>
          <scan-target-picker></scan-target-picker>
        </div>
      </ds-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'overview-view': OverviewView;
  }
}
