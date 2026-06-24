import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js';
import './index.css';
import './theme/material-theme.css';
import './app-root.js';
import './features/scan-picker/index.js';

const typescaleStyle = document.createElement('style');
typescaleStyle.textContent = typescaleStyles.cssText;
document.head.appendChild(typescaleStyle);

const appRoot = document.getElementById('app');

if (appRoot) {
  appRoot.innerHTML = `<disk-scope-app></disk-scope-app>`;
}
