import { LitElement, css, html } from 'lit';

export class DiskScopeApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif;
      color: #1a1a1a;
      background: #fafafa;
    }

    .shell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }

    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #5f6368;
    }

    .status {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #188038;
    }
  `;

  render() {
    const apiReady = typeof window.diskScope !== 'undefined';

    return html`
      <div class="shell">
        <h1>DiskScope</h1>
        <p>Foundation ready - developer workspace initialized.</p>
        <p class="status">
          ${apiReady ? 'window.diskScope API available' : 'Waiting for preload API...'}
        </p>
      </div>
    `;
  }
}

customElements.define('disk-scope-app', DiskScopeApp);

declare global {
  interface HTMLElementTagNameMap {
    'disk-scope-app': DiskScopeApp;
  }
}
