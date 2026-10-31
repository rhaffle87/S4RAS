import urllib.request
import json
import os
import re

token = "24d71ca5817a4878b3315c313839b8c4"
headers = {
    "Content-Type": "application/json",
    "X-Emby-Token": token
}

STUDIO_MAP = {
    "Jujutsu Kaisen": ["MAPPA", "MBS"],
    "Kimetsu no Yaiba": ["ufotable", "Tokyo MX"],
    "Solo Leveling": ["A-1 Pictures", "Tokyo MX"],
    "Spy x Family": ["WIT Studio", "CloverWorks", "TV Tokyo"],
    "Kimi no Na wa": ["CoMix Wave Films", "TOHO animation"],
    "Suzume": ["CoMix Wave Films", "TOHO animation"],
    "Indonesian Archipelago": ["TVRI Nasional", "S4RAS EduBroadcast Network"],
    "World Wonders": ["National Geographic", "BBC Earth"],
    "Deep Sea Exploration": ["Discovery Science", "BBC Earth"],
    "Cosmos": ["National Geographic", "S4RAS EduBroadcast Network"],
    "Planetary Climates": ["Discovery Science", "S4RAS EduBroadcast Network"],
    "Ancient Civilizations": ["BBC Earth", "S4RAS EduBroadcast Network"],
    "Digital Frontier": ["S4RAS EduBroadcast Network", "Netflix"],
    "His Girl Friday": ["Columbia Pictures", "S4RAS Cinema"],
    "Charade": ["Universal Pictures", "S4RAS Cinema"],
    "The General": ["United Artists", "Buster Keaton Productions", "S4RAS Cinema"],
    "Carnival of Souls": ["Herts-Lion International Corp.", "S4RAS Cinema"],
    "Gulliver": ["Paramount Pictures", "Fleischer Studios", "S4RAS Cinema"],
    "Tears of Steel": ["Blender Foundation", "S4RAS Cinema"],
    "Sintel": ["Blender Foundation", "S4RAS Cinema"],
    "Big Buck Bunny": ["Blender Foundation", "S4RAS Cinema"],
    "Agent 327": ["Blender Foundation", "S4RAS Cinema"],
    "Caminandes": ["Blender Foundation", "S4RAS Cinema"],
    "Elephants Dream": ["Blender Foundation", "S4RAS Cinema"],
    "Cosmos Laundromat": ["Blender Foundation", "S4RAS Cinema"]
}

# 1. Update items via Jellyfin API
url = "http://localhost:8096/Items?IncludeItemTypes=Series,Movie&Recursive=true"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

items = data.get("Items", [])
print(f"Total series & movies found: {len(items)}")

for it in items:
    item_id = it["Id"]
    name = it["Name"]
    item_type = it["Type"]

    matched_studios = None
    for key, studs in STUDIO_MAP.items():
        if key.lower() in name.lower():
            matched_studios = studs
            break
    
    if not matched_studios:
        if item_type == "Series":
            matched_studios = ["National Geographic", "S4RAS EduBroadcast Network"]
        else:
            matched_studios = ["S4RAS Cinema"]

    print(f"Updating [{item_type}] {name} ({item_id}) -> Studios: {matched_studios}")

    try:
        req_item = urllib.request.Request(f"http://localhost:8096/Items/{item_id}", headers=headers)
        with urllib.request.urlopen(req_item) as r:
            item_data = json.loads(r.read().decode())

        item_data["Studios"] = [{"Name": s} for s in matched_studios]

        req_update = urllib.request.Request(
            f"http://localhost:8096/Items/{item_id}",
            data=json.dumps(item_data).encode('utf-8'),
            headers=headers
        )
        with urllib.request.urlopen(req_update) as r:
            pass
    except Exception as e:
        print(f"  Error updating {name}: {e}")

# 2. Update .nfo files on disk
media_dirs = [
    "/home/s4ras/jellyfin/media/anime",
    "/home/s4ras/jellyfin/media/tvshows",
    "/home/s4ras/jellyfin/media/movies"
]

for root_dir in media_dirs:
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            if f.endswith(".nfo"):
                nfo_path = os.path.join(root, f)
                try:
                    with open(nfo_path, "r", encoding="utf-8") as nf:
                        content = nf.read()

                    matched = None
                    for key, studs in STUDIO_MAP.items():
                        if key.lower() in root.lower() or key.lower() in f.lower():
                            matched = studs
                            break
                    
                    if matched:
                        content = re.sub(r'\s*<studio>.*?</studio>', '', content)
                        studio_xml = "".join([f"\n  <studio>{s}</studio>" for s in matched])
                        if "</tvshow>" in content:
                            content = content.replace("</tvshow>", f"{studio_xml}\n</tvshow>")
                        elif "</movie>" in content:
                            content = content.replace("</movie>", f"{studio_xml}\n</movie>")
                        
                        with open(nfo_path, "w", encoding="utf-8") as nf:
                            nf.write(content)
                except Exception as e:
                    print(f"NFO error {nfo_path}: {e}")

print("Studio metadata population complete!")
