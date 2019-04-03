#Set-ExecutionPolicy -ExecutionPolicy Bypass
function Enlist-UIRendering {
    $VerbosePreference = 'Continue'
    cd "$PSScriptRoot/../UI/"
    if ((test-path "$PSScriptRoot/../UI/Detector-UI-Rendering/dist") -eq $false) {
        Write-Host "Enlisting UI project from git..." -ForegroundColor Green
        git clone https://github.com/cindylovescoding/Detector-UI-Rendering.git
    }
    else {
        Write-Host "UI Project already exists. Skip enlistment." -ForegroundColor Cyan
    }
}

function System-Check {
    if (Get-Command node -errorAction SilentlyContinue) {
        $current_version = (node -v)
    }

    if (Get-Command npm -errorAction SilentlyContinue) {
        $npm_version = (npm -v)
    }
    
    write-host "Checking Node.js and Npm version before starting local development tool" -ForegroundColor Green

    if ($current_version -or ([System.Version]$current_version.Replace("v", "") -lt [System.Version]"8.0.0") -or $npm_version -or ($npm_version.Replace("v", "") -lt [System.Version]"5.0.0")) {
        write-host "Detected Node.js and Npm installed with versions:" -ForegroundColor Magenta
        write-host "`tNode.js version: $current_version" -ForegroundColor Cyan
        write-host "`tNpm version: $npm_version`n"  -ForegroundColor Cyan

        write-host "Intstalling http-server for local development tool" -ForegroundColor Green
        npm install http-server -g
    }
    else {
        write-host "Please make sure you have installed Node.js version 8.x (or greater), npm version 5.x (or greater)." -ForegroundColor Cyan
        $downloadsLink = "https://nodejs.org/en/download/"
        write-host $downloadsLink -ForegroundColor Cyan
        write-host "Please rerun this StartUp.cmd after you have installed Npm" -ForegroundColor red  
        exit
    }
}

function Copy-FrameworkDependencies {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $false)]
        [string]
        $buildPath = "\\reddog\Builds\branches\git_aapt_antares_websites_master\",

        [Parameter(Mandatory = $false)]
        [string]
        $buildChildPath = "\retail-amd64\hosting\Azure\GeoRegionService\DiagnosticRole\bin\Diagnostics.RuntimeHost",

        [Parameter(Mandatory = $false)]
        [string]
        $modelFileName = "\Diagnostics.ModelsAndUtils.dll",

        [Parameter(Mandatory = $false)]
        [string]
        $dpFileName = "\Diagnostics.DataProviders.dll",

        [Parameter(Mandatory = $false)]
        [string]
        $destinationPath = "$PSScriptRoot\..\References",

        [Parameter(Mandatory = $false)]
        [string]
        $versionFile = "$PSScriptRoot\..\References\RuntimeHostVersion.txt"
    )
    

    $VerbosePreference = 'Continue'

    if (test-path $buildPath ) {
        $latestBuild = (dir $buildPath | Sort {($_.LastWriteTime)} -Descending)[0].Name
        $secondLatestBuild = (dir $buildPath | Sort {($_.LastWriteTime)} -Descending)[1].Name
        $latestPath = $buildPath + $latestBuild + $buildChildPath
        $latestModelDll = $latestPath + $modelFileName
        $latestDPDll = $latestPath + $dpFileName 

        $secondLatestPath = $buildPath + $secondLatestBuild + $buildChildPath
        $secondLatestModelDll = $secondLatestPath + $modelFileName
        $secondLatestDPDll = $secondLatestPath + $dpFileName 

        if ((Test-Path $latestModelDll) -and (Test-Path $latestDPDll)) {
            Write-Host "Use the latest build $latestBuild" -ForegroundColor Magenta

        }
        else {
            if ((Test-Path $secondLatestModelDll) -and (Test-Path $secondLatestDPDll)) {
                Write-Host "Latest build is not ready yet, Get the second latest build $secondLatestBuild" -ForegroundColor Cyan
                $latestPath = $secondLatestPath
            }
        }


        [string] $existingVersion = ""

        if (test-Path $versionFile) {
            $existingVersion = Get-Content $versionFile -Raw -Force
        }

        if (([String]::IsNullOrEmpty($existingVersion)) -or ($existingVersion -contains $latestBuild)) {
            Write-Host "Copy dependency from $latestPath to $destinationPath" -ForegroundColor Cyan
            Copy-Item -Path $latestPath -Destination $destinationPath -Recurse -Force -ErrorAction SilentlyContinue  
            Write-Host "Copied dependencies successfully" -ForegroundColor Green
            
            Write-Host "Update the version file $versionFile with version: $latestBuild" -ForegroundColor Cyan
            if (-not ((Test-Path $versionFile))) {
                $null = New-Item $versionFile -Force
            }

            $latestBuild | Set-Content $versionFile
        }
        else {
            Write-Host "Same build version $latestBuild already exists. Skip Copying builds." -ForegroundColor Cyan
        }
    }
    else {
        Write-Error "Unable to get access to build path $buildPath, please check you Internet or VPN connection"
        exit 1
    }
}

Import-Module $PSScriptRoot\LocalDevelopingHelper.psm1 -Force

$logFile = "$PSScriptRoot\StartUp.log"

$VerbosePreference = "Continue"
$ErrorActionPreference = "Continue"

Start-Transcript -path $logFile

Enlist-UIRendering

# Prerequisite
System-Check

Write-Host "StartUp.cmd log file will be at: $logFile `n" -ForegroundColor Cyan
write-Host "Start preparing VS code `n" -ForegroundColor Green

# Rename package.txt into package.json
if (Test-Path "$($PSScriptRoot)\..\..\Detector\package.txt") {
    Move-Item -Path "$($PSScriptRoot)\..\..\Detector\package.txt" -Destination "$($PSScriptRoot)\..\..\Detector\package.json" -Force
}

# Preparign the reference region for detector csx
# a. Copy the references from latest reddog build
Copy-FrameworkDependencies

# b. Import references for detector references
$detectorCsxPath = "$($PSScriptRoot)\..\..\Detector\detector.csx"
Add-FrameworkReferences -filePath $detectorCsxPath

# Open csx in vscode
code "$($PSScriptRoot)\..\..\Detector\detector.csx" "$($PSScriptRoot)\..\..\Detector" 

Stop-Transcript -ErrorAction Ignore

