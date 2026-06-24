import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DsButtonVariant = 'filled' | 'outlined' | 'text';

@customElement('ds-button')
export class DsButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  @property({ reflect: true }) variant: DsButtonVariant = 'filled';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  render() {
    const common = html`<slot></slot>`;

    switch (this.variant) {
      case 'outlined':
        return html`
          <md-outlined-button ?disabled=${this.disabled} type=${this.type}>
            ${common}
          </md-outlined-button>
        `;
      case 'text':
        return html`
          <md-text-button ?disabled=${this.disabled} type=${this.type}>
            ${common}
          </md-text-button>
        `;
      default:
        return html`
          <md-filled-button ?disabled=${this.disabled} type=${this.type}>
            ${common}
          </md-filled-button>
        `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-button': DsButton;
  }
}
