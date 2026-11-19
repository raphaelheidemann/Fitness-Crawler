/**
 * Rule-based EN -> PT-BR names for the free-exercise-db catalog (~870 names).
 * Words are classed as M(ovement), E(quipment), A(djective), N(oun/muscle).
 * Output order: Movement [de Muscle] Adjectives Equipment, e.g.
 * "Incline Dumbbell Curl" -> "Rosca Inclinada com Halter".
 * shortcut: unknown words stay in English, add them to RAW when you spot one.
 */
type Cat = 'M' | 'E' | 'A' | 'N' | 'F';
interface Entry {
  pt: string; // adjectives: "masc|fem"
  cat: Cat;
  fem?: boolean;
}

// en|pt|cat[|f]   (F = filler word)
const RAW = `
bench press|Supino|M
chest press|Supino|M
floor press|Supino no Chão|M
incline press|Supino Inclinado|M
decline press|Supino Declinado|M
leg press|Leg Press|M
shoulder press|Desenvolvimento de Ombros|M
military press|Desenvolvimento Militar|M
overhead press|Desenvolvimento|M
push press|Push Press|M
press|Desenvolvimento|M
hammer curl|Rosca Martelo|M|f
hammer curls|Rosca Martelo|M|f
preacher curl|Rosca Scott|M|f
preacher curls|Rosca Scott|M|f
concentration curl|Rosca Concentrada|M|f
concentration curls|Rosca Concentrada|M|f
zottman curl|Rosca Zottman|M|f
leg curl|Mesa Flexora|M|f
leg curls|Mesa Flexora|M|f
wrist curl|Rosca de Punho|M|f
curl|Rosca|M|f
curls|Rosca|M|f
leg extension|Cadeira Extensora|M|f
leg extensions|Cadeira Extensora|M|f
extension|Extensão|M|f
extensions|Extensão|M|f
front squat|Agachamento Frontal|M
back squat|Agachamento Livre|M
squat|Agachamento|M
squats|Agachamento|M
romanian deadlift|Levantamento Terra Romeno|M
stiff legged deadlift|Stiff|M
sumo deadlift|Levantamento Terra Sumô|M
deadlift|Levantamento Terra|M
deadlifts|Levantamento Terra|M
lat pulldown|Puxada Alta|M|f
pulldown|Puxada|M|f
pulldowns|Puxada|M|f
pull down|Puxada|M|f
pushdown|Pushdown|M
pull up|Barra Fixa|M|f
pull ups|Barra Fixa|M|f
pullup|Barra Fixa|M|f
pullups|Barra Fixa|M|f
chin up|Barra Fixa Supinada|M|f
chin ups|Barra Fixa Supinada|M|f
chinup|Barra Fixa Supinada|M|f
push up|Flexão|M|f
push ups|Flexão|M|f
pushups|Flexão|M|f
pushup|Flexão|M|f
row|Remada|M|f
rows|Remada|M|f
fly|Crucifixo|M
flye|Crucifixo|M
flyes|Crucifixo|M
flys|Crucifixo|M
crossover|Crossover|M
lateral raise|Elevação Lateral|M|f
lateral raises|Elevação Lateral|M|f
front raise|Elevação Frontal|M|f
raise|Elevação|M|f
raises|Elevação|M|f
crunch|Abdominal|M
crunches|Abdominal|M
sit up|Abdominal|M
sit ups|Abdominal|M
situps|Abdominal|M
lunge|Avanço|M
lunges|Avanço|M
step up|Step-Up|M
step ups|Step-Up|M
shrug|Encolhimento|M
shrugs|Encolhimento|M
dip|Mergulho|M
dips|Mergulho|M
jump|Salto|M
jumps|Salto|M
kickback|Coice|M
kickbacks|Coice|M
good morning|Bom Dia|M
good mornings|Bom Dia|M
bridge|Ponte|M|f
twist|Rotação|M|f
rotation|Rotação|M|f
stretch|Alongamento|M
stretches|Alongamento|M
walk|Caminhada|M|f
carry|Transporte|M
plank|Prancha|M|f
swing|Swing|M
swings|Swing|M
clean|Clean|M
snatch|Snatch|M
jerk|Jerk|M
thruster|Thruster|M
burpee|Burpee|M
dumbbell|com Halter|E
dumbbells|com Halteres|E
barbell|com Barra|E
cable|no Cabo|E
cables|no Cabo|E
kettlebell|com Kettlebell|E
kettlebells|com Kettlebells|E
machine|na Máquina|E
smith machine|no Smith|E
smith|no Smith|E
ez bar|com Barra W|E
ez curl bar|com Barra W|E
band|com Elástico|E
bands|com Elástico|E
exercise ball|na Bola Suíça|E
medicine ball|com Bola Medicinal|E
stability ball|na Bola Suíça|E
ball|com Bola|E
plate|com Anilha|E
rope|com Corda|E
ropes|com Cordas|E
chains|com Correntes|E
sled|no Trenó|E
trap bar|com Barra Hexagonal|E
bar|com Barra|E
foam roll|com Rolo de Espuma|E
bodyweight|-|E
body weight|-|E
pulley|na Polia|E
leverage|na Máquina|E
lever|na Máquina|E
box|no Caixote|E
bench|no Banco|E
incline|Inclinado|Inclinada|A
decline|Declinado|Declinada|A
seated|Sentado|Sentada|A
standing|em Pé|em Pé|A
lying|Deitado|Deitada|A
reverse|Reverso|Reversa|A
alternating|Alternado|Alternada|A
alternate|Alternado|Alternada|A
one arm|Unilateral|Unilateral|A
single arm|Unilateral|Unilateral|A
one leg|Unilateral|Unilateral|A
single leg|Unilateral|Unilateral|A
single|Unilateral|Unilateral|A
two arm|Bilateral|Bilateral|A
close grip|Pegada Fechada|Pegada Fechada|A
wide grip|Pegada Aberta|Pegada Aberta|A
medium grip|Pegada Média|Pegada Média|A
reverse grip|Pegada Inversa|Pegada Inversa|A
neutral grip|Pegada Neutra|Pegada Neutra|A
underhand|Pegada Supinada|Pegada Supinada|A
grip|Pegada|Pegada|A
overhead|Acima da Cabeça|Acima da Cabeça|A
front|Frontal|Frontal|A
rear|Posterior|Posterior|A
side|Lateral|Lateral|A
lateral|Lateral|Lateral|A
bent over|Curvado|Curvada|A
straight|Reto|Reta|A
flat|Reto|Reta|A
high|Alto|Alta|A
low|Baixo|Baixa|A
wide|Aberto|Aberta|A
close|Fechado|Fechada|A
weighted|com Peso|com Peso|A
behind the neck|Atrás da Nuca|Atrás da Nuca|A
kneeling|Ajoelhado|Ajoelhada|A
prone|Pronado|Pronada|A
supine|Supinado|Supinada|A
hanging|Suspenso|Suspensa|A
floor|no Chão|no Chão|A
on the floor|no Chão|no Chão|A
palms up|Palmas para Cima|Palmas para Cima|A
palms down|Palmas para Baixo|Palmas para Baixo|A
palms|Palmas|Palmas|A
power|Explosivo|Explosiva|A
pullover|Pullover|M
upright row|Remada Alta|M|f
split squat|Agachamento Búlgaro|M
split squats|Agachamento Búlgaro|M
hack squat|Agachamento Hack|M
muscle up|Muscle-Up|M
t bar row|Remada Cavalinho|M|f
external rotation|Rotação Externa|M|f
internal rotation|Rotação Interna|M|f
sprint|Corrida|M|f
hops|Saltos|M
wall|na Parede|E
chair|Cadeira|N
adductor|Adutores|N
isometric|Isométrico|Isométrica|A
elevated|Elevado|Elevada|A
double|Duplo|Dupla|A
palm in|Pegada Neutra|Pegada Neutra|A
triceps|Tríceps|N
tricep|Tríceps|N
biceps|Bíceps|N
bicep|Bíceps|N
shoulder|Ombros|N
shoulders|Ombros|N
chest|Peito|N
back|Costas|N
lower back|Lombar|N
leg|Pernas|N
legs|Pernas|N
calf|Panturrilha|N
calves|Panturrilhas|N
glute|Glúteos|N
glutes|Glúteos|N
hamstring|Posteriores|N
hamstrings|Posteriores|N
quad|Quadríceps|N
quads|Quadríceps|N
quadriceps|Quadríceps|N
ab|Abdômen|N
abs|Abdômen|N
abdominal|Abdômen|N
core|Core|N
lat|Dorsais|N
lats|Dorsais|N
delt|Deltoide|N
delts|Deltoides|N
deltoid|Deltoide|N
trap|Trapézio|N
traps|Trapézio|N
neck|Pescoço|N
forearm|Antebraço|N
forearms|Antebraços|N
wrist|Punho|N
hip|Quadril|N
hips|Quadril|N
groin|Virilha|N
oblique|Oblíquos|N
obliques|Oblíquos|N
arm|Braço|N
arms|Braços|N
head|Cabeça|N
knee|Joelho|N
ankle|Tornozelo|N
position|Posição|N
with|-|F
the|-|F
a|-|F
and|e|F
to|para|F
from|de|F
on|em|F
in|em|F
into|em|F
of|de|F
over|sobre|F
up|para Cima|F
down|para Baixo|F
`;

const DICT = new Map<string, Entry>();
RAW.trim()
  .split('\n')
  .forEach((line) => {
    const p = line.split('|');
    if (p[3] === 'A') DICT.set(p[0], { pt: `${p[1]}|${p[2]}`, cat: 'A' });
    else DICT.set(p[0], { pt: p[1], cat: p[2] as Cat, fem: p[3] === 'f' });
  });

const cache = new Map<string, string>();

function translatePart(part: string): string {
  const words = part
    .replace(/[()]/g, ' ')
    .replace(/[-/,]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const movements: { pt: string; fem: boolean }[] = [];
  const nouns: string[] = [];
  const adjs: string[] = [];
  const equips: string[] = [];
  const inline: { cat: Cat; pt: string }[] = [];
  let hasFiller = false;

  for (let i = 0; i < words.length; ) {
    let hit: Entry | null = null;
    let used = 1;
    for (let n = Math.min(4, words.length - i); n >= 1; n--) {
      const e = DICT.get(
        words
          .slice(i, i + n)
          .join(' ')
          .toLowerCase()
      );
      if (e) {
        hit = e;
        used = n;
        break;
      }
    }
    if (!hit) {
      nouns.push(words[i]);
      inline.push({ cat: 'N', pt: words[i] });
    } else if (hit.cat === 'M') {
      movements.push({ pt: hit.pt, fem: Boolean(hit.fem) });
      inline.push({ cat: 'M', pt: hit.pt });
    } else if (hit.cat === 'E') {
      if (hit.pt !== '-') equips.push(hit.pt);
      inline.push({ cat: 'E', pt: hit.pt === '-' ? '' : hit.pt });
    } else if (hit.cat === 'A') {
      adjs.push(hit.pt);
      inline.push({ cat: 'A', pt: hit.pt.split('|')[0] });
    } else if (hit.cat === 'F') {
      if (hit.pt !== '-') {
        nouns.push(hit.pt);
        hasFiller = true;
      }
      inline.push({ cat: 'F', pt: hit.pt === '-' ? '' : hit.pt });
    } else {
      nouns.push(hit.pt);
      inline.push({ cat: 'N', pt: hit.pt });
    }
    i += used;
  }

  const eq = Array.from(new Set(equips)).join(' e ');
  if (movements.length > 1) {
    return inline
      .map((x) => x.pt)
      .filter(Boolean)
      .join(' ');
  }
  const fem = movements[0]?.fem ?? false;
  const adjText = Array.from(new Set(adjs)).map((a) => {
    const [m, f] = a.split('|');
    return fem ? f : m;
  });
  const head = movements[0]
    ? nouns.length
      ? `${movements[0].pt}${hasFiller ? ' ' : ' de '}${nouns.join(' ')}`
      : movements[0].pt
    : nouns.join(' ');
  return [head, ...adjText, eq].filter(Boolean).join(' ');
}

export function exerciseNamePt(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const out = name
    .split(' - ')
    .map(translatePart)
    .filter(Boolean)
    .join(' - ');
  const final = out || name;
  cache.set(name, final);
  return final;
}
