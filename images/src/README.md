# Originals

The artwork everything served is derived from. Nothing in here is loaded by
the page.

| File | What it is | What comes from it |
|---|---|---|
| `../purrinter_logo.png` | The badge as supplied, 1254×1254 on white | `mark_round.png`, and from that every icon: `images/favicon.png`, `icon-192`, `icon-512`, `apple-touch-icon`, `/favicon.ico` |
| `mark_round.png` | The same badge with everything outside its ring made transparent | the icons above |
| `launch_banner.png` | The banner the token launched with, 2172×724 (3:1), pulled from thestonks.exchange by `.github/workflows/fetch-art.yml` | `images/banner_poster.webp` (the hero, at 1440) and `images/social.jpg` (the card, letterboxed to 1200×630) |
| `launch_mark.png` | The launch image from the same source — byte-identical to the supplied logo | nothing; kept as provenance |
| `../purr_header.mp4` | The header clip as supplied, 672×448 (3:2), 10.0s H.264 — **audio stripped**, `-c:v copy`, so the picture is the original's bit for bit | `images/hero_poster.webp`, its own first frame |
| `../footer.png` | The footer artwork as supplied, 2172×724 (3:1) | `images/footer.webp` — the file the page actually loads, 111KB against 1.69MB |
| `header_contact.jpg` | A contact sheet of the clip, one frame a second. A diagnostic, not an asset: the sandbox cannot decode H.264, and this was the only way to see what the header shows before type went over it | nothing |

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

**The hero clip is here now**, and both of those rules are met by
`.github/workflows/poster.yml`, which does the work on a runner because the
sandbox cannot: its Chromium is built without H.264 and its only ffmpeg is
Playwright's, configured `--disable-everything` but VP8 and PNG.

```bash
# hero poster — the FIRST frame, with no -ss. Seeking even slightly lands on
# a different picture, and poster and frame 0 have to be the same image or
# the hand-off to playback jumps.
ffmpeg -i images/purr_header.mp4 -frames:v 1 \
       -c:v libwebp -quality 88 -compression_level 6 images/hero_poster.webp

# the served footer, at full size. No downscale: 2172 wide is already under
# 2× for a 1440px viewport, so there is no resolution to give away.
ffmpeg -i images/footer.png -c:v libwebp -quality 86 -compression_level 6 \
       images/footer.webp

# the clip, with its audio dropped. The hero is muted and looping, so the
# AAC track was 210KB nobody could ever hear. -c:v copy: not re-encoded.
ffmpeg -i images/purr_header.mp4 -c:v copy -an -movflags +faststart out.mp4
```

**The footer artwork is 3:1 and must never be cropped SQUARER than that.**
Its two BASE blocks sit at the far left and right edges, so a box taller than
3:1 makes `object-fit: cover` take the sides — a 2:1 crop at phone width
showed the middle 67%, which is nothing but sky and floor, and the footer
rendered as a blank band. Crop it WIDER (the page uses 3.9:1 on desktop) and
the crop comes off the top, which is only sky.
