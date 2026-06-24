import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/ds-button.js';
import './components/ds-card.js';
import './components/ds-dialog.js';
import './components/ds-nav-rail.js';
import './components/ds-table.js';
import './components/ds-top-app-bar.js';
import './features/cleanup-candidates/index.js';
import './features/exclusions/index.js';
import './features/file-types/index.js';
import './features/largest-files/index.js';
import './features/largest-folders/index.js';
import './features/overview/index.js';
import './features/settings/index.js';
import {
  APP_ROUTES,
  DEFAULT_ROUTE,
  getRouteById,
  isAppRoute,
  type AppRoute,
} from './routes.js';

@customElement('disk-scope-app')
export class DiskScopeApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--ds-color-background);
      color: var(--ds-color-on-background);
      font-family: var(--ds-font-family, Roboto, sans-serif);
    }

    .body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .content {
      flex: 1;
      min-width: 0;
      padding: 24px;
      overflow: auto;
    }

    .scan-status {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: var(--ds-scan-status-height);
      padding: 8px 24px;
      background: var(--ds-color-scan-status);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-surface-variant);
      font: 500 0.875rem/1.25rem var(--ds-font-family, Roboto, sans-serif);
    }

    .scan-status .icon {
      color: var(--md-sys-color-primary);
      font-size: 20px;
    }

    .scan-status .detail {
      color: var(--md-sys-color-on-surface);
    }
  `;

  @state() private activeRoute: AppRoute = DEFAULT_ROUTE;

  private handleNavSelect(event: CustomEvent<{ routeId: string }>) {
    const { routeId } = event.detail;
    if (isAppRoute(routeId)) {
      this.activeRoute = routeId;
    }
  }

  private renderActiveView() {
    const route = getRouteById(this.activeRoute);
    switch (route.id) {
      case 'overview':
        return html`<overview-view></overview-view>`;
      case 'largest-folders':
        return html`<largest-folders-view></largest-folders-view>`;
      case 'largest-files':
        return html`<largest-files-view></largest-files-view>`;
      case 'file-types':
        return html`<file-types-view></file-types-view>`;
      case 'cleanup-candidates':
        return html`<cleanup-candidates-view></cleanup-candidates-view>`;
      case 'exclusions':
        return html`<exclusions-view></exclusions-view>`;
      case 'settings':
        return html`<settings-view></settings-view>`;
      default:
        return html`<overview-view></overview-view>`;
    }
  }

  render() {
    const apiReady = typeof window.diskScope !== 'undefined';
    const route = getRouteById(this.activeRoute);

    return html`
      <ds-top-app-bar
        title="DiskScope"
        subtitle=${apiReady ? 'No scan target selected' : 'Waiting for preload API...'}
      ></ds-top-app-bar>

      <div class="body">
        <ds-nav-rail
          .routes=${APP_ROUTES}
          .activeRoute=${this.activeRoute}
          @ds-nav-select=${this.handleNavSelect}
        ></ds-nav-rail>

        <main class="content" aria-label=${route.label}>
          ${this.renderActiveView()}
        </main>
      </div>

      <footer class="scan-status" aria-label="Scan status">
        <span class="material-symbols-outlined icon" aria-hidden="true">progress_activity</span>
        <span>No scan in progress</span>
        <span class="detail">Scan progress will appear here during active scans.</span>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'disk-scope-app': DiskScopeApp;
  }
}
