/**
 * Rule-based EN -> PT-BR names for the free-exercise-db catalog (~876 names).
 * OVERRIDES is consulted first for exact catalog names that require idiomatic
 * Brazilian gym terminology, gender/number agreement, or deduplication.
 * RAW rules handle general phrasing and future/unseen exercises.
 */
type Cat = 'M' | 'E' | 'A' | 'N' | 'F';
interface Entry {
  pt: string; // adjectives: "masc|fem"
  cat: Cat;
  fem?: boolean;
}

const OVERRIDES: Record<string, string> = {
  // Exemplos clássicos e termos idiomáticos de academia no Brasil
  'Lat Pullover': 'Pullover na Polia',
  'Lying Machine Chest Press': 'Supino Máquina Deitado',
  'Machine Chest Press': 'Supino Máquina',
  'Machine Bench Press': 'Supino Máquina',
  'Leverage Chest Press': 'Supino Máquina Articulado',
  'Leverage Incline Chest Press': 'Supino Inclinado Máquina Articulado',
  'Leverage Decline Chest Press': 'Supino Declinado Máquina Articulado',
  'Leverage Shoulder Press': 'Desenvolvimento Máquina Articulado',
  'Leverage High Row': 'Remada Alta Máquina Articulada',
  'Leverage Iso Row': 'Remada Unilateral Máquina Articulada',
  'Leverage Deadlift': 'Levantamento Terra na Máquina',
  'Leverage Shrug': 'Encolhimento na Máquina',
  'Butterfly': 'Peck Deck (Voador)',
  'Leg Press': 'Leg Press 45°',
  'Narrow Stance Leg Press': 'Leg Press 45° Pés Juntos',
  'Smith Machine Leg Press': 'Leg Press no Smith',
  'Calf Press On The Leg Press Machine': 'Panturrilha no Leg Press',
  'Calf Press': 'Panturrilha no Leg Press Horizontal',
  'Lying Leg Curls': 'Mesa Flexora',
  'Seated Leg Curl': 'Cadeira Flexora',
  'Standing Leg Curl': 'Flexora em Pé',
  'Leg Extensions': 'Cadeira Extensora',
  'Single-Leg Leg Extension': 'Cadeira Extensora Unilateral',
  'Crunches': 'Abdominal Supra',
  'Sit-Up': 'Abdominal Completo',
  'Seated Cable Rows': 'Remada Baixa na Polia',
  'Seated One-arm Cable Pulley Rows': 'Remada Baixa Unilateral na Polia',
  'Cable Crossover': 'Crossover na Polia',
  'Low Cable Crossover': 'Crossover Polia Baixa',
  'Single-Arm Cable Crossover': 'Crossover Unilateral na Polia',
  'Triceps Pushdown': 'Tríceps Pulley Barra Reta',
  'Triceps Pushdown - Rope Attachment': 'Tríceps Pulley com Corda',
  'Triceps Pushdown - V-Bar Attachment': 'Tríceps Pulley Barra V',
  'Reverse Grip Triceps Pushdown': 'Tríceps Pulley Pegada Supinada',
  'Cable Incline Pushdown': 'Tríceps Pulley Inclinado na Polia',
  'EZ-Bar Skullcrusher': 'Tríceps Testa com Barra W',
  'Band Skull Crusher': 'Tríceps Testa com Elástico',
  'Decline Close-Grip Bench To Skull Crusher': 'Supino Fechado para Tríceps Testa Declinado',
  'Romanian Deadlift': 'Levantamento Terra Romeno',
  'Romanian Deadlift from Deficit': 'Levantamento Terra Romeno em Déficit',
  'Stiff-Legged Barbell Deadlift': 'Stiff com Barra',
  'Stiff-Legged Dumbbell Deadlift': 'Stiff com Halteres',
  'Smith Machine Stiff-Legged Deadlift': 'Stiff no Smith',
  'Wide Stance Stiff Legs': 'Stiff Base Aberta com Barra',
  'Russian Twist': 'Giro Russo',
  'Cable Russian Twists': 'Giro Russo na Polia',
  'Barbell Hip Thrust': 'Elevação Pélvica com Barra',
  'Barbell Glute Bridge': 'Elevação Pélvica no Chão com Barra',

  // A - F
  '3/4 Sit-Up': 'Abdominal Parcial (3/4)',
  '90/90 Hamstring': 'Alongamento de Posteriores 90/90',
  'Ab Crunch Machine': 'Abdominal na Máquina',
  'Ab Roller': 'Roda Abdominal',
  'Adductor': 'Liberação Miofascial de Adutores',
  'Adductor/Groin': 'Alongamento de Adutores e Virilha',
  'Advanced Kettlebell Windmill': 'Moinho Avançado com Kettlebell',
  'Air Bike': 'Bicicleta Ergométrica (Air Bike)',
  'All Fours Quad Stretch': 'Alongamento de Quadríceps em Quatro Apoios',
  'Alternate Heel Touchers': 'Abdominal Oblíquo Tocando os Calcanhares',
  'Alternate Incline Dumbbell Curl': 'Rosca Alternada Inclinada com Halteres',
  'Alternate Leg Diagonal Bound': 'Salto Diagonal Alternado',
  'Alternating Deltoid Raise': 'Elevação Frontal Alternada com Halteres',
  'Alternating Floor Press': 'Supino no Chão Alternado com Kettlebells',
  'Alternating Hang Clean': 'Hang Clean Alternado com Kettlebells',
  'Alternating Renegade Row': 'Remada Renegada Alternada com Halteres',
  'Ankle Circles': 'Rotação de Tornozelo',
  'Ankle On The Knee': 'Alongamento de Glúteos (Tornozelo no Joelho)',
  'Anterior Tibialis-SMR': 'Liberação Miofascial de Tibial Anterior',
  'Anti-Gravity Press': 'Desenvolvimento Invertido no Banco Inclinado com Barra',
  'Arm Circles': 'Rotação de Braços',
  'Arnold Dumbbell Press': 'Desenvolvimento Arnold com Halteres',
  'Around The Worlds': 'Crucifixo Circular (Around The World) com Halteres',
  'Atlas Stone Trainer': 'Treino de Pedra de Atlas (Strongman)',
  'Atlas Stones': 'Levantamento de Pedras de Atlas (Strongman)',
  'Axle Deadlift': 'Levantamento Terra com Barra Grossa (Axle)',
  'Back Flyes - With Bands': 'Crucifixo Invertido Sentado com Elástico',
  'Backward Drag': 'Arrasto de Costas no Trenó',
  'Backward Medicine Ball Throw': 'Arremesso para Trás com Bola Medicinal',
  'Balance Board': 'Equilíbrio na Prancha (Balance Board)',
  'Ball Leg Curl': 'Mesa Flexora na Bola Suíça',
  'Band Assisted Pull-Up': 'Barra Fixa Assistida com Elástico',
  'Band Good Morning (Pull Through)': 'Bom Dia (Pull Through) com Elástico',
  'Band Hip Adductions': 'Adução de Quadril com Elástico',
  'Barbell Ab Rollout': 'Roda Abdominal com Barra',
  'Barbell Ab Rollout - On Knees': 'Roda Abdominal com Barra Ajoelhado',
  'Barbell Bench Press - Medium Grip': 'Supino Reto com Barra (Pegada Média)',
  'Barbell Curl': 'Rosca Direta com Barra',
  'Barbell Curls Lying Against An Incline': 'Rosca Direta Deitada no Banco Inclinado com Barra',
  'Barbell Full Squat': 'Agachamento Profundo com Barra',
  'Barbell Guillotine Bench Press': 'Supino Guilhotina com Barra',
  'Barbell Incline Bench Press - Medium Grip': 'Supino Inclinado com Barra (Pegada Média)',
  'Barbell Incline Shoulder Raise': 'Protração de Ombros Inclinada com Barra',
  'Barbell Rear Delt Row': 'Remada Aberta para Deltoide Posterior com Barra',
  'Barbell Rollout from Bench': 'Extensão Abdominal com Barra no Banco',
  'Barbell Seated Calf Raise': 'Panturrilha Sentado com Barra',
  'Barbell Squat To A Bench': 'Agachamento no Banco com Barra',
  'Barbell Walking Lunge': 'Avanço Caminhando com Barra',
  'Battling Ropes': 'Corda Naval',
  'Bear Crawl Sled Drags': 'Caminhada do Urso Arrastando Trenó',
  'Behind Head Chest Stretch': 'Alongamento de Peito com Mãos Atrás da Cabeça',
  'Bench Press - Powerlifting': 'Supino Reto Powerlifting com Barra',
  'Bench Press - With Bands': 'Supino Reto com Elástico',
  'Bench Press with Chains': 'Supino Reto com Correntes',
  'Bent-Arm Barbell Pullover': 'Pullover Braço Flexionado com Barra',
  'Bent-Arm Dumbbell Pullover': 'Pullover Braço Flexionado com Halter',
  'Bent-Knee Hip Raise': 'Elevação de Quadril com Joelhos Flexionados',
  'Bent Over Dumbbell Rear Delt Raise With Head On Bench': 'Crucifixo Invertido com Testa Apoiada no Banco e Halteres',
  'Bent Over Low-Pulley Side Lateral': 'Elevação Lateral Curvada na Polia Baixa',
  'Bent Over One-Arm Long Bar Row': 'Remada Cavalinho Unilateral Curvada',
  'Bent Over Two-Arm Long Bar Row': 'Remada Cavalinho Curvada com Barra',
  'Bent Over Two-Dumbbell Row': 'Remada Curvada com Halteres',
  'Bent Over Two-Dumbbell Row With Palms In': 'Remada Curvada Pegada Neutra com Halteres',
  'Bent Press': 'Bent Press com Kettlebell',
  'Bicycling': 'Ciclismo',
  'Bicycling, Stationary': 'Bicicleta Ergométrica',
  'Board Press': 'Supino no Bloco com Barra',
  'Body-Up': 'Prancha com Extensão de Tríceps (Body-Up)',
  'Body Tricep Press': 'Extensão de Tríceps Peso Corporal',
  'Bodyweight Mid Row': 'Remada Média na Barra Baixa (Peso Corporal)',
  'Bodyweight Squat': 'Agachamento Livre (Peso Corporal)',
  'Bodyweight Walking Lunge': 'Avanço Caminhando (Peso Corporal)',
  'Bosu Ball Cable Crunch With Side Bends': 'Abdominal na Polia com Flexão Lateral no Bosu',
  'Bottoms-Up Clean From The Hang Position': 'Clean Fundo para Cima do Hang com Kettlebell',
  'Bottoms Up': 'Abdominal Elevação de Quadril no Chão',
  'Box Jump (Multiple Response)': 'Salto Contínuo no Caixote',
  'Box Skip': 'Salto Alternado no Caixote',
  'Box Squat with Bands': 'Agachamento no Caixote com Elástico',
  'Box Squat with Chains': 'Agachamento no Caixote com Correntes',
  'Bradford/Rocky Presses': 'Desenvolvimento Bradford com Barra',
  'Butt-Ups': 'Elevação de Quadril na Prancha',
  'Butt Lift (Bridge)': 'Elevação Pélvica no Chão',
  'Cable Hammer Curls - Rope Attachment': 'Rosca Martelo na Polia com Corda',
  'Cable Hip Adduction': 'Adução de Quadril na Polia',
  'Cable Incline Triceps Extension': 'Tríceps Francês Inclinado na Polia',
  'Cable Iron Cross': 'Crossover Isométrico Alto na Polia',
  'Cable Judo Flip': 'Rotação de Tronco (Judo Flip) na Polia',
  'Cable Lying Triceps Extension': 'Tríceps Testa Deitado na Polia',
  'Cable Rear Delt Fly': 'Crucifixo Invertido na Polia',
  'Cable Rope Overhead Triceps Extension': 'Tríceps Francês na Polia com Corda',
  'Cable Rope Rear-Delt Rows': 'Remada Alta para Posterior na Polia com Corda',
  'Calf-Machine Shoulder Shrug': 'Encolhimento na Máquina de Panturrilha',
  'Calf Raise On A Dumbbell': 'Panturrilha em Pé com Apoio no Halter',
  'Calf Raises - With Bands': 'Panturrilha em Pé com Elástico',
  'Calf Stretch Elbows Against Wall': 'Alongamento de Panturrilha com Cotovelos na Parede',
  'Calf Stretch Hands Against Wall': 'Alongamento de Panturrilha com Mãos na Parede',
  'Car Deadlift': 'Levantamento Terra com Carro (Strongman)',
  'Car Drivers': 'Rotação Frontal com Anilha (Volante)',
  'Carioca Quick Step': 'Corrida Lateral Cruzada (Carioca)',
  'Cat Stretch': 'Alongamento Gato-Vaca',
  'Catch and Overhead Throw': 'Recepção e Arremesso Acima da Cabeça com Bola Medicinal',
  'Chain Handle Extension': 'Tríceps Francês no Chão com Correntes',
  'Chain Press': 'Supino no Chão com Correntes (Peito)',
  'Chair Leg Extended Stretch': 'Alongamento de Posteriores na Cadeira',
  'Chair Lower Back Stretch': 'Alongamento Lombar Sentado na Cadeira',
  'Chair Squat': 'Agachamento Sentando na Cadeira',
  'Chair Upper Body Stretch': 'Alongamento de Tronco na Cadeira',
  'Chest And Front Of Shoulder Stretch': 'Alongamento de Peito e Deltoide Anterior',
  'Chest Push from 3 point stance': 'Arremesso de Peito em 3 Apoios com Bola Medicinal',
  'Chest Push (multiple response)': 'Arremesso Contínuo de Peito com Bola Medicinal',
  'Chest Push (single response)': 'Arremesso Explosivo de Peito com Bola Medicinal',
  'Chest Push with Run Release': 'Arremesso de Peito com Corrida e Bola Medicinal',
  'Chest Stretch on Stability Ball': 'Alongamento de Peito na Bola Suíça',
  'Child\'s Pose': 'Postura da Criança (Alongamento)',
  'Chin To Chest Stretch': 'Alongamento Cervical (Queixo ao Peito)',
  'Circus Bell': 'Desenvolvimento Unilateral com Halter Gigante (Circus Bell)',
  'Clean Deadlift': 'Levantamento Terra de Saída (Clean)',
  'Clean Pull': 'Puxada Alta de Clean com Barra',
  'Clean Shrug': 'Encolhimento de Clean com Barra',
  'Clean and Press': 'Clean e Desenvolvimento com Barra',
  'Clean from Blocks': 'Clean nos Blocos com Barra',
  'Clock Push-Up': 'Flexão de Braço Relógio',
  'Close-Grip Dumbbell Press': 'Supino Fechado com Halteres',
  'Close-Grip EZ-Bar Curl with Band': 'Rosca Direta Pegada Fechada com Barra W e Elástico',
  'Close-Grip EZ-Bar Press': 'Supino Fechado com Barra W',
  'Close-Grip Front Lat Pulldown': 'Puxada Frontal Pegada Fechada',
  'Close-Grip Push-Up off of a Dumbbell': 'Flexão de Braço Pegada Fechada no Halter',
  'Close-Grip Standing Barbell Curl': 'Rosca Direta Pegada Fechada em Pé com Barra',
  'Cocoons': 'Abdominal Casulo',
  'Conan\'s Wheel': 'Roda de Conan (Strongman)',
  'Cross-Body Crunch': 'Abdominal Cruzado',
  'Cross Body Hammer Curl': 'Rosca Martelo Cruzada com Halteres',
  'Cross Over - With Bands': 'Crossover com Elástico',
  'Crossover Reverse Lunge': 'Afundo Cruzado para Trás',
  'Crucifix': 'Crucifixo Isométrico (Strongman)',
  'Crunch - Hands Overhead': 'Abdominal Supra com Braços Estendidos',
  'Crunch - Legs On Exercise Ball': 'Abdominal Supra com Pernas na Bola Suíça',
  'Cuban Press': 'Desenvolvimento Cubano com Halteres',
  'Dancer\'s Stretch': 'Alongamento do Dançarino (Lombar)',
  'Dead Bug': 'Abdominal Inseto Morto (Dead Bug)',
  'Decline Barbell Bench Press': 'Supino Declinado com Barra',
  'Decline Dumbbell Triceps Extension': 'Tríceps Testa Declinado com Halteres',
  'Decline EZ Bar Triceps Extension': 'Tríceps Testa Declinado com Barra W',
  'Decline Oblique Crunch': 'Abdominal Oblíquo Declinado',
  'Decline Reverse Crunch': 'Abdominal Infra Declinado',
  'Decline Smith Press': 'Supino Declinado no Smith',
  'Depth Jump Leap': 'Salto em Profundidade com Distância',
  'Dips - Chest Version': 'Paralelas (Foco em Peito)',
  'Dips - Triceps Version': 'Paralelas (Foco em Tríceps)',
  'Donkey Calf Raises': 'Panturrilha Burrinho (Donkey)',
  'Double Kettlebell Alternating Hang Clean': 'Hang Clean Alternado com Dois Kettlebells',
  'Double Kettlebell Jerk': 'Jerk com Dois Kettlebells',
  'Double Kettlebell Push Press': 'Push Press com Dois Kettlebells',
  'Double Kettlebell Snatch': 'Snatch com Dois Kettlebells',
  'Double Kettlebell Windmill': 'Moinho com Dois Kettlebells',
  'Double Leg Butt Kick': 'Salto com Chute nos Glúteos',
  'Downward Facing Balance': 'Equilíbrio em Decúbito Ventral na Bola Suíça',
  'Drop Push': 'Flexão Pliométrica com Queda no Caixote',
  'Dumbbell Alternate Bicep Curl': 'Rosca Direta Alternada com Halteres',
  'Dumbbell Bench Press': 'Supino Reto com Halteres',
  'Dumbbell Bench Press with Neutral Grip': 'Supino Reto Pegada Neutra com Halteres',
  'Dumbbell Bicep Curl': 'Rosca Direta com Halteres',
  'Dumbbell Incline Shoulder Raise': 'Protração de Ombros Inclinada com Halteres',
  'Dumbbell Lunges': 'Avanço com Halteres',
  'Dumbbell Lying One-Arm Rear Lateral Raise': 'Crucifixo Invertido Deitado Unilateral com Halter',
  'Dumbbell Lying Pronation': 'Pronação de Antebraço Deitado com Halter',
  'Dumbbell Lying Rear Lateral Raise': 'Crucifixo Invertido Deitado com Halteres',
  'Dumbbell Lying Supination': 'Supinação de Antebraço Deitado com Halter',
  'Dumbbell One-Arm Shoulder Press': 'Desenvolvimento Unilateral com Halter',
  'Dumbbell One-Arm Triceps Extension': 'Tríceps Francês Unilateral com Halter',
  'Dumbbell Prone Incline Curl': 'Rosca Pronada no Banco Inclinado com Halteres',
  'Dumbbell Raise': 'Elevação Lateral Alta com Halteres',
  'Dumbbell Scaption': 'Elevação no Plano Escapular (Scaption) com Halteres',
  'Dumbbell Seated Box Jump': 'Salto Sentado no Caixote com Halteres',
  'Dumbbell Seated One-Leg Calf Raise': 'Panturrilha Sentado Unilateral com Halter',
  'Dumbbell Shoulder Press': 'Desenvolvimento com Halteres',
  'Dumbbell Side Bend': 'Flexão Lateral de Tronco com Halter',
  'Dumbbell Squat To A Bench': 'Agachamento no Banco com Halteres',
  'Dumbbell Tricep Extension -Pronated Grip': 'Tríceps Francês Pegada Pronada com Halteres',
  'Dynamic Back Stretch': 'Alongamento Dinâmico de Costas',
  'Dynamic Chest Stretch': 'Alongamento Dinâmico de Peito',
  'EZ-Bar Curl': 'Rosca Direta com Barra W',
  'Elbow Circles': 'Rotação de Cotovelos',
  'Elbow to Knee': 'Abdominal Bicicleta (Cotovelo no Joelho)',
  'Elbows Back': 'Alongamento de Peito com Cotovelos para Trás',
  'Elevated Back Lunge': 'Afundo com Pé da Frente Elevado com Barra',
  'Elevated Cable Rows': 'Remada Sentada Elevada na Polia',
  'Elliptical Trainer': 'Elíptico',
  'Exercise Ball Crunch': 'Abdominal Supra na Bola Suíça',
  'Exercise Ball Pull-In': 'Flexão de Pernas na Prancha com Bola Suíça',
  'Extended Range One-Arm Kettlebell Floor Press': 'Supino no Chão Amplitude Máxima Unilateral com Kettlebell',
  'Face Pull': 'Face Pull na Polia',
  'Farmer\'s Walk': 'Caminhada do Fazendeiro',
  'Fast Skipping': 'Saltito Rápido (Skipping)',
  'Finger Curls': 'Rosca de Dedos com Barra',
  'Flat Bench Cable Flyes': 'Crucifixo Reto na Polia',
  'Flat Bench Leg Pull-In': 'Abdominal Infra Retraindo Pernas no Banco',
  'Flat Bench Lying Leg Raise': 'Elevação de Pernas Deitado no Banco Reto',
  'Flexor Incline Dumbbell Curls': 'Rosca Inclinada Assimétrica com Halteres',
  'Floor Glute-Ham Raise': 'Extensão Nórdica de Posteriores no Chão',
  'Floor Press with Chains': 'Supino no Chão com Correntes',
  'Flutter Kicks': 'Abdominal Tesoura Vertical',
  'Foot-SMR': 'Liberação Miofascial da Planta do Pé',
  'Forward Drag with Press': 'Arrasto de Trenó com Empurrão de Peito',
  'Frankenstein Squat': 'Agachamento Frankenstein com Barra',
  'Freehand Jump Squat': 'Agachamento com Salto Livre',
  'Frog Hops': 'Salto Sapo',
  'Frog Sit-Ups': 'Abdominal Borboleta (Frog)',
  'Front Barbell Squat To A Bench': 'Agachamento Frontal no Banco com Barra',
  'Front Box Jump': 'Salto Frontal no Caixote',
  'Front Cone Hops (or hurdle hops)': 'Saltos Frontais sobre Cones',
  'Front Leg Raises': 'Elevação Frontal de Pernas em Pé',
  'Front Raise And Pullover': 'Elevação Frontal com Pullover com Barra',
  'Front Squat (Clean Grip)': 'Agachamento Frontal (Pegada Clean)',
  'Front Squats With Two Kettlebells': 'Agachamento Frontal com Dois Kettlebells',
  'Front Two-Dumbbell Raise': 'Elevação Frontal com Dois Halteres',
  'Full Range-Of-Motion Lat Pulldown': 'Puxada Alta com Amplitude Completa',

  // G - O
  'Gironda Sternum Chins': 'Barra Fixa no Esterno (Gironda)',
  'Glute Ham Raise': 'Flexão Nórdica (Glute Ham Raise)',
  'Goblet Squat': 'Agachamento Goblet com Kettlebell',
  'Good Morning off Pins': 'Bom Dia nos Pinos com Barra',
  'Gorilla Chin/Crunch': 'Barra Fixa Supinada com Abdominal (Gorilla)',
  'Groin and Back Stretch': 'Alongamento de Virilha e Costas',
  'Groiners': 'Alongamento Dinâmico de Virilha (Groiners)',
  'Hammer Grip Incline DB Bench Press': 'Supino Inclinado Pegada Neutra com Halteres',
  'Handstand Push-Ups': 'Flexão na Parada de Mãos',
  'Hang Clean': 'Hang Clean com Barra',
  'Hang Clean - Below the Knees': 'Hang Clean Abaixo dos Joelhos com Barra',
  'Hang Snatch': 'Hang Snatch com Barra',
  'Hang Snatch - Below Knees': 'Hang Snatch Abaixo dos Joelhos com Barra',
  'Hanging Bar Good Morning': 'Bom Dia com Barra Suspensa',
  'Hanging Pike': 'Elevação de Pernas em V Suspenso (Pike)',
  'Heaving Snatch Balance': 'Snatch Balance com Impulso (Heaving)',
  'Heavy Bag Thrust': 'Empurrão Explosivo no Saco de Pancadas',
  'High Cable Curls': 'Rosca Alta na Polia',
  'Hip Circles (prone)': 'Rotação de Quadril em Quatro Apoios',
  'Hip Flexion with Band': 'Flexão de Quadril com Elástico',
  'Hip Lift with Band': 'Elevação Pélvica com Elástico',
  'Hug A Ball': 'Alongamento Lombar Abraçando a Bola Suíça',
  'Hug Knees To Chest': 'Alongamento Abraçando os Joelhos no Peito',
  'Hurdle Hops': 'Saltos sobre Barreiras',
  'Hyperextensions (Back Extensions)': 'Hiperextensão Lombar no Banco',
  'Hyperextensions With No Hyperextension Bench': 'Hiperextensão Lombar no Solo',
  'IT Band and Glute Stretch': 'Alongamento de Banda Iliotibial e Glúteos com Elástico',
  'Iliotibial Tract-SMR': 'Liberação Miofascial de Banda Iliotibial',
  'Inchworm': 'Caminhada das Mãos (Inchworm)',
  'Incline Barbell Triceps Extension': 'Tríceps Testa Inclinado com Barra',
  'Incline Bench Pull': 'Remada Deitada no Banco Inclinado com Barra',
  'Incline Cable Chest Press': 'Supino Inclinado na Polia',
  'Incline Dumbbell Bench With Palms Facing In': 'Supino Inclinado com Halteres (Palmas para Dentro)',
  'Incline Dumbbell Flyes - With A Twist': 'Crucifixo Inclinado com Rotação de Halteres',
  'Incline Dumbbell Press': 'Supino Inclinado com Halteres',
  'Incline Hammer Curls': 'Rosca Martelo Inclinada com Halteres',
  'Incline Inner Biceps Curl': 'Rosca Inclinada Aberta para Bíceps com Halteres',
  'Incline Push-Up': 'Flexão de Braço Inclinada',
  'Incline Push-Up Close-Grip': 'Flexão de Braço Inclinada Pegada Fechada',
  'Incline Push-Up Depth Jump': 'Flexão Inclinada Pliométrica com Queda',
  'Incline Push-Up Medium': 'Flexão de Braço Inclinada Pegada Média',
  'Incline Push-Up Reverse Grip': 'Flexão de Braço Inclinada Pegada Supinada',
  'Incline Push-Up Wide': 'Flexão de Braço Inclinada Aberta',
  'Intermediate Groin Stretch': 'Alongamento Intermediário de Virilha',
  'Intermediate Hip Flexor and Quad Stretch': 'Alongamento de Flexores do Quadril e Quadríceps',
  'Inverted Row': 'Remada Invertida (Australiana)',
  'Inverted Row with Straps': 'Remada Invertida com Fitas (TRX)',
  'Iron Cross': 'Crucifixo Isométrico de Ombros com Halteres',
  'Iron Crosses (stretch)': 'Alongamento Cruz de Ferro no Chão',
  'Isometric Chest Squeezes': 'Compressão Isométrica de Peito',
  'Isometric Neck Exercise - Front And Back': 'Isometria Cervical (Frontal e Posterior)',
  'Isometric Neck Exercise - Sides': 'Isometria Cervical (Lateral)',
  'Isometric Wipers': 'Prancha Isométrica Limpador de Para-Brisa',
  'JM Press': 'Supino JM com Barra',
  'Jackknife Sit-Up': 'Abdominal Canivete (Jackknife)',
  'Janda Sit-Up': 'Abdominal Janda',
  'Jerk Balance': 'Jerk Balance com Barra',
  'Jerk Dip Squat': 'Agachamento Curto para Jerk (Jerk Dip)',
  'Jogging, Treadmill': 'Trote na Esteira',
  'Keg Load': 'Carregamento de Barril (Strongman)',
  'Kettlebell Dead Clean': 'Dead Clean com Kettlebell',
  'Kettlebell Figure 8': 'Oito entre as Pernas com Kettlebell',
  'Kettlebell Halo': 'Halo com Kettlebell',
  'Kettlebell Halo with Overhead Extension': 'Halo com Tríceps Francês com Kettlebell',
  'Kettlebell Hang Clean': 'Hang Clean com Kettlebell',
  'Kettlebell Overhead Triceps Extension': 'Tríceps Francês Acima da Cabeça com Kettlebell',
  'Kettlebell Pass Between The Legs': 'Passe entre as Pernas com Kettlebell',
  'Kettlebell Pirate Ships': 'Balanço Lateral (Pirate Ship) com Kettlebell',
  'Kettlebell Seesaw Press': 'Desenvolvimento Alternado (Seesaw) com Kettlebell',
  'Kettlebell Sumo High Pull': 'Remada Alta Sumô com Kettlebell',
  'Kettlebell Turkish Get-Up (Lunge style)': 'Levantamento Turco (Estilo Avanço) com Kettlebell',
  'Kettlebell Turkish Get-Up (Squat style)': 'Levantamento Turco (Estilo Agachamento) com Kettlebell',
  'Kipping Muscle Up': 'Muscle-Up com Kipping',
  'Knee Across The Body': 'Alongamento de Glúteos (Joelho Cruzado)',
  'Knee Circles': 'Rotação de Joelhos',
  'Knee/Hip Raise On Parallel Bars': 'Elevação de Joelhos nas Paralelas',
  'Knee Tuck Jump': 'Salto Agrupado (Joelhos ao Peito)',
  'Kneeling Arm Drill': 'Movimento de Corrida Ajoelhado',
  'Kneeling Cable Crunch With Alternating Oblique Twists': 'Abdominal na Polia Ajoelhado com Rotação de Oblíquos',
  'Kneeling Cable Triceps Extension': 'Tríceps Francês Ajoelhado na Polia',
  'Kneeling Hip Flexor': 'Alongamento de Flexores do Quadril Ajoelhado',
  'Kneeling Jump Squat': 'Agachamento com Salto Partindo de Ajoelhado',
  'Kneeling High Pulley Row': 'Remada Alta Ajoelhado na Polia',
  'Kneeling Single-Arm High Pulley Row': 'Remada Alta Ajoelhado Unilateral na Polia',
  'Landmine 180\'s': 'Rotação de Tronco no Landmine (180°)',
  'Landmine Linear Jammer': 'Desenvolvimento Explosivo no Landmine',
  'Lateral Bound': 'Salto Lateral Pliométrico',
  'Lateral Cone Hops': 'Saltos Laterais sobre Cones',
  'Lateral Raise - With Bands': 'Elevação Lateral com Elástico',
  'Leg-Over Floor Press': 'Supino no Chão com Pernas Elevadas com Kettlebell',
  'Leg-Up Hamstring Stretch': 'Alongamento de Posteriores com Perna Elevada',
  'Leg Lift': 'Elevação de Pernas Deitado no Chão',
  'Leg Pull-In': 'Abdominal Infra Retraindo Pernas no Chão',
  'Linear 3-Part Start Technique': 'Técnica de Arrancada Linear em 3 Partes',
  'Linear Acceleration Wall Drill': 'Exercício de Aceleração Linear na Parede',
  'Linear Depth Jump': 'Salto em Profundidade Linear',
  'Log Lift': 'Levantamento de Tora (Log Lift)',
  'London Bridges': 'Remada Invertida na Corda (London Bridge)',
  'Looking At Ceiling': 'Alongamento de Quadríceps Olhando para o Teto',
  'Low Cable Triceps Extension': 'Tríceps Francês Polia Baixa',
  'Low Pulley Row To Neck': 'Remada Alta ao Pescoço na Polia Baixa',
  'Lower Back Curl': 'Extensão Lombar no Chão (Superman Invertido)',
  'Lunge Pass Through': 'Avanço com Passe por Baixo da Perna com Kettlebell',
  'Lunge Sprint': 'Avanço Explosivo na Máquina',
  'Lying Bent Leg Groin': 'Alongamento de Virilha Deitado com Joelho Flexionado',
  'Lying Cable Curl': 'Rosca Direta Deitada na Polia',
  'Lying Cambered Barbell Row': 'Remada Curvada Deitada com Barra Curva',
  'Lying Close-Grip Bar Curl On High Pulley': 'Rosca Deitada Pegada Fechada na Polia Alta',
  'Lying Close-Grip Barbell Triceps Extension Behind The Head': 'Tríceps Testa Atrás da Cabeça Pegada Fechada com Barra',
  'Lying Close-Grip Barbell Triceps Press To Chin': 'Tríceps Testa ao Queixo Pegada Fechada com Barra W',
  'Lying Crossover': 'Alongamento de Quadril Cruzado Deitado',
  'Lying Dumbbell Tricep Extension': 'Tríceps Testa Deitado com Halteres',
  'Lying Face Down Plate Neck Resistance': 'Extensão Cervical Deitado de Bruços com Anilha',
  'Lying Face Up Plate Neck Resistance': 'Flexão Cervical Deitado de Barriga para Cima com Anilha',
  'Lying Glute': 'Alongamento de Glúteos Deitado',
  'Lying Hamstring': 'Alongamento de Posteriores Deitado',
  'Lying High Bench Barbell Curl': 'Rosca Deitada no Banco Alto com Barra',
  'Lying One-Arm Lateral Raise': 'Elevação Lateral Deitado Unilateral com Halter',
  'Lying Prone Quadriceps': 'Alongamento de Quadríceps Deitado de Bruços',
  'Lying Rear Delt Raise': 'Crucifixo Invertido Deitado no Banco com Halteres',
  'Lying Supine Dumbbell Curl': 'Rosca Deitada no Banco Reto com Halteres',
  'Lying T-Bar Row': 'Remada Cavalinho Apoiada (Máquina)',
  'Lying Triceps Press': 'Tríceps Testa com Barra W (Pegada Média)',
  'Machine Bicep Curl': 'Rosca Direta na Máquina',
  'Machine Shoulder (Military) Press': 'Desenvolvimento na Máquina',
  'Machine Triceps Extension': 'Tríceps Máquina',
  'Medicine Ball Chest Pass': 'Passe de Peito com Bola Medicinal',
  'Medicine Ball Full Twist': 'Rotação Completa de Tronco com Bola Medicinal',
  'Medicine Ball Scoop Throw': 'Arremesso por Baixo (Scoop) com Bola Medicinal',
  'Middle Back Shrug': 'Retração Escapular (Encolhimento Médio) com Halteres',
  'Mixed Grip Chin': 'Barra Fixa Pegada Mista',
  'Monster Walk': 'Caminhada Lateral Monstro com Elástico',
  'Mountain Climbers': 'Escalador (Mountain Climbers)',
  'Moving Claw Series': 'Corrida Técnica (Moving Claw)',
  'Muscle Snatch': 'Snatch de Força (Muscle Snatch)',
  'Narrow Stance Hack Squats': 'Agachamento Hack Pés Juntos',
  'Narrow Stance Squats': 'Agachamento Livre Pés Juntos com Barra',
  'Natural Glute Ham Raise': 'Flexão Nórdica Natural',
  'Neck Press': 'Supino no Pescoço (Guilhotina) com Barra',
  'Oblique Crunches': 'Abdominal Oblíquo Lateral',
  'Oblique Crunches - On The Floor': 'Abdominal Oblíquo no Chão',
  'Olympic Squat': 'Agachamento Olímpico com Barra',
  'On-Your-Back Quad Stretch': 'Alongamento de Quadríceps Deitado de Costas',
  'On Your Side Quad Stretch': 'Alongamento de Quadríceps Deitado de Lado',
  'One-Arm Flat Bench Dumbbell Flye': 'Crucifixo Reto Unilateral com Halter',
  'One-Arm High-Pulley Cable Side Bends': 'Flexão Lateral de Tronco Unilateral na Polia Alta',
  'One-Arm Incline Lateral Raise': 'Elevação Lateral Inclinada Unilateral com Halter',
  'One-Arm Kettlebell Military Press To The Side': 'Desenvolvimento Lateral Unilateral com Kettlebell',
  'One-Arm Kettlebell Para Press': 'Desenvolvimento Paralelo Unilateral com Kettlebell',
  'One-Arm Kettlebell Split Jerk': 'Split Jerk Unilateral com Kettlebell',
  'One-Arm Kettlebell Split Snatch': 'Split Snatch Unilateral com Kettlebell',
  'One-Arm Long Bar Row': 'Remada Cavalinho Unilateral com Barra',
  'One-Arm Open Palm Kettlebell Clean': 'Clean Palma Aberta Unilateral com Kettlebell',
  'One-Arm Side Deadlift': 'Levantamento Terra Lateral Unilateral com Barra',
  'One-Arm Side Laterals': 'Elevação Lateral Unilateral com Halter',
  'One-Legged Cable Kickback': 'Glúteo Coice na Polia',
  'One Arm Against Wall': 'Alongamento de Dorsais Unilateral na Parede',
  'One Arm Floor Press': 'Supino no Chão Unilateral com Barra',
  'One Arm Lat Pulldown': 'Puxada Alta Unilateral na Polia',
  'One Arm Pronated Dumbbell Triceps Extension': 'Tríceps Francês Unilateral Pegada Pronada com Halter',
  'One Arm Supinated Dumbbell Triceps Extension': 'Tríceps Francês Unilateral Pegada Supinada com Halter',
  'One Half Locust': 'Alongamento de Quadríceps Meio Gafanhoto',
  'One Handed Hang': 'Alongamento Suspenso Unilateral na Barra',
  'One Knee To Chest': 'Alongamento Joelho ao Peito',
  'Open Palm Kettlebell Clean': 'Clean Palma Aberta com Kettlebell',
  'Otis-Up': 'Abdominal Otis com Peso',
  'Overhead Cable Curl': 'Rosca Bíceps Polia Alta',
  'Overhead Lat': 'Alongamento de Dorsais Acima da Cabeça',
  'Overhead Slam': 'Arremesso no Chão Acima da Cabeça com Bola Medicinal',
  'Overhead Triceps': 'Alongamento de Tríceps Acima da Cabeça',

  // P - Z
  'Pallof Press With Rotation': 'Pallof Press com Rotação na Polia',
  'Palms-Down Dumbbell Wrist Curl Over A Bench': 'Rosca de Punho Inversa no Banco com Halteres',
  'Palms-Down Wrist Curl Over A Bench': 'Rosca de Punho Inversa no Banco com Barra',
  'Palms-Up Barbell Wrist Curl Over A Bench': 'Rosca de Punho no Banco com Barra',
  'Palms-Up Dumbbell Wrist Curl Over A Bench': 'Rosca de Punho no Banco com Halteres',
  'Parallel Bar Dip': 'Paralelas',
  'Pelvic Tilt Into Bridge': 'Alongamento com Inclinação Pélvica e Ponte',
  'Peroneals-SMR': 'Liberação Miofascial de Fibulares',
  'Peroneals Stretch': 'Alongamento de Fibulares',
  'Pin Presses': 'Supino nos Pinos com Barra',
  'Plate Pinch': 'Pinça com Anilha (Preensão)',
  'Platform Hamstring Slides': 'Flexão Deslizante de Posteriores',
  'Plie Dumbbell Squat': 'Agachamento Sumô com Halter',
  'Posterior Tibialis Stretch': 'Alongamento de Tibial Posterior',
  'Power Clean from Blocks': 'Power Clean nos Blocos com Barra',
  'Power Partials': 'Elevação Lateral Parcial Pesada com Halteres',
  'Power Snatch from Blocks': 'Power Snatch nos Blocos com Barra',
  'Power Stairs': 'Subida de Degraus com Peso (Power Stairs)',
  'Preacher Hammer Dumbbell Curl': 'Rosca Martelo no Banco Scott com Halteres',
  'Press Sit-Up': 'Abdominal com Desenvolvimento com Barra',
  'Prone Manual Hamstring': 'Flexão de Posteriores Manual Pronado',
  'Prowler Sprint': 'Empurrada de Prowler (Corrida)',
  'Pull Through': 'Pull Through na Polia Baixa',
  'Push-Up Wide': 'Flexão de Braço Aberta',
  'Push-Ups - Close Triceps Position': 'Flexão de Braço Fechada (Tríceps)',
  'Push-Ups With Feet Elevated': 'Flexão de Braço com Pés Elevados',
  'Push-Ups With Feet On An Exercise Ball': 'Flexão de Braço com Pés na Bola Suíça',
  'Push Press - Behind the Neck': 'Push Press Atrás da Nuca com Barra',
  'Push Up to Side Plank': 'Flexão de Braço com Prancha Lateral',
  'Pushups (Close and Wide Hand Positions)': 'Flexão de Braço Alternando Pegada Fechada e Aberta',
  'Pyramid': 'Alongamento Pirâmide na Bola Suíça',
  'Quick Leap': 'Salto Rápido no Caixote',
  'Rack Delivery': 'Transição para Posição de Rack com Barra',
  'Rack Pulls': 'Meio Terra no Rack com Barra',
  'Recumbent Bike': 'Bicicleta Horizontal',
  'Return Push from Stance': 'Arremesso de Retorno em Base Atlética com Bola Medicinal',
  'Reverse Band Bench Press': 'Supino Reto com Elástico Invertido',
  'Reverse Band Box Squat': 'Agachamento no Caixote com Elástico Invertido',
  'Reverse Band Deadlift': 'Levantamento Terra com Elástico Invertido',
  'Reverse Band Power Squat': 'Agachamento com Elástico Invertido',
  'Reverse Band Sumo Deadlift': 'Levantamento Terra Sumô com Elástico Invertido',
  'Reverse Flyes With External Rotation': 'Crucifixo Invertido com Rotação Externa com Halteres',
  'Reverse Grip Bent-Over Rows': 'Remada Curvada Pegada Supinada com Barra',
  'Reverse Plate Curls': 'Rosca Invertida com Anilha',
  'Reverse Triceps Bench Press': 'Supino Pegada Supinada com Barra',
  'Rickshaw Carry': 'Caminhada no Carrinho (Rickshaw)',
  'Rickshaw Deadlift': 'Levantamento Terra no Carrinho (Rickshaw)',
  'Ring Dips': 'Mergulho nas Argolas',
  'Rocket Jump': 'Salto Foguete',
  'Rocking Standing Calf Raise': 'Panturrilha em Pé com Balanço com Barra',
  'Rocky Pull-Ups/Pulldowns': 'Barra Fixa Alternada (Frente e Nuca)',
  'Rope Climb': 'Subida na Corda',
  'Rope Crunch': 'Abdominal na Polia com Corda',
  'Rope Jumping': 'Pular Corda',
  'Rope Straight-Arm Pulldown': 'Pulldown com Corda na Polia',
  'Round The World Shoulder Stretch': 'Alongamento Circular de Ombros',
  'Rowing, Stationary': 'Remo Ergômetro',
  'Running, Treadmill': 'Corrida na Esteira',
  'Runner\'s Stretch': 'Alongamento do Corredor',
  'Sandbag Load': 'Carregamento de Saco de Areia (Strongman)',
  'Scapular Pull-Up': 'Puxada Escapular na Barra Fixa',
  'Scissor Kick': 'Abdominal Tesoura Horizontal',
  'Scissors Jump': 'Salto Tesoura Alternado',
  'Seated Band Hamstring Curl': 'Flexão de Posteriores Sentado com Elástico',
  'Seated Bent-Over One-Arm Dumbbell Triceps Extension': 'Tríceps Coice Sentado Unilateral com Halter',
  'Seated Bent-Over Rear Delt Raise': 'Crucifixo Invertido Sentado com Halteres',
  'Seated Bent-Over Two-Arm Dumbbell Triceps Extension': 'Tríceps Coice Sentado Bilateral com Halteres',
  'Seated Biceps': 'Alongamento de Bíceps Sentado',
  'Seated Calf Raise': 'Panturrilha Sentado na Máquina',
  'Seated Close-Grip Concentration Barbell Curl': 'Rosca Concentrada Sentada Pegada Fechada com Barra',
  'Seated Dumbbell Inner Biceps Curl': 'Rosca Sentada Aberta para Bíceps com Halteres',
  'Seated Dumbbell Palms-Down Wrist Curl': 'Rosca de Punho Inversa Sentada com Halteres',
  'Seated Dumbbell Palms-Up Wrist Curl': 'Rosca de Punho Sentada com Halteres',
  'Seated Flat Bench Leg Pull-In': 'Abdominal Retraindo Pernas Sentado no Banco',
  'Seated Front Deltoid': 'Alongamento de Deltoide Anterior Sentado',
  'Seated Glute': 'Alongamento de Glúteos Sentado',
  'Seated Hamstring': 'Alongamento de Posteriores Sentado',
  'Seated Head Harness Neck Resistance': 'Extensão Cervical Sentado com Arnês',
  'Seated Leg Tucks': 'Abdominal Sentado Encolhendo os Joelhos',
  'Seated One-Arm Dumbbell Palms-Down Wrist Curl': 'Rosca de Punho Inversa Sentada Unilateral com Halter',
  'Seated One-Arm Dumbbell Palms-Up Wrist Curl': 'Rosca de Punho Sentada Unilateral com Halter',
  'Seated Palm-Up Barbell Wrist Curl': 'Rosca de Punho Sentada com Barra',
  'Seated Palms-Down Barbell Wrist Curl': 'Rosca de Punho Inversa Sentada com Barra',
  'Seated Side Lateral Raise': 'Elevação Lateral Sentada com Halteres',
  'Seated Triceps Press': 'Tríceps Francês Sentado com Halter',
  'Seated Two-Arm Palms-Up Low-Pulley Wrist Curl': 'Rosca de Punho Sentada na Polia Baixa',
  'See-Saw Press (Alternating Side Press)': 'Desenvolvimento Alternado (Gangorra) com Halteres',
  'Shotgun Row': 'Remada Unilateral na Polia Baixa (Shotgun)',
  'Shoulder Circles': 'Rotação de Ombros',
  'Shoulder Press - With Bands': 'Desenvolvimento com Elástico',
  'Shoulder Raise': 'Elevação Escapular de Ombros',
  'Side-Lying Floor Stretch': 'Alongamento Lateral Deitado no Chão',
  'Side Hop-Sprint': 'Salto Lateral com Arrancada',
  'Side Jackknife': 'Abdominal Canivete Lateral',
  'Side Lateral Raise': 'Elevação Lateral com Halteres',
  'Side Laterals to Front Raise': 'Elevação Lateral para Frontal com Halteres',
  'Side Standing Long Jump': 'Salto Lateral em Distância',
  'Side To Side Chins': 'Barra Fixa Deslocando para os Lados',
  'Side Wrist Pull': 'Alongamento Lateral de Ombros (Puxando Punho)',
  'Side to Side Box Shuffle': 'Deslocamento Lateral Rápido no Caixote',
  'Single-Arm Linear Jammer': 'Desenvolvimento Explosivo Unilateral no Landmine',
  'Single-Cone Sprint Drill': 'Arrancada em Torno do Cone',
  'Single-Leg High Box Squat': 'Agachamento Unilateral no Caixote Alto',
  'Single-Leg Hop Progression': 'Progressão de Saltos Unilaterais',
  'Single-Leg Lateral Hop': 'Salto Lateral Unilateral',
  'Single-Leg Stride Jump': 'Salto em Passada Unilateral no Caixote',
  'Single Dumbbell Raise': 'Elevação Frontal com Um Halter',
  'Single Leg Butt Kick': 'Salto Unilateral com Chute nos Glúteos',
  'Single Leg Push-off': 'Impulsão Unilateral no Caixote',
  'Sit Squats': 'Agachamento Sentando e Levantando (Peso Corporal)',
  'Skating': 'Patinação (Salto Lateral do Patinador)',
  'Sled Drag - Harness': 'Arrasto de Trenó com Arnês',
  'Sled Overhead Backward Walk': 'Caminhada de Costas Puxando Trenó Acima da Cabeça',
  'Sled Overhead Triceps Extension': 'Tríceps Francês Puxando Trenó',
  'Sled Push': 'Empurrada de Trenó',
  'Sled Reverse Flye': 'Crucifixo Invertido no Trenó',
  'Sled Row': 'Remada Puxando Trenó',
  'Sledgehammer Swings': 'Marretada no Pneu',
  'Smith Incline Shoulder Raise': 'Protração de Ombros Inclinada no Smith',
  'Smith Machine Behind the Back Shrug': 'Encolhimento Atrás das Costas no Smith',
  'Smith Machine Calf Raise': 'Panturrilha em Pé no Smith',
  'Smith Machine Decline Press': 'Supino Declinado no Smith (Pegada Média)',
  'Smith Machine Hang Power Clean': 'Hang Power Clean no Smith',
  'Smith Machine Overhead Shoulder Press': 'Desenvolvimento no Smith',
  'Smith Machine Reverse Calf Raises': 'Flexão Dorsal (Tibial) no Smith',
  'Smith Single-Leg Split Squat': 'Agachamento Búlgaro no Smith',
  'Snatch Balance': 'Snatch Balance com Barra',
  'Snatch Deadlift': 'Levantamento Terra Pegada Snatch',
  'Snatch Pull': 'Puxada Alta de Snatch com Barra',
  'Snatch Shrug': 'Encolhimento de Snatch com Barra',
  'Snatch from Blocks': 'Snatch nos Blocos com Barra',
  'Speed Band Overhead Triceps': 'Tríceps Francês Rápido com Elástico',
  'Speed Box Squat': 'Agachamento Explosivo no Caixote com Barra',
  'Speed Squats': 'Agachamento Explosivo com Barra',
  'Spell Caster': 'Rotação de Tronco (Spell Caster) com Halteres',
  'Spider Crawl': 'Caminhada Aranha (Spider Crawl)',
  'Split Clean': 'Split Clean com Barra',
  'Split Jerk': 'Split Jerk com Barra',
  'Split Jump': 'Salto Afundo Alternado',
  'Split Snatch': 'Split Snatch com Barra',
  'Spinal Stretch': 'Alongamento de Coluna Sentado',
  'Squats - With Bands': 'Agachamento Livre com Elástico',
  'Squat Jerk': 'Squat Jerk com Barra',
  'Squat with Plate Movers': 'Agachamento com Deslizamento de Anilhas',
  'Stairmaster': 'Simulador de Escada',
  'Standing Barbell Press Behind Neck': 'Desenvolvimento por Trás da Nuca com Barra',
  'Standing Bent-Over One-Arm Dumbbell Triceps Extension': 'Tríceps Coice em Pé Curvado Unilateral com Halter',
  'Standing Bent-Over Two-Arm Dumbbell Triceps Extension': 'Tríceps Coice em Pé Curvado Bilateral com Halteres',
  'Standing Biceps Cable Curl': 'Rosca Direta na Polia',
  'Standing Cable Lift': 'Levantamento Diagonal na Polia Baixa',
  'Standing Calf Raises': 'Panturrilha em Pé na Máquina',
  'Standing Dumbbell Straight-Arm Front Delt Raise Above Head': 'Elevação Frontal Completa Acima da Cabeça com Halteres',
  'Standing Front Barbell Raise Over Head': 'Elevação Frontal Acima da Cabeça com Barra',
  'Standing Gastrocnemius Calf Stretch': 'Alongamento de Panturrilha (Gastrocnêmio) em Pé',
  'Standing Hip Circles': 'Rotação de Quadril em Pé',
  'Standing Hip Flexors': 'Alongamento de Flexores do Quadril em Pé',
  'Standing Inner-Biceps Curl': 'Rosca Aberta em Pé para Bíceps com Halteres',
  'Standing Long Jump': 'Salto Horizontal em Distância',
  'Standing Low-Pulley Deltoid Raise': 'Elevação Lateral na Polia Baixa',
  'Standing Low-Pulley One-Arm Triceps Extension': 'Tríceps Francês Unilateral na Polia Baixa',
  'Standing Olympic Plate Hand Squeeze': 'Preensão Isométrica de Anilha em Pé',
  'Standing One-Arm Dumbbell Curl Over Incline Bench': 'Rosca Scott Unilateral no Banco Inclinado com Halter',
  'Standing One-Arm Dumbbell Triceps Extension': 'Tríceps Francês em Pé Unilateral com Halter',
  'Standing Palm-In One-Arm Dumbbell Press': 'Desenvolvimento em Pé Pegada Neutra Unilateral com Halter',
  'Standing Palms-Up Barbell Behind The Back Wrist Curl': 'Rosca de Punho Atrás das Costas com Barra',
  'Standing Pelvic Tilt': 'Inclinação Pélvica em Pé (Alongamento)',
  'Standing Soleus And Achilles Stretch': 'Alongamento de Sóleo e Tendão de Aquiles em Pé',
  'Standing Toe Touches': 'Alongamento Tocando os Pés em Pé',
  'Standing Towel Triceps Extension': 'Tríceps Francês em Pé com Toalha',
  'Standing Two-Arm Overhead Throw': 'Arremesso Acima da Cabeça com Bola Medicinal',
  'Star Jump': 'Polichinelo Estrela (Star Jump)',
  'Step Mill': 'Escada Ergométrica (Step Mill)',
  'Step-up with Knee Raise': 'Step-Up com Elevação de Joelho',
  'Stiff Leg Barbell Good Morning': 'Bom Dia com Pernas Estendidas com Barra',
  'Stomach Vacuum': 'Vácuo Abdominal (Stomach Vacuum)',
  'Straight-Arm Pulldown': 'Pulldown Braço Estendido na Polia',
  'Straight Bar Bench Mid Rows': 'Remada Curvada no Banco com Barra',
  'Straight Raises on Incline Bench': 'Elevação Frontal Deitado no Banco Inclinado com Barra',
  'Stride Jump Crossover': 'Salto Cruzado Lateral no Caixote',
  'Supine Chest Throw': 'Arremesso de Peito Deitado com Bola Medicinal',
  'Supine One-Arm Overhead Throw': 'Arremesso Acima da Cabeça Deitado Unilateral com Bola Medicinal',
  'Supine Two-Arm Overhead Throw': 'Arremesso Acima da Cabeça Deitado com Bola Medicinal',
  'Suspended Fallout': 'Abdominal Extensão Suspenso com Fitas',
  'T-Bar Row with Handle': 'Remada Cavalinho com Triângulo',
  'Tate Press': 'Tríceps Tate com Halteres',
  'The Straddle': 'Alongamento de Posteriores Pernas Afastadas',
  'Thigh Abductor': 'Cadeira Abdutora',
  'Thigh Adductor': 'Cadeira Adutora',
  'Tire Flip': 'Tombamento de Pneu',
  'Toe Touchers': 'Abdominal Tocando os Pés Deitado',
  'Trail Running/Walking': 'Corrida ou Caminhada em Trilha',
  'Tricep Dumbbell Kickback': 'Tríceps Coice com Halter',
  'Triceps Overhead Extension with Rope': 'Tríceps Francês na Polia Alta com Corda',
  'Tuck Crunch': 'Abdominal Encolhido (Tuck)',
  'Upper Back-Leg Grab': 'Alongamento de Costas Superior e Posteriores Sentado',
  'Upright Barbell Row': 'Remada Alta com Barra',
  'Upright Cable Row': 'Remada Alta na Polia',
  'Upright Row - With Bands': 'Remada Alta com Elástico',
  'Upward Stretch': 'Alongamento Estendido para Cima',
  'V-Bar Pulldown': 'Puxada Alta com Triângulo',
  'V-Bar Pullup': 'Barra Fixa com Triângulo',
  'Vertical Swing': 'Swing Vertical com Halter',
  'Walking, Treadmill': 'Caminhada na Esteira',
  'Weighted Ball Hyperextension': 'Hiperextensão Lombar na Bola Suíça com Peso',
  'Weighted Ball Side Bend': 'Flexão Lateral de Tronco na Bola Suíça com Peso',
  'Weighted Jump Squat': 'Agachamento com Salto com Barra',
  'Weighted Pull Ups': 'Barra Fixa com Peso',
  'Weighted Sit-Ups - With Bands': 'Abdominal Completo com Elástico',
  'Wide-Grip Lat Pulldown': 'Puxada Alta Aberta na Polia',
  'Wide-Grip Pulldown Behind The Neck': 'Puxada Atrás da Nuca Pegada Aberta',
  'Wide-Grip Rear Pull-Up': 'Barra Fixa Aberta Atrás da Nuca',
  'Wide Stance Barbell Squat': 'Agachamento Base Aberta com Barra',
  'Wind Sprints': 'Pedalada Suspensa na Barra Fixa',
  'Windmills': 'Alongamento Moinho de Costas no Chão',
  'World\'s Greatest Stretch': 'Maior Alongamento do Mundo (Mobilidade)',
  'Wrist Circles': 'Rotação de Punhos',
  'Wrist Roller': 'Rolo de Punho com Peso',
  'Wrist Rotations with Straight Bar': 'Rotação de Punhos com Barra Reta',
  'Yoke Walk': 'Caminhada com Yoke (Strongman)',
  'Zottman Preacher Curl': 'Rosca Zottman no Banco Scott com Halteres',
  'Bodyweight Flyes': 'Crucifixo Deslizante no Solo',
  'Close-Grip EZ Bar Curl': 'Rosca Direta Pegada Fechada com Barra W',
  'Floor Press': 'Supino no Chão com Barra',
  'Good Morning': 'Bom Dia com Barra',
  'Middle Back Stretch': 'Alongamento da Região Média das Costas',
  'Preacher Curl': 'Rosca Scott com Barra',
  'Seated Good Mornings': 'Bom Dia Sentado com Barra',
  'Standing Cable Wood Chop': 'Rotação Lenhador em Pé na Polia',
  'Upper Back Stretch': 'Alongamento da Parte Superior das Costas',
};

// en|pt|cat[|f]   (F = filler word)
const RAW = `
bench press|Supino|M
chest press|Supino|M
floor press|Supino no Chão|M
incline press|Supino Inclinado|M
decline press|Supino Declinado|M
leg press|Leg Press|M
shoulder press|Desenvolvimento|M
military press|Desenvolvimento Militar|M
overhead press|Desenvolvimento|M
arnold press|Desenvolvimento Arnold|M
bradford press|Desenvolvimento Bradford|M
tate press|Tríceps Tate|M
jm press|Supino JM|M
pallof press|Pallof Press|M
svend press|Svend Press|M
push press|Push Press|M
press|Desenvolvimento|M
hammer curl|Rosca Martelo|M|f
hammer curls|Rosca Martelo|M|f
preacher curl|Rosca Scott|M|f
preacher curls|Rosca Scott|M|f
concentration curl|Rosca Concentrada|M|f
concentration curls|Rosca Concentrada|M|f
zottman curl|Rosca Zottman|M|f
drag curl|Rosca Drag|M|f
spider curl|Rosca Spider|M|f
bicep curl|Rosca Direta|M|f
bicep curls|Rosca Direta|M|f
biceps curl|Rosca Direta|M|f
biceps curls|Rosca Direta|M|f
reverse curl|Rosca Inversa|M|f
reverse curls|Rosca Inversa|M|f
seated leg curl|Cadeira Flexora|M|f
lying leg curl|Mesa Flexora|M|f
lying leg curls|Mesa Flexora|M|f
standing leg curl|Flexora em Pé|M|f
leg curl|Mesa Flexora|M|f
leg curls|Mesa Flexora|M|f
wrist curl|Rosca de Punho|M|f
wrist curls|Rosca de Punho|M|f
curl|Rosca|M|f
curls|Rosca|M|f
leg extension|Cadeira Extensora|M|f
leg extensions|Cadeira Extensora|M|f
triceps extension|Tríceps Francês|M
tricep extension|Tríceps Francês|M
extension|Extensão|M|f
extensions|Extensão|M|f
front squat|Agachamento Frontal|M
back squat|Agachamento Livre|M
hack squat|Agachamento Hack|M
hack squats|Agachamento Hack|M
split squat|Agachamento Búlgaro|M
split squats|Agachamento Búlgaro|M
goblet squat|Agachamento Goblet|M
pistol squat|Agachamento Pistol|M
sissy squat|Agachamento Sissy|M
zercher squat|Agachamento Zercher|M
zercher squats|Agachamento Zercher|M
jefferson squat|Agachamento Jefferson|M
jefferson squats|Agachamento Jefferson|M
box squat|Agachamento no Caixote|M
overhead squat|Agachamento Acima da Cabeça|M
squat|Agachamento|M
squats|Agachamento|M
romanian deadlift|Levantamento Terra Romeno|M
stiff legged deadlift|Stiff|M
sumo deadlift|Levantamento Terra Sumô|M
deadlift|Levantamento Terra|M
deadlifts|Levantamento Terra|M
lat pulldown|Puxada Alta|M|f
lat pullover|Pullover na Polia|M
pulldown|Puxada|M|f
pulldowns|Puxada|M|f
pull down|Puxada|M|f
triceps pushdown|Tríceps Pulley|M
tricep pushdown|Tríceps Pulley|M
pushdown|Tríceps Pulley|M
skull crusher|Tríceps Testa|M
skullcrusher|Tríceps Testa|M
pull up|Barra Fixa|M|f
pull ups|Barra Fixa|M|f
pullup|Barra Fixa|M|f
pullups|Barra Fixa|M|f
chin up|Barra Fixa Supinada|M|f
chin ups|Barra Fixa Supinada|M|f
chinup|Barra Fixa Supinada|M|f
chins|Barra Fixa Supinada|M|f
chin|Barra Fixa Supinada|M|f
push up|Flexão de Braço|M|f
push ups|Flexão de Braço|M|f
pushups|Flexão de Braço|M|f
pushup|Flexão de Braço|M|f
upright row|Remada Alta|M|f
upright rows|Remada Alta|M|f
bent over row|Remada Curvada|M|f
bent over rows|Remada Curvada|M|f
seated cable row|Remada Baixa na Polia|M|f
seated cable rows|Remada Baixa na Polia|M|f
t bar row|Remada Cavalinho|M|f
row|Remada|M|f
rows|Remada|M|f
reverse fly|Crucifixo Invertido|M
reverse flye|Crucifixo Invertido|M
reverse flyes|Crucifixo Invertido|M
pull apart|Crucifixo Invertido|M
pec deck|Peck Deck (Voador)|M
butterfly|Peck Deck (Voador)|M
fly|Crucifixo|M
flye|Crucifixo|M
flyes|Crucifixo|M
flys|Crucifixo|M
crossover|Crossover|M
calf raise|Panturrilha|M|f
calf raises|Panturrilha|M|f
lateral raise|Elevação Lateral|M|f
lateral raises|Elevação Lateral|M|f
front raise|Elevação Frontal|M|f
hip thrust|Elevação Pélvica|M|f
leg raise|Elevação de Pernas|M|f
leg raises|Elevação de Pernas|M|f
raise|Elevação|M|f
raises|Elevação|M|f
crunch|Abdominal|M
crunches|Abdominal|M
sit up|Abdominal|M
sit ups|Abdominal|M
situps|Abdominal|M
russian twist|Giro Russo|M
russian twists|Giro Russo|M
wood chop|Lenhador|M
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
hops|Saltos|M
hop|Salto|M
leap|Salto|M
glute kickback|Glúteo Coice|M
kickback|Coice|M
kickbacks|Coice|M
good morning|Bom Dia|M
good mornings|Bom Dia|M
bridge|Ponte|M|f
hyperextension|Hiperextensão Lombar|M|f
hyperextensions|Hiperextensão Lombar|M|f
side bend|Flexão Lateral de Tronco|M|f
side bends|Flexão Lateral de Tronco|M|f
external rotation|Rotação Externa|M|f
internal rotation|Rotação Interna|M|f
twist|Rotação|M|f
rotation|Rotação|M|f
stretch|Alongamento|M
stretches|Alongamento|M
smr|Liberação Miofascial|M|f
walk|Caminhada|M|f
carry|Transporte|M
plank|Prancha|M|f
rollout|Rolo Abdominal|M
swing|Swing|M
swings|Swing|M
clean and jerk|Clean e Jerk|M
clean and press|Clean e Desenvolvimento|M
clean|Clean|M
snatch|Snatch|M
jerk|Jerk|M
thruster|Thruster|M
burpee|Burpee|M
pullover|Pullover|M
muscle up|Muscle-Up|M
turkish get up|Levantamento Turco|M
windmill|Moinho|M
sprint|Corrida|M|f
throw|Arremesso|M
slam|Arremesso no Chão|M
rack pull|Meio Terra no Rack|M
rack pulls|Meio Terra no Rack|M
dumbbell|com Halteres|E
dumbbells|com Halteres|E
barbell|com Barra|E
cable|na Polia|E
cables|na Polia|E
kettlebell|com Kettlebell|E
kettlebells|com Kettlebells|E
machine|na Máquina|E
smith machine|no Smith|E
smith|no Smith|E
ez bar|com Barra W|E
ez curl bar|com Barra W|E
e-z curl bar|com Barra W|E
band|com Elástico|E
bands|com Elástico|E
exercise ball|na Bola Suíça|E
medicine ball|com Bola Medicinal|E
stability ball|na Bola Suíça|E
swiss ball|na Bola Suíça|E
physioball|na Bola Suíça|E
bosu ball|no Bosu|E
ball|com Bola|E
plate|com Anilha|E
rope|com Corda|E
ropes|com Cordas|E
chains|com Correntes|E
sled|no Trenó|E
trap bar|com Barra Hexagonal|E
bar|com Barra|E
foam roll|com Rolo de Espuma|E
bodyweight|Peso Corporal|E
body weight|Peso Corporal|E
body only|Peso Corporal|E
pulley|na Polia|E
leverage|na Máquina|E
lever|na Máquina|E
box|no Caixote|E
bench|no Banco|E
wall|na Parede|E
straps|com Fitas|E
towel|com Toalha|E
incline|Inclinado|Inclinada|A
decline|Declinado|Declinada|A
seated|Sentado|Sentada|A
standing|em Pé|em Pé|A
lying|Deitado|Deitada|A
reverse|Invertido|Invertida|A
alternating|Alternado|Alternada|A
alternate|Alternado|Alternada|A
one arm|Unilateral|Unilateral|A
single arm|Unilateral|Unilateral|A
one leg|Unilateral|Unilateral|A
one legged|Unilateral|Unilateral|A
single leg|Unilateral|Unilateral|A
single|Unilateral|Unilateral|A
two arm|Bilateral|Bilateral|A
two dumbbell|com Dois Halteres|com Dois Halteres|A
double|Duplo|Dupla|A
close grip|Pegada Fechada|Pegada Fechada|A
wide grip|Pegada Aberta|Pegada Aberta|A
medium grip|Pegada Média|Pegada Média|A
reverse grip|Pegada Supinada|Pegada Supinada|A
neutral grip|Pegada Neutra|Pegada Neutra|A
mixed grip|Pegada Mista|Pegada Mista|A
underhand|Pegada Supinada|Pegada Supinada|A
overhand|Pegada Pronada|Pegada Pronada|A
pronated|Pronado|Pronada|A
supinated|Supinado|Supinada|A
palm in|Pegada Neutra|Pegada Neutra|A
palms in|Pegada Neutra|Pegada Neutra|A
grip|Pegada|Pegada|A
overhead|Acima da Cabeça|Acima da Cabeça|A
front|Frontal|Frontal|A
rear|Posterior|Posterior|A
side|Lateral|Lateral|A
lateral|Lateral|Lateral|A
bent over|Curvado|Curvada|A
bent arm|Braço Flexionado|Braço Flexionado|A
straight arm|Braço Estendido|Braço Estendido|A
straight|Reto|Reta|A
flat|Reto|Reta|A
high|Alto|Alta|A
low|Baixo|Baixa|A
mid|Médio|Média|A
wide|Aberto|Aberta|A
close|Fechado|Fechada|A
narrow|Fechado|Fechada|A
weighted|com Peso|com Peso|A
behind the neck|Atrás da Nuca|Atrás da Nuca|A
behind the back|Atrás das Costas|Atrás das Costas|A
kneeling|Ajoelhado|Ajoelhada|A
prone|Pronado|Pronada|A
supine|Supinado|Supinada|A
hanging|Suspenso|Suspensa|A
suspended|Suspenso|Suspensa|A
floor|no Chão|no Chão|A
on the floor|no Chão|no Chão|A
palms up|Palmas para Cima|Palmas para Cima|A
palms down|Palmas para Baixo|Palmas para Baixo|A
palm up|Palmas para Cima|Palmas para Cima|A
palms|Palmas|Palmas|A
power|Explosivo|Explosiva|A
explosive|Explosivo|Explosiva|A
plyo|Pliométrico|Pliométrica|A
isometric|Isométrico|Isométrica|A
elevated|Elevado|Elevada|A
dynamic|Dinâmico|Dinâmica|A
stiff legged|Pernas Estendidas|Pernas Estendidas|A
stiff leg|Pernas Estendidas|Pernas Estendidas|A
narrow stance|Base Fechada|Base Fechada|A
wide stance|Base Aberta|Base Aberta|A
deficit|em Déficit|em Déficit|A
triceps|Tríceps|N
tricep|Tríceps|N
biceps|Bíceps|N
bicep|Bíceps|N
shoulder|Ombros|N
shoulders|Ombros|N
chest|Peito|N
back|Costas|N
upper back|Costas Superior|N
middle back|Costas Médio|N
lower back|Lombar|N
leg|Pernas|N
legs|Pernas|N
calf|Panturrilha|N
calves|Panturrilhas|N
soleus|Sóleo|N
gastrocnemius|Gastrocnêmio|N
glute|Glúteos|N
glutes|Glúteos|N
hamstring|Posteriores|N
hamstrings|Posteriores|N
quad|Quadríceps|N
quads|Quadríceps|N
quadriceps|Quadríceps|N
adductor|Adutores|N
adductors|Adutores|N
abductor|Abdutores|N
abductors|Abdutores|N
ab|Abdômen|N
abs|Abdômen|N
abdominal|Abdômen|N
core|Core|N
lat|Dorsais|N
lats|Dorsais|N
latissimus dorsi|Dorsais|N
delt|Deltoide|N
delts|Deltoides|N
deltoid|Deltoide|N
trap|Trapézio|N
traps|Trapézio|N
rhomboids|Romboides|N
piriformis|Piriforme|N
brachialis|Braquial|N
neck|Pescoço|N
forearm|Antebraço|N
forearms|Antebraços|N
wrist|Punho|N
finger|Dedos|N
hip|Quadril|N
hips|Quadril|N
groin|Virilha|N
oblique|Oblíquos|N
obliques|Oblíquos|N
arm|Braço|N
arms|Braços|N
head|Cabeça|N
knee|Joelho|N
knees|Joelhos|N
ankle|Tornozelo|N
foot|Pé|N
feet|Pés|N
elbow|Cotovelo|N
elbows|Cotovelos|N
hand|Mão|N
hands|Mãos|N
torso|Tronco|N
spine|Coluna|N
spinal|Coluna|N
chair|Cadeira|N
position|Posição|N
with|-|F
the|-|F
a|-|F
an|-|F
and|e|F
or|ou|F
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

  const fem = movements[0]?.fem ?? false;
  const adjText = Array.from(new Set(adjs)).map((a) => {
    const [m, f] = a.split('|');
    return fem ? f : m;
  });
  const isUnilateral = adjText.includes('Unilateral');
  const normalizedEquips = equips.map((eq) =>
    isUnilateral && eq === 'com Halteres' ? 'com Halter' : eq
  );
  const eq = Array.from(new Set(normalizedEquips)).join(' e ');

  if (movements.length > 1) {
    return inline
      .map((x) => x.pt)
      .filter(Boolean)
      .join(' ');
  }
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

  const override = OVERRIDES[name];
  if (override) {
    cache.set(name, override);
    return override;
  }

  const out = name
    .split(' - ')
    .map(translatePart)
    .filter(Boolean)
    .join(' - ');
  const final = out || name;
  cache.set(name, final);
  return final;
}
