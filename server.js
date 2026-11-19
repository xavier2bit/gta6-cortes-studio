const express = require('express');
const path = require('path');
const fs = require('fs');
const { getVideoInfo, getSubtitles, downloadSegment } = require('./lib/downloader');
const { findViralMoments } = require('./lib/ai_moments');
const { renderClip } = require('./lib/renderer');
const { inspectVideoQA, generateContactSheet } = require('./lib/qa_checker');
const config = require('./lib/config');

const app = express();
const PORT = 3333;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(config.paths.output));
app.use('/assets', express.static(config.paths.assets));

let cachedSubtitles = {};

// 1. API: Get & Update Brand Settings
app.get('/api/brand', (req, res) => {
  try {
    const brand = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand.json'), 'utf8'));
    res.json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/brand', (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand.json'), 'utf8'));
    const updated = { ...current, ...req.body };
    fs.writeFileSync(path.join(__dirname, 'brand.json'), JSON.stringify(updated, null, 2), 'utf8');
    config.brand = updated;
    res.json({ success: true, brand: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. API: Analyze video and return metadata + viral moments
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

// 3. API: Render clip with V2 intelligent controls & QA checks
app.post('/api/render', async (req, res) => {
  try {
    const brand = config.brand || require('./brand.json');
    const {
      url,
      videoId,
      model = 'split',
      startSec,
      durationSec = 15,
      hookText,
      badgeText = brand.display_name,
      channelTag = brand.handle,
      newsTitle,
      newsCategory = 'GG NO CHAT • ANÁLISE EDITORIAL',
      lofiVolume = 0.08,
      fontName = 'Bebas Neue',
      framePreset = 'no_frame',
      pipMode = false,
      gameplayCrop = { x: 0.07, y: 0.23, w: 0.50, h: 0.77 }
    } = req.body;

    if (!url && !fs.existsSync('hd_clip.mp4')) {
      return res.status(400).json({ error: 'URL ou vídeo fonte não encontrado' });
    }

    const subtitles = (videoId && cachedSubtitles[videoId]) ? cachedSubtitles[videoId] : [];
    const timestamp = Date.now();
    const clipFilename = `v2_${model}_${startSec || 600}s_${timestamp}.mp4`;
    const tempRawClip = path.join(config.paths.temp, `raw_${clipFilename}`);
    const finalOutputPath = path.join(config.paths.output, clipFilename);

    let sourcePath = tempRawClip;

    // Use local HD clip if url is Davy Jones test clip and hd_clip.mp4 exists
    if (fs.existsSync('hd_clip.mp4') && (!url || url.includes('chge7GrCNc0'))) {
      sourcePath = path.resolve('hd_clip.mp4');
      console.log(`[API] Utilizando clipe HD local pré-carregado: ${sourcePath}`);
    } else {
      console.log(`[API] Baixando trecho de ${startSec}s (${durationSec}s)...`);
      await downloadSegment(url, parseFloat(startSec), parseFloat(durationSec), tempRawClip);
    }

    console.log(`[API V2] Renderizando modelo: ${model} com normalização -16 LUFS...`);
    await renderClip({
      inputVideoPath: sourcePath,
      model,
      outputPath: finalOutputPath,
      subtitles,
      clipStartSec: parseFloat(startSec || 600),
      clipDurationSec: parseFloat(durationSec || 15),
      hookText: hookText || 'LUCIA NA CELA: "CARACA, QUE ISSO?"',
      badgeText: badgeText || brand.display_name,
      channelTag: channelTag || brand.handle,
      newsTitle: newsTitle || hookText || 'LUCIA NA CELA: DETALHES DE LEONIDA',
      newsCategory,
      lofiVolume: parseFloat(lofiVolume),
      fontName,
      framePreset,
      pipMode,
      gameplayCrop
    });

    if (sourcePath === tempRawClip) {
      try { fs.unlinkSync(tempRawClip); } catch (_) {}
    }

    // Run automated QA check
    console.log(`[API V2] Executando auditoria QA e gerando Contact Sheet...`);
    const qa = await inspectVideoQA(finalOutputPath, {
      sourceUrl: url || 'https://www.youtube.com/watch?v=chge7GrCNc0',
      sourceIn: startSec || 600,
      sourceOut: (startSec || 600) + durationSec,
      brandHandle: channelTag || brand.handle
    });

    const sheetFilename = `contact_sheet_${timestamp}.jpg`;
    const sheetPath = path.join(config.paths.output, sheetFilename);
    await generateContactSheet(finalOutputPath, sheetPath);

    res.json({
      success: true,
      videoUrl: `/output/${clipFilename}`,
      contactSheetUrl: `/output/${sheetFilename}`,
      filename: clipFilename,
      qa
    });
  } catch (err) {
    console.error('[API] Erro ao renderizar:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. API: Get Latest QA Report
app.get('/api/qa', (req, res) => {
  try {
    const qaReportPath = path.join(config.paths.output, 'qa_report.json');
    if (fs.existsSync(qaReportPath)) {
      const data = JSON.parse(fs.readFileSync(qaReportPath, 'utf8'));
      return res.json({ success: true, data });
    }
    res.json({ success: false, message: 'Nenhum relatório QA gerado ainda.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. API: List Generated Clips
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
🌴 GG NO CHAT — GTA 6 CORTES STUDIO V2 INICIADO!
🌐 Acesse no seu navegador: http://localhost:${PORT}
  `);
});
