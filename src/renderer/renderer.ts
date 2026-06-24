import './index.css';
import './app-root';
import './features/scan-picker';

const appRoot = document.getElementById('app');

if (appRoot) {
  appRoot.innerHTML = `
    <disk-scope-app></disk-scope-app>
    <scan-target-picker></scan-target-picker>
  `;
}
