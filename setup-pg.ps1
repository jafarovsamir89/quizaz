$pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-14.10-1-windows-x64-binaries.zip"
$zipPath = "$env:TEMP\pgsql.zip"
$extractPath = "c:\quizaz\pgsql"

if (-not (Test-Path $extractPath)) {
    Write-Host "Downloading PostgreSQL..."
    Invoke-WebRequest -Uri $pgUrl -OutFile $zipPath
    Write-Host "Extracting PostgreSQL..."
    Expand-Archive -Path $zipPath -DestinationPath "c:\quizaz" -Force
}

$pgBin = "c:\quizaz\pgsql\bin"
$pgData = "c:\quizaz\pgsql\data"

if (-not (Test-Path $pgData)) {
    Write-Host "Initializing Database..."
    & "$pgBin\initdb.exe" -D $pgData -U postgres -A trust
}

Write-Host "Starting PostgreSQL..."
Start-Process -FilePath "$pgBin\pg_ctl.exe" -ArgumentList "-D $pgData -l c:\quizaz\pgsql\logfile start" -NoNewWindow

Start-Sleep -Seconds 3

Write-Host "Creating bilikarena database..."
& "$pgBin\createdb.exe" -U postgres bilikarena

Write-Host "PostgreSQL is running!"
