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

    $stageScript = Join-Path $RepoRoot "scripts/stage-release-assets.ps1"
    & $stageScript -Version $Version -RepoRoot $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        throw "stage-release-assets.ps1 failed."
    }

    $manifestPath = Join-Path $RepoRoot "dist/release/upload-manifest.json"
    if (-not (Test-Path $manifestPath)) {
        throw "Upload manifest not found: $manifestPath"
    }

    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    return @{
        Directory = [string]$manifest.directory
        Files     = @($manifest.upload)
    }
}

function Get-GitHubActionsUrl {
    $remoteUrl = git remote get-url origin
    if ($remoteUrl -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)') {
        return "https://github.com/$($Matches.owner)/$($Matches.repo)/actions"
    }
    return "https://github.com (open your repo Actions tab)"
}

function Ensure-ReleaseTagOnRemote {
    param(
        [string]$RepoRoot,
        [string]$Tag
    )

    Set-Location $RepoRoot

    $head = git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "Could not resolve HEAD."
    }

    $existingLocal = git tag --list $Tag
    if ($existingLocal) {
        $tagCommit = git rev-parse $Tag
        if ($LASTEXITCODE -ne 0) {
            throw "Could not resolve local tag $Tag."
        }
        if ($tagCommit -ne $head) {
            throw "Tag $Tag exists locally at $tagCommit but HEAD is $head. Delete or move the tag before releasing."
        }
        Write-Host "Tag $Tag already exists locally on HEAD."
    }
    else {
        Write-Host "Creating tag $Tag on HEAD."
        git tag -a $Tag -m "Release $Tag"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create tag $Tag."
        }
    }

    $remoteTag = git ls-remote --tags origin "refs/tags/$Tag"
    if ($remoteTag) {
        Write-Host "Tag $Tag already exists on origin."
        return
    }

    Write-Host "Pushing $Tag to origin."
    git push origin $Tag
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push tag $Tag to origin."
    }
}

function Publish-TagForCi {
    param(
        [string]$RepoRoot,
        [string]$Tag
    )

    $remoteBefore = git ls-remote --tags origin "refs/tags/$Tag"
    Ensure-ReleaseTagOnRemote -RepoRoot $RepoRoot -Tag $Tag

    if ($remoteBefore) {
        Write-Host "If you need a rebuild, delete the remote tag and re-run, or push a new version."
    }
    else {
        Write-Host "Tag push triggers .github/workflows/release.yml."
    }
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

    Ensure-ReleaseTagOnRemote -RepoRoot $RepoRoot -Tag $Tag

    # Use --notes-file instead of --notes: PowerShell breaks embedded double quotes
    # in native command lines, which makes gh treat words like "code" as asset paths.
    $notesPath = Join-Path $RepoRoot "dist/release-notes-upload.md"
    $notesDir = Split-Path $notesPath -Parent
    if ($notesDir -and -not (Test-Path $notesDir)) {
        New-Item -ItemType Directory -Path $notesDir -Force | Out-Null
    }
    Set-Content -Path $notesPath -Value $ReleaseNotes -Encoding utf8

    $releaseArgs = @(
        "release", "create", $Tag,
        "--title", "DiskScope $Version",
        "--notes-file", $notesPath
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

$buildBodyScript = Join-Path $repoRoot "scripts/build-release-body.ps1"
& $buildBodyScript -Version $Version -OutputPath (Join-Path $repoRoot "dist/release-body.md")

$downloadGuide = Get-Content (Join-Path $repoRoot "dist/release-body.md") -Raw
$combinedNotes = if ($releaseNotes) { "$downloadGuide`n`n$releaseNotes" } else { $downloadGuide }

Publish-LocalRelease -RepoRoot $repoRoot -Tag $tag -Version $Version -AssetPaths $assets.Files -ReleaseNotes $combinedNotes -IsDraft:$Draft.IsPresent

Write-Host ""
Write-Host "Uploaded assets:"
foreach ($file in $assets.Files) {
    Write-Host "  $file"
}
