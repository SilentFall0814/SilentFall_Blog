$backendDir = "e:\Project\Web_Project\SilentFall_Blog\Backend"

# Get all non-Java files that might contain references
$configFiles = Get-ChildItem -Path $backendDir -Include "*.xml","*.yml","*.yaml","*.properties","*.txt" -Recurse

$count = 0
foreach ($file in $configFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content

    # Step 1: Replace Maven groupId
    $content = $content -replace 'cc\.feitwnd', 'cc.silentfall'

    # Step 2: Replace main class reference in pom.xml
    $content = $content -replace 'cc\.feitwnd\.FeiTwndBackendApplication', 'com.silentfall.blog.SilentFallBlogApplication'

    # Step 3: Replace FeiTwnd in artifactId and other places
    $content = $content -replace 'FeiTwnd', 'SilentFall'

    # Step 4: Replace lowercase feitwnd
    $content = $content -replace 'feitwnd', 'silentfall'

    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $count++
        Write-Output "Modified: $($file.FullName)"
    }
}

Write-Output "Total modified config files: $count"
