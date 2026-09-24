#!/usr/bin/env python3
"""Static file server with auto browser reload on file changes."""
from __future__ import annotations

import argparse
import hashlib
import mimetypes
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
WATCH_EXTS = {".html", ".css", ".js", ".json", ".md", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico"}
INJECT = b"""
<script>
(function(){
  var es = new EventSource('/__livereload');
  es.onmessage = function(){ location.reload(); };
  es.onerror = function(){ /* browser will retry */ };
})();
</script>
"""


def fingerprint(root: Path) -> str:
    h = hashlib.md5()
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in WATCH_EXTS:
            continue
        if any(part.startswith(".") and part not in {".nojekyll"} for part in path.parts):
            # skip .git and hidden dirs, keep .nojekyll
            if ".git" in path.parts:
                continue
        if ".git" in path.parts:
            continue
        try:
            st = path.stat()
            h.update(str(path.relative_to(root)).encode())
            h.update(str(int(st.st_mtime_ns)).encode())
            h.update(str(st.st_size).encode())
        except OSError:
            pass
    return h.hexdigest()


class LiveHandler(BaseHTTPRequestHandler):
    server_version = "ZhouyiLive/1.0"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/__livereload":
            self._sse()
            return
        self._static(parsed.path)

    def _sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        last = getattr(self.server, "fp", "")
        try:
            while True:
                cur = getattr(self.server, "fp", last)
                if cur != last:
                    last = cur
                    self.wfile.write(b"data: reload\n\n")
                    self.wfile.flush()
                time.sleep(0.4)
        except (BrokenPipeError, ConnectionResetError):
            return

    def _static(self, url_path: str):
        path = unquote(url_path.split("?", 1)[0])
        if path.endswith("/"):
            path += "index.html"
        if path == "/":
            path = "/index.html"
        # prevent path traversal
        rel = path.lstrip("/")
        file_path = (ROOT / rel).resolve()
        if not str(file_path).startswith(str(ROOT)):
            self.send_error(403)
            return
        if not file_path.is_file():
            self.send_error(404)
            return
        data = file_path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(file_path))
        ctype = ctype or "application/octet-stream"
        if file_path.suffix.lower() == ".html":
            if b"</body>" in data:
                data = data.replace(b"</body>", INJECT + b"</body>", 1)
            else:
                data = data + INJECT
            ctype = "text/html; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def watch_loop(server: ThreadingHTTPServer):
    server.fp = fingerprint(ROOT)
    while True:
        time.sleep(0.6)
        cur = fingerprint(ROOT)
        if cur != server.fp:
            server.fp = cur
            print("[live] files changed → notify browsers")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer((args.host, args.port), LiveHandler)
    httpd.fp = fingerprint(ROOT)
    threading.Thread(target=watch_loop, args=(httpd,), daemon=True).start()
    print(f"周易读书卡 live server: http://{args.host}:{args.port}")
    print(f"serving {ROOT} (auto-reload on change)")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
