const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testFFmpegSplit() {
  const inputVideo = 'hd_clip.mp4';
  const overlayPink = 'assets/brand/processed/overlay_vice_pink.png';
  const outVideo = 'temp/test_ffmpeg_split_vice_pink.mp4';

  const filter = [
    `[0:v]crop=iw*0.22:ih*0.22:iw*0.015:ih*0.02,scale=817:650:flags=lanczos[cam_fit]`,
    `[0:v]crop=iw*0.50:ih*0.77:iw*0.07:ih*0.23,scale=817:663:flags=lanczos[game_fit]`,
    `color=c=#0A0612:s=1080x1920:r=60[bg]`,
    `[bg][cam_fit]overlay=131:347[bg_cam]`,
    `[bg_cam][game_fit]overlay=131:1004[bg_cam_game]`,
    `[bg_cam_game][1:v]overlay=0:0[v_out]`
  ].join(';');

  const args = [
    '-y',
    '-ss', '600',
    '-t', '5', // 5 seconds test
    '-i', inputVideo,
    '-i', overlayPink,
    '-filter_complex', filter,
    '-map', '[v_out]',
    '-map', '0:a?',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    outVideo
  ];

  console.log('Rendering 5s test in FFmpeg...');
  const ff = spawn('ffmpeg', args);
  ff.stderr.on('data', d => {});
  ff.on('close', code => {
    console.log(`FFmpeg exited with code ${code}`);
    if (code === 0) {
      console.log('Success! Saved temp/test_ffmpeg_split_vice_pink.mp4');
    }
  });
}

testFFmpegSplit();
