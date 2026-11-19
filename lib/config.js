const path = require('path');

const linksDir = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\Admin\\AppData\\Local', 'Microsoft', 'WinGet', 'Links');
const ffmpegPkgDir = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Admin\\AppData\\Local',
  'Microsoft', 'WinGet', 'Packages',
  'yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'ffmpeg-N-127043-g5a54fcf75e-win64-gpl',
  'bin'
);

const currentPath = process.env.PATH || '';
if (!currentPath.includes(ffmpegPkgDir)) {
  process.env.PATH = `${linksDir};${ffmpegPkgDir};${currentPath}`;
}

module.exports = {
  paths: {
    root: path.resolve(__dirname, '..'),
    output: path.resolve(__dirname, '..', 'output'),
    temp: path.resolve(__dirname, '..', 'temp'),
    assets: path.resolve(__dirname, '..', 'assets'),
    fonts: path.resolve(__dirname, '..', 'assets', 'fonts'),
    overlays: path.resolve(__dirname, '..', 'assets', 'overlays'),
    audio: path.resolve(__dirname, '..', 'assets', 'audio'),
    lofi: path.resolve(__dirname, '..', 'assets', 'audio', 'lofi'),
  },
  bin: {
    ytdlp: path.join(linksDir, 'yt-dlp.exe'),
    ffmpeg: path.join(ffmpegPkgDir, 'ffmpeg.exe'),
    ffprobe: path.join(ffmpegPkgDir, 'ffprobe.exe'),
  },
  video: {
    width: 1080,
    height: 1920,
    fps: 60,
    crf: 17, // Crystal-clear quality
    preset: 'fast',
    swsFlags: 'lanczos+accurate_rnd',
  },
  audio: {
    lofiDefaultVolume: 0.08, // Subtle background volume
    lofiTrack: path.resolve(__dirname, '..', 'assets', 'audio', 'lofi', 'lofi_beat.mp3')
  },
  colors: {
    neonPink: '#FF007F',
    neonCyan: '#00F0FF',
    neonPurple: '#A000FF',
    neonYellow: '#FFE600',
    darkBg: '#0D0818',
  }
};
