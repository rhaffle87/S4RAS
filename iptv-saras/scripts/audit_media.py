import os, glob, subprocess, json, hashlib

BASE_DIR = "/home/s4ras/jellyfin/media"

def get_file_info(fpath):
    size_mb = os.path.getsize(fpath) / (1024 * 1024)
    
    # Calculate MD5 (read first 64MB + last 64MB if huge, or full if < 200MB)
    h = hashlib.md5()
    with open(fpath, "rb") as f:
        # read up to 50MB for hash representation or full
        chunk = f.read(50 * 1024 * 1024)
        h.update(chunk)
    md5_partial = h.hexdigest()

    # ffprobe
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "stream=index,codec_type,codec_name,width,height:stream_tags=language,title:format=duration",
        "-of", "json",
        fpath
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    duration_s = 0.0
    res_str = "N/A"
    audio_codec = "N/A"
    audio_lang = "N/A"
    sub_info = "Hardsub (Indo)"

    if res.returncode == 0:
        data = json.loads(res.stdout)
        duration_s = float(data.get("format", {}).get("duration", 0))
        for s in data.get("streams", []):
            if s.get("codec_type") == "video" and res_str == "N/A":
                res_str = f"{s.get('width')}x{s.get('height')} ({s.get('codec_name')})"
            elif s.get("codec_type") == "audio" and audio_codec == "N/A":
                audio_codec = s.get("codec_name")
                audio_lang = s.get("tags", {}).get("language", "jpn") # Default jpn for Otakudesu hardsubs
            elif s.get("codec_type") == "subtitle":
                lang = s.get("tags", {}).get("language", "und")
                sub_info = f"Softsub ({lang})"

    duration_min = f"{int(duration_s // 60)}m {int(duration_s % 60)}s"
    return {
        "file": os.path.basename(fpath),
        "size_mb": f"{size_mb:.1f} MB",
        "duration": duration_min,
        "resolution": res_str,
        "audio": f"{audio_codec} ({audio_lang})",
        "subs": sub_info,
        "md5": md5_partial
    }

print("=== AUDIT REPORT ===")
# Anime
anime_files = sorted(glob.glob(os.path.join(BASE_DIR, "anime/*/*/*.mp4")) + glob.glob(os.path.join(BASE_DIR, "anime/*/*.mp4")))
print(f"\n--- ANIME ({len(anime_files)} files) ---")
for f in anime_files:
    info = get_file_info(f)
    print(f"[{info['file']}] | Size: {info['size_mb']} | Dur: {info['duration']} | Res: {info['resolution']} | Audio: {info['audio']} | Sub: {info['subs']} | MD5: {info['md5']}")

# TV Shows
tv_files = sorted(glob.glob(os.path.join(BASE_DIR, "tvshows/*/*/*.mp4")))
print(f"\n--- TV SHOWS ({len(tv_files)} files) ---")
for f in tv_files:
    info = get_file_info(f)
    print(f"[{info['file']}] | Size: {info['size_mb']} | Dur: {info['duration']} | Res: {info['resolution']} | Audio: {info['audio']} | Sub: {info['subs']} | MD5: {info['md5']}")
