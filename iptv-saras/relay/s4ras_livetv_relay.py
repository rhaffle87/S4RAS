"""
s4ras_livetv_relay.py - Production Live TV Stream Relay & Reverse Proxy Daemon
Runs on VM 200 (127.0.0.1:8099). Proxied through Caddy /live-relay/* -> 8099.

Features:
1. YouTube Live Resolver with memory cache and auto-renewal (TTL: 90 mins).
2. Direct HLS streams redirection with full CORS headers.
3. Static logo serving for channel icons (/live-relay/logos/<id>.png).
4. Static EPG serving (/live-relay/epg.xml).
5. Health check endpoint /health.
"""

import sys
import os
import time
import json
import logging
import urllib.request
import urllib.error
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PORT = 8099
LOG_FILE = "/var/log/s4ras_livetv_relay.log"
LOGOS_DIR = "/home/s4ras/jellyfin/media/livetv/logos"
EPG_FILE = "/home/s4ras/jellyfin/media/livetv/epg.xml"
M3U_FILE = "/home/s4ras/jellyfin/media/livetv/s4ras-livetv.m3u"
CHANNELS_JSON = "/home/s4ras/jellyfin/media/livetv/merged_channels.json"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

CHANNEL_REGISTRY = {}

def load_registry():
    global CHANNEL_REGISTRY
    if os.path.exists(CHANNELS_JSON):
        try:
            with open(CHANNELS_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
                CHANNEL_REGISTRY = {item["id"]: item for item in data}
                logging.info(f"Loaded {len(CHANNEL_REGISTRY)} channels into relay registry.")
        except Exception as e:
            logging.error(f"Failed loading {CHANNELS_JSON}: {e}")

# Cache for resolved URLs: slug -> { "url": str, "expires": float }
URL_CACHE = {}

def resolve_youtube(slug, yt_url):
    now = time.time()
    cached = URL_CACHE.get(slug)
    if cached and cached["expires"] > now:
        return cached["url"]

    logging.info(f"Resolving YouTube live URL for {slug} ({yt_url})...")
    cmd = ["yt-dlp", "-g", yt_url]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if res.returncode == 0 and res.stdout.strip():
            resolved = res.stdout.strip().split("\n")[0]
            URL_CACHE[slug] = {
                "url": resolved,
                "expires": now + (90 * 60) # 90 minutes cache
            }
            logging.info(f"Resolved {slug} successfully. Cached for 90 mins.")
            return resolved
        else:
            logging.error(f"yt-dlp failed for {slug}: {res.stderr.strip()}")
            return None
    except Exception as e:
        logging.error(f"Exception resolving {slug}: {e}")
        return None

class RelayHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Origin, User-Agent")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")

    def do_HEAD(self):
        self.do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Health check
        if path == "/health":
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            body = json.dumps({"status": "healthy", "channels": len(CHANNEL_REGISTRY), "cached": len(URL_CACHE)})
            self.wfile.write(body.encode("utf-8"))
            return

        # 2. Channel logos static serving: /logos/<filename>.png
        if path.startswith("/logos/"):
            filename = os.path.basename(path)
            logo_path = os.path.join(LOGOS_DIR, filename)
            if os.path.exists(logo_path):
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "image/png")
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                with open(logo_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        # 3. EPG XML static serving: /epg.xml
        if path == "/epg.xml":
            if os.path.exists(EPG_FILE):
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/xml; charset=utf-8")
                self.send_header("Cache-Control", "public, max-age=3600")
                self.end_headers()
                with open(EPG_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        # 4. M3U static serving: /s4ras-livetv.m3u
        if path == "/s4ras-livetv.m3u":
            if os.path.exists(M3U_FILE):
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "audio/x-mpegurl; charset=utf-8")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                with open(M3U_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
            return

        # 5. Live stream manifest proxy: /live/<channel_slug>.m3u8
        if path.startswith("/live/") and path.endswith(".m3u8"):
            slug = path[len("/live/"): -len(".m3u8")]
            if slug not in CHANNEL_REGISTRY:
                load_registry()
            
            if slug not in CHANNEL_REGISTRY:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b"Channel not found in registry")
                return

            info = CHANNEL_REGISTRY[slug]
            if info["type"] == "youtube":
                target_url = resolve_youtube(slug, info["url"])
            else:
                target_url = info["url"]

            if not target_url:
                self.send_response(502)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b"Live stream resolution failed")
                return

            try:
                # 302 redirect with CORS headers for direct browser/player consumption
                self.send_response(302)
                self.send_cors_headers()
                self.send_header("Location", target_url)
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.end_headers()
                logging.info(f"Stream redirect for {slug} -> {target_url[:60]}...")
            except Exception as e:
                logging.error(f"Error redirecting stream for {slug}: {e}")
                self.send_response(500)
                self.send_cors_headers()
                self.end_headers()
            return

        # Fallback
        self.send_response(404)
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(b"Not Found")

def run():
    load_registry()
    os.makedirs(LOGOS_DIR, exist_ok=True)
    server = HTTPServer(("0.0.0.0", PORT), RelayHandler)
    logging.info(f"S4RAS Live TV Relay daemon listening on 0.0.0.0:{PORT}...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
    logging.info("S4RAS Live TV Relay stopped.")

if __name__ == "__main__":
    run()
