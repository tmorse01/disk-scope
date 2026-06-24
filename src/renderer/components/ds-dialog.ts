import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ds-dialog')
export class DsDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;

  private handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('ds-close', { bubbles: true, composed: true }),
    );
  }

  render() {
    return html`
      <md-dialog ?open=${this.open} @closed=${this.handleClose}>
        <div slot="headline">
          <slot name="headline"></slot>
        </div>
        <div slot="content">
          <slot name="content"></slot>
        </div>
        <div slot="actions">
          <slot name="actions">
            <md-text-button @click=${this.handleClose}>Close</md-text-button>
          </slot>
        </div>
      </md-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-dialog': DsDialog;
  }
}
