import os, urllib.request, subprocess

anime_metadata = [
    {
        "dir": "/home/s4ras/jellyfin/media/anime/Chainsaw Man (2022)",
        "title": "Chainsaw Man",
        "year": "2022",
        "rating": "8.7",
        "plot": "Denji, pemuda miskin yang hidup bersama anjing iblis Pochita, dibantai oleh Yakuza yang berkhianat. Pochita mengorbankan diri menjadi jantung Denji, membangkitkannya sebagai Manusia Gergaji Mesin (Chainsaw Man) yang direkrut oleh Makima ke dalam Divisi Keamanan Khusus Pemburu Iblis.",
        "genre": "Aksi / Horor / Supranatural",
        "studios": ["MAPPA", "TV Tokyo"],
        "poster": "https://image.tmdb.org/t/p/original/npdB6eFz44XZ55zg90Hav4ZKZ30.jpg",
        "fanart": "https://image.tmdb.org/t/p/original/y4X1v8qE6n1wT5K12YxO4mD9yVp.jpg"
    },
    {
        "dir": "/home/s4ras/jellyfin/media/anime/One Punch Man (2015)",
        "title": "One Punch Man",
        "year": "2015",
        "rating": "8.8",
        "plot": "Saitama menjadi pahlawan super terkuat di bumi setelah berlatih ekstrem hingga kepalanya botak. Masalahnya: ia mampu mengalahkan semua monster raksasa dan ancaman kosmik hanya dengan satu pukulan (One Punch), membuatnya dilanda kebosanan akut.",
        "genre": "Aksi / Komedi / Pahlawan Super",
        "studios": ["Madhouse", "TV Tokyo"],
        "poster": "https://image.tmdb.org/t/p/original/iE3s0lG5QVdE0ofFi7wwqM0qY16.jpg",
        "fanart": "https://image.tmdb.org/t/p/original/1otYh3J3d9a9L0W6E9m0G9YxY16.jpg"
    },
    {
        "dir": "/home/s4ras/jellyfin/media/anime/Spy x Family (2022)",
        "title": "Spy x Family",
        "year": "2022",
        "rating": "8.6",
        "plot": "Agen rahasia Twilight ditugaskan menyelidiki tokoh politik berbahaya di negara tetangga. Demi misinya, ia menyamar sebagai Loid Forger dan membangun keluarga palsu dengan mengadopsi Anya (gadis cilik berkemampuan telepati) dan menikahi Yor (pembunuh bayaran legendaris Thorn Princess).",
        "genre": "Aksi / Komedi / Spionase",
        "studios": ["WIT Studio", "CloverWorks", "TV Tokyo"],
        "poster": "https://image.tmdb.org/t/p/original/3r4LYFuXrg3G8fep5Mm7q0WvSCw.jpg",
        "fanart": "https://image.tmdb.org/t/p/original/m9PHVqFvU6y9bXjG1R9n9k5p4L1.jpg"
    }
]

for a in anime_metadata:
    os.makedirs(a["dir"], exist_ok=True)
    studios_xml = "\n".join([f"  <studio>{s}</studio>" for s in a["studios"]])
    nfo = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<tvshow>
  <title>{a['title']}</title>
  <originaltitle>{a['title']}</originaltitle>
  <year>{a['year']}</year>
  <rating>{a['rating']}</rating>
  <plot>{a['plot']}</plot>
  <genre>{a['genre']}</genre>
{studios_xml}
</tvshow>"""
    with open(os.path.join(a["dir"], "tvshow.nfo"), "w", encoding="utf-8") as f:
        f.write(nfo)
    print(f"Wrote NFO for {a['title']}")

    # Download posters
    subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", a["poster"], "-o", os.path.join(a["dir"], "poster.jpg")])
    subprocess.run(["curl", "-sSL", "-A", "Mozilla/5.0", a["fanart"], "-o", os.path.join(a["dir"], "fanart.jpg")])
    print(f"Downloaded poster/fanart for {a['title']}")

print("Anime metadata update complete!")
