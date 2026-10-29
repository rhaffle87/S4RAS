#!/usr/bin/env python3
"""
S4RAS SSO Login Theme Asset Hash & Manifest Generator
Generates content-hashed CSS and JS filenames, updates theme.properties,
and records asset hashes for immutable caching and Cloudflare edge cache-busting.
"""

import os
import glob
import hashlib
import json
from datetime import datetime, timezone

THEME_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "theme", "s4ras", "login"))
CSS_DIR = os.path.join(THEME_DIR, "resources", "css")
JS_DIR = os.path.join(THEME_DIR, "resources", "js")
THEME_PROPS = os.path.join(THEME_DIR, "theme.properties")
MANIFEST_FILE = os.path.join(THEME_DIR, "asset-manifest.json")

def hash_content(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:8]

def build_assets():
    print(f"Building SSO Theme Assets in: {THEME_DIR}")
    os.makedirs(CSS_DIR, exist_ok=True)
    os.makedirs(JS_DIR, exist_ok=True)

    # 1. Process CSS
    # Primary canonical source is s4ras-login.css (or latest s4ras-login-v*.css)
    css_src = os.path.join(CSS_DIR, "s4ras-login.css")
    if not os.path.exists(css_src):
        # Fallback to existing v4 if base not present yet
        v_files = glob.glob(os.path.join(CSS_DIR, "s4ras-login-v*.css"))
        if v_files:
            css_src = sorted(v_files)[-1]
        else:
            raise FileNotFoundError(f"No source CSS found in {CSS_DIR}")

    with open(css_src, "rb") as f:
        css_data = f.read()
    css_hash = hash_content(css_data)
    css_target_name = f"s4ras-login.{css_hash}.css"
    css_target_path = os.path.join(CSS_DIR, css_target_name)

    # Clean old hashed css files (matching s4ras-login.*.css but not s4ras-login.css)
    for f in glob.glob(os.path.join(CSS_DIR, "s4ras-login.*.css")):
        if f != css_src and f != css_target_path:
            os.remove(f)

    with open(css_target_path, "wb") as f:
        f.write(css_data)
    print(f"  [CSS] Generated: {css_target_name} (hash: {css_hash})")

    # 2. Process JS
    js_src = os.path.join(JS_DIR, "s4ras-pw.js")
    js_hash = ""
    js_target_name = ""
    if os.path.exists(js_src):
        with open(js_src, "rb") as f:
            js_data = f.read()
        js_hash = hash_content(js_data)
        js_target_name = f"s4ras-pw.{js_hash}.js"
        js_target_path = os.path.join(JS_DIR, js_target_name)

        # Clean old hashed js files
        for f in glob.glob(os.path.join(JS_DIR, "s4ras-pw.*.js")):
            if f != js_src and f != js_target_path:
                os.remove(f)

        with open(js_target_path, "wb") as f:
            f.write(js_data)
        print(f"  [JS]  Generated: {js_target_name} (hash: {js_hash})")

    # 3. Update theme.properties
    props_lines = [
        "parent=keycloak.v2",
        "locales=id,en",
        f"styles=css/{css_target_name}"
    ]
    if js_target_name:
        props_lines.append(f"scripts=js/{js_target_name}")

    with open(THEME_PROPS, "w", encoding="utf-8") as f:
        f.write("\n".join(props_lines) + "\n")
    print(f"  [CONF] Updated {THEME_PROPS}")

    # 4. Write asset-manifest.json
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "css_source": os.path.basename(css_src),
        "css_file": css_target_name,
        "css_hash": css_hash,
        "js_file": js_target_name,
        "js_hash": js_hash,
        "theme_properties": {
            "parent": "keycloak.v2",
            "styles": f"css/{css_target_name}",
            "scripts": f"js/{js_target_name}" if js_target_name else ""
        },
        "cloudflare_purge_targets": [
            f"https://sso.s4ras.site/resources/*/login/s4ras/css/{css_target_name}",
            f"https://sso.s4ras.site/resources/*/login/s4ras/js/{js_target_name}" if js_target_name else ""
        ]
    }
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"  [MANIFEST] Written to {MANIFEST_FILE}")

    return manifest

if __name__ == "__main__":
    build_assets()
