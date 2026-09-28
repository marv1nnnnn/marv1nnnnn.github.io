# Fonts

The type is what a dubbed tape and its insert would have been printed, typed and written in.

- `courier-prime*.woff2`: Courier Prime (OFL). The typewriter: the interface, the deck, the insert's small print.
- `libre-caslon*.woff2`: Libre Caslon Text (OFL). The booklet's body text.
- `reenie-beanie.woff2`: Reenie Beanie (OFL). Ballpoint handwriting: the cassette label, track numbers, years in the margin.
- Each tape's titles, set by `html[data-tape]` in `app/globals.css`: haze the typewriter, 3am `bodoni-moda-italic.woff2` (Bodoni Moda, OFL), night bus `big-shoulders.woff2` (Big Shoulders Display, OFL), ritual `unifraktur-maguntia.woff2` (UnifrakturMaguntia, OFL), pressure `alfa-slab-one.woff2` (Alfa Slab One, OFL), bent `special-elite.woff2` (Special Elite, Apache 2.0).
- `chinese-serif.woff2`: Noto Serif CJK SC, subset to the CJK glyphs currently used by the site.

All are latin subsets from Google Fonts. Licenses: `OFL.txt`, `LICENSE-Special-Elite.txt`, `OFL-Noto-Serif-CJK.txt`. Regenerate the Noto subset when publishing new Chinese characters.
