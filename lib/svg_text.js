const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const config = require('./config');

// Preload fonts
let fontPricedown = null;
let fontBebas = null;
let fontAnton = null;
let fontMontserrat = null;

try {
  fontPricedown = opentype.parse(fs.readFileSync(path.join(config.paths.fonts, 'pricedown.otf')));
} catch (e) { console.error('Failed to load pricedown font:', e); }

try {
  fontBebas = opentype.parse(fs.readFileSync(path.join(config.paths.fonts, 'BebasNeue-Regular.ttf')));
} catch (e) { console.error('Failed to load Bebas font:', e); }

try {
  fontAnton = opentype.parse(fs.readFileSync(path.join(config.paths.fonts, 'Anton-Regular.ttf')));
} catch (e) { console.error('Failed to load Anton font:', e); }

/**
 * Returns SVG path data for given text using the specified font
 */
function getTextPath(text, x, y, fontSize, fontType = 'bebas', options = {}) {
  let font = fontBebas;
  if (fontType === 'pricedown') font = fontPricedown;
  else if (fontType === 'anton') font = fontAnton;

  if (!font) return { pathData: '', width: 0 };

  const p = font.getPath(text, 0, 0, fontSize);
  const bbox = p.getBoundingBox();
  const textWidth = bbox.x2 - bbox.x1;

  let renderX = x;
  if (options.align === 'center') {
    renderX = x - textWidth / 2 - bbox.x1;
  } else if (options.align === 'right') {
    renderX = x - textWidth - bbox.x1;
  }

  const alignedPath = font.getPath(text, renderX, y, fontSize);
  return {
    pathData: alignedPath.toPathData(2),
    width: textWidth,
    height: bbox.y2 - bbox.y1
  };
}

module.exports = {
  getTextPath
};
