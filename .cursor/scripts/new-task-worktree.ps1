# Create an isolated git worktree for a DiskScope task deck mate.
# Usage: .cursor/scripts/new-task-worktree.ps1 -TaskNum 003 -ShortName material-shell
#        .cursor/scripts/new-task-worktree.ps1 003 material-shell

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$TaskNum,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$ShortName,

    [string]$BaseBranch = "master"
)

$ErrorActionPreference = "Stop"

$RepoRoot = git rev-parse --show-toplevel
if (-not $RepoRoot) {
    Write-Error "Not inside a git repository."
}

Set-Location $RepoRoot

$Branch = "task/$TaskNum-$ShortName"
$WorktreePath = Join-Path $RepoRoot ".worktrees/task-$TaskNum"

if (Test-Path $WorktreePath) {
    Write-Host "Worktree already exists: $WorktreePath"
    git worktree list
    exit 0
}

$BranchExists = git show-ref --verify --quiet "refs/heads/$Branch"
if ($BranchExists) {
    Write-Host "Branch exists; adding worktree for existing branch $Branch"
    git worktree add $WorktreePath $Branch
} else {
    Write-Host "Creating branch $Branch from $BaseBranch"
    git worktree add $WorktreePath -b $Branch $BaseBranch
}

Write-Host "Ready: $WorktreePath on $Branch"
git worktree list
