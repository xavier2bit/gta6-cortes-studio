import math
from typing import Dict, Any, List

class RankingEngine:
    """
    Multimodal Highlight Fusion & Ranking Engine.
    Combines Chat, Audio, HUD, Visual and Transcription signals.
    Synthesizes setup -> climax -> reaction narrative structure.
    Refines boundaries to speech / silence points.
    """
    def __init__(self, min_clip_duration: float = 12.0, max_clip_duration: float = 45.0):
        self.min_clip_duration = min_clip_duration
        self.max_clip_duration = max_clip_duration

    def fuse_and_rank(self,
                      video_duration: float,
                      audio_data: Dict[str, Any],
                      chat_data: Dict[str, Any],
                      hud_data: Dict[str, Any],
                      visual_data: List[Dict[str, Any]],
                      transcript_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Multimodal fusion:
        1. Aligns signals onto a synchronized 1-second timeline grid.
        2. Calculates weighted composite moment scores.
        3. Identifies peak climax moments.
        4. Expands to include context setup (5-10s before) and reaction (5-10s after).
        5. Refines boundaries using speech and silence boundaries.
        6. Generates realistic, content-grounded hook headlines and confidence ratings.
        """
        timeline_len = int(math.ceil(video_duration))
        grid_scores = [0.0] * timeline_len
        grid_evidence = [[] for _ in range(timeline_len)]

        # 1. Integrate Audio Spikes (Weight: 30%)
        has_chat = chat_data.get("has_chat", False)
        # If no chat is available, audio and HUD weights adaptively increase!
        audio_weight = 0.45 if not has_chat else 0.30
        chat_weight = 0.35 if has_chat else 0.00
        hud_weight = 0.25 if not has_chat else 0.20
        transcript_weight = 0.15

        for sp in audio_data.get("spikes", []):
            t = int(round(sp["time"]))
            if 0 <= t < timeline_len:
                score_contrib = sp["excitement_score"] * audio_weight * 100.0
                grid_scores[t] += score_contrib
                spike_type = "Grito/Reação alta" if sp.get("type") == "scream_or_shout" else "Explosão de áudio"
                grid_evidence[t].append({
                    "modality": "audio",
                    "text": f"{spike_type} ({sp.get('vol_boost', 2.0):.1f}x acima da média)",
                    "score": round(score_contrib, 1)
                })

        # 2. Integrate Chat Spikes (Weight: 35% when available)
        if has_chat:
            for sp in chat_data.get("spikes", []):
                t = int(round(sp["time"]))
                if 0 <= t < timeline_len:
                    score_contrib = sp["hype_score"] * chat_weight * 100.0
                    grid_scores[t] += score_contrib
                    grid_evidence[t].append({
                        "modality": "chat",
                        "text": f"Pico de chat ({sp.get('mps', 0):.1f} msg/s, Z-Score: {sp.get('z_score', 0):.1f})",
                        "score": round(score_contrib, 1)
                    })

        # 3. Integrate GTA HUD Events (Weight: 20-25%)
        for ev in hud_data.get("events", []):
            t = int(round(ev["time"]))
            if 0 <= t < timeline_len:
                score_contrib = ev["hud_score"] * hud_weight * 100.0
                grid_scores[t] += score_contrib
                desc = "Estrelas de Polícia ativas" if ev["type"] == "wanted_level_active" else \
                       "Tela de Morte (WASTED)" if ev["type"] == "wasted_or_busted" else "Dano crítico no jogador"
                grid_evidence[t].append({
                    "modality": "hud",
                    "text": desc,
                    "score": round(score_contrib, 1)
                })

        # 4. Integrate Transcription Buzz (Weight: 15%)
        for seg in transcript_data:
            if seg.get("buzz_score", 0) > 0:
                t = int(round((seg["start"] + seg["end"]) / 2.0))
                if 0 <= t < timeline_len:
                    score_contrib = seg["buzz_score"] * transcript_weight * 100.0
                    grid_scores[t] += score_contrib
                    grid_evidence[t].append({
                        "modality": "transcript",
                        "text": f"Fala impactante: \"{seg['text'][:40]}...\"",
                        "score": round(score_contrib, 1)
                    })

        # 5. Peak Finding & Cluster Expansion
        # Smooth scores with a 5-second moving average window
        smoothed = []
        for i in range(timeline_len):
            w_start = max(0, i - 2)
            w_end = min(timeline_len, i + 3)
            smoothed.append(sum(grid_scores[w_start:w_end]) / (w_end - w_start))

        # Identify local peaks with adaptive thresholding
        mean_score = sum(smoothed) / len(smoothed) if smoothed else 0.0
        var_score = sum((x - mean_score) ** 2 for x in smoothed) / len(smoothed) if smoothed else 0.0
        std_score = math.sqrt(var_score)
        adaptive_threshold = max(12.0, mean_score + 0.6 * std_score)

        candidate_peaks = []
        for i in range(len(smoothed)):
            is_peak = True
            if i > 0 and smoothed[i] < smoothed[i - 1]:
                is_peak = False
            if i < len(smoothed) - 1 and smoothed[i] < smoothed[i + 1]:
                is_peak = False

            if is_peak and smoothed[i] >= adaptive_threshold:
                candidate_peaks.append((i, smoothed[i]))

        # Fallback if no peak crossed threshold: pick highest point
        if not candidate_peaks and smoothed:
            best_idx = 0
            best_val = smoothed[0]
            for idx, val in enumerate(smoothed):
                if val > best_val:
                    best_val = val
                    best_idx = idx
            if best_val > 0:
                candidate_peaks.append((best_idx, best_val))

        # Sort peaks by composite score descending
        candidate_peaks.sort(key=lambda x: x[1], reverse=True)

        # Merge overlapping / adjacent peaks (suppress peaks within 30 seconds of an existing candidate)
        selected_clusters = []
        for peak_sec, peak_score in candidate_peaks:
            too_close = False
            for c in selected_clusters:
                if abs(c["peak_sec"] - peak_sec) < 30.0:
                    too_close = True
                    break
            if not too_close:
                selected_clusters.append({
                    "peak_sec": peak_sec,
                    "peak_score": peak_score
                })
            if len(selected_clusters) >= 8: # Top 8 distinct moments
                break

        # 6. Formulate Context (Setup -> Climax -> Reaction) & Refine Boundaries
        candidates = []
        silence_pts = audio_data.get("silence_points", [])

        for rank_idx, cluster in enumerate(selected_clusters):
            peak = cluster["peak_sec"]
            raw_score = cluster["peak_score"]

            # Narrative window:
            # Setup: ~6s before peak
            # Climax + Reaction: ~9s after peak
            raw_start = max(0.0, float(peak - 6.0))
            raw_end = min(video_duration, float(peak + 9.0))

            # Snap boundaries to silence or speech pauses
            best_start = raw_start
            for s_pt in silence_pts:
                if raw_start - 3.0 <= s_pt <= raw_start + 2.0:
                    best_start = s_pt
                    break

            best_end = raw_end
            for s_pt in silence_pts:
                if raw_end - 2.0 <= s_pt <= raw_end + 4.0:
                    best_end = s_pt
                    break

            # Further refine with speech boundaries if transcription exists
            if transcript_data:
                for seg in transcript_data:
                    if abs(seg["start"] - best_start) <= 2.5:
                        best_start = seg["start"]
                        break
                for seg in reversed(transcript_data):
                    if abs(seg["end"] - best_end) <= 3.0:
                        best_end = seg["end"]
                        break

            # Guarantee valid duration between min and max
            duration = best_end - best_start
            if duration < self.min_clip_duration:
                best_end = min(video_duration, best_start + self.min_clip_duration)
            elif duration > self.max_clip_duration:
                best_end = best_start + self.max_clip_duration

            # Collect evidence across the clip interval
            clip_evidences = []
            ev_seen = set()
            for t in range(int(best_start), min(timeline_len, int(best_end) + 1)):
                for ev in grid_evidence[t]:
                    key = ev["text"]
                    if key not in ev_seen:
                        ev_seen.add(key)
                        clip_evidences.append(ev)

            # Generate honest, content-grounded suggested hook title
            suggested_hook = self._generate_honest_hook(best_start, best_end, clip_evidences, transcript_data)

            # Normalized score (0 to 100)
            final_score = min(98.0, max(45.0, raw_score * 1.15))

            # Confidence rating
            num_modalities = len(set(ev["modality"] for ev in clip_evidences))
            confidence = "ALTA" if num_modalities >= 3 else ("MÉDIA" if num_modalities >= 2 else "MODERADA")

            candidates.append({
                "id": f"highlight_{rank_idx + 1}_{int(best_start)}s",
                "rank": rank_idx + 1,
                "start": round(best_start, 2),
                "end": round(best_end, 2),
                "duration": round(best_end - best_start, 2),
                "peak_time": peak,
                "score": round(final_score, 1),
                "confidence": confidence,
                "suggested_hook": suggested_hook,
                "reasons": [ev["text"] for ev in clip_evidences[:4]],
                "evidence_breakdown": clip_evidences[:6],
                "modalities_count": num_modalities
            })

        return candidates

    def _generate_honest_hook(self, start: float, end: float, evidences: List[Dict[str, Any]], transcript: List[Dict[str, Any]]) -> str:
        """Generates a truthful hook conditioned on what actually happens in the scene."""
        # Check transcript speech first
        spoken_phrases = []
        for seg in transcript:
            if seg["start"] >= start and seg["end"] <= end:
                spoken_phrases.append(seg["text"])

        full_speech = " ".join(spoken_phrases).lower()

        # Check for GTA HUD events
        has_wasted = any("WASTED" in ev["text"] for ev in evidences)
        has_police = any("Polícia" in ev["text"] for ev in evidences)
        has_scream = any("Grito" in ev["text"] for ev in evidences)

        if has_wasted:
            return "O MOMENTO QUE DEU TUDO ERRADO NO GTA!"
        elif has_police:
            return "FUGA INSANA: A POLÍCIA NÃO DEU TRÉGUA!"
        elif has_scream and ("caraca" in full_speech or "meu deus" in full_speech or "que isso" in full_speech):
            return "REAÇÃO ÉPICA: 'CARACA, O QUE É ISSO?!'"
        elif "lucia" in full_speech or "cela" in full_speech or "prisão" in full_speech:
            return "LUCIA NA CELA: DETALHES DE LEONIDA"
        elif spoken_phrases and len(spoken_phrases[0]) > 6:
            # Condition on actual spoken phrase
            first_clean = spoken_phrases[0].replace('"', '').strip()
            if len(first_clean) < 45:
                return f"'{first_clean.upper()}'"
            return first_clean[:40].upper() + "..."
        else:
            return "MOMENTO VIRAL: REAÇÃO AO VIVO"
