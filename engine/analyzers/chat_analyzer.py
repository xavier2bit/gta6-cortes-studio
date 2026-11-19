import re
import math
from typing import List, Dict, Any, Optional

HYPE_PATTERNS = [
    r'\b(lul|omegalul|kekw|pog|poggers|w|l|clip|clipa|clip it)\b',
    r'\b(kkk+|haha+|rsrs+|jaja+)\b',
    r'\b(caralho|krl|mds|meu deus|wtf|omg|mano|vtnc|fake|olha isso)\b',
    r'\b(morreu|f|busted|wasted|preso|policia|estrela)\b'
]

COMPILED_HYPE = [re.compile(p, re.IGNORECASE) for p in HYPE_PATTERNS]

class ChatAnalyzer:
    """
    Analyzes livestream / VOD chat for burst velocity and hype sentiment.
    Inspired by streamclipper, Hypeline and chat-downloader.
    """
    def __init__(self, window_size_sec: float = 8.0, step_size_sec: float = 1.0):
        self.window_size = window_size_sec
        self.step_size = step_size_sec

    def extract_chat_from_url(self, url: str, max_messages: Optional[int] = None) -> List[Dict[str, Any]]:
        """Downloads chat using chat_downloader when available."""
        try:
            from chat_downloader import ChatDownloader
            downloader = ChatDownloader()
            chat = downloader.get_chat(url, max_messages=max_messages)
            messages = []
            for item in chat:
                timestamp = item.get('time_in_seconds')
                if timestamp is None:
                    continue
                messages.append({
                    'time': float(timestamp),
                    'author': item.get('author', {}).get('name', 'user'),
                    'message': item.get('message', '')
                })
            return sorted(messages, key=lambda x: x['time'])
        except Exception as e:
            print(f"[ChatAnalyzer] Could not fetch remote chat: {e}. Running with no-chat fallback.")
            return []

    def analyze_messages(self, messages: List[Dict[str, Any]], video_duration_sec: float) -> Dict[str, Any]:
        """
        Computes rolling message velocity, z-scores, and hype emote density across the video timeline.
        """
        if not messages or video_duration_sec <= 0:
            timeline_len = int(math.ceil(video_duration_sec))
            return {
                "has_chat": False,
                "timeline": [{"time": t, "mps": 0.0, "z_score": 0.0, "hype_score": 0.0} for t in range(timeline_len)],
                "spikes": []
            }

        # Ensure messages are sorted chronologically
        messages = sorted(messages, key=lambda x: float(x.get('time', 0.0)))

        num_steps = int(math.ceil(video_duration_sec / self.step_size))
        timeline = []
        msg_counts = []
        hype_counts = []

        msg_idx = 0
        n_msgs = len(messages)

        for step in range(num_steps):
            center_time = step * self.step_size
            win_start = max(0.0, center_time - self.window_size / 2.0)
            win_end = center_time + self.window_size / 2.0

            # Count messages in window
            count = 0
            hype = 0
            unique_authors = set()

            for m in messages:
                t = m['time']
                if win_start <= t <= win_end:
                    count += 1
                    unique_authors.add(m.get('author', ''))
                    text = m.get('message', '')
                    for pattern in COMPILED_HYPE:
                        if pattern.search(text):
                            hype += 1
                            break
                elif t > win_end:
                    break

            mps = count / self.window_size
            author_diversity = (len(unique_authors) / count) if count > 0 else 0.0
            adjusted_mps = mps * (0.5 + 0.5 * author_diversity)

            msg_counts.append(adjusted_mps)
            hype_counts.append(hype)
            timeline.append({
                "time": round(center_time, 2),
                "mps": round(adjusted_mps, 2),
                "raw_count": count,
                "unique_authors": len(unique_authors),
                "hype_count": hype
            })

        # Calculate mean and standard deviation
        mean_mps = sum(msg_counts) / len(msg_counts) if msg_counts else 0.0
        variance = sum((x - mean_mps) ** 2 for x in msg_counts) / len(msg_counts) if msg_counts else 0.0
        std_mps = math.sqrt(variance) if variance > 0 else 1.0

        # Assign z-scores and detect spikes
        spikes = []
        for i, entry in enumerate(timeline):
            mps = entry['mps']
            z = (mps - mean_mps) / std_mps if std_mps > 0 else 0.0
            entry['z_score'] = round(z, 2)

            # Hype density (percentage of hype words in window)
            hype_ratio = (entry['hype_count'] / entry['raw_count']) if entry['raw_count'] > 0 else 0.0
            hype_score = min(1.0, (z / 3.0) * 0.7 + hype_ratio * 0.3)
            entry['hype_score'] = round(max(0.0, hype_score), 3)

            # A spike occurs when z_score >= 2.0 and at least 3 unique users
            if z >= 2.0 and entry['unique_authors'] >= 3:
                spikes.append({
                    "time": entry['time'],
                    "z_score": entry['z_score'],
                    "mps": entry['mps'],
                    "hype_score": entry['hype_score']
                })

        return {
            "has_chat": True,
            "mean_mps": round(mean_mps, 2),
            "std_mps": round(std_mps, 2),
            "total_messages": len(messages),
            "timeline": timeline,
            "spikes": spikes
        }
