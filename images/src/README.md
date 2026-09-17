# Originals

The artwork everything served is derived from. Nothing in here is loaded by
the page.

| File | What it is | What comes from it |
|---|---|---|
| `../purrinter_logo.png` | The badge as supplied, 1254×1254 on white | `mark_round.png`, and from that every icon: `images/favicon.png`, `icon-192`, `icon-512`, `apple-touch-icon`, `/favicon.ico` |
| `mark_round.png` | The same badge with everything outside its ring made transparent | the icons above |
| `launch_banner.png` | The banner the token launched with, 2172×724 (3:1), pulled from thestonks.exchange by `.github/workflows/fetch-art.yml` | `images/banner_poster.webp` (the hero, at 1440) and `images/social.jpg` (the card, letterboxed to 1200×630) |
| `launch_mark.png` | The launch image from the same source — byte-identical to the supplied logo | nothing; kept as provenance |

```bash
# icons — mask to the ring, then resize. A round badge on a white square is
# wrong on a dark tab strip, a home screen and a chat card.
# (The mask is drawn 4× oversized and downsampled, so its edge is antialiased.)

# hero and card, from the launch banner
python3 - <<'EOF'
from PIL import Image
src = Image.open('images/src/launch_banner.png').convert('RGB')
w, h = src.size
src.resize((1440, round(h * 1440 / w)), Image.LANCZOS) \
   .save('images/banner_poster.webp', 'WEBP', quality=88, method=6)
art = src.resize((1200, round(h * 1200 / w)), Image.LANCZOS)
card = Image.new('RGB', (1200, 630), (204, 210, 240))   # the banner's own border
card.paste(art, (0, (630 - art.height) // 2))
card.save('images/social.jpg', 'JPEG', quality=88, optimize=True)
EOF
```

**Letterbox the card, never crop it.** A 3:1 banner is wider than any card
shape: X crops a large-image card to 2:1 and takes the SIDES, which here means
the printer off one end and "PRINTING BASECAT" off the other.

**If a hero clip is ever added,** its first frame must be this poster, or the
hand-off from poster to playback jumps. Strip the audio — the hero is muted
and looping, so the track is dead weight.
