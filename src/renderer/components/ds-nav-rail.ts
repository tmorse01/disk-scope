import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { NavRoute } from '../routes.js';

@customElement('ds-nav-rail')
export class DsNavRail extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    nav {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: var(--ds-nav-rail-width);
      min-height: 100%;
      padding: 12px 0;
      background: var(--ds-color-nav-rail);
      border-right: 1px solid var(--md-sys-color-outline-variant);
    }

    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      min-height: 64px;
      padding: 8px 4px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      font: 500 0.75rem/1rem var(--ds-font-family, Roboto, sans-serif);
      transition: background-color 150ms ease;
    }

    button:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
    }

    button:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: -2px;
    }

    button[aria-current='page'] {
      background: var(--ds-color-nav-rail-active);
      color: var(--md-sys-color-on-secondary-container);
    }

    button[aria-current='page'] .icon {
      color: var(--md-sys-color-on-secondary-container);
    }

    .icon {
      font-size: 24px;
    }

    .label {
      max-width: 72px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  @property({ attribute: false }) routes: NavRoute[] = [];
  @property() activeRoute = '';

  private handleSelect(routeId: string) {
    this.dispatchEvent(
      new CustomEvent('ds-nav-select', {
        detail: { routeId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <nav aria-label="Primary">
        ${this.routes.map(
          (route) => html`
            <button
              type="button"
              aria-current=${this.activeRoute === route.id ? 'page' : 'false'}
              @click=${() => this.handleSelect(route.id)}
            >
              <span class="material-symbols-outlined icon" aria-hidden="true">
                ${route.icon}
              </span>
              <span class="label">${route.label}</span>
            </button>
          `,
        )}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-nav-rail': DsNavRail;
  }
}
