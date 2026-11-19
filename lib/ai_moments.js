/**
 * Analyzes video transcript segments to identify high-potential viral moments
 */
function findViralMoments(segments, options = {}) {
  const minDuration = options.minDuration || 15;
  const maxDuration = options.maxDuration || 45;
  const targetCount = options.targetCount || 5;

  const viralKeywords = [
    { word: 'gta', weight: 15 },
    { word: 'lucia', weight: 12 },
    { word: 'jason', weight: 12 },
    { word: 'rockstar', weight: 10 },
    { word: 'gráfico', weight: 14 },
    { word: 'mapa', weight: 12 },
    { word: 'física', weight: 14 },
    { word: 'olha isso', weight: 16 },
    { word: 'meu deus', weight: 18 },
    { word: 'caraca', weight: 15 },
    { word: 'inacreditável', weight: 18 },
    { word: 'surreal', weight: 16 },
    { word: 'detalhe', weight: 12 },
    { word: 'vazamento', weight: 14 },
    { word: 'oficial', weight: 10 },
    { word: 'polícia', weight: 10 },
    { word: 'dinheiro', weight: 8 },
    { word: 'prisão', weight: 10 },
    { word: 'cidade', weight: 8 },
    { word: 'vice city', weight: 15 },
    { word: 'absurdo', weight: 14 }
  ];

  if (!segments || segments.length === 0) {
    // If no subtitles, return default staggered highlights
    return [
      { startSec: 60, durationSec: 30, score: 90, title: 'GTA VI: Início da Gameplay', hook: 'REAÇÃO ÉPICA AO GTA 6!' },
      { startSec: 300, durationSec: 30, score: 88, title: 'GTA VI: Detalhes do Mapa', hook: 'OLHA O NÍVEL DESSE GRÁFICO!' },
      { startSec: 600, durationSec: 30, score: 95, title: 'GTA VI: Prisão da Lucia', hook: 'A PRIMEIRA MISSÃO DO GTA 6!' }
    ];
  }

  // Slide window of 25-35 seconds across all segments
  const windowStepSec = 10;
  const windowDurationSec = 30;
  const totalVideoDuration = (segments[segments.length - 1].endMs || 0) / 1000;
  
  const candidates = [];

  for (let t = 10; t < totalVideoDuration - windowDurationSec; t += windowStepSec) {
    const windowStartMs = t * 1000;
    const windowEndMs = (t + windowDurationSec) * 1000;

    const windowSegments = segments.filter(
      s => s.endMs >= windowStartMs && s.startMs <= windowEndMs
    );
    
    const combinedText = windowSegments.map(s => s.text).join(' ').toLowerCase();
    if (combinedText.length < 30) continue;

    let score = 50; // base score

    for (const kw of viralKeywords) {
      if (combinedText.includes(kw.word)) {
        score += kw.weight;
      }
    }

    // Question marks and exclamations indicate emotional peaks
    const exclamations = (combinedText.match(/!/g) || []).length;
    const questions = (combinedText.match(/\?/g) || []).length;
    score += exclamations * 4;
    score += questions * 3;

    // Word density (faster speech often means more energy)
    const wordCount = combinedText.split(/\s+/).length;
    if (wordCount > 60) score += 10;

    // Generate hook title based on content
    let hook = 'DAVY JONES REAGIU AO GTA 6!';
    if (combinedText.includes('gráfico') || combinedText.includes('olha isso')) {
      hook = 'OLHA O NÍVEL DESSE GRÁFICO NO GTA 6! 😱';
    } else if (combinedText.includes('prisão') || combinedText.includes('lucia')) {
      hook = 'A CENA DA PRISÃO NO GTA 6 É INSANA! 🚨';
    } else if (combinedText.includes('mapa') || combinedText.includes('cidade')) {
      hook = 'O TAMANHO DO MAPA DO GTA 6 É ABSURDO! 🗺️';
    } else if (combinedText.includes('física') || combinedText.includes('detalhe')) {
      hook = 'OS DETALHES DE FÍSICA NO GTA VI! 🔥';
    } else if (combinedText.includes('inacreditável') || combinedText.includes('surreal')) {
      hook = 'ELE NÃO ACREDITOU NO QUE VIU NO GTA 6! 🤯';
    }

    candidates.push({
      startSec: t,
      durationSec: windowDurationSec,
      score,
      textSample: combinedText.substring(0, 120) + '...',
      title: hook.replace(/[😱🚨🗺️🔥🤯]/g, '').trim(),
      hook
    });
  }

  // Sort by score descending and deduplicate overlapping clips
  candidates.sort((a, b) => b.score - a.score);

  const selected = [];
  for (const c of candidates) {
    const overlaps = selected.some(s => Math.abs(s.startSec - c.startSec) < 25);
    if (!overlaps) {
      selected.push(c);
      if (selected.length >= targetCount) break;
    }
  }

  return selected;
}

module.exports = {
  findViralMoments
};
