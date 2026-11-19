const sharp = require('sharp');

async function testGameplayCropPerfect() {
  const input = 'temp/frames_analysis/raw_frame_7s.jpg';
  
  // Crop without any webcam bleed, keeping Lucia perfectly centered
  // 1080x960 aspect ratio is 9:8 (1.125)
  // At height 835, width is 835 * 1.125 = 939.375 -> 940px
  // left: 130 to 1070, top: 245 to 1080
  await sharp(input)
    .extract({ left: 130, top: 245, width: 940, height: 835 })
    .resize(1080, 960)
    .toFile('temp/frames_analysis/crop_lucia_perfect.jpg');

  console.log('Saved crop_lucia_perfect.jpg');
}

testGameplayCropPerfect().catch(console.error);
