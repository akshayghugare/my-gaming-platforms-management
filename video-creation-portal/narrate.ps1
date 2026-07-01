# Generates one WAV per scene via Windows SAPI, plus durations.json (seconds per scene id).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$root = $PSScriptRoot
$audioDir = Join-Path $root "audio"
if (-not (Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir | Out-Null }

$scenes = Get-Content (Join-Path $root "scenes.json") -Raw | ConvertFrom-Json

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Prefer the female Zira voice if present, else default.
$voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
if ($voices -contains "Microsoft Zira Desktop") { $synth.SelectVoice("Microsoft Zira Desktop") }
$synth.Rate = 0      # normal pace
$synth.Volume = 100

# Pin a known PCM format so duration = (fileBytes - 44) / byteRate is exact.
# 22050 Hz, 16-bit, mono  ->  byteRate = 22050 * 2 = 44100 bytes/sec
$sampleRate = 22050
$byteRate = $sampleRate * 2
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(`
    [System.Speech.AudioFormat.EncodingFormat]::Pcm, $sampleRate, 16, 1, $byteRate, 2, $null)

$durations = @{}
$i = 0
foreach ($scene in $scenes) {
    $idx = "{0:D2}" -f $i
    $wav = Join-Path $audioDir "scene-$idx.wav"
    $synth.SetOutputToWaveFile($wav, $fmt)
    $synth.Speak($scene.narration)
    $synth.SetOutputToNull()

    $len = (Get-Item $wav).Length
    $seconds = [math]::Round(($len - 44) / $byteRate, 3)
    $durations[$scene.id] = $seconds
    Write-Output ("{0}  {1,6}s  {2}" -f $idx, $seconds, $scene.id)
    $i++
}

$synth.Dispose()
$durations | ConvertTo-Json | Set-Content -Path (Join-Path $audioDir "durations.json") -Encoding utf8
Write-Output "DONE: $i narration clips -> $audioDir"
