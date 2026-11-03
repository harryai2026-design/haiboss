$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
$runtimeFile=Join-Path $root '.local/runtime-node.json'
if(Test-Path -LiteralPath $runtimeFile){$runtime=(Get-Content -LiteralPath $runtimeFile -Raw|ConvertFrom-Json).path}else{$runtime=(Get-Command node -ErrorAction Stop).Source}
if(-not(Test-Path -LiteralPath $runtime)){throw 'Configured Node runtime is missing. Use an installed Node 24 LTS runtime and update .local/runtime-node.json.'}
$major=[int]((& $runtime --version).TrimStart('v').Split('.')[0])
if($major -lt 22 -or $major -ge 25){throw 'Use Node 24 LTS (or supported Node 22) for the pinned Payload stack.'}
& $runtime --env-file-if-exists=.env scripts/dev.mjs
