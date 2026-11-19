const path = require('path');
const fs = require('fs');
const { getSubtitles } = require('./lib/downloader');
const { renderClip } = require('./lib/renderer');
const { inspectVideoQA, generateContactSheet } = require('./lib/qa_checker');
const config = require('./lib/config');

async function runV2Pilot() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        🌴 GG NO CHAT — GTA 6 CORTES STUDIO V2 🌴           ║');
  console.log('║               EXECUÇÃO DO PILOTO DE QUALIDADE             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const url = 'https://www.youtube.com/watch?v=chge7GrCNc0';
  const startSec = 600;
  const durationSec = 15;
  const rawClipPath = path.resolve('hd_clip.mp4');

  console.log('1. Carregando e sanitizando legendas automáticas...');
  const subtitles = await getSubtitles(url);
  console.log(`   Legendas carregadas: ${subtitles.length} segmentos com timestamps palavra-por-palavra.`);

  const outputs = [];

  // 1. MODELO 1: REAÇÃO / SPLIT SCREEN V2 COM MOLDURA OFICIAL VICE PINK (GG NO CHAT)
  console.log('\n2. Renderizando Modelo 1: Reação / Split Screen V2 (Moldura Oficial Vice Pink)...');
  const out1 = path.join(config.paths.output, 'v2_modelo_1_split.mp4');
  await renderClip({
    inputVideoPath: rawClipPath,
    model: 'split',
    outputPath: out1,
    subtitles,
    clipStartSec: startSec,
    clipDurationSec: durationSec,
    hookText: 'LUCIA NA CELA: "CARACA, QUE ISSO?"',
    badgeText: 'GG NO CHAT',
    channelTag: '@ggnochat',
    framePreset: 'vice_pink',
    gameplayCrop: { x: 0.07, y: 0.23, w: 0.50, h: 0.77 },
    lofiVolume: 0.08,
    fontName: 'Bebas Neue'
  });
  outputs.push({ name: 'Modelo 1 - Reação Split V2 (Oficial Vice Pink)', path: out1 });

  // 2. MODELO 2: ANÁLISE EDITORIAL GG NO CHAT V2 COM MOLDURA 16:9
  console.log('\n3. Renderizando Modelo 2: Análise Editorial GG NO CHAT V2 (Moldura 16:9)...');
  const out2 = path.join(config.paths.output, 'v2_modelo_2_web_analise.mp4');
  await renderClip({
    inputVideoPath: rawClipPath,
    model: 'web',
    outputPath: out2,
    subtitles,
    clipStartSec: startSec,
    clipDurationSec: durationSec,
    newsTitle: 'LUCIA NA CELA: DETALHES DE LEONIDA',
    newsCategory: 'GG NO CHAT • ANÁLISE EDITORIAL',
    badgeText: 'GG NO CHAT',
    channelTag: '@ggnochat',
    framePreset: 'wide_16x9',
    gameplayCrop: { x: 0.07, y: 0.23, w: 0.50, h: 0.77 },
    lofiVolume: 0.08,
    fontName: 'Bebas Neue'
  });
  outputs.push({ name: 'Modelo 2 - Análise Editorial V2 (Moldura 16:9)', path: out2 });

  // 3. MODELO 3: HIGHLIGHT / DIRECT SHORT V2 COM MOLDURA ROXO NOTURNO
  console.log('\n4. Renderizando Modelo 3: Highlight / Direct Short V2 (Moldura Roxo Noturno)...');
  const out3 = path.join(config.paths.output, 'v2_modelo_3_direct_short.mp4');
  await renderClip({
    inputVideoPath: rawClipPath,
    model: 'direct',
    outputPath: out3,
    subtitles,
    clipStartSec: startSec,
    clipDurationSec: durationSec,
    hookText: 'LUCIA EXPLORANDO A PRISÃO DE LEONIDA',
    badgeText: 'GG NO CHAT',
    channelTag: '@ggnochat',
    framePreset: 'subtle_dark',
    directMode: 'smart_crop',
    cropAnchor: { x: 0.10, y: 0.0, w: 0.5625, h: 1.0 },
    lofiVolume: 0.08,
    fontName: 'Bebas Neue'
  });
  outputs.push({ name: 'Modelo 3 - Direct Short V2 (Moldura Roxo Noturno)', path: out3 });

  // 4. MODELO 4: DIRECT SHORT FULL-BLEED (SEM MOLDURA - 100% GAMEPLAY 9:16)
  console.log('\n5. Renderizando Modelo 4: Direct Short Full-Bleed (Comparativo Sem Moldura)...');
  const out4 = path.join(config.paths.output, 'v2_modelo_4_framed_edition.mp4');
  await renderClip({
    inputVideoPath: rawClipPath,
    model: 'direct',
    outputPath: out4,
    subtitles,
    clipStartSec: startSec,
    clipDurationSec: durationSec,
    hookText: 'LUCIA NA CELA: IMERSÃO TOTAL 9:16',
    badgeText: 'GG NO CHAT',
    channelTag: '@ggnochat',
    framePreset: 'no_frame',
    directMode: 'smart_crop',
    cropAnchor: { x: 0.10, y: 0.0, w: 0.5625, h: 1.0 },
    lofiVolume: 0.08,
    fontName: 'Bebas Neue'
  });
  outputs.push({ name: 'Modelo 4 - Direct Full-Bleed 9:16', path: out4 });

  // 5. GERANDO CONTACT SHEETS DE AMOSTRAGEM [0, 0.5, 1, 2, 4, 7, 10, 13, 15s]
  console.log('\n6. Gerando Contact Sheets de Auditoria Visual...');
  const contactSheets = [];
  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const sheetPath = path.join(config.paths.output, `contact_sheet_model_${i + 1}.jpg`);
    console.log(`   -> Gerando folha de contato para ${item.name}...`);
    await generateContactSheet(item.path, sheetPath);
    contactSheets.push(sheetPath);
  }

  // 6. EXECUTANDO INSPEÇÃO COMPLETA DE QUALIDADE (QA REPORT)
  console.log('\n7. Executando bateria de testes e relatório de QA...');
  const qaResults = [];
  for (const item of outputs) {
    console.log(`   -> Analisando QA para ${item.name}...`);
    const qa = await inspectVideoQA(item.path, {
      sourceUrl: url,
      sourceIn: startSec,
      sourceOut: startSec + durationSec,
      brandHandle: '@ggnochat'
    });
    qa.modelName = item.name;
    qaResults.push(qa);
  }

  const qaReportPath = path.join(config.paths.output, 'qa_report.json');
  fs.writeFileSync(qaReportPath, JSON.stringify({
    studio: 'GG NO CHAT — GTA 6 Cortes Studio V2',
    evaluatedAt: new Date().toISOString(),
    overallStatus: qaResults.every(r => !r.status.includes('FAIL')) ? 'PASS (ALL CHECKS CLEARED)' : 'FAIL',
    reports: qaResults
  }, null, 2), 'utf8');

  console.log(`\n✅ Relatório de QA salvo em: ${qaReportPath}`);
  console.log('\n✨ RESUMO DO PILOTO V2:');
  qaResults.forEach(r => {
    console.log(`   * [${r.status}] ${r.modelName}`);
    console.log(`     Loudness: ${r.metrics.integratedLufs} LUFS | True Peak: ${r.metrics.truePeakDbfs} dBFS | Tam: ${r.metrics.fileSizeMB} MB`);
  });
}

runV2Pilot().catch(err => {
  console.error('\n❌ Erro na execução do piloto V2:', err);
  process.exit(1);
});
