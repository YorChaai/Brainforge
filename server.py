import ctypes
import http.server
import json
import os
import socket
import sys
import threading
import time
import webbrowser

PORT = 8765
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def is_target_browser_foreground() -> bool:
    """Verify the active foreground window is a web browser or AI tab before sending Ctrl+V."""
    try:
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return False
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return False
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buf, length + 1)
        title = buf.value.lower()
        allowed_keywords = (
            "gemini",
            "chatgpt",
            "chrome",
            "edge",
            "brave",
            "firefox",
            "opera",
            "vivaldi",
        )
        return any(k in title for k in allowed_keywords)
    except Exception:
        return False


def send_ctrl_v_native() -> bool:
    """Send Ctrl+V keystroke natively via Win32 user32.keybd_event only if browser window is focused."""
    try:
        if not is_target_browser_foreground():
            return False
        user32 = ctypes.windll.user32
        VK_CONTROL = 0x11
        VK_V = 0x56
        KEYEVENTF_KEYUP = 0x0002

        user32.keybd_event(VK_CONTROL, 0, 0, 0)
        user32.keybd_event(VK_V, 0, 0, 0)
        time.sleep(0.04)
        user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
        return True
    except Exception:
        return False


def auto_paste_after_delay(delay_sec: float = 3.8) -> None:
    def _worker():
        time.sleep(max(1.0, delay_sec))
        # Poll up to 4 seconds for the browser window to become the active foreground window
        deadline = time.time() + 4.0
        while time.time() < deadline:
            if send_ctrl_v_native():
                break
            time.sleep(0.35)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()


class DualStackServer(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


class BrainForgeHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".webmanifest": "application/manifest+json; charset=utf-8",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/auto-paste":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                payload = json.loads(raw)
            except Exception:
                payload = {}

            delay_sec = float(payload.get("delay", 3.8))
            auto_paste_after_delay(delay_sec)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    os.chdir(BASE_DIR)
    url = f"http://localhost:{PORT}/index.html"
    print(f"BrainForge.AI Pro berjalan di {url}")
    print("Encoding UTF-8 & Auto-Paste AKTIF.")
    if "--no-open" not in sys.argv:
        webbrowser.open(url)
    try:
        server = DualStackServer(("::", PORT), BrainForgeHandler)
    except Exception:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), BrainForgeHandler)

    with server as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
