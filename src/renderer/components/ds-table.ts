import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('ds-table')
export class DsTable extends LitElement {
  static styles = css`
    :host {
      display: block;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--md-sys-color-surface-container-lowest, var(--md-sys-color-surface));
      color: var(--md-sys-color-on-surface);
      font: var(--md-sys-typescale-body-medium-size, 0.875rem) /
        var(--md-sys-typescale-body-medium-line-height, 1.25rem)
        var(--ds-font-family, Roboto, sans-serif);
    }

    ::slotted(thead) {
      background: var(--md-sys-color-surface-container-high);
    }

    ::slotted(th) {
      text-align: left;
      padding: 12px 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    ::slotted(td) {
      padding: 12px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    ::slotted(tr:last-child td) {
      border-bottom: none;
    }

    ::slotted(tr:hover td) {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
    }
  `;

  render() {
    return html`
      <table>
        <slot></slot>
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-table': DsTable;
  }
}
