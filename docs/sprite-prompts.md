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

## Problema da primeira rodada

O AI Studio devolveu quase cópias dos sprites masculinos nos tiers 2 a 4 (e feminino e não binário quase iguais no tier 1). Causa: os sprites masculinos anexados como referência foram copiados em vez de só servirem de estilo. Esta versão corrige assim:

- a referência é só de **estilo** (pixels, contorno, paleta, fundo), nunca de personagem;
- cada personagem tem um **design próprio e diferente por escrito** (cabelo, silhueta, roupa, cores);
- há uma lista **proibida** (o que não pode copiar) e uma **checagem** antes de aceitar a imagem.

## Como usar o AI Studio

1. Anexe os 4 sprites masculinos atuais (`src/assets/images/crawler_tier_*.jpg`) **somente** como referência de estilo, com a frase de aviso abaixo. Se o AI Studio continuar copiando o personagem, remova as referências e use só o bloco de estilo em texto.
2. **Fase 1:** gere uma imagem por vez, uma conversa por imagem (evita contaminação entre personagens). Ordem: `f_t1` a `f_t4`, depois `n_t1` a `n_t4`.
3. **Checagem antes de aceitar** (rejeite e gere de novo se falhar):
   - o rosto, o cabelo e a roupa são visivelmente diferentes do sprite masculino do mesmo tier;
   - a silhueta mudou (ombros, cintura, quadril, comprimento do casaco ou da capa);
   - paleta dominante diferente da masculina em pelo menos 2 peças;
   - o feminino e o não binário do mesmo tier não parecem o mesmo personagem.
4. **Fase 2:** variações por edição (abaixo). Salve tudo em `src/assets/crawlers/` com os nomes da tabela.

## Bloco de estilo (cole antes de todo prompt)

> Pixel art character sprite. Use the attached images ONLY as a reference for the rendering style: chunky visible pixels, thick black outline, limited palette with dithered shading, dark-fantasy dungeon-crawler tone. Do NOT copy any attached character: new face, new hairstyle, new clothing, new colors, new silhouette. Full body, single character, 3/4 front view facing slightly right, dynamic stance. Flat very dark navy background (#0b1017), no scenery, no text, no logo, no watermark. Square 1024x1024, character centered, feet in the lower third, about 60% of the canvas height. Original character design, not a copy of any existing franchise character.

**Negative (cole no fim de todo prompt):**

> Avoid: copying the reference characters, identical pose and outfit to the reference, the same orange headband, the same brown long coat, the same helmet shape, hearts pattern shorts, text, logos, realistic or 3D rendering, smooth gradients, anti-aliased blur, multiple characters, background scenery.

## Fase 1: bases (designs próprios, cada um diferente do masculino)

O masculino de referência por tier: T1 jaqueta de couro e bermuda, T2 bandana laranja e casaco marrom, T3 elmo verde com capa azul e lâmina vermelha, T4 elmo preto com chifres e espada de chamas. **Nada disso pode aparecer nos novos.**

**Feminino**

- `f_t1` Novice: Young woman beginner fighter, athletic build, **dark auburn hair in a high ponytail with loose bangs**, small scar on the cheek. **Fitted sleeveless gray training top and cropped olive-green cargo pants with tape-wrapped shins**, fingerless gym gloves with taped knuckles, worn sneakers. Fighting stance with fists raised. Palette: gray, olive, auburn.
- `f_t2` Brawler: Woman street brawler, **short dark-teal bob haircut with a red bandana tied at the neck (not on the head)**. **Cropped charcoal bomber jacket open over a burgundy tank top, studded belt, fitted black leggings with knee guards**, spiked steel bracers, **two short curved daggers (one in each hand)**. Narrower waist, slimmer silhouette than a bulky coat. Palette: charcoal, burgundy, teal.
- `f_t3` Hunter: Woman monster hunter in light, form-fitting scale armor. **Open-face hood in dark crimson with a white mask under the eyes (face partially visible, determined eyes)**, a short hip-length cape in deep green, bronze shoulder guards, glowing amber runes on the chest, **fitted waist, armored skirt-style tassets over leggings**, tall bronze boots. Weapon: **a glowing blue-white crescent glaive (not a red blade)**. Palette: crimson, bronze, deep green, ice blue.
- `f_t4` Warden: Woman apex warden in ornate white-and-silver plate with gold trim, **a crowned winged helm (swept-back wings instead of horns) with a glowing cyan visor**, **flowing white-and-violet cloak**, plate with a defined waist and flared hip plates, rune sash at the hip, **tall banner-spear wreathed in violet-white fire (not a sword of green-yellow flame)**. Palette: white, silver, gold, violet, cyan.

**Não binário** (deve parecer outra pessoa do que o feminino do mesmo tier, e do masculino)

- `n_t1` Novice: Androgynous beginner fighter, lean build. **Very short buzzed hair with a shaved side undercut, dyed pale blue top**. **Oversized hooded windbreaker in teal and yellow tied at the waist, loose black track pants, mismatched high-top sneakers**, bandaged hands. Palette: teal, yellow, black, pale blue.
- `n_t2` Brawler: Androgynous brawler, lean build. **Wavy shoulder-length lilac hair under a dark cap**, small hoop earring. **Layered long open coat in forest green over a loose cream shirt, wide belt, baggy dark trousers**, leather boots, chain-wrapped fists and **a short iron kama sickle**. Palette: forest green, cream, lilac, iron gray.
- `n_t3` Hunter: Androgynous hunter, lean build. **Full face hidden by a smooth pale-bone mask with a single glowing violet slit**, long hooded cloak in dusk orange with a patchwork of bone plates, **straight tunic silhouette with no emphasized chest or waist**, wrapped forearms, **dual curved bone hooks (glowing orange edges)**. Palette: bone white, dusk orange, violet.
- `n_t4` Warden: Androgynous apex warden in sleek obsidian-and-silver armor, **a smooth crested helm with a glowing magenta visor and a flowing horsehair crest**, straight geometric plate with no gendered shaping, **a long split-tail tabard in silver and magenta**, **a tall glowing prism staff topped with a floating magenta crystal (staff, not sword)**. Palette: obsidian, silver, magenta.

**Se mesmo assim copiar o masculino:** gere sem nenhuma imagem anexada, só com o bloco de estilo em texto + o prompt do personagem. Depois, se quiser o traço mais próximo, use a edição abaixo no próprio resultado, nunca no masculino.

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
