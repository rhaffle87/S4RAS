import os, urllib.request, urllib.parse, subprocess

shows = [
    {
        "title": "The Adventures of Sherlock Holmes (1984)",
        "studio": "Granada Television",
        "tmdb_id": "236",
        "plot": "Sherlock Holmes and Dr Watson solve the mysteries of Victorian London in this classic, faithful television adaptation of Sir Arthur Conan Doyle's stories.",
        "poster_url": "https://image.tmdb.org/t/p/original/mXj78r03hQJkI6uN5oE9cTzGf6T.jpg",
        "fanart_url": "https://image.tmdb.org/t/p/original/9rM1e1Ea825J2KzXvjL1NnB6kPz.jpg",
        "episodes": [
            {
                "season": 1,
                "episode": 1,
                "title": "A Scandal in Bohemia",
                "url": "https://archive.org/download/SherlockHolmesGranada/1984-04-24%20-%20Sherlock%20Holmes%20-%20A%20Scandal%20In%20Bohemia.mp4"
            },
            {
                "season": 1,
                "episode": 2,
                "title": "The Dancing Men",
                "url": "https://archive.org/download/SherlockHolmesGranada/1984-05-01%20-%20Sherlock%20Holmes%20-%20The%20Dancing%20Men.mp4"
            },
            {
                "season": 1,
                "episode": 3,
                "title": "The Naval Treaty",
                "url": "https://archive.org/download/SherlockHolmesGranada/1984-05-08%20-%20Sherlock%20Holmes%20-%20The%20Naval%20Treaty.mp4"
            },
            {
                "season": 1,
                "episode": 4,
                "title": "The Solitary Cyclist",
                "url": "https://archive.org/download/SherlockHolmesGranada/1984-05-15%20-%20Sherlock%20Holmes%20-%20The%20Solitary%20Cyclist%20.mp4"
            }
        ]
    },
    {
        "title": "The Twilight Zone (1959)",
        "studio": "CBS",
        "tmdb_id": "4607",
        "plot": "An anthology of ordinary people who find themselves in extraordinarily astounding situations, which they each try to solve in a remarkable manner.",
        "poster_url": "https://image.tmdb.org/t/p/original/5Jb30Lp3n0Z7Y5K0xQh0S9RkR5x.jpg",
        "fanart_url": "https://image.tmdb.org/t/p/original/5qgB5x3p7k3jR4p4cR1a5K8bW6v.jpg",
        "episodes": [
            {
                "season": 1,
                "episode": 1,
                "title": "Where Is Everybody?",
                "url": "https://archive.org/download/the-twilight-zone-1959-s-01-e-00-original-pilot/The%20Twilight%20Zone%201959%20S01E01%20Where%20Is%20Everybody.mp4"
            },
            {
                "season": 1,
                "episode": 2,
                "title": "One for the Angels",
                "url": "https://archive.org/download/the-twilight-zone-1959-s-01-e-00-original-pilot/The%20Twilight%20Zone%201959%20S01E02%20One%20for%20the%20Angels.mp4"
            },
            {
                "season": 1,
                "episode": 3,
                "title": "Mr. Denton on Doomsday",
                "url": "https://archive.org/download/the-twilight-zone-1959-s-01-e-00-original-pilot/The%20Twilight%20Zone%201959%20S01E03%20Mr.%20Denton%20on%20Doomsday.mp4"
            },
            {
                "season": 1,
                "episode": 4,
                "title": "The Sixteen-Millimeter Shrine",
                "url": "https://archive.org/download/the-twilight-zone-1959-s-01-e-00-original-pilot/The%20Twilight%20Zone%201959%20S01E04%20The%20Sixteen-Millimeter%20Shrine.mp4"
            }
        ]
    },
    {
        "title": "Cosmos - A Personal Voyage (1980)",
        "studio": "PBS",
        "tmdb_id": "2437",
        "plot": "Astronomer Carl Sagan leads us on an engaging guided tour of the various elements and cosmological characteristics of the universe.",
        "poster_url": "https://image.tmdb.org/t/p/original/uK7r2vGj4GkMhU3F3E8R9Z0xM8n.jpg",
        "fanart_url": "https://image.tmdb.org/t/p/original/9vG9gH5K8w5J3t3Q4L6k4J6n8kP.jpg",
        "episodes": [
            {
                "season": 1,
                "episode": 1,
                "title": "The Shores of the Cosmic Ocean",
                "url": "https://archive.org/download/CosmosAPersonalVoyage/1980%20Cosmos%20%28A%20Personal%20Voyage%29%20-%20Ep%2001%20The%20Shores%20of%20the%20Cosmic%20Ocean.mp4"
            },
            {
                "season": 1,
                "episode": 2,
                "title": "One Voice in the Cosmic Fugue",
                "url": "https://archive.org/download/CosmosAPersonalVoyage/1980%20Cosmos%20%28A%20Personal%20Voyage%29%20-%20Ep%2002%20One%20Voice%20in%20the%20Cosmic%20Fugue.mp4"
            }
        ]
    }
]

BASE_DIR = "/home/s4ras/jellyfin/media/tvshows"

def download_file(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000000:
        print(f"File already exists: {path}")
        return
    print(f"Downloading {url} -> {path}...")
    tmp = path + ".tmp"
    cmd = ["curl", "-fSL", "-A", "Mozilla/5.0", url, "-o", tmp]
    res = subprocess.run(cmd)
    if res.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 100000:
        os.rename(tmp, path)
        print(f"Success: {path} ({os.path.getsize(path)/(1024*1024):.1f} MB)")
    else:
        print(f"Failed to download {url}")
        if os.path.exists(tmp): os.remove(tmp)

for s in shows:
    s_dir = os.path.join(BASE_DIR, s["title"])
    os.makedirs(s_dir, exist_ok=True)
    
    # tvshow.nfo
    nfo_content = f"""<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<tvshow>
  <title>{s['title']}</title>
  <plot>{s['plot']}</plot>
  <studio>{s['studio']}</studio>
  <tmdbid>{s['tmdb_id']}</tmdbid>
</tvshow>"""
    with open(os.path.join(s_dir, "tvshow.nfo"), "w", encoding="utf-8") as f:
        f.write(nfo_content)

    # Poster & fanart
    # Download posters if available or curl them
    subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", s["poster_url"], "-o", os.path.join(s_dir, "poster.jpg")])
    subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", s["fanart_url"], "-o", os.path.join(s_dir, "fanart.jpg")])

    for ep in s["episodes"]:
        s_season_dir = os.path.join(s_dir, f"Season {ep['season']:02d}")
        os.makedirs(s_season_dir, exist_ok=True)
        ep_filename = f"{s['title'].split(' (')[0]} - S{ep['season']:02d}E{ep['episode']:02d}.mp4"
        dest_path = os.path.join(s_season_dir, ep_filename)
        download_file(ep["url"], dest_path)

print("All TV shows ingested successfully!")
