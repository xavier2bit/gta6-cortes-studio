const { spawnSync } = require('child_process');
const config = require('./lib/config');

// Test loudnorm on hd_clip.mp4
const res = spawnSync(config.bin.ffmpeg, [
  '-y',
  '-i', 'hd_clip.mp4',
  '-i', config.audio.lofiTrack,
  '-filter_complex', `
    [0:a]volume=1.2[voice];
    [1:a]aloop=loop=-1:size=2e+09,volume=0.08,afade=t=in:ss=0:d=1,afade=t=out:st=13.8:d=1.2[lofi];
    [voice][lofi]amix=inputs=2:duration=first:dropout_transition=2[mixed];
    [mixed]loudnorm=I=-16.0:TP=-1.0:LRA=11.0:print_format=json[a_out]
  `.trim(),
  '-map', '[a_out]',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-t', '15',
  'temp/test_audio_loudnorm.m4a'
]);

console.log('Audio test exit code:', res.status);
const stderr = res.stderr.toString();
const jsonMatch = stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
if (jsonMatch) {
  console.log('Loudness measurement:');
  console.log(jsonMatch[0]);
}
