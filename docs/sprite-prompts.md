# Sprites de personagem (Google AI Studio)

O app procura os sprites em `src/assets/crawlers/` e escolhe sozinho o que mais combina com a aparência do jogador. Não precisa mexer em código: é só colocar os arquivos lá com o nome certo.
Sem arquivo nenhum, o app usa os 4 sprites originais (masculinos) de `src/assets/images/`.

## Nome dos arquivos

`{estilo}_t{tier}[_h{cabelo}][_c{corCabelo}][_s{pele}][_e{olhos}].png` (ou `.jpg` / `.webp`)

- estilo: `m` masculino, `f` feminino, `n` não binário
- tier: `1` Novice, `2` Brawler, `3` Hunter, `4` Warden
- o que faltar no nome vale para qualquer escolha (coringa). `f_t1.png` serve para todo mundo que escolheu feminino no tier 1.

Exemplos: `f_t1.png` · `f_t1_c3.png` (loiro) · `f_t2_h2_c3_s4.png` (cabelo longo, loiro, pele escura) · `n_t2_e1.png` (olhos azuis)

Índices (iguais aos do editor de aparência):

| Atributo | Índices |
|---|---|
| `h` cabelo | 0 curto · 1 espetado · 2 longo · 3 rabo de cavalo · 4 raspado · 5 moicano |
| `c` cor do cabelo | 0 preto · 1 castanho escuro · 2 castanho · 3 loiro · 4 ruivo · 5 prateado · 6 azul · 7 rosa |
| `s` pele | 0 muito clara · 1 clara · 2 morena · 3 castanha · 4 escura · 5 muito escura |
| `e` olhos | 0 castanho · 1 azul · 2 verde · 3 mel · 4 cinza · 5 âmbar · 6 violeta |

Altura e porte (baixo/alto, magro/musculoso) o app aplica sozinho com um ajuste de escala. Não gere variações disso.

## Como usar o AI Studio

1. Anexe os 4 sprites atuais (`src/assets/images/crawler_tier_*.jpg`) como **referência de estilo** em toda conversa.
2. **Fase 1:** gere as 8 bases (feminino e não binário, tiers 1 a 4) com os prompts abaixo. Se quiser também masculino padronizado, gere `m_t1` a `m_t4` com o mesmo bloco.
3. **Fase 2:** para cada base, peça variações **editando a própria imagem** (prompt de edição abaixo). Editar mantém pose, traço e enquadramento iguais; gerar do zero muda o personagem.
4. Salve com o nome da tabela acima em `src/assets/crawlers/`.

Prioridade das variações (o app combina por arquivo; se não existir a combinação exata, usa a mais próxima):
1. cor do cabelo (`c0` a `c7`) nos tiers 1 e 2, nos 3 estilos
2. tom de pele (`s0` a `s5`) nos tiers 1 e 2
3. estilo de cabelo (`h0` a `h5`) e cor dos olhos (`e0` a `e6`) nos tiers 1 e 2
4. Tiers 3 e 4 têm elmo cobrindo o rosto: só a base basta.

## Bloco de estilo (cole antes de todo prompt)

> Pixel art character sprite in the exact same art style as the attached reference images: chunky visible pixels, thick black outline, limited palette with dithered shading, dark-fantasy dungeon-crawler tone. Full body, single character, 3/4 front view facing slightly right, dynamic fighting stance. Flat very dark navy background (#0b1017), no scenery, no text, no logo, no watermark. Square 1024x1024, character centered, feet in the lower third, about 60% of the canvas height. Original character design, not a copy of any existing franchise character.

## Fase 1: bases

**Feminino**

- `f_t1` Novice: Young woman, scrappy beginner fighter. Messy shoulder-length brown hair, determined expression. Open worn leather jacket over a plain tan tank top, mismatched gym shorts, barefoot. Hands wrapped in rough cloth with small metal spikes. Athletic build.
- `f_t2` Brawler: Woman, street-hardened brawler. Spiky ginger-brown hair with an orange headband trailing behind. Patched dark brown long coat, one big steel shoulder pad, studded fingerless gauntlet, olive combat pants, knee guards, wrapped boots. Curved steel knife in the right hand.
- `f_t3` Hunter: Woman, armored monster hunter. Dark steel helmet with a glowing green visor, tattered dark blue-purple cloak, plated gray armor with glowing violet runes, brown leather tabard, steel gauntlets and boots. Long curved glowing red blade. Armor follows a feminine silhouette (narrower waist), not exaggerated.
- `f_t4` Warden: Woman, apex dungeon warden. Black horned helm with a glowing gold visor, black plate armor with glowing gold runes, long dark cloak with orange trim, rune banner at the waist. Huge sword wreathed in yellow-green flame. Feminine silhouette, imposing and heroic.

**Não binário:** use os mesmos 4 prompts, trocando a primeira frase por "Androgynous character, slim-to-medium build, gender-ambiguous face and silhouette, no exaggerated chest or shoulders." Mantenha roupa, armadura, arma e cores. Arquivos `n_t1` a `n_t4`.

## Fase 2: variações (edição de imagem)

Anexe a base e use:

> Edit the attached image. Change ONLY: {MUDANÇA}. Keep everything else pixel-identical: pose, outline, clothing, armor, weapon, framing, background and art style.

Valores de {MUDANÇA}:
- cor do cabelo: `hair color to {blonde | black | dark brown | brown | red | silver | blue | pink}`
- pele: `skin tone to {very fair | light | tan | brown | dark | very dark}`
- olhos: `eye color to {brown | blue | green | hazel | gray | amber | violet}`
- cabelo: `hairstyle to {short | spiky | long | ponytail | buzz cut | mohawk}`

Para combinar (ex.: `f_t2_h2_c3_s4`), parta da base e aplique as edições em sequência, uma por vez.

## Aviso sobre os sprites atuais

Os 4 sprites masculinos atuais lembram bastante o Dungeon Crawler Carl (por exemplo a cueca com corações do tier 1). Os prompts acima criam personagens originais no mesmo estilo visual. Vale trocar os masculinos também na limpeza de direitos que você já planejou.
