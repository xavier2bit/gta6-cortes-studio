#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { getVideoInfo, getSubtitles, downloadSegment } = require('./lib/downloader');
const { findViralMoments } = require('./lib/ai_moments');
const { renderClip } = require('./lib/renderer');
const config = require('./lib/config');

function parseArgs() {
  const brand = config.brand || require('./brand.json');
  const args = process.argv.slice(2);
  const options = {
    url: null,
    model: 'split', // 'split' | 'web' | 'direct'
    start: null,
    duration: 15,
    hook: null,
    badge: brand.display_name || 'GG NO CHAT',
    tag: brand.handle || '@ggnochat',
    frame: 'no_frame',
    auto: false,
    count: 3,
    lofi: 0.08,
    font: 'Bebas Neue',
    outputDir: config.paths.output
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' || arg === '-u') options.url = args[++i];
    else if (arg === '--model' || arg === '-m') options.model = args[++i];
    else if (arg === '--start' || arg === '-s') options.start = parseFloat(args[++i]);
    else if (arg === '--duration' || arg === '-d') options.duration = parseFloat(args[++i]);
    else if (arg === '--hook' || arg === '-h') options.hook = args[++i];
    else if (arg === '--badge' || arg === '-b') options.badge = args[++i];
    else if (arg === '--tag' || arg === '-t') options.tag = args[++i];
    else if (arg === '--frame') options.frame = args[++i];
    else if (arg === '--font' || arg === '-f') options.font = args[++i];
    else if (arg === '--auto' || arg === '-a') options.auto = true;
    else if (arg === '--count' || arg === '-c') options.count = parseInt(args[++i], 10);
    else if (arg === '--lofi' || arg === '-l') options.lofi = parseFloat(args[++i]);
    else if (arg === '--output' || arg === '-o') options.outputDir = path.resolve(args[++i]);
  }
  return options;
}

async function main() {
  const opts = parseArgs();

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🌴 GTA 6 VIRAL CLIPPER STUDIO 🌴                  ║
║   Modelos: Meio a Meio | Página de GTA 6 | Só Cortes     ║
╚═══════════════════════════════════════════════════════════╝
  `);

  if (!opts.url) {
    console.log(`
Uso:
  node cli.js --url "https://www.youtube.com/watch?v=..." [opções]

Opções:
  --model, -m     Modelo: "split" (Meio a Meio), "web" (Página GTA 6), "direct" (Só Cortes) [Padrão: split]
  --start, -s     Tempo inicial do corte em segundos (ex: 600)
  --duration, -d  Duração do corte em segundos [Padrão: 30]
  --hook, -h      Texto do gancho superior (ex: "DAVY JONES REAGINDO AO GTA 6!")
  --badge, -b     Texto do badge (ex: "GTA VI", "OFICIAL")
  --tag, -t       Tag do seu canal (ex: "@GTA6CORTES")
  --auto, -a      Detectar e gerar os melhores cortes virais automaticamente
  --count, -c     Quantidade de cortes a gerar no modo auto [Padrão: 3]
  --output, -o    Pasta de saída dos vídeos [Padrão: ./output]

Exemplos:
  node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --model split --start 600 --duration 25
  node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --model web --start 600 --duration 30
  node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --auto --count 3
    `);
    process.exit(1);
  }

  console.log(`[1/4] Coletando informações do vídeo: ${opts.url}`);
  const info = await getVideoInfo(opts.url);
  console.log(`📹 Título: ${info.title}`);
  console.log(`👤 Canal: ${info.channel}`);
  console.log(`⏱️ Duração: ${Math.floor(info.duration / 60)}m ${info.duration % 60}s`);

  console.log(`\n[2/4] Baixando legendas automáticas / transcrição...`);
  const subtitles = await getSubtitles(opts.url);
  console.log(`📝 Total de trechos legendados obtidos: ${subtitles.length}`);

  let momentsToRender = [];

  if (opts.auto || opts.start === null) {
    console.log(`\n[3/4] Analisando momentos virais com IA...`);
    const viralMoments = findViralMoments(subtitles, { targetCount: opts.count });
    console.log(`🔥 Encontrados ${viralMoments.length} momentos de alta retenção:`);
    viralMoments.forEach((m, idx) => {
      console.log(`   #${idx + 1} [${m.startSec}s - ${m.startSec + m.durationSec}s] Score: ${m.score} | ${m.hook}`);
    });
    momentsToRender = viralMoments;
  } else {
    momentsToRender = [{
      startSec: opts.start,
      durationSec: opts.duration,
      hook: opts.hook || `${info.channel.toUpperCase()} REAGIU AO GTA 6!`,
      title: info.title
    }];
  }

  console.log(`\n[4/4] Processando e renderizando cortes no modelo: [${opts.model.toUpperCase()}]...`);
  fs.mkdirSync(opts.outputDir, { recursive: true });

  for (let i = 0; i < momentsToRender.length; i++) {
    const moment = momentsToRender[i];
    const clipName = `corte_${moment.startSec}s_${opts.model}_${Date.now()}.mp4`;
    const tempRawClip = path.join(config.paths.temp, `raw_${clipName}`);
    const finalOutputPath = path.join(opts.outputDir, clipName);

    console.log(`\n-> [${i + 1}/${momentsToRender.length}] Baixando trecho de ${moment.startSec}s a ${moment.startSec + moment.durationSec}s...`);
    await downloadSegment(opts.url, moment.startSec, moment.durationSec, tempRawClip);

    console.log(`-> Renderizando efeito visual e legendas dinâmicas...`);
    await renderClip({
      inputVideoPath: tempRawClip,
      model: opts.model,
      outputPath: finalOutputPath,
      subtitles,
      clipStartSec: moment.startSec,
      clipDurationSec: moment.durationSec,
      hookText: opts.hook || moment.hook,
      badgeText: opts.badge,
      channelTag: opts.tag,
      newsTitle: moment.hook.replace(/[😱🚨🗺️🔥🤯]/g, '').trim(),
      lofiVolume: opts.lofi,
      fontName: opts.font,
      framePreset: opts.frame
    });

    try { fs.unlinkSync(tempRawClip); } catch (_) {}
    console.log(`✅ VÍDEO CONCLUÍDO: ${finalOutputPath}`);
  }

  console.log(`\n✨ TODOS OS CORTES FORAM GERADOS COM SUCESSO EM: ${opts.outputDir}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro durante o processo:', err.message);
  process.exit(1);
});
