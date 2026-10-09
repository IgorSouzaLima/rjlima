#!/usr/bin/env python3
"""Image-to-video with Veo (fast tier), for the landing page backgrounds.

  python3 veo.py <input.png> <output.mp4> "<prompt>" [aspect 16:9|9:16]

Key: GEMINI_API_KEY from the profile .env in PERFIL_ENV. Never prints the key.
"""
import base64, json, os, sys, time, urllib.request

ENV = os.environ.get("PERFIL_ENV", "/root/.hermes/profiles/hora-aqui/.env")
MODEL = os.environ.get("VEO_MODEL", "veo-3.1-fast-generate-preview")
BASE = "https://generativelanguage.googleapis.com/v1beta"


def key():
    for line in open(ENV, encoding="utf-8"):
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip().strip("\"'")
    sys.exit("missing GEMINI_API_KEY")


def call(path, body=None):
    req = urllib.request.Request(f"{BASE}/{path}", data=json.dumps(body).encode() if body else None,
                                 headers={"x-goog-api-key": key(), "content-type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=120))


def main():
    src, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
    aspect = sys.argv[4] if len(sys.argv) > 4 else "16:9"
    img = base64.b64encode(open(src, "rb").read()).decode()
    mime = "image/png" if src.lower().endswith(".png") else "image/jpeg"
    op = call(f"models/{MODEL}:predictLongRunning", {
        "instances": [{"prompt": prompt, "image": {"bytesBase64Encoded": img, "mimeType": mime}}],
        "parameters": {"aspectRatio": aspect, "durationSeconds": 8, "resolution": "720p",
                       "negativePrompt": "text, captions, watermark, logo changes, distorted letters, people close-up, fast cuts"},
    })
    while not op.get("done"):
        time.sleep(10)
        op = call(op["name"])
    if op.get("error"):
        sys.exit(json.dumps(op["error"])[:400])
    uri = op["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
    req = urllib.request.Request(uri, headers={"x-goog-api-key": key()})
    open(out, "wb").write(urllib.request.urlopen(req, timeout=300).read())
    print(json.dumps({"ok": True, "model": MODEL, "file": out}))


main()
