const express = require('express');
const path = require('path');
const fs = require('fs');
const { getVideoInfo, getSubtitles, downloadSegment } = require('./lib/downloader');
const { findViralMoments } = require('./lib/ai_moments');
const { renderClip } = require('./lib/renderer');
const config = require('./lib/config');

const app = express();
const PORT = 3333;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(config.paths.output));

// In-memory cache for loaded video subtitles
let cachedSubtitles = {};

// API: Analyze video and return metadata + viral moments
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL do vídeo é obrigatória' });

    console.log(`[API] Analisando vídeo: ${url}`);
    const info = await getVideoInfo(url);
    const subtitles = await getSubtitles(url);
    cachedSubtitles[info.id] = subtitles;

    const viralMoments = findViralMoments(subtitles, { targetCount: 6 });

    res.json({
      success: true,
      info,
      moments: viralMoments,
      hasSubtitles: subtitles.length > 0
    });
  } catch (err) {
    console.error('[API] Erro ao analisar:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Render clip
app.post('/api/render', async (req, res) => {
  try {
    const {
      url,
      videoId,
      model = 'split',
      startSec,
      durationSec = 30,
      hookText,
      badgeText = 'GTA VI',
      channelTag = '@GTA6CORTES',
      newsTitle,
      newsCategory,
      lofiVolume = 0.08,
      fontName = 'Bebas Neue'
    } = req.body;

    if (!url || startSec === undefined) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const subtitles = cachedSubtitles[videoId] || [];
    const timestamp = Date.now();
    const clipFilename = `gta6_${model}_${startSec}s_${timestamp}.mp4`;
    const tempRawClip = path.join(config.paths.temp, `raw_${clipFilename}`);
    const finalOutputPath = path.join(config.paths.output, clipFilename);

    console.log(`[API] Baixando trecho de ${startSec}s (${durationSec}s)...`);
    await downloadSegment(url, startSec, durationSec, tempRawClip);

    console.log(`[API] Renderizando modelo: ${model}...`);
    await renderClip({
      inputVideoPath: tempRawClip,
      model,
      outputPath: finalOutputPath,
      subtitles,
      clipStartSec: parseFloat(startSec),
      clipDurationSec: parseFloat(durationSec),
      hookText: hookText || 'GTA 6 GAMEPLAY OFICIAL!',
      badgeText,
      channelTag,
      newsTitle: newsTitle || hookText || 'NOVA GAMEPLAY REVELADA DO GTA VI',
      newsCategory: newsCategory || 'ROCKSTAR NEWSWIRE • OFICIAL',
      lofiVolume: parseFloat(lofiVolume),
      fontName
    });

    try { fs.unlinkSync(tempRawClip); } catch (_) {}

    res.json({
      success: true,
      videoUrl: `/output/${clipFilename}`,
      filename: clipFilename
    });
  } catch (err) {
    console.error('[API] Erro ao renderizar:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: List generated clips
app.get('/api/clips', (req, res) => {
  try {
    fs.mkdirSync(config.paths.output, { recursive: true });
    const files = fs.readdirSync(config.paths.output)
      .filter(f => f.endsWith('.mp4'))
      .map(f => {
        const stats = fs.statSync(path.join(config.paths.output, f));
        return {
          filename: f,
          url: `/output/${f}`,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(1),
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ clips: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🌴 GTA 6 VIRAL CLIPPER STUDIO INICIADO!
🌐 Acesse no seu navegador: http://localhost:${PORT}
  `);
});
