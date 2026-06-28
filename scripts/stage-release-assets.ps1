# Stage Electron Forge out/ artifacts for GitHub Release upload.
#
# Usage:
#   .\scripts\stage-release-assets.ps1 -Version 0.1.0
#   pnpm stage:release

param(
    [string]$Version = "",

    [string]$RepoRoot = "",
    [string]$OutputDir = "dist/release"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
    param([string]$Root)
    if ($Root) {
        return (Resolve-Path $Root).Path
    }
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if (-not $gitRoot) {
        throw "Not inside a git repository. Pass -RepoRoot explicitly."
    }
    return $gitRoot
}

function Format-ByteSize {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) {
        return "{0:N2} GB" -f ($Bytes / 1GB)
    }
    if ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    }
    if ($Bytes -ge 1KB) {
        return "{0:N2} KB" -f ($Bytes / 1KB)
    }
    return "$Bytes B"
}

$repoRoot = Resolve-RepoRoot -Root $RepoRoot

if (-not $Version) {
    $packageJsonPath = Join-Path $repoRoot "package.json"
    $Version = [string](Get-Content $packageJsonPath -Raw | ConvertFrom-Json).version
}

if ($Version -notmatch '^\d+\.\d+\.\d+(-[\w.-]+)?$') {
    throw "Version must look like semver (e.g. 0.1.0). Got: $Version"
}

$distDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
    $OutputDir
} else {
    Join-Path $repoRoot $OutputDir
}

$portableSource = Join-Path $repoRoot "out/DiskScope-win32-x64"
$portableExe = Join-Path $portableSource "DiskScope.exe"
$squirrelDir = Join-Path $repoRoot "out/make/squirrel.windows/x64"

Write-Host "Staging release assets for DiskScope $Version"
Write-Host "  Repo root: $repoRoot"

if (-not (Test-Path $portableExe)) {
    throw "Missing unpacked app: $portableExe`nRun 'pnpm build:native' and 'pnpm make' first."
}

$setupSource = Get-ChildItem -Path $squirrelDir -Filter "*Setup.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $setupSource) {
    throw "Missing Squirrel installer in $squirrelDir`nRun 'pnpm make' first."
}

Write-Host "Verified out/ build outputs:"
Write-Host "  $($setupSource.FullName) ($(Format-ByteSize $setupSource.Length))"
Write-Host "  $portableExe ($(Format-ByteSize (Get-Item $portableExe).Length))"

if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

$setupName = "DiskScope-$Version-Setup.exe"
$setupTarget = Join-Path $distDir $setupName
Copy-Item $setupSource.FullName $setupTarget

$releasesSource = Join-Path $squirrelDir "RELEASES"
if (-not (Test-Path $releasesSource)) {
    throw "Missing Squirrel RELEASES feed in $squirrelDir`nRun 'pnpm make' first."
}

$nupkgSources = Get-ChildItem -Path $squirrelDir -Filter "*.nupkg" -ErrorAction SilentlyContinue
if (-not $nupkgSources -or $nupkgSources.Count -eq 0) {
    throw "Missing Squirrel *.nupkg packages in $squirrelDir`nRun 'pnpm make' first."
}

$releasesTarget = Join-Path $distDir "RELEASES"
Copy-Item $releasesSource $releasesTarget

$nupkgTargets = @()
foreach ($nupkg in $nupkgSources) {
    $target = Join-Path $distDir $nupkg.Name
    Copy-Item $nupkg.FullName $target
    $nupkgTargets += $target
}

$portableName = "DiskScope-$Version-win32-x64-portable.zip"
$portableTarget = Join-Path $distDir $portableName
Compress-Archive -Path (Join-Path $portableSource "*") -DestinationPath $portableTarget -CompressionLevel Optimal

$assetManifest = @(
    @{
        Name    = $setupName
        Purpose = "Windows installer (Squirrel) - recommended download"
        Source  = $setupSource.FullName
    },
    @{
        Name    = "RELEASES"
        Purpose = "Squirrel update feed manifest (auto-update)"
        Source  = $releasesSource
    }
)

foreach ($nupkg in $nupkgSources) {
    $assetManifest += @{
        Name    = $nupkg.Name
        Purpose = "Squirrel update package (auto-update)"
        Source  = $nupkg.FullName
    }
}

$assetManifest += @(
    @{
        Name    = $portableName
        Purpose = "Portable build - unzip and run DiskScope.exe"
        Source  = $portableSource
    }
)

$checksumLines = @()
$assetLines = @(
    "DiskScope $Version release assets",
    "Staged from out/ on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    ""
)

foreach ($entry in $assetManifest) {
    $filePath = Join-Path $distDir $entry.Name
    $fileInfo = Get-Item $filePath
    $hash = (Get-FileHash -Algorithm SHA256 $filePath).Hash.ToLowerInvariant()
    $checksumLines += "$hash  $($entry.Name)"
    $assetLines += "$($entry.Name)  $(Format-ByteSize $fileInfo.Length)"
    $assetLines += "  Purpose: $($entry.Purpose)"
    $assetLines += "  Source:  $($entry.Source)"
    $assetLines += ""
}

$checksumPath = Join-Path $distDir "SHA256SUMS.txt"
Set-Content -Path $checksumPath -Value ($checksumLines -join "`n") -NoNewline

$assetsManifestPath = Join-Path $distDir "ASSETS.txt"
Set-Content -Path $assetsManifestPath -Value ($assetLines -join "`n") -Encoding utf8

Write-Host ""
Write-Host "Staged release assets in $distDir :"
Get-ChildItem $distDir -File | ForEach-Object {
    Write-Host ("  {0,-45} {1}" -f $_.Name, (Format-ByteSize $_.Length))
}

# Upload user-facing binaries, Squirrel feed assets, and checksums (exclude ASSETS.txt).
$uploadFiles = @(
    $setupTarget,
    $releasesTarget
) + $nupkgTargets + @(
    $portableTarget,
    $checksumPath
)

$manifestPath = Join-Path $distDir "upload-manifest.json"
@{
    version   = $Version
    directory = $distDir
    upload    = $uploadFiles
} | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding utf8

Write-Host ""
Write-Host "Upload manifest: $manifestPath"
