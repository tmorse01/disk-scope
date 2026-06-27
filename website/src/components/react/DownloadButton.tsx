import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { GITHUB } from '../../lib/site';
import { MaterialIcon } from './MaterialIcon';
import { WebsiteThemeProvider } from './WebsiteThemeProvider';

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
};

type DownloadButtonProps = {
  fallbackVersion: string;
  variant?: 'hero' | 'footer';
};

function findSetupAsset(assets: ReleaseAsset[]): ReleaseAsset | undefined {
  return assets.find((asset) => /^DiskScope-.*-Setup\.exe$/i.test(asset.name));
}

function DownloadButtonInner({ fallbackVersion, variant = 'hero' }: DownloadButtonProps) {
  const fallbackHref = `${GITHUB.releasesUrl}`;
  const [href, setHref] = useState(fallbackHref);
  const [versionLabel, setVersionLabel] = useState(`v${fallbackVersion}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestRelease(): Promise<void> {
      try {
        const response = await fetch(GITHUB.apiLatestRelease, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) {
          return;
        }
        const release = (await response.json()) as GitHubRelease;
        const setup = findSetupAsset(release.assets);
        if (cancelled) {
          return;
        }
        if (setup) {
          setHref(setup.browser_download_url);
        } else if (release.html_url) {
          setHref(release.html_url);
        }
        if (release.tag_name) {
          setVersionLabel(release.tag_name.startsWith('v') ? release.tag_name : `v${release.tag_name}`);
        }
      } catch {
        // Keep build-time fallback URL.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLatestRelease();
    return () => {
      cancelled = true;
    };
  }, []);

  const isHero = variant === 'hero';

  return (
    <Stack spacing={1.5} alignItems={isHero ? 'flex-start' : 'center'}>
      <Button
        component="a"
        href={href}
        variant="contained"
        color="primary"
        size="large"
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" aria-hidden />
          ) : (
            <MaterialIcon name="download" aria-hidden />
          )
        }
        aria-busy={loading}
      >
        Download for Windows
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px' }}>
        {versionLabel} · Free · MIT license
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <a href={GITHUB.releasesUrl} style={{ color: 'inherit' }}>
          Portable zip &amp; checksums on GitHub Releases
        </a>
      </Typography>
    </Stack>
  );
}

export default function DownloadButton(props: DownloadButtonProps) {
  return (
    <WebsiteThemeProvider>
      <DownloadButtonInner {...props} />
    </WebsiteThemeProvider>
  );
}
