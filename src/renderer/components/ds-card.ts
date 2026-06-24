import '@material/web/labs/card/elevated-card.js';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('ds-card')
export class DsCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    md-elevated-card {
      display: block;
      padding: 16px;
    }
  `;

  render() {
    return html`
      <md-elevated-card>
        <slot></slot>
      </md-elevated-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-card': DsCard;
  }
}
