param(
  [string]$ProjectRef = "hniimfwovqqjfdwoixae"
)

$ErrorActionPreference = "Stop"

Write-Host "Paste a Supabase access token beginning with sbp_. The token will not be displayed."
$secureToken = Read-Host "Supabase access token" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)

try {
  $env:SUPABASE_ACCESS_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}

try {
  if ($env:SUPABASE_ACCESS_TOKEN -notmatch '^sbp_[A-Za-z0-9]{40}$') {
    throw "Invalid token format. Paste only the complete Supabase access token beginning with sbp_."
  }

  $projectRoot = Split-Path -Parent $PSScriptRoot
  Push-Location $projectRoot
  try {
    $functions = @(
      "admin-create-user",
      "create-passenger-reservation",
      "create-payment-intent",
      "generate-ai-text",
      "notify-large-cargo-approval",
      "telegram-webhook"
    )

    foreach ($function in $functions) {
      Write-Host "Deploying $function..." -ForegroundColor Cyan
      npx.cmd supabase functions deploy $function --no-verify-jwt --project-ref $ProjectRef
      if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed for $function."
      }
    }

    Write-Host "All production functions deployed successfully." -ForegroundColor Green
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
}
