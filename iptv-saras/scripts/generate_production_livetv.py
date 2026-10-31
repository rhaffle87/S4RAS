import os, urllib.request, json, datetime, time, subprocess

LOGOS_DIR = "/home/s4ras/jellyfin/media/livetv/logos"
THUMBNAILS_DIR = "/home/s4ras/jellyfin/media/livetv/thumbnails"
EPG_FILE = "/home/s4ras/jellyfin/media/livetv/epg.xml"
os.makedirs(LOGOS_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)

# 1. Download official vector/PNG logos
OFFICIAL_LOGOS = {
    "tvri_nasional": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/TVRI_Nasional_2019.svg/500px-TVRI_Nasional_2019.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "kompas_tv": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/KOMPAS_TV_%282017%29.svg/500px-KOMPAS_TV_%282017%29.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "cnn_indonesia": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/CNN_Indonesia_logo.svg/500px-CNN_Indonesia_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "tvone": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/TV-One-logo-2016.png/500px-TV-One-logo-2016.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "cnbc_indonesia": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/CNBC_Indonesia_2025.svg/500px-CNBC_Indonesia_2025.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "tvri_world": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/TVRI-World.svg/500px-TVRI-World.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "cna_en": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/CNA_new_logo.svg/500px-CNA_new_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "aljazeera_en": "https://upload.wikimedia.org/wikipedia/commons/0/03/Al_Jazeera_Media_Network_Logo_design.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
    "dw_english": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/TV_Tokyo_logo_2023.svg/500px-TV_Tokyo_logo_2023.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "france24_en": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/France_24_logo_%282013%29.svg/500px-France_24_logo_%282013%29.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "nasa_tv": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/500px-NASA_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "redbull_tv": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/500px-CBS_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "trt_world": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/TRT_World_logo.svg/500px-TRT_World_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
}

# Regional TVRIs reuse the official TVRI logo
tvri_daerah = [
    "tvri_jabar", "tvri_jateng", "tvri_bali", "tvri_kaltim", "tvri_sulut",
    "tvri_sulsel", "tvri_aceh", "tvri_sumbar", "tvri_riau", "tvri_ntb",
    "tvri_ntt", "tvri_papua"
]
for td in tvri_daerah:
    OFFICIAL_LOGOS[td] = OFFICIAL_LOGOS["tvri_nasional"]

headers = {'User-Agent': 'S4RAS-Bot/1.0 (contact@s4ras.site)'}

print("=== Downloading Official Channel Logos ===")
for ch_id, url in OFFICIAL_LOGOS.items():
    dest = os.path.join(LOGOS_DIR, f"{ch_id}.png")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            with open(dest, "wb") as f:
                f.write(data)
            print(f"Downloaded official logo for {ch_id} ({len(data)} bytes)")
    except Exception as e:
        print(f"Error downloading logo for {ch_id}: {e}")

# 2. Download high-res landscape program thumbnails
PROGRAM_THUMBNAILS = {
    "kompas_news": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=640&q=80",
    "tvone_kabar": "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=640&q=80",
    "cnn_news": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640&q=80",
    "cnbc_finance": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&q=80",
    "tvri_culture": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=640&q=80",
    "cna_asia": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=640&q=80",
    "aljazeera_world": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80",
    "dw_europe": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&q=80",
    "france24_global": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=640&q=80",
    "nasa_space": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&q=80",
    "redbull_sports": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=640&q=80",
    "trt_dialogue": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=80"
}

print("=== Downloading Program Thumbnails ===")
for p_id, url in PROGRAM_THUMBNAILS.items():
    dest = os.path.join(THUMBNAILS_DIR, f"{p_id}.jpg")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            with open(dest, "wb") as f:
                f.write(data)
            print(f"Downloaded thumbnail {p_id}.jpg ({len(data)} bytes)")
    except Exception as e:
        print(f"Error downloading thumbnail {p_id}: {e}")

# 3. Generate Realistic Station-Specific EPG XML
STATION_PROGRAMS = {
    "kompas_tv": [
        ("06:00", "08:00", "Sapa Indonesia Pagi", "Program berita pagi terkini menyajikan dinamika politik, ekonomi, dan sosial masyarakat dengan liputan mendalam.", "kompas_news"),
        ("08:00", "10:00", "Kompas Pagi", "Kilas berita terkini dari berbagai daerah di tanah air bersama para jurnalis Kompas TV di lapangan.", "kompas_news"),
        ("10:00", "12:00", "Bincang Kita", "Dialog santai dan inspiratif membahas inovasi, ekonomi kreatif, dan profil tokoh berprestasi di Nusantara.", "kompas_news"),
        ("12:00", "13:30", "Kompas Siang Live", "Laporan berita aktual tengah hari merangkum peristiwa penting politik dan penegakan hukum hari ini.", "kompas_news"),
        ("13:30", "15:00", "Target", "Liputan investigasi mendalam mengangkat kasus-kasus kriminal dan misteri sosial tersembunyi.", "kompas_news"),
        ("15:00", "17:00", "Sapa Indonesia Siang", "Perkembangan situasi terkini di ibu kota dan penjuru tanah air secara interaktif.", "kompas_news"),
        ("17:00", "19:00", "Kompas Petang Terkini", "Rangkuman lengkap dinamika peristiwa nasional menjelang malam dengan analisis pakar.", "kompas_news"),
        ("19:00", "20:30", "Rosi", "Talkshow eksklusif bersama Rosianna Silalahi mengupas isu kontroversial bersama narasumber utama bangsa.", "kompas_news"),
        ("20:30", "22:00", "Kompas Malam", "Pemberitaan penutup hari mengupas refleksi kebijakan publik dan sorotan internasional.", "kompas_news"),
        ("22:00", "24:00", "Kilas Kompas Dunia", "Sorotan berita global dan peristiwa terpopuler mancanegara sepanjang hari.", "kompas_news")
    ],
    "tvone": [
        ("06:00", "08:30", "Kabar Pagi", "Siaran warta pagi mengulas fakta utama nasional, laporan lalu lintas, dan perkembangan geopolitik.", "tvone_kabar"),
        ("08:30", "10:00", "Apa Kabar Indonesia Pagi", "Talkshow pagi menghadirkan politisi, akademisi, dan praktisi membahas tajuk utama harian.", "tvone_kabar"),
        ("10:00", "12:00", "Ragam Perkara", "Liputan hukum dan kriminalitas kriminal aktual di kota-kota besar Indonesia.", "tvone_kabar"),
        ("12:00", "14:00", "Kabar Siang", "Pemberitaan komprehensif siang hari menyajikan breaking news langsung dari ruang sidang dan parlemen.", "tvone_kabar"),
        ("14:00", "16:00", "Bedah Kasus", "Analisis investigasi terhadap kasus hukum menonjol bersama pakar kriminologi.", "tvone_kabar"),
        ("16:00", "18:00", "Kabar Petang", "Warta berita petang menyajikan laporan komprehensif dari seluruh biro tvOne di Indonesia.", "tvone_kabar"),
        ("18:00", "20:00", "Catatan Demokrasi", "Debat tajam para tokoh nasional membahas isu politik terhangat dengan lugas dan kritis.", "tvone_kabar"),
        ("20:00", "22:00", "Indonesia Lawyers Club", "Forum diskusi hukum paling bergengsi membahas polemik konstitusi dan peradilan.", "tvone_kabar"),
        ("22:00", "24:00", "Kabar Malam", "Rangkuman peristiwa penting sebelum berganti hari beserta ulasan olahraga dunia.", "tvone_kabar")
    ],
    "cnn_indonesia": [
        ("06:00", "08:30", "CNN Indonesia Good Morning", "Semangat pagi menyajikan warta terkini, tren gaya hidup, dan informasi cuaca serta finansial.", "cnn_news"),
        ("08:30", "11:00", "CNN Newsroom Pagi", "Liputan berita berimbang dari dalam dan luar negeri dengan narasumber kredibel.", "cnn_news"),
        ("11:00", "13:00", "CNN Indonesia News Update", "Pembaruan berita cepat tengah hari mencakup politik, pasar modal, dan keamanan.", "cnn_news"),
        ("13:00", "15:00", "Inside Indonesia", "Dokumenter mendalam menelusuri kearifan lokal, teknologi hijau, dan komunitas inspiratif.", "cnn_news"),
        ("15:00", "17:00", "Connected", "Interaksi langsung jurnalis CNN dengan audiens membahas trending topic di media sosial.", "cnn_news"),
        ("17:00", "19:00", "CNN Newsroom Petang", "Analisis tajam peristiwa utama hari ini bersama analis politik terkemuka.", "cnn_news"),
        ("19:00", "20:30", "The Political Show", "Wawancara eksklusif mengupas manuver politik dan kebijakan strategis pemerintah.", "cnn_news"),
        ("20:30", "22:30", "CNN Prime News", "Berita utama malam hari menyajikan fakta akurat dengan standar jurnalistik global.", "cnn_news"),
        ("22:30", "24:00", "World News Today", "Rangkuman peristiwa dunia dari biro CNN di seluruh penjuru benua.", "cnn_news")
    ],
    "cnbc_indonesia": [
        ("06:00", "08:30", "Squawk Box Indonesia", "Panduan pembukaan pasar modal, analisis IHSG, komoditas, dan pergerakan rupiah.", "cnbc_finance"),
        ("08:30", "11:00", "Market Review", "Pembedahan portofolio saham dan rekomendasi analis terpercaya bagi investor ritel.", "cnbc_finance"),
        ("11:00", "13:30", "Power Lunch", "Ulasan sesi I perdagangan bursa dan wawancara dengan CEO korporasi terkemuka.", "cnbc_finance"),
        ("13:30", "15:30", "Closing Bell Indonesia", "Detik-detik penutupan bursa saham, analisis sektor pemenang, dan tren obligasi.", "cnbc_finance"),
        ("15:30", "17:30", "Profit", "Mengupas strategi bisnis korporasi, merger akuisisi, dan arah investasi masa depan.", "cnbc_finance"),
        ("17:30", "19:30", "Evening Up", "Dinamika makroekonomi, kebijakan suku bunga Bank Indonesia, dan inflasi global.", "cnbc_finance"),
        ("19:30", "21:30", "The CNBC Conversation", "Dialog inspiratif bersama tokoh bisnis papan atas dan menteri kabinet ekonomi.", "cnbc_finance"),
        ("21:30", "24:00", "Global Market Wrap", "Pembukaan pasar Wall Street dan dampaknya terhadap ekonomi Asia esok hari.", "cnbc_finance")
    ],
    "tvri_nasional": [
        ("06:00", "08:00", "Indonesia Membangun", "Inspirasi pembangunan infrastruktur dan pemberdayaan ekonomi pedesaan di penjuru negeri.", "tvri_culture"),
        ("08:00", "10:00", "Warta Nusantara", "Kabar berita dari 34 stasiun TVRI daerah menyuarakan denyut masyarakat lokal.", "tvri_culture"),
        ("10:00", "12:00", "Pesona Indonesia", "Dokumenter keindahan alam, budaya adat, dan warisan sejarah luhur Nusantara.", "tvri_culture"),
        ("12:00", "13:30", "Klik Indonesia Siang", "Warta berita nasional tengah hari yang mengedepankan jurnalisme publik yang edukatif.", "tvri_culture"),
        ("13:30", "15:30", "Mimbar Agama & Budaya", "Kajian lintas nilai moral, toleransi berbangsa, dan kearifan spiritual Nusantara.", "tvri_culture"),
        ("15:30", "17:30", "Pesona Nusantara", "Menjelajahi keanekaragaman flora, fauna, dan tradisi unik masyarakat kepulauan.", "tvri_culture"),
        ("17:30", "19:00", "Klik Indonesia Petang", "Siaran berita terpadu merangkum kebijakan nasional dan diplomasi Indonesia di dunia.", "tvri_culture"),
        ("19:00", "21:00", "Dunia Dalam Berita", "Program warta legendaris TVRI menyajikan peristiwa global dan hubungan luar negeri.", "tvri_culture"),
        ("21:00", "24:00", "Panggung Budaya", "Apresiasi pertunjukan seni tari, musik tradisional, dan teater nusantara.", "tvri_culture")
    ],
    "tvri_world": [
        ("06:00", "10:00", "World Today Morning", "English news coverage bringing Indonesian perspectives to the international community.", "tvri_culture"),
        ("10:00", "14:00", "Archipelago Today", "Discovering trade, tourism, and diplomatic initiatives across Southeast Asia.", "tvri_culture"),
        ("14:00", "18:00", "Talk to TVRI World", "In-depth discussions with ambassadors, global leaders, and cultural envoys.", "tvri_culture"),
        ("18:00", "24:00", "World Today Evening", "Comprehensive global analysis of geopolitical developments and green energy.", "tvri_culture")
    ],
    "cna_en": [
        ("06:00", "09:00", "Asia First", "Leading Asian morning news program covering politics, business, and tech innovation.", "cna_asia"),
        ("09:00", "13:00", "Asia Now", "Real-time updates on breaking stories across East, South, and Southeast Asia.", "cna_asia"),
        ("13:00", "17:00", "East Asia Tonight", "Focus on China, Japan, Korea, and Taiwan economic developments.", "cna_asia"),
        ("17:00", "21:00", "Singapore Tonight", "Prime time news highlighting regional ASEAN leadership and financial markets.", "cna_asia"),
        ("21:00", "24:00", "Insight", "Investigative documentary series delving into Asia's pressing social dilemmas.", "cna_asia")
    ],
    "aljazeera_en": [
        ("06:00", "09:00", "NewsHour Morning", "Unfiltered global journalism bringing voices from often overlooked communities.", "aljazeera_world"),
        ("09:00", "13:00", "The Stream", "Social media powered debates exploring human rights and community action.", "aljazeera_world"),
        ("13:00", "17:00", "Witness", "Award-winning independent documentaries showcasing inspiring human resilience.", "aljazeera_world"),
        ("17:00", "21:00", "Inside Story", "Expert panels debating today's most controversial international flashpoints.", "aljazeera_world"),
        ("21:00", "24:00", "Counting the Cost", "Global economic reality check on inflation, energy transition, and labor.", "aljazeera_world")
    ],
    "dw_english": [
        ("06:00", "10:00", "DW News Morning", "European perspective on world politics, digital rights, and European unity.", "dw_europe"),
        ("10:00", "14:00", "Conflict Zone", "Tough, direct interviews challenging decision-makers on their policies.", "dw_europe"),
        ("14:00", "18:00", "Eco Africa & Shift", "Environmental solutions, renewable energy breakthroughs, and tech trends.", "dw_europe"),
        ("18:00", "24:00", "The Day with DW", "In-depth recap of global diplomatic summits and cultural milestones.", "dw_europe")
    ],
    "france24_en": [
        ("06:00", "10:00", "The Newsroom Paris", "French international news network reporting live on European and African affairs.", "france24_global"),
        ("10:00", "14:00", "Perspective", "Engaging conversations with artists, authors, and philosophers on modern society.", "france24_global"),
        ("14:00", "18:00", "French Connections", "Deciphering the cultural habits, governance quirks, and gastronomy of France.", "france24_global"),
        ("18:00", "24:00", "Eye on Africa", "Comprehensive coverage of economic renaissance and politics across the African continent.", "france24_global")
    ],
    "nasa_tv": [
        ("06:00", "10:00", "Space Station Live", "Live views of Earth from the ISS, crew activities, and microgravity experiments.", "nasa_space"),
        ("10:00", "14:00", "NASA Science Live", "Astrophysicists explaining James Webb telescope discoveries and Mars rovers.", "nasa_space"),
        ("14:00", "18:00", "Artemis Progress Report", "Behind the scenes of lunar landers, Orion capsule tests, and deep space propulsion.", "nasa_space"),
        ("18:00", "24:00", "ISS Expedition Briefing", "Astronaut interviews and replays of historic spacewalks and rocket launches.", "nasa_space")
    ],
    "redbull_tv": [
        ("06:00", "10:00", "Rad Company & Action Sports", "Adrenaline packed downhill mountain biking, surfing, and urban freerunning.", "redbull_sports"),
        ("10:00", "14:00", "The Horn - Alpine Rescue", "Documentary following the heroes of Air Zermatt conducting extreme mountain rescues.", "redbull_sports"),
        ("14:00", "18:00", "URBEX Exploration", "Fearless climbers reaching the summits of world megastructures and cranes.", "redbull_sports"),
        ("18:00", "24:00", "Sound Waves & Festivals", "Live electronic music performances, breakdancing championships, and creator sessions.", "redbull_sports")
    ],
    "trt_world": [
        ("06:00", "10:00", "The Newsmakers", "Challenging conventional narratives with incisive reporting across continents.", "trt_dialogue"),
        ("10:00", "14:00", "Roundtable", "Lively debates examining how multilateral decisions impact emerging nations.", "trt_dialogue"),
        ("14:00", "18:00", "Straits Talk", "Focus on the geopolitical intersections of the Middle East, Caucasus, and Mediterranean.", "trt_dialogue"),
        ("18:00", "24:00", "Beyond the Headlines", "Deep human interest stories highlighting cultural diplomacy and humanitarian efforts.", "trt_dialogue")
    ]
}

# Regional TVRIs reuse tvri_nasional structure with regional flair
for td in tvri_daerah:
    loc = td.replace("tvri_", "").upper()
    STATION_PROGRAMS[td] = [
        (s[0], s[1], f"{s[2]} ({loc})", f"Warta siaran TVRI Daerah {loc}: {s[3]}", "tvri_culture")
        for s in STATION_PROGRAMS["tvri_nasional"]
    ]

# Build XMLTV
xml_lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!DOCTYPE tv SYSTEM "xmltv.dtd">',
    '<tv generator-info-name="S4RAS Live TV Engine v2.0">'
]

# Write channel definitions
for ch_id in STATION_PROGRAMS.keys():
    name = ch_id.replace("_", " ").title()
    xml_lines.append(f'  <channel id="{ch_id}">')
    xml_lines.append(f'    <display-name>{name}</display-name>')
    xml_lines.append(f'    <icon src="http://172.17.0.1:8099/logos/{ch_id}.png" />')
    xml_lines.append('  </channel>')

# Time slots for yesterday (-1), today (0), tomorrow (+1)
base_today = datetime.datetime.now(datetime.timezone.utc).date()

for offset in [-1, 0, 1]:
    target_date = base_today + datetime.timedelta(days=offset)
    date_str = target_date.strftime("%Y%m%d")
    
    for ch_id, progs in STATION_PROGRAMS.items():
        for start_str, end_str, title, desc, thumb_id in progs:
            s_hour, s_min = start_str.split(":")
            e_hour, e_min = end_str.split(":")
            
            # Start and stop timestamps in XMLTV format: YYYYMMDDHHMMSS +0700
            start_ts = f"{date_str}{s_hour}{s_min}00 +0700"
            if end_str == "24:00":
                next_date = (target_date + datetime.timedelta(days=1)).strftime("%Y%m%d")
                stop_ts = f"{next_date}000000 +0700"
            else:
                stop_ts = f"{date_str}{e_hour}{e_min}00 +0700"
                
            xml_lines.append(f'  <programme start="{start_ts}" stop="{stop_ts}" channel="{ch_id}">')
            xml_lines.append(f'    <title lang="id">{title}</title>')
            xml_lines.append(f'    <desc lang="id">{desc}</desc>')
            xml_lines.append(f'    <icon src="http://172.17.0.1:8099/thumbnails/{thumb_id}.jpg" />')
            xml_lines.append(f'    <category lang="en">News</category>')
            xml_lines.append('  </programme>')

xml_lines.append('</tv>')

with open(EPG_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(xml_lines))

print(f"Generated {EPG_FILE} successfully with {len(xml_lines)} lines!")
