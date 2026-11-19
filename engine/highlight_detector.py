import os
import sys
import json
import math
import argparse
import subprocess
import time
from typing import Dict, Any, List

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.analyzers.chat_analyzer import ChatAnalyzer
from engine.analyzers.audio_analyzer import AudioAnalyzer
from engine.analyzers.gta_hud_detector import GtaHudDetector
from engine.analyzers.visual_analyzer import VisualAnalyzer
from engine.analyzers.transcription_analyzer import TranscriptionAnalyzer
from engine.ranking_engine import RankingEngine

def get_video_duration(video_path: str, ffprobe_bin: str = "ffprobe") -> float:
    """Uses ffprobe to obtain accurate duration."""
    cmd = [
        ffprobe_bin,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    try:
        out = subprocess.check_output(cmd).decode().strip()
        return float(out)
    except Exception as e:
        print(f"[Detector] Warning getting duration via ffprobe: {e}. Fallback to 60.0s.")
        return 60.0

def generate_preview_clip(video_path: str, start: float, duration: float, out_path: str, ffmpeg_bin: str = "ffmpeg"):
    """Generates a fast 360p preview MP4 for the Radar timeline UI."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-ss", str(start),
        "-t", str(duration),
        "-i", video_path,
        "-vf", "scale=-2:360",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "aac",
        "-b:a", "64k",
        out_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        print(f"[Detector] Failed to generate preview clip: {e}")
        return False

def run_highlight_pipeline(video_path: str,
                           output_json_path: str,
                           chat_source: str = None,
                           max_duration: float = None,
                           generate_previews: bool = True,
                           ffmpeg_bin: str = "ffmpeg",
                           ffprobe_bin: str = "ffprobe",
                           use_cache: bool = True) -> Dict[str, Any]:
    start_time = time.time()
    print("=" * 65)
    print("🛰️  GG NO CHAT — RADAR DE HIGHLIGHTS & DETECÇÃO MULTIMODAL")
    print("=" * 65)
    print(f"Arquivo de Entrada: {video_path}")

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    total_duration = get_video_duration(video_path, ffprobe_bin)
    if max_duration and max_duration > 0:
        total_duration = min(total_duration, max_duration)
    print(f"Duração analisada: {total_duration:.1f} segundos ({total_duration/60.0:.1f} min)")

    # Interruption Recovery / Checkpoint Cache directory
    import hashlib
    video_hash = hashlib.md5(f"{os.path.basename(video_path)}_{total_duration}".encode()).hexdigest()[:10]
    cache_dir = os.path.join(os.path.dirname(output_json_path), "cache", video_hash)
    if use_cache:
        os.makedirs(cache_dir, exist_ok=True)

    # 1. Chat Analysis
    print("\n[1/5] 💬 Analisando fluxo de Chat...")
    chat_cache_file = os.path.join(cache_dir, "chat_results.json")
    if use_cache and os.path.exists(chat_cache_file):
        with open(chat_cache_file, 'r', encoding='utf-8') as f:
            chat_results = json.load(f)
        print(f"   [CACHE RESTAURADO] {len(chat_results.get('spikes', []))} picos de hype carregados.")
    else:
        chat_analyzer = ChatAnalyzer()
        messages = []
        if chat_source:
            if os.path.exists(chat_source):
                try:
                    with open(chat_source, 'r', encoding='utf-8') as f:
                        messages = json.load(f)
                except Exception as e:
                    print(f"   Erro ao carregar chat local: {e}")
            elif chat_source.startswith("http"):
                messages = chat_analyzer.extract_chat_from_url(chat_source)

        chat_results = chat_analyzer.analyze_messages(messages, total_duration)
        if use_cache:
            with open(chat_cache_file, 'w', encoding='utf-8') as f:
                json.dump(chat_results, f)
        print(f"   Chat processado: {len(messages)} mensagens | {len(chat_results.get('spikes', []))} picos de hype.")

    # 2. Audio Analysis
    print("\n[2/5] 🔊 Analisando sinais acústicos e energia espectral...")
    audio_cache_file = os.path.join(cache_dir, "audio_results.json")
    if use_cache and os.path.exists(audio_cache_file):
        with open(audio_cache_file, 'r', encoding='utf-8') as f:
            audio_results = json.load(f)
        print(f"   [CACHE RESTAURADO] {len(audio_results.get('spikes', []))} explosões de áudio carregadas.")
    else:
        audio_analyzer = AudioAnalyzer(ffmpeg_bin=ffmpeg_bin)
        audio_results = audio_analyzer.analyze(video_path, total_duration)
        if use_cache:
            with open(audio_cache_file, 'w', encoding='utf-8') as f:
                json.dump(audio_results, f)
        print(f"   Áudio processado: {len(audio_results.get('spikes', []))} explosões de reação | {len(audio_results.get('silence_points', []))} pontos de silêncio para corte limpo.")

    # 3. GTA HUD & Game Events Detection
    print("\n[3/5] ⭐ Detectando eventos do HUD de GTA (Polícia, Morte, Dano)...")
    hud_cache_file = os.path.join(cache_dir, "hud_results.json")
    if use_cache and os.path.exists(hud_cache_file):
        with open(hud_cache_file, 'r', encoding='utf-8') as f:
            hud_results = json.load(f)
        print(f"   [CACHE RESTAURADO] {hud_results.get('events_detected', 0)} eventos de HUD carregados.")
    else:
        hud_detector = GtaHudDetector()
        hud_results = hud_detector.analyze_video(video_path, total_duration, sample_fps=1.0)
        if use_cache:
            with open(hud_cache_file, 'w', encoding='utf-8') as f:
                json.dump(hud_results, f)
        print(f"   HUD analisado: {hud_results.get('events_detected', 0)} eventos críticos de jogabilidade detectados.")

    # 4. Visual Scene Cut Detection
    print("\n[4/5] 🎬 Detectando cortes de plano e transições visuais (PySceneDetect)...")
    scenes_cache_file = os.path.join(cache_dir, "scenes_results.json")
    if use_cache and os.path.exists(scenes_cache_file):
        with open(scenes_cache_file, 'r', encoding='utf-8') as f:
            scenes = json.load(f)
        print(f"   [CACHE RESTAURADO] {len(scenes)} cortes de cena carregados.")
    else:
        visual_analyzer = VisualAnalyzer()
        scenes = visual_analyzer.detect_scenes(video_path, max_duration_sec=total_duration)
        if use_cache:
            with open(scenes_cache_file, 'w', encoding='utf-8') as f:
                json.dump(scenes, f)
        print(f"   Cortes visuais: {len(scenes)} mudanças de cena detectadas.")

    # 5. Faster-Whisper Speech Transcription
    print("\n[5/5] 🗣️ Transcrevendo falas e reações com faster-whisper...")
    transcript_cache_file = os.path.join(cache_dir, "transcript_results.json")
    if use_cache and os.path.exists(transcript_cache_file):
        with open(transcript_cache_file, 'r', encoding='utf-8') as f:
            transcript = json.load(f)
        print(f"   [CACHE RESTAURADO] {len(transcript)} segmentos de transcrição carregados.")
    else:
        transcription_analyzer = TranscriptionAnalyzer(model_size="tiny")
        transcript = transcription_analyzer.transcribe(video_path)
        if use_cache:
            with open(transcript_cache_file, 'w', encoding='utf-8') as f:
                json.dump(transcript, f)
        print(f"   Transcrição concluída: {len(transcript)} segmentos de fala mapeados.")

    # 6. Multimodal Fusion & Narrative Ranking
    print("\n⚡ [Fusão Multimodal] Gerando ranking de melhores cortes...")
    ranking_engine = RankingEngine(min_clip_duration=12.0, max_clip_duration=45.0)
    candidates = ranking_engine.fuse_and_rank(
        video_duration=total_duration,
        audio_data=audio_results,
        chat_data=chat_results,
        hud_data=hud_results,
        visual_data=scenes,
        transcript_data=transcript
    )

    # 7. Generate Low-Res Previews for Radar UI
    previews_dir = os.path.join(os.path.dirname(output_json_path), "previews")
    if generate_previews and candidates:
        print("\n🎥 Gerando prévias leves (360p) para o Radar...")
        for c in candidates:
            preview_filename = f"{c['id']}_preview.mp4"
            preview_path = os.path.join(previews_dir, preview_filename)
            generate_preview_clip(video_path, c["start"], c["duration"], preview_path, ffmpeg_bin=ffmpeg_bin)
            c["preview_url"] = f"/output/previews/{preview_filename}"

    # Build second-by-second Heatmap for the UI Timeline
    heatmap = []
    step_duration = int(math.ceil(total_duration))
    # Align values
    audio_map = {int(round(x["time"])): x.get("excitement_score", 0) for x in audio_results.get("timeline", [])}
    chat_map = {int(round(x["time"])): x.get("hype_score", 0) for x in chat_results.get("timeline", [])}
    hud_map = {int(round(x["time"])): x.get("hud_score", 0) for x in hud_results.get("timeline", [])}

    for s in range(min(step_duration, 3600)): # Up to 1 hour
        aud = audio_map.get(s, 0.0)
        cht = chat_map.get(s, 0.0)
        hud = hud_map.get(s, 0.0)
        composite = min(1.0, aud * 0.4 + cht * 0.35 + hud * 0.25)
        heatmap.append({
            "second": s,
            "audio": round(aud, 3),
            "chat": round(cht, 3),
            "hud": round(hud, 3),
            "composite": round(composite, 3)
        })

    elapsed = round(time.time() - start_time, 2)
    output_data = {
        "studio": "GG NO CHAT — Radar de Highlights",
        "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "video_path": video_path,
        "duration_sec": total_duration,
        "processing_time_sec": elapsed,
        "candidates_count": len(candidates),
        "candidates": candidates,
        "heatmap": heatmap,
        "scenes_count": len(scenes),
        "chat_stats": {
            "has_chat": chat_results.get("has_chat", False),
            "total_messages": chat_results.get("total_messages", 0),
            "spikes": len(chat_results.get("spikes", []))
        },
        "audio_stats": {
            "spikes": len(audio_results.get("spikes", []))
        },
        "hud_stats": {
            "events_detected": hud_results.get("events_detected", 0)
        }
    }

    os.makedirs(os.path.dirname(os.path.abspath(output_json_path)), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Detecção concluída em {elapsed}s!")
    print(f"   {len(candidates)} melhores momentos identificados com evidências completas.")
    print(f"   Relatório salvo em: {output_json_path}")
    return output_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GG NO CHAT Highlight Detection Engine")
    parser.add_argument("--input", required=True, help="Input video file path")
    parser.add_argument("--output", default="output/radar_highlights.json", help="Output JSON path")
    parser.add_argument("--chat", default=None, help="Chat JSON file or remote URL")
    parser.add_argument("--max-duration", type=float, default=None, help="Max duration in seconds to analyze")
    parser.add_argument("--no-previews", action="store_true", help="Disable generating preview clips")
    parser.add_argument("--ffmpeg", default="ffmpeg", help="Path to ffmpeg executable")
    parser.add_argument("--ffprobe", default="ffprobe", help="Path to ffprobe executable")

    args = parser.parse_args()

    run_highlight_pipeline(
        video_path=args.input,
        output_json_path=args.output,
        chat_source=args.chat,
        max_duration=args.max_duration,
        generate_previews=not args.no_previews,
        ffmpeg_bin=args.ffmpeg,
        ffprobe_bin=args.ffprobe
    )
