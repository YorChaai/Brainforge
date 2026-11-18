import base64
import pathlib

root = pathlib.Path(__file__).resolve().parent
html = root.joinpath("index.html").read_text("utf-8")
css = root.joinpath("styles.css").read_text("utf-8")
prompts = root.joinpath("prompts.js").read_text("utf-8")
app = root.joinpath("app.js").read_text("utf-8")
b64 = "data:image/png;base64," + base64.b64encode(root.joinpath("logo.png").read_bytes()).decode("ascii")

html = (
    html.replace('href="logo.png"', f'href="{b64}"')
    .replace('src="logo.png"', f'src="{b64}"')
    .replace('<link rel="stylesheet" href="styles.css" />', f"<style>\n{css}\n</style>")
    .replace('<script src="prompts.js" charset="utf-8"></script>', f"<script>\n{prompts}\n</script>")
    .replace('<script src="app.js" charset="utf-8"></script>', f"<script>\n{app}\n</script>")
)

targets = [
    root.joinpath("BrainForge_HP_Standalone.html"),
    root.joinpath("mobile_app", "assets", "brainforge.html"),
]

for out_path in targets:
    if out_path.parent.exists():
        out_path.write_text(html, "utf-8")
        print(f"Built {out_path} ({out_path.stat().st_size} bytes)")

