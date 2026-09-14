Add-Type -AssemblyName System.Drawing
$outputDirectory = Join-Path $PSScriptRoot 'dist/images'
$invariant = [System.Globalization.CultureInfo]::InvariantCulture

function Format-Number([double]$value) {
    return $value.ToString('0.###', $invariant)
}

function New-Lettering([string]$content, [double]$x, [double]$y, [double]$width, [double]$height, [string]$color, [string]$family = 'Arial', [int]$style = 1) {
    $font = [System.Drawing.FontFamily]::new($family)
    $outline = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $outline.AddString($content, $font, $style, 100, [System.Drawing.PointF]::new(0, 0), [System.Drawing.StringFormat]::GenericTypographic)
    $bounds = $outline.GetBounds()
    $points = $outline.PathPoints
    $types = $outline.PathTypes
    $commands = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt $points.Length; $i++) {
        $type = $types[$i] -band 7
        $point = (Format-Number $points[$i].X) + ' ' + (Format-Number $points[$i].Y)
        if ($type -eq 0) { $commands.Add('M' + $point) }
        elseif ($type -eq 1) { $commands.Add('L' + $point) }
        elseif ($type -eq 3) {
            $commands.Add('C' + $point + ' ' + (Format-Number $points[$i + 1].X) + ' ' + (Format-Number $points[$i + 1].Y) + ' ' + (Format-Number $points[$i + 2].X) + ' ' + (Format-Number $points[$i + 2].Y))
            $i += 2
        }
        if (($types[$i] -band 128) -ne 0) { $commands.Add('Z') }
    }
    $transform = 'translate(' + $x + ' ' + $y + ') scale(' + (Format-Number ($width / $bounds.Width)) + ' ' + (Format-Number ($height / $bounds.Height)) + ') translate(' + (Format-Number (-$bounds.X)) + ' ' + (Format-Number (-$bounds.Y)) + ')'
    $result = '<path fill="' + $color + '" transform="' + $transform + '" d="' + ($commands -join '') + '"/>'
    $outline.Dispose()
    $font.Dispose()
    return $result
}

# Outlined lettering stays crisp and does not depend on fonts or raster images.
$wellington = @(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 186" role="img" aria-labelledby="title"><title id="title">Wellington José 4479 — candidato a deputado federal</title>'
    (New-Lettering 'Wellington' 2 3 454 70 '#f5f8ff')
    (New-Lettering 'José' 2 83 163 76 '#f5f8ff')
    (New-Lettering '4479' 177 83 279 76 '#ffda48' 'Arial' 3)
    (New-Lettering 'CANDIDATO A DEPUTADO FEDERAL' 3 171 450 13 '#c2d4ec')
    '</svg>'
) -join "`n"
$canella = @(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 186" role="img" aria-labelledby="title"><title id="title">Márcio Canella 44444 — candidato a deputado estadual</title>'
    (New-Lettering 'Márcio' 65 2 175 27 '#f5f8ff')
    (New-Lettering 'CANELLA' 3 39 298 52 '#f5f8ff')
    (New-Lettering '44444' 3 100 298 59 '#f5f8ff' 'Arial' 3)
    (New-Lettering 'DEPUTADO ESTADUAL' 5 171 294 13 '#c2d4ec')
    '</svg>'
) -join "`n"
[System.IO.File]::WriteAllText((Join-Path $outputDirectory 'wellington-wordmark.svg'), $wellington, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $outputDirectory 'canella-wordmark.svg'), $canella, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Created two transparent SVG wordmarks with outlined lettering.'
