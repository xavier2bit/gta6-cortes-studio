const config = require('./lib/config');
const { spawnSync } = require('child_process');
const fs = require('fs');

fs.mkdirSync('temp/frames_analysis', { recursive: true });
[0, 2, 7, 12].forEach(sec => {
  spawnSync(config.bin.ffmpeg, [
    '-y', '-ss', String(sec), '-i', 'hd_clip.mp4', '-vframes', '1',
    `temp/frames_analysis/raw_frame_${sec}s.jpg`
  ]);
});
console.log('Frames extracted:');
fs.readdirSync('temp/frames_analysis').forEach(f => console.log(f));
