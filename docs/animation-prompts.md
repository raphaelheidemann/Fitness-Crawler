# Poses e animações do avatar (Google AI Studio)

Para a ideia "Avatar vivo": o personagem acompanha o usuário na aba Gym e na aba Dieta e reage às ações. Animação aqui = poucos quadros estáticos alternados em FPS baixo (2 a 4 por segundo), estilo 8-bit.

Regra de ouro: **editar o sprite que já existe**, nunca gerar do zero. O personagem tem que ser idêntico em todas as poses (rosto, cabelo, roupa, armadura, cores, contorno). É o oposto do que fizemos nos sprites base.

## Nome dos arquivos

Pasta: `src/assets/crawlers/poses/`

`{estilo}_t{tier}_{pose}_{quadro}.jpg` — estilo `m`, `f` ou `n`; tier `1` a `4`; quadro `1`, `2`, ...

Exemplos: `f_t1_crossed_1.jpg` · `n_t3_thumbs_2.jpg` · `m_t2_chef_1.jpg`

Os sprites masculinos originais (`crawler_tier_*.jpg`) são a base de `m_t1` a `m_t4`.

## Poses

| pose | onde aparece | quadros |
|---|---|---|
| `crossed` | Gym: personagem parado de braços cruzados, acompanhando o treino | 2 (respiração) |
| `chef` | Dieta: personagem com chapéu de cozinheiro no canto | 2 (respiração) |
| `thumbs` | Dieta: joinha ao marcar uma refeição (com o chapéu) | 2 |
| `walk` | Gym: caminhando pela trilha conforme as séries avançam | 4 |
| `fist` | Gym: soquinho ao marcar uma série | 2 |
| `victory` | Gym: ao finalizar o treino | 2 |

**Fase A (começar por aqui):** `crossed` (2), `chef` (2), `thumbs` (2) = 6 imagens por sprite.
**Fase B:** `walk` (4), `fist` (2), `victory` (2) = 8 imagens por sprite.

Teste primeiro com **um sprite só** (sugestão: `f_t1`) para validar a consistência antes de gerar os 12.

## Como usar

1. Uma conversa por sprite. Anexe **somente** o sprite que vai ser editado (ex.: `f_t1.jpg`) e cole o bloco de edição abaixo + a pose.
2. Gere um quadro por vez. O quadro 2 deve ser editado a partir do quadro 1 aceito, não do sprite original.
3. Checagem antes de aceitar:
   - o personagem é a mesma pessoa (rosto, cabelo, roupa e cores iguais);
   - os pés estão **exatamente na mesma posição** e a escala é a mesma (senão ele "pula" ao alternar quadros);
   - fundo idêntico (#0b1017) e contorno preto como no original;
   - a diferença entre os quadros 1 e 2 é pequena (1 a 2 blocos de pixel).
4. Se o AI Studio mudar o personagem, regere com a frase: "The character must be pixel-identical to the attached image except for the pose".

## Bloco de edição (cole antes de toda pose)

> Edit the attached pixel art sprite. The character must stay pixel-identical to the attached image: same face, hairstyle, outfit, armor, weapon design, colors, palette, black outline, pixel size and rendering style. Keep the same canvas (1024x1024), the same flat dark navy background (#0b1017), the same character scale, and the feet planted at exactly the same position on the canvas. Change ONLY the pose and the items listed below. No text, no logo, no watermark, no extra characters, no scenery. Keep the weapon in the design but lower it, hold it in the other hand or rest it against the body when the pose needs a free hand.

**Negative (cole no fim):**

> Avoid: redesigning the character, changing hair, face, outfit or colors, different pixel size, smooth gradients, blur, 3D or realistic rendering, a different background, shifting or resizing the character, motion blur, extra limbs.

## Poses (cole depois do bloco de edição)

**crossed_1:** Pose: standing upright with both arms crossed over the chest, relaxed confident posture, weight slightly on one leg, head facing slightly right.
**crossed_2:** Same as crossed_1 but breathing: the whole torso and head one pixel block higher, shoulders one pixel block raised. Everything else identical.

**chef_1:** Same standing idle pose as crossed_1 (arms crossed), plus a small white pixel-art chef's hat (toque) sitting on top of the head. If the character wears a helmet, put the toque on top of the helmet, sitting between the horns or the crest, keeping the helmet visible.
**chef_2:** Same as chef_1 with the breathing shift: torso and head one pixel block higher, the toque moves with the head.

**thumbs_1:** Keep the chef's hat. Pose: the right arm extended slightly forward giving a clear thumbs-up with the hand closed and the thumb up, big readable hand, friendly confident stance, weapon lowered or in the left hand.
**thumbs_2:** Same as thumbs_1 but the thumbs-up hand raised one pixel block and the thumb tilted slightly, as if bouncing.

**walk_1 to walk_4** (walk cycle, facing right, side view, same scale and ground line in all four frames):
- walk_1: contact pose, right foot forward touching the ground, left foot back, arms swinging opposite.
- walk_2: passing pose, legs together under the body, body one pixel block lower.
- walk_3: contact pose mirrored, left foot forward, right foot back.
- walk_4: passing pose, legs together, body one pixel block higher.

**fist_1:** Pose: a short fist pump, right fist raised up near the shoulder, tight happy stance. **fist_2:** the fist at the top of the pump, one block higher, body leaning slightly forward.

**victory_1:** Pose: victory, both arms raised up and open, chest out, weapon held up in one hand if the pose allows. **victory_2:** same pose, arms and weapon one pixel block higher.

## Depois

Quando as imagens estiverem em `src/assets/crawlers/poses/`, o código de animação (trilha da Gym, canto da Dieta, troca de quadros em FPS baixo, "reduzir movimento") é a próxima etapa. Me avise com a lista de arquivos gerados.
