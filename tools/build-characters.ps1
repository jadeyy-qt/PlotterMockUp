<#
  Builds the character library used by blank_workspace.html.

  Run this after adding / renaming / removing images in images\characters\<Name>\ :
      powershell -ExecutionPolicy Bypass -File tools\build-characters.ps1

  It writes:
    images\characters\characters.js     -> list of characters, poses and friendly names
    images\characters\_thumbs\...       -> small cropped previews (fast to load)

  Each sub-folder of images\characters is one character (folder name = display name).
  Every image inside it is one pose / expression of that character.
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root     = Split-Path -Parent $PSScriptRoot
$charDir  = Join-Path $root 'images\characters'
$thumbDir = Join-Path $charDir '_thumbs'
$outFile  = Join-Path $charDir 'characters.js'
$ThumbHeight = 360

# ---------- friendly names ----------
# Words in file names that should read differently. Add your own here.
$WordMap = @{
  'handonheadphone'   = 'hand on headphones'
  'handonheadphones'  = 'hand on headphones'
  'phoneonhand'       = 'phone in hand'
  'onehanddown'       = 'one hand down'
  'eyedown'           = 'looking down'
  'eyesdown'          = 'looking down'
  'checkingattumbler' = 'checking tumbler'
  'holdingtumbler'    = 'holding tumbler'
  'embarassed'        = 'embarrassed'
  'noenter'           = 'no entry'
  'up'                = 'arm up'
  'down'              = 'arm down'
}
# Words that describe an expression (shown as the main name; everything else becomes the pose detail).
$Emotions = @('normal','neutral','amused','curious','embarrassed','embarassed','teasing','concerned','serious','smirk',
              'pleased','squint','yawn','happy','mad','angry','sad','approved','thinking','focused','reading','writing',
              'stop','noenter','surprised','shocked','smile','smiling','laugh','laughing','worried','scared','confused',
              'tired','annoyed','excited','proud','shy','crying','checkingattumbler')
$DefaultWords = @('normal','neutral')

function Split-Tokens([string]$name){
  $n = [regex]::Replace($name, '([a-z0-9])([A-Z])', '$1-$2')         # GuardNoEnter -> Guard-No-Enter
  return @($n.ToLower() -split '[-_ .]+' | Where-Object { $_ -ne '' })
}
function Title([string]$s){ if(-not $s){ return '' }; return $s.Substring(0,1).ToUpper() + $s.Substring(1) }

# ---------- bounding box of the drawn pixels ----------
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class CharBox {
  // returns x,y,w,h of pixels that are neither transparent nor near-white
  public static int[] Find(Bitmap bmp){
    var rect = new Rectangle(0,0,bmp.Width,bmp.Height);
    var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int stride = data.Stride, w = bmp.Width, h = bmp.Height;
    byte[] px = new byte[stride*h];
    Marshal.Copy(data.Scan0, px, 0, px.Length);
    bmp.UnlockBits(data);
    int minX=w, minY=h, maxX=-1, maxY=-1;
    for(int y=0;y<h;y+=2){ int row=y*stride;
      for(int x=0;x<w;x+=2){ int i=row+x*4;
        byte b=px[i], g=px[i+1], r=px[i+2], a=px[i+3];
        if(a>16 && !(r>240 && g>240 && b>240)){
          if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } }
    if(maxX<0) return new int[]{0,0,w,h};
    return new int[]{minX,minY,maxX-minX+2,maxY-minY+2};
  }
}
'@

function Encode-Path([string]$p){ return (($p -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/' }
function Js([string]$s){ return '"' + ($s -replace '\\','\\' -replace '"','\"') + '"' }

if(Test-Path $thumbDir){ Remove-Item $thumbDir -Recurse -Force }
New-Item -ItemType Directory -Force $thumbDir | Out-Null

$library = @()
$folders = Get-ChildItem $charDir -Directory | Where-Object { $_.Name -ne '_thumbs' } | Sort-Object Name
foreach($folder in $folders){
  $files = @(Get-ChildItem $folder.FullName -File | Where-Object { $_.Extension -match '^\.(png|jpe?g|webp)$' } | Sort-Object Name)
  if($files.Count -eq 0){ continue }
  Write-Host "- $($folder.Name): $($files.Count) image(s)"

  # union bounding box over all poses so switching poses never shifts the character
  $minX=[int]::MaxValue; $minY=[int]::MaxValue; $maxX=0; $maxY=0; $iw=0; $ih=0
  foreach($f in $files){
    $bmp = [System.Drawing.Bitmap]::new($f.FullName)
    $b = [CharBox]::Find($bmp); $iw=$bmp.Width; $ih=$bmp.Height; $bmp.Dispose()
    $minX=[Math]::Min($minX,$b[0]); $minY=[Math]::Min($minY,$b[1])
    $maxX=[Math]::Max($maxX,$b[0]+$b[2]); $maxY=[Math]::Max($maxY,$b[1]+$b[3])
  }
  $pad = [int]([Math]::Max($maxX-$minX, $maxY-$minY) * 0.02)
  $cx=[Math]::Max(0,$minX-$pad); $cy=[Math]::Max(0,$minY-$pad)
  $cw=[Math]::Min($iw,$maxX+$pad)-$cx; $ch=[Math]::Min($ih,$maxY+$pad)-$cy

  # tokens, minus words shared by every file in the folder (e.g. "justin-", "suzy-holdingtumbler-", "-b")
  $tok = @{}; foreach($f in $files){ $tok[$f.Name] = Split-Tokens $f.BaseName }
  $lists = @($files | ForEach-Object { ,$tok[$_.Name] })
  $pre = 0; $suf = 0
  if($files.Count -gt 1){
    $minLen = ($lists | ForEach-Object { $_.Count } | Measure-Object -Minimum).Minimum
    while($pre -lt $minLen-1 -and (@($lists | ForEach-Object { $_[$pre] } | Select-Object -Unique).Count -eq 1)){ $pre++ }
    while($suf -lt $minLen-$pre-1 -and (@($lists | ForEach-Object { $_[$_.Count-1-$suf] } | Select-Object -Unique).Count -eq 1)){ $suf++ }
  }

  $sub = Join-Path $thumbDir $folder.Name
  New-Item -ItemType Directory -Force $sub | Out-Null
  $poses = @(); $defaultIdx = 0; $seen = @{}
  for($i=0; $i -lt $files.Count; $i++){
    $f = $files[$i]; $t = $tok[$f.Name]
    $core = @(if($files.Count -gt 1){ $t[$pre..($t.Count-1-$suf)] } else { $t })
    $joined = ($core -join '')
    # merge split phrases back ("no","enter" -> "noenter") before mapping
    $words = @(); $k=0
    while($k -lt $core.Count){
      if($k+1 -lt $core.Count -and $WordMap.ContainsKey($core[$k]+$core[$k+1])){ $words += ($core[$k]+$core[$k+1]); $k+=2 }
      else { $words += $core[$k]; $k++ }
    }
    $emo = $words | Where-Object { $Emotions -contains $_ } | Select-Object -First 1
    $rest = @($words | Where-Object { $_ -ne $emo })
    $map = { param($w) if($WordMap.ContainsKey($w)){ $WordMap[$w] } else { $w -replace '^([a-z]+)(\d+)$','$1 $2' } }   # pose4 -> pose 4
    if($emo){
      $label  = Title (& $map $emo)
      $detail = ($rest | ForEach-Object { Title (& $map $_) }) -join (' ' + [char]0x00B7 + ' ')
    } else {
      $label  = Title ((($words | ForEach-Object { & $map $_ }) -join ' '))
      $detail = ''
    }
    if(-not $label){ $label = Title $f.BaseName }
    $key = "$label|$detail"; if($seen.ContainsKey($key)){ $seen[$key]++; $detail = (($detail + ' ' + $seen[$key]).Trim()) } else { $seen[$key]=1 }
    if(($DefaultWords -contains $emo) -and -not $rest.Count -and $defaultIdx -eq 0){ $defaultIdx = $i }

    # thumbnail: cropped to the character frame
    $bmp = [System.Drawing.Bitmap]::new($f.FullName)
    $tw = [int]([double]$cw / $ch * $ThumbHeight)
    $th = New-Object System.Drawing.Bitmap $tw, $ThumbHeight
    $g = [System.Drawing.Graphics]::FromImage($th)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode='HighQuality'; $g.PixelOffsetMode='HighQuality'
    $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0,0,$tw,$ThumbHeight), (New-Object System.Drawing.Rectangle $cx,$cy,$cw,$ch), 'Pixel')
    $g.Dispose(); $bmp.Dispose()
    $thumbName = [IO.Path]::ChangeExtension($f.Name, '.png')
    $th.Save((Join-Path $sub $thumbName), [System.Drawing.Imaging.ImageFormat]::Png); $th.Dispose()

    $poses += "      { label: $(Js $label), detail: $(Js $detail), src: $(Js ('images/characters/' + (Encode-Path "$($folder.Name)/$($f.Name)"))), thumb: $(Js ('images/characters/_thumbs/' + (Encode-Path "$($folder.Name)/$thumbName"))), file: $(Js $f.Name) }"
  }
  # if no plain "normal/neutral" pose exists, fall back to the first file that contains one
  if($defaultIdx -eq 0){
    for($i=0;$i -lt $files.Count;$i++){ if(@($tok[$files[$i].Name] | Where-Object { $DefaultWords -contains $_ }).Count){ $defaultIdx=$i; break } }
  }
  $library += @"
  {
    name: $(Js $folder.Name),
    crop: { x: $cx, y: $cy, w: $cw, h: $ch, imgW: $iw, imgH: $ih },
    defaultPose: $defaultIdx,
    poses: [
$($poses -join ",`n")
    ]
  }
"@
}

$js = "/* Generated by tools/build-characters.ps1 - re-run it after changing images/characters. */`nwindow.CHARACTER_LIBRARY = [`n" + ($library -join ",`n") + "`n];`n"
[IO.File]::WriteAllText($outFile, $js, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Wrote $outFile ($($library.Count) characters)"
