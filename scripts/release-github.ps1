# Build DiskScope for Windows and publish installable artifacts to GitHub Releases.
#
# Local publish (requires GitHub CLI: https://cli.github.com/):
#   .\scripts\release-github.ps1
#   .\scripts\release-github.ps1 -Version 0.2.0 -Notes "Bug fixes"
#
# CI publish (build runs on GitHub Actions; no local gh needed):
#   .\scripts\release-github.ps1 -CiOnly
#   git push origin v0.1.0   # if you tagged manually instead
#
# Options:
#   -CiOnly       Create/push tag only; GitHub Actions builds and uploads assets.
#   -SkipTests    Skip lint, typecheck, and unit tests before building.
#   -SkipBuild    Upload existing out/ artifacts (local publish mode only).
#   -Draft        Create a draft release.
#   -Notes        Release notes body (Markdown).
#   -NotesFile    Path to a Markdown file for release notes.

param(
    [string]$Version = "",
    [switch]$CiOnly,
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Draft,
    [string]$Notes = "",
    [string]$NotesFile = ""
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    $root = git rev-parse --show-toplevel 2>$null
    if (-not $root) {
        throw "Not inside a git repository."
    }
    return $root
}

function Get-PackageVersion {
    param([string]$RepoRoot)
    $packageJsonPath = Join-Path $RepoRoot "package.json"
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    return [string]$packageJson.version
}

function Assert-CommandExists {
    param(
        [string]$Name,
        [string]$InstallHint
    )
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required but was not found. $InstallHint"
    }
}

function Invoke-RepoCommand {
    param(
        [string]$WorkingDirectory,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Command
    )
    $display = $Command -join ' '
    Write-Host ">> $display"
    Push-Location $WorkingDirectory
    try {
        & $Command[0] $Command[1..($Command.Length - 1)]
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $display"
        }
    }
    finally {
        Pop-Location
    }
}

function Get-ReleaseNotes {
    param(
        [string]$RepoRoot,
        [string]$Tag,
        [string]$InlineNotes,
        [string]$NotesPath
    )

    if ($NotesPath) {
        $fullPath = if ([System.IO.Path]::IsPathRooted($NotesPath)) { $NotesPath } else { Join-Path $RepoRoot $NotesPath }
        if (-not (Test-Path $fullPath)) {
            throw "Notes file not found: $fullPath"
        }
        return Get-Content $fullPath -Raw
    }

    if ($InlineNotes) {
        return $InlineNotes
    }

    $previousTag = git describe --tags --abbrev=0 "HEAD~1" 2>$null
    if ($LASTEXITCODE -ne 0) {
        $previousTag = $null
    }
    if ($previousTag) {
        $log = git log "$previousTag..HEAD" --pretty=format:"- %s (%h)" 2>$null
        if ($log) {
            return "## What's changed`n`n$log"
        }
    }

    return "DiskScope $Tag - Windows installer and portable build."
}

function New-ReleaseAssets {
    param(
        [string]$RepoRoot,
        [string]$Version
    )

    $distDir = Join-Path $RepoRoot "dist/release"
    if (Test-Path $distDir) {
        Remove-Item $distDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null

    $setupSource = Get-ChildItem -Path (Join-Path $RepoRoot "out/make/squirrel.windows/x64") -Filter "*Setup.exe" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $setupSource) {
        throw "Squirrel installer not found. Run 'pnpm make' first or omit -SkipBuild."
    }

    $setupName = "DiskScope-$Version-Setup.exe"
    $setupTarget = Join-Path $distDir $setupName
    Copy-Item $setupSource.FullName $setupTarget

    $portableSource = Join-Path $RepoRoot "out/DiskScope-win32-x64"
    if (-not (Test-Path $portableSource)) {
        throw "Unpacked app folder not found at out/DiskScope-win32-x64. Run 'pnpm make' or 'pnpm package'."
    }

    $portableName = "DiskScope-$Version-win32-x64-portable.zip"
    $portableTarget = Join-Path $distDir $portableName
    if (Test-Path $portableTarget) {
        Remove-Item $portableTarget -Force
    }
    Compress-Archive -Path (Join-Path $portableSource "*") -DestinationPath $portableTarget -CompressionLevel Optimal

    $checksumLines = @()
    foreach ($asset in Get-ChildItem $distDir -File) {
        $hash = (Get-FileHash -Algorithm SHA256 $asset.FullName).Hash.ToLowerInvariant()
        $checksumLines += "$hash  $($asset.Name)"
    }
    $checksumPath = Join-Path $distDir "SHA256SUMS.txt"
    Set-Content -Path $checksumPath -Value ($checksumLines -join "`n") -NoNewline

    return @{
        Directory = $distDir
        Files     = Get-ChildItem $distDir -File | ForEach-Object { $_.FullName }
    }
}

function Get-GitHubActionsUrl {
    $remoteUrl = git remote get-url origin
    if ($remoteUrl -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)') {
        return "https://github.com/$($Matches.owner)/$($Matches.repo)/actions"
    }
    return "https://github.com (open your repo Actions tab)"
}

function Publish-TagForCi {
    param(
        [string]$RepoRoot,
        [string]$Tag
    )

    Set-Location $RepoRoot

    $existingLocal = git tag --list $Tag
    if ($existingLocal) {
        Write-Host "Tag $Tag already exists locally."
    }
    else {
        Write-Host "Creating tag $Tag on HEAD."
        git tag -a $Tag -m "Release $Tag"
    }

    $remoteTag = git ls-remote --tags origin "refs/tags/$Tag"
    if ($remoteTag) {
        Write-Host "Tag $Tag already exists on origin. Push skipped."
        Write-Host "If you need a rebuild, delete the remote tag and re-run, or push a new version."
        return
    }

    Write-Host "Pushing $Tag to origin (this triggers .github/workflows/release.yml)."
    git push origin $Tag
}

function Publish-LocalRelease {
    param(
        [string]$RepoRoot,
        [string]$Tag,
        [string]$Version,
        [string[]]$AssetPaths,
        [string]$ReleaseNotes,
        [bool]$IsDraft
    )

    Assert-CommandExists -Name "gh" -InstallHint "Install from https://cli.github.com/ and run 'gh auth login'."

    gh auth status | Out-Null

    $releaseArgs = @(
        "release", "create", $Tag,
        "--title", "DiskScope $Version",
        "--notes", $ReleaseNotes
    )

    if ($IsDraft) {
        $releaseArgs += "--draft"
    }

    foreach ($asset in $AssetPaths) {
        $releaseArgs += $asset
    }

    Write-Host "Creating GitHub release $Tag and uploading assets..."
    & gh @releaseArgs
    if ($LASTEXITCODE -ne 0) {
        throw "gh release create failed."
    }

    $viewUrl = gh release view $Tag --json url -q .url
    Write-Host "Release published: $viewUrl"
}

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

if (-not $Version) {
    $Version = Get-PackageVersion -RepoRoot $repoRoot
}

if ($Version -notmatch '^\d+\.\d+\.\d+(-[\w.-]+)?$') {
    throw "Version must look like semver (e.g. 0.1.0). Got: $Version"
}

$tag = "v$Version"
$packageVersion = Get-PackageVersion -RepoRoot $repoRoot
if ($packageVersion -ne $Version) {
    throw "Requested version '$Version' does not match package.json version '$packageVersion'. Update package.json first."
}

Write-Host "DiskScope release: $tag"

if ($CiOnly) {
    Publish-TagForCi -RepoRoot $repoRoot -Tag $tag
    Write-Host ""
    Write-Host "Done. Watch the release workflow at:"
    Write-Host "  $(Get-GitHubActionsUrl)"
    exit 0
}

$releaseNotes = Get-ReleaseNotes -RepoRoot $repoRoot -Tag $tag -InlineNotes $Notes -NotesPath $NotesFile

if (-not $SkipTests) {
    Invoke-RepoCommand -WorkingDirectory $repoRoot pnpm lint
    Invoke-RepoCommand -WorkingDirectory $repoRoot pnpm typecheck
    Invoke-RepoCommand -WorkingDirectory $repoRoot pnpm test
}

if (-not $SkipBuild) {
    Invoke-RepoCommand -WorkingDirectory $repoRoot pnpm build:native
    Invoke-RepoCommand -WorkingDirectory $repoRoot pnpm make
}

$assets = New-ReleaseAssets -RepoRoot $repoRoot -Version $Version
Publish-LocalRelease -RepoRoot $repoRoot -Tag $tag -Version $Version -AssetPaths $assets.Files -ReleaseNotes $releaseNotes -IsDraft:$Draft.IsPresent

Write-Host ""
Write-Host "Uploaded assets:"
foreach ($file in $assets.Files) {
    Write-Host "  $file"
}
