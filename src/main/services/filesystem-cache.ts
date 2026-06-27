import { spawn } from 'node:child_process';
import type { Result } from '../../shared/result';

export type FilesystemCacheError = {
  code: string;
  message: string;
};

const SYSTEM_MEMORY_LIST_INFORMATION = 80;

const POWERSHELL_FLUSH_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeMethods {
  [DllImport("ntdll.dll")]
  public static extern int NtSetSystemInformation(int SystemInformationClass, IntPtr SystemInformation, int SystemInformationLength);
}
"@
function Invoke-MemoryListCommand([int]$Command) {
  $size = [System.Runtime.InteropServices.Marshal]::SizeOf([Int32])
  $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($size)
  try {
    [System.Runtime.InteropServices.Marshal]::WriteInt32($ptr, $Command)
    return [NativeMethods]::NtSetSystemInformation(${SYSTEM_MEMORY_LIST_INFORMATION}, $ptr, $size)
  } finally {
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
  }
}
foreach ($cmd in @(1, 2, 4)) {
  $status = Invoke-MemoryListCommand $cmd
  if ($status -ne 0) { exit $status }
}
exit 0
`.trim();

function mapExitCodeToError(code: number | null, stderr: string): FilesystemCacheError {
  if (code === 5 || code === 3221225506) {
    return {
      code: 'ACCESS_DENIED',
      message:
        'Could not clear filesystem cache. Run DiskScope as Administrator for cold-scan benchmarks.',
    };
  }

  return {
    code: 'CACHE_FLUSH_FAILED',
    message: stderr.trim() || `Cache flush exited with code ${code ?? 'unknown'}`,
  };
}

export async function dropWindowsStandbyCache(): Promise<Result<void, FilesystemCacheError>> {
  if (process.platform !== 'win32') {
    return { ok: true, value: undefined };
  }

  return new Promise((resolve) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', POWERSHELL_FLUSH_SCRIPT],
      { windowsHide: true },
    );

    let stderr = '';

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        error: { code: 'SPAWN_FAILED', message: error.message },
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, value: undefined });
        return;
      }

      resolve({ ok: false, error: mapExitCodeToError(code, stderr) });
    });
  });
}
