# Arte do mundo: bosses, baús, cenários, ícones, receitas (Google AI Studio)

Pacote para aproveitar a cota grátis. Regras que aprendemos:
- Anexe 2 a 3 imagens atuais **só como referência de estilo** (o boss da mantis, o baú e o fundo da floresta, em `src/assets/images/`).
- **Uma conversa por imagem**, para uma não contaminar a outra.
- Cada imagem tem nome de arquivo fixo (abaixo). Salve na pasta indicada e me avise: eu ligo no app.

## Bloco de estilo (cole antes de todo prompt)

> Pixel art in the exact rendering style of the attached reference images: chunky visible pixels, thick black outline, limited palette with dithered shading, dark-fantasy dungeon-crawler tone. Use the references ONLY for rendering style; do not copy their subject. Original design, not a copy of any existing franchise creature or item. No text, no logo, no watermark, no UI.

**Negative (cole no fim de todo prompt):**

> Avoid: copying the reference subject, text, logos, watermarks, realistic or 3D rendering, smooth gradients, blur, anti-aliasing, multiple subjects, photo style.

---

## 1. Bosses (8 imagens) — `src/assets/world/boss_N.jpg`

Quadrado 1024x1024, fundo liso `#0b1017`, criatura inteira centrada, 3/4 de frente, postura de ataque, ocupa cerca de 70% da altura. Tom: ameaçador mas legível, silhueta forte.

- `boss_2` **Crimson-Eyed Stalker**: predador esguio de quatro patas, pelagem negra com costelas à mostra, olhos vermelhos brilhantes, restos de ruína de pedra enroscados no pelo.
- `boss_3` **Gnarled Bog Treant**: árvore antiga e retorcida de pântano, braços de raiz, musgo e cogumelos luminosos verdes, rosto de casca com olhos âmbar.
- `boss_4` **Chitin Dreadnought**: besouro gigante blindado, carapaça escura com placas serrilhadas, mandíbulas enormes, brilho laranja entre as placas.
- `boss_5` **Ember Hound Matriarch**: cão infernal enorme de pelo escuro com brasas, crina de fogo, presas, olhos de brasa.
- `boss_6` **Bone-Bark Colossus**: golem de ossos e casca de árvore, crânio de cervo como cabeça, galhos como chifres, ombros de pedra.
- `boss_7` **Mirror-Eyed Serpent**: serpente longa enrolada, escamas azul-prateadas, olhos espelhados, capuz aberto.
- `boss_8` **Storm-Hide Boar**: javali colossal de pele cinza-azulada com faíscas de raio, presas de marfim, cicatrizes.
- (`boss_1` já existe: Razor Mantis.)

## 2. Baús de loot (4 imagens) — `src/assets/world/chest_{bronze|silver|gold|platinum}.jpg`

Quadrado 1024x1024, fundo liso `#0b1017`, baú fechado centrado, mesma posição e escala nas 4 imagens. Mesmo desenho do baú de referência, só trocando o material e o brilho:
- `chest_bronze`: madeira escura com reforços de bronze.
- `chest_silver`: madeira com reforços de prata polida.
- `chest_gold`: reforços de ouro com gemas vermelhas e brilho dourado discreto.
- `chest_platinum`: reforços branco-azulados, gemas ciano flutuando em volta, brilho forte.

## 3. Cenários (4 imagens) — `src/assets/world/bg_N.jpg`

Paisagem 16:9, 1536x864, sem personagens, sem texto, escura e com a parte de baixo mais calma (o chão), para sobrepor sprites. Mesmo estilo e iluminação crepuscular da floresta de referência.
- `bg_2` **Ruined Tower Perimeter**: muralhas de pedra em ruínas e uma torre quebrada ao fundo, hera, céu roxo escuro.
- `bg_3` **Mist-Dithered Hollow**: vale baixo de névoa, árvores finas, pântano com luzes verdes.
- `bg_4` **Deep Hunting Grounds**: floresta densa e fechada, raízes enormes, olhos vermelhos mal visíveis entre as árvores.
- `bg_1` já existe (floresta). Se sobrar cota, `bg_5` **Ember Caverns**: caverna com rios de brasa e cristais laranja.

## 4. Ícones de equipamento (21 imagens) — `src/assets/world/gear/{id}.jpg`

Quadrado 512x512, fundo liso `#0b1017`, o item inteiro, centrado, em ângulo levemente diagonal, ocupa 70% do quadro, sem mão nem personagem. Mesmo estilo nas 21 imagens. Os 3 itens marcados com (*) ganharam **nome novo** original; use o nome novo.

Armas:
- `wpn_spiked_wraps` Spiked Knuckle Wraps: faixas de pano sujas com pregos nos nós dos dedos.
- `wpn_iron_gauntlets` Iron-Studded Gauntlets: luvas de ferro grossas com rebites.
- `wpn_serrated_blade` Serrated Hunting Knife: faca de caça de lâmina serrilhada.
- `wpn_mantis_scythe` Crimson Mantis Scythe: foice curva de quitina vermelha com brilho.
- `wpn_blazing_greatsword` Emerald-Flame Greatsword: espada grande com chama verde-amarela.
- `wpn_goblin_bomb_glove` (*) **Brass Ember Gauntlet**: manopla de latão com tubo de ignição e faíscas, cheiro de enxofre.

Armaduras:
- `arm_leather_jacket` Scuffed Leather Jacket: jaqueta de couro gasta.
- `arm_reinforced_coat` Pauldron Trench Coat: sobretudo com ombreiras rebitadas.
- `arm_runed_obsidian` Runed Shadow Cloak: capa crepuscular esfarrapada.
- `arm_warden_plate` Floor Warden Plate: peitoral de obsidiana com runas de brasa.
- `arm_heart_boxers_cape` (*) **Crimson Crest Cloak**: capa de guerra carmesim com um brasão de escudo dourado (sem corações).

Acessórios:
- `acc_tousled_grit` Crawler's Grit: um par de pés descalços com faixas nos tornozelos, simbolizando "sem capacete".
- `acc_amber_headband` Torchbearer Bandana: bandana âmbar dobrada.
- `acc_emerald_visor` Night-Stalker Visor: viseira verde luminosa.
- `acc_horned_crown` Horned Obsidian Crown: coroa de obsidiana com chifres.
- `acc_donut_tiara` (*) **Jeweled Familiar Collar**: coleira de joias vistosa com pingente de cristal.

Auras (efeito, sem objeto: um anel/halo de luz no centro do quadro):
- `aur_none` Twilight Mist: névoa azul fria suave.
- `aur_torch_ember` Torchlight Ember: halo âmbar quente com faíscas.
- `aur_mantis_crimson` Mantis Hunter Crimson: halo vermelho de perigo.
- `aur_forest_emerald` Venom Mist Emerald: névoa esmeralda bioluminescente.
- `aur_celestial_gold` Legendary Loot Gold: halo dourado radiante.

## 5. Ilustrações das receitas (19 imagens) — `src/assets/recipes/{id}.jpg`

Retangular 4:3, 1024x768, pixel art de **comida** vista de cima em 3/4, prato ou copo centrado, fundo escuro liso `#0b1017`, cores apetitosas. Substituem as fotos emprestadas.

`rec_starter_panqueca` pilha de panquecas simples com fio de mel · `rec_starter_mingau_aveia` tigela de mingau de aveia com banana e canela · `rec_starter_crepioca_banana` crepioca dobrada com banana fatiada · `rec_starter_ovos_mexidos` ovos mexidos com tomate e pão · `rec_starter_bolo_cenoura` fatia de bolo de cenoura com cobertura de chocolate · `rec_starter_vitamina` copo de vitamina de banana com aveia · `rec_starter_iogurte_granola` tigela de iogurte com granola e frutas · `rec_starter_tapioca_queijo` tapioca dobrada com queijo derretido · `rec_starter_arroz_feijao_frango` prato com arroz, feijão e frango grelhado · `rec_starter_carne_moida_macarrao` macarrão com carne moída · `rec_starter_pure_frango` frango desfiado com purê de batata-doce · `rec_starter_omelete` omelete de queijo e tomate · `rec_starter_atum_salada` salada de atum com arroz · `rec_starter_panqueca_banana` panquequinhas de banana com canela · `rec_starter_brownie_fit` quadrados de brownie de chocolate escuro · `rec_starter_panqueca_proteica` panquecas proteicas de aveia com frutas vermelhas · `rec_starter_mousse_whey` taça de mousse de chocolate com iogurte grego · `rec_starter_mug_cake_whey` bolo de caneca de chocolate · `rec_starter_shake_proteico` copo alto de shake de banana com pasta de amendoim.

## 6. Texto (sem imagem, rápido): nomes originais

Prompt de texto para o mesmo AI Studio:

> I'm building an original 8-bit dungeon fitness game. Give me original English names (2 to 3 words) and one-line descriptions for: 20 enemies/bosses by floor theme (forest, ruins, bog, caverns), 20 achievements for fitness habits (workouts, streaks, nutrition, hydration), and 12 crawler class names. Avoid any names, terms or catchphrases from the Dungeon Crawler Carl books or any other existing franchise. Return JSON arrays with fields name, description.

## Depois

Quando as imagens estiverem prontas em `src/assets/world/` e `src/assets/recipes/`, me avise com a lista. Eu ligo: bosses por semana, baú por raridade, cenário por boss, ícones nas telas de Armory, receitas, e aplico os nomes novos dos 3 equipamentos.
