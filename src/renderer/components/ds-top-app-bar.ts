import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ds-top-app-bar')
export class DsTopAppBar extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    header {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: var(--ds-top-app-bar-height);
      padding: 8px 24px;
      background: var(--ds-color-top-app-bar);
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .logo {
      color: var(--md-sys-color-primary);
      font-size: 28px;
    }

    .titles {
      min-width: 0;
    }

    .title {
      margin: 0;
      font: 500 1.375rem/1.75rem var(--ds-font-family, Roboto, sans-serif);
    }

    .subtitle {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font: 400 0.875rem/1.25rem var(--ds-font-family, Roboto, sans-serif);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  @property() title = 'DiskScope';
  @property() subtitle = 'No scan target selected';

  render() {
    return html`
      <header>
        <div class="brand">
          <span class="material-symbols-outlined logo" aria-hidden="true">storage</span>
          <div class="titles">
            <h1 class="title">${this.title}</h1>
            <p class="subtitle">${this.subtitle}</p>
          </div>
        </div>
        <div class="actions">
          <slot name="actions"></slot>
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-top-app-bar': DsTopAppBar;
  }
}
