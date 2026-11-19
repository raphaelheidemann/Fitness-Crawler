# Sprite prompts (AI Studio)

Goal: 8 new images, 4 tiers x 2 styles (feminine, non-binary), matching the existing masculine set in `src/assets/images/`.
Generate each tier in one chat so the style stays consistent. Attach the matching existing masculine image as a reference when the tool allows.

## Shared style block (paste before every prompt)

> 8-bit / 16-bit pixel art character sprite, full body, single character, facing slightly right, 3/4 front view, chunky visible pixels, thick black outline, limited palette, dithered shading. Flat very dark navy background (#0b1017), no scenery, no text, no watermark. Square 1024x1024, character centered, feet near the bottom third, about 60% of the canvas height. Dark-fantasy dungeon-crawler tone, same art style as the reference image.

## Feminine

**Tier 1 – Novice** (`crawler_f_tier_1`)
> Young woman, scrappy beginner fighter. Messy shoulder-length brown hair, determined expression. Open worn leather jacket over a plain tan tank top, mismatched gym shorts, barefoot. Hands wrapped in rough cloth with small metal spikes, fighting stance. Athletic build.

**Tier 2 – Brawler** (`crawler_f_tier_2`)
> Woman, street-hardened brawler. Spiky ginger-brown hair with an orange headband trailing behind. Patched dark brown long coat, one big steel shoulder pad, studded fingerless gauntlet, olive combat pants, knee guards and wrapped boots. Holds a curved steel knife in the right hand.

**Tier 3 – Hunter** (`crawler_f_tier_3`)
> Woman, armored monster hunter. Dark steel helmet with a glowing green visor, tattered dark blue-purple cloak flowing behind, plated gray armor with glowing violet runes, brown leather tabard, steel gauntlets and boots. Wields a long curved glowing red blade. Armor shaped to a feminine silhouette (narrower waist, no exaggeration).

**Tier 4 – Warden** (`crawler_f_tier_4`)
> Woman, apex dungeon warden. Black horned helm with a glowing gold visor, black plate armor with glowing gold runes, long dark cloak with orange trim, rune banner hanging at the waist. Wields a huge sword wreathed in yellow-green flame. Armor with a feminine silhouette, imposing and heroic.

## Non-binary

Same four prompts, but replace the character line with an androgynous character: slim-to-medium build, gender-ambiguous face and silhouette, no exaggerated chest or shoulders. Keep clothing, armor, weapon and colors identical to the feminine version. Save as `crawler_n_tier_1` … `crawler_n_tier_4`.

## Hooking them up

1. Convert to JPG (or keep PNG), put the 8 files in `src/assets/images/`.
2. In `src/lib/crawlerEngine.ts`, add two records next to `CRAWLER_SPRITES` (tier -> path) and use them in `CRAWLER_SPRITES_BY_STYLE`:

```ts
export const CRAWLER_SPRITES_FEMININE = { 1: '/src/assets/images/crawler_f_tier_1.jpg', /* 2, 3, 4 */ };
export const CRAWLER_SPRITES_NEUTRAL = { 1: '/src/assets/images/crawler_n_tier_1.jpg', /* 2, 3, 4 */ };
// CRAWLER_SPRITES_BY_STYLE = { masculine: CRAWLER_SPRITES, feminine: CRAWLER_SPRITES_FEMININE, neutral: CRAWLER_SPRITES_NEUTRAL }
```
