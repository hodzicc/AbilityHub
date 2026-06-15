# Pokrece cijeli AbilityHub stack: DB/MQ (Docker), BE servisi (dotnet run), FE (npm run dev)
# Pokrenuti iz root foldera projekta: .\start-all.ps1

$root = $PSScriptRoot

Write-Host "1/3 Pokrecem SQL Server i RabbitMQ (Docker)..." -ForegroundColor Cyan
Push-Location "$root\BE"
docker compose up -d sqlserver rabbitmq
Pop-Location

Write-Host "Cekam da SQL Server / RabbitMQ budu spremni (15s)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "2/3 Pokrecem backend servise (svaki u novom prozoru)..." -ForegroundColor Cyan

$services = @(
    @{ Name = "Auth";        Path = "$root\BE\Services\AbilityHub.Auth" },
    @{ Name = "Users";       Path = "$root\BE\Services\AbilityHub.Users" },
    @{ Name = "AppRegistry"; Path = "$root\BE\Services\AbilityHub.AppRegistry" },
    @{ Name = "Settings";    Path = "$root\BE\Services\AbilityHub.Settings" },
    @{ Name = "Usage";       Path = "$root\BE\Services\AbilityHub.Usage" },
    @{ Name = "Gateway";     Path = "$root\BE\Gateway\AbilityHub.Gateway" }
)

foreach ($svc in $services) {
    $title = "AbilityHub - $($svc.Name)"
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$title'; cd '$($svc.Path)'; `$env:ASPNETCORE_ENVIRONMENT='Development'; dotnet run"
    )
    Start-Sleep -Seconds 2
}

Write-Host "3/3 Pokrecem frontend (npm run dev)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'AbilityHub - FE'; cd '$root\FE'; npm run dev"
)

Write-Host ""
Write-Host "Sve pokrenuto:" -ForegroundColor Green
Write-Host "  - DB (SQL Server): localhost:1433"
Write-Host "  - RabbitMQ UI:     http://localhost:15672 (abilityhub / abilityhub123)"
Write-Host "  - Gateway API:     http://localhost:5046"
Write-Host "  - Frontend:        http://localhost:3000"
