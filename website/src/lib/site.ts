/** Site-wide constants for SEO and download links. */

export const SITE = {
  name: 'DiskScope',
  tagline: 'Cleanup-focused disk usage analyzer for developers and power users',
} as const;

export const GITHUB = {
  owner: 'tmorse01',
  repo: 'disk-scope',
  get repoUrl() {
    return `https://github.com/${this.owner}/${this.repo}`;
  },
  get releasesUrl() {
    return `${this.repoUrl}/releases/latest`;
  },
  get apiLatestRelease() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
  },
} as const;

export const SEO = {
  title: 'DiskScope — Free disk usage analyzer for Windows',
  description:
    'Free disk space analyzer for Windows. Find large folders, developer caches like node_modules, and safe cleanup targets — a modern WinDirStat alternative.',
  keywords: [
    'disk usage analyzer',
    'disk space analyzer windows',
    'free disk cleanup tool',
    'windirstat alternative',
    'wiztree alternative',
    'find large folders',
    'node_modules disk space',
    'developer disk analyzer',
  ],
} as const;

export const FEATURES = [
  {
    icon: 'folder_open',
    title: 'Largest folders first',
    description:
      'Scan any drive or folder and surface the biggest space hogs immediately — sortable tree tables with drilldown breadcrumbs.',
  },
  {
    icon: 'code',
    title: 'Developer-aware cleanup',
    description:
      'Spot node_modules, .next, dist, build outputs, package caches, and other repo artifacts with risk labels so you know what is safe to target.',
  },
  {
    icon: 'shield',
    title: 'Safe by default',
    description:
      'Reveal in Explorer, copy paths, exclude folders, and rescan — no reckless permanent delete in the app.',
  },
  {
    icon: 'speed',
    title: 'Fast, responsive scans',
    description:
      'Background scanning keeps the UI responsive with live progress, cancel support, and a clear completion summary.',
  },
] as const;

export const FAQ = [
  {
    question: 'Is DiskScope free?',
    answer:
      'Yes. DiskScope is free and open source under the MIT license. There is no subscription, account, or in-app purchase.',
  },
  {
    question: 'Is DiskScope a WinDirStat or WizTree alternative?',
    answer:
      'DiskScope focuses on the same job — showing where disk space goes — with a modern Material Design interface and developer-aware cleanup hints. It is a good fit if you want clearer cleanup targeting rather than only a treemap view.',
  },
  {
    question: 'What can I safely delete?',
    answer:
      'Cleanup candidates are labeled by risk. Low-risk items like build caches are usually safe to remove and regenerate. The app helps you identify targets; you always choose what to delete outside DiskScope.',
  },
  {
    question: 'Does DiskScope work on Mac or Linux?',
    answer:
      'The current release targets Windows 10 and later. macOS and Linux builds are not available yet.',
  },
  {
    question: 'Why does Windows SmartScreen warn about the installer?',
    answer:
      'Installers are not code-signed yet. Download from the official GitHub Releases page, verify SHA256 checksums when provided, and choose Run anyway if you trust the source.',
  },
  {
    question: 'Does DiskScope upload my files anywhere?',
    answer:
      'No. Scanning runs locally on your machine. DiskScope does not upload file lists or contents to the cloud.',
  },
] as const;
