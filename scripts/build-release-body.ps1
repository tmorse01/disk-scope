# Build GitHub Release body with download guide prepended.
param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [string]$OutputPath = "dist/release-body.md"
)

$ErrorActionPreference = "Stop"

$templatePath = Join-Path $PSScriptRoot "release-download-guide.md"
if (-not (Test-Path $templatePath)) {
    throw "Missing template: $templatePath"
}

$guide = (Get-Content $templatePath -Raw) -replace '\{\{VERSION\}\}', $Version
$parent = Split-Path $OutputPath -Parent
if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
}

Set-Content -Path $OutputPath -Value $guide.TrimEnd() -Encoding utf8
Write-Host "Release body written to $OutputPath"
