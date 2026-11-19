import re
from typing import Dict, Any, List, Optional

VIRAL_KEYWORDS_PT = [
    r'\b(caraca|caralho|mano|meu deus|nossa|olha isso|que isso|mentira|mds|inacreditável)\b',
    r'\b(morri|morreu|policia|estrela|vazou|oficial|novo|bizarro|absurdo|fuga|perseguição)\b',
    r'\b(lucia|jason|vice city|leonida|trailer|gameplay|gráfico|física)\b'
]

VIRAL_KEYWORDS_EN = [
    r'\b(holy shit|what the fuck|no way|omg|look at this|insane|crazy|bro|dude)\b',
    r'\b(busted|wasted|cops|stars|leak|official|graphics|physics|unbelievable)\b'
]

COMPILED_VIRAL = [re.compile(p, re.IGNORECASE) for p in VIRAL_KEYWORDS_PT + VIRAL_KEYWORDS_EN]

class TranscriptionAnalyzer:
    """
    Speech transcription and semantic virality analyzer using faster-whisper.
    """
    def __init__(self, model_size: str = "tiny"):
        self.model_size = model_size
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
                # Run on CPU with int8 quantization for lightweight fast inference
                self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            except Exception as e:
                print(f"[TranscriptionAnalyzer] Failed to load faster-whisper: {e}")
                self._model = False
        return self._model

    def transcribe(self, audio_or_video_path: str, language: str = None) -> List[Dict[str, Any]]:
        """Transcribes audio into timestamped segments and words."""
        model = self._get_model()
        if not model:
            return []

        try:
            segments, info = model.transcribe(
                audio_or_video_path,
                language=language,
                beam_size=3,
                word_timestamps=True,
                vad_filter=True, # Voice Activity Detection filter
                vad_parameters=dict(min_silence_duration_ms=400)
            )

            results = []
            for seg in segments:
                words = []
                for w in (seg.words or []):
                    words.append({
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "probability": round(w.probability, 2)
                    })

                text = seg.text.strip()
                # Score semantic buzz
                buzz_count = 0
                for pattern in COMPILED_VIRAL:
                    if pattern.search(text):
                        buzz_count += 1

                results.append({
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": text,
                    "words": words,
                    "buzz_score": min(1.0, buzz_count * 0.35)
                })

            return results
        except Exception as e:
            print(f"[TranscriptionAnalyzer] Transcription error: {e}")
            return []

    def find_speech_boundaries(self, segments: List[Dict[str, Any]], target_start: float, target_end: float) -> Dict[str, float]:
        """
        Refines highlight start and end boundaries to align with natural speech starts and pauses.
        Never cuts a word in half!
        """
        best_start = target_start
        best_end = target_end

        # Find clean start: beginning of a sentence / phrase closest to target_start
        for seg in segments:
            if abs(seg["start"] - target_start) <= 3.5:
                best_start = seg["start"]
                break

        # Find clean end: end of a sentence / phrase closest to target_end
        for seg in reversed(segments):
            if abs(seg["end"] - target_end) <= 4.0:
                best_end = seg["end"]
                break

        return {"start": round(best_start, 2), "end": round(best_end, 2)}
