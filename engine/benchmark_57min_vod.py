import os
import sys
import time
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.analyzers.audio_analyzer import AudioAnalyzer
from engine.analyzers.transcription_analyzer import TranscriptionAnalyzer
from engine.ranking_engine import RankingEngine

def benchmark_vod():
    audio_path = "temp/vod_57min_audio.m4a"
    ffmpeg_bin = "C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-127043-g5a54fcf75e-win64-gpl\\bin\\ffmpeg.exe"

    print("=" * 65)
    print("⏱️  BENCHMARK REAL DE VOD COMPLETO (57 MINUTOS / 3.419s)")
    print("=" * 65)

    t0 = time.time()
    analyzer = AudioAnalyzer(ffmpeg_bin=ffmpeg_bin)
    print("\n1. Executando varredura acústica contínua nos 57 minutos...")
    audio_results = analyzer.analyze(audio_path, duration_sec=3419.0)
    t_audio = time.time() - t0

    spikes = audio_results.get("spikes", [])
    silences = audio_results.get("silence_points", [])
    print(f"   -> Concluído em {t_audio:.2f}s ({3419.0 / t_audio:.1f}x mais rápido que tempo real!)")
    print(f"   -> Total de picos de grito/explosão detectados: {len(spikes)}")
    print(f"   -> Pontos de pausa/silêncio mapeados: {len(silences)}")

    # 2. Coarse-to-fine transcription: transcribe around top 10 candidate clusters
    print("\n2. Transcrevendo trechos dos principais picos de energia com faster-whisper...")
    t1 = time.time()
    transcriber = TranscriptionAnalyzer(model_size="tiny")

    # Group spikes into candidate windows
    candidate_windows = []
    for sp in spikes:
        t = sp["time"]
        merged = False
        for cw in candidate_windows:
            if abs(cw["center"] - t) < 30.0:
                cw["spikes"].append(sp)
                merged = True
                break
        if not merged:
            candidate_windows.append({"center": t, "spikes": [sp]})

    candidate_windows.sort(key=lambda x: len(x["spikes"]), reverse=True)
    top_windows = candidate_windows[:8]

    all_transcripts = []
    # Transcribe speech in top candidate windows using temporary snippets
    for i, cw in enumerate(top_windows):
        c_time = cw["center"]
        snippet_start = max(0.0, c_time - 8.0)
        snippet_dur = 20.0
        snip_path = f"temp/snip_candidate_{i+1}.m4a"

        # Extract snippet via subprocess
        import subprocess
        cmd = [
            ffmpeg_bin,
            "-y",
            "-ss", str(snippet_start),
            "-t", str(snippet_dur),
            "-i", audio_path,
            "-c", "copy",
            snip_path,
            "-v", "error"
        ]
        subprocess.run(cmd, check=False)

        if os.path.exists(snip_path):
            segs = transcriber.transcribe(snip_path)
            for s in segs:
                s["start"] += snippet_start
                s["end"] += snippet_start
                all_transcripts.append(s)
            try:
                os.remove(snip_path)
            except:
                pass

    t_transcribe = time.time() - t1
    print(f"   -> Transcrição focada concluída em {t_transcribe:.2f}s")
    print(f"   -> Segmentos de fala capturados: {len(all_transcripts)}")

    # 3. Fuse & Rank
    print("\n3. Classificando os melhores momentos com o Ranking Engine...")
    ranking_engine = RankingEngine(min_clip_duration=12.0, max_clip_duration=35.0)
    candidates = ranking_engine.fuse_and_rank(
        video_duration=3419.0,
        audio_data=audio_results,
        chat_data={"has_chat": False, "timeline": [], "spikes": []},
        hud_data={"has_hud": False, "events": []},
        visual_data=[],
        transcript_data=all_transcripts
    )

    t_total = time.time() - t0
    print(f"\n✨ RESULTADOS DO BENCHMARK DE 57 MINUTOS:")
    print(f"   Tempo total de processamento: {t_total:.2f}s ({t_total/60.0:.2f} min)")
    print(f"   Velocidade global: {3419.0 / t_total:.1f}x TEMPO REAL!")
    print(f"   Top {len(candidates)} Melhores Momentos Identificados:")

    for c in candidates:
        print(f"   * [Rank #{c['rank']}] Score: {c['score']}/100 | Início: {c['start']:.1f}s - Fim: {c['end']:.1f}s ({c['duration']:.1f}s)")
        print(f"     Gancho: {c['suggested_hook']}")
        print(f"     Evidências: {', '.join(c['reasons'][:2])}")

    bench_report = {
        "benchmark": "57-Minute VOD Processing",
        "vod_duration_sec": 3419.0,
        "processing_time_sec": round(t_total, 2),
        "speedup_vs_realtime": round(3419.0 / t_total, 1),
        "audio_scan_time_sec": round(t_audio, 2),
        "transcription_time_sec": round(t_transcribe, 2),
        "total_audio_spikes": len(spikes),
        "total_silence_pauses": len(silences),
        "candidates": candidates
    }

    with open("output/benchmark_57min_report.json", "w", encoding="utf-8") as f:
        json.dump(bench_report, f, indent=2, ensure_ascii=False)

    print(f"\nRelatório de benchmark salvo em: output/benchmark_57min_report.json")

if __name__ == "__main__":
    benchmark_vod()
