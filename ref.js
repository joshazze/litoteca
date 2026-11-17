'use strict';
/* Dados de referência da Litoteca.
   Classes e valores típicos de manuais de mineralogia (Dana, Klein & Dutrow) e do
   material didático do IGc-USP. Valores de amostra real variam: o app só preenche
   campos vazios e tudo continua editável. */

const CLASSES_PADRAO = {
  mineral: [
    { id: 'nativos', nome: 'Elementos nativos', desc: 'Minerais formados por um único elemento químico, em geral metais (ouro, prata, cobre), semimetais ou não metais (enxofre, carbono).' },
    { id: 'sulfetos', nome: 'Sulfetos', desc: 'Combinação de metais com o enxofre (S²⁻). Brilho metálico, alta densidade e traço escuro são frequentes. Principais minérios de chumbo, zinco e cobre.' },
    { id: 'haloides', nome: 'Halóides', desc: 'Têm como ânion dominante um halogênio (Cl⁻, F⁻, Br⁻, I⁻). Ligações iônicas, dureza baixa, muitos solúveis em água.' },
    { id: 'oxidos', nome: 'Óxidos e hidróxidos', desc: 'Metais ligados ao oxigênio (O²⁻) ou à hidroxila (OH⁻). Duros e densos no caso dos óxidos, mais moles nos hidróxidos. Grande parte dos minérios de ferro, alumínio, estanho e titânio.' },
    { id: 'carbonatos', nome: 'Carbonatos', desc: 'Têm o grupo aniônico (CO₃)²⁻. Dureza 3 a 4, clivagem romboédrica nos trigonais e reação com ácido clorídrico diluído.' },
    { id: 'sulfatos', nome: 'Sulfatos', desc: 'Têm o grupo aniônico (SO₄)²⁻. Em geral claros, moles a médios, frequentes em ambientes evaporíticos.' },
    { id: 'fosfatos', nome: 'Fosfatos', desc: 'Têm o grupo aniônico (PO₄)³⁻, que pode ser substituído por arsenato e vanadato. A apatita é o fosfato mais comum.' },
    { id: 'neso', grupo: 'Silicatos', nome: 'Nesossilicatos', desc: 'Tetraedros de SiO₄ isolados, ligados entre si por cátions. Estrutura compacta: dureza e densidade altas, hábito equidimensional.' },
    { id: 'soro', grupo: 'Silicatos', nome: 'Sorossilicatos', desc: 'Pares de tetraedros que compartilham um oxigênio, formando o grupo Si₂O₇.' },
    { id: 'ciclo', grupo: 'Silicatos', nome: 'Ciclossilicatos', desc: 'Tetraedros ligados em anéis fechados de três, quatro ou seis unidades. O anel de seis (Si₆O₁₈) explica o hábito prismático hexagonal do berilo e da turmalina.' },
    { id: 'ino', grupo: 'Silicatos', nome: 'Inossilicatos', desc: 'Tetraedros em cadeias. Cadeia simples nos piroxênios (clivagem a cerca de 87° e 93°) e dupla nos anfibólios (clivagem a 56° e 124°).' },
    { id: 'filo', grupo: 'Silicatos', nome: 'Filossilicatos', desc: 'Tetraedros em folhas. Clivagem basal perfeita, hábito lamelar e dureza baixa: micas, argilominerais, talco, clorita e serpentina.' },
    { id: 'tecto', grupo: 'Silicatos', nome: 'Tectossilicatos', desc: 'Tetraedros ligados nas três dimensões, todos os oxigênios compartilhados. Grupo mais abundante da crosta: quartzo, feldspatos, feldspatoides e zeólitas.' }
  ],
  rocha: [
    { id: 'plutonicas', grupo: 'Ígneas', nome: 'Ígneas plutônicas', desc: 'Cristalizadas do magma em profundidade, com resfriamento lento. Cristais visíveis a olho nu (textura fanerítica).' },
    { id: 'vulcanicas', grupo: 'Ígneas', nome: 'Ígneas vulcânicas e hipabissais', desc: 'Resfriadas na superfície ou perto dela. Granulação fina (afanítica), vítrea, porfirítica ou vesicular.' },
    { id: 'clasticas', grupo: 'Sedimentares', nome: 'Sedimentares clásticas', desc: 'Formadas por fragmentos de outras rochas transportados, depositados, compactados e cimentados. Classificadas pelo tamanho do grão.' },
    { id: 'quimicas', grupo: 'Sedimentares', nome: 'Sedimentares químicas', desc: 'Precipitadas diretamente de soluções aquosas, por evaporação ou mudança química do meio.' },
    { id: 'organicas', grupo: 'Sedimentares', nome: 'Sedimentares orgânicas', desc: 'Formadas pelo acúmulo de restos de organismos: carapaças, conchas ou matéria vegetal.' },
    { id: 'foliadas', grupo: 'Metamórficas', nome: 'Metamórficas foliadas', desc: 'Transformadas sob pressão orientada: os minerais se alinham e a rocha ganha foliação (clivagem ardosiana, xistosidade, bandamento gnáissico).' },
    { id: 'naofoliadas', grupo: 'Metamórficas', nome: 'Metamórficas não foliadas', desc: 'Recristalizadas sem orientação preferencial, em geral por calor (metamorfismo de contato) ou por serem quase monominerálicas.' }
  ]
};

/* Ficha de cada tipo: [chave, rótulo, dica, sugestões?] */
const CAMPOS = {
  mineral: [
    { secao: 'Identificação', campos: [
      ['variedade', 'Variedade', 'ex.: ametista, rubi'],
      ['formula', 'Composição química', 'ex.: SiO2 (os números viram subscrito)']
    ]},
    { secao: 'Propriedades físicas', campos: [
      ['dureza', 'Dureza (Mohs)', 'ex.: 7'],
      ['densidade', 'Densidade (g/cm³)', 'ex.: 2,65'],
      ['traco', 'Traço', 'cor do pó na porcelana'],
      ['brilho', 'Brilho', '', 'brilhos'],
      ['cor', 'Cor', ''],
      ['diafaneidade', 'Diafaneidade', '', 'diafaneidades'],
      ['clivagem', 'Clivagem', 'ex.: perfeita basal'],
      ['fratura', 'Fratura', 'ex.: conchoidal'],
      ['sistema', 'Sistema cristalino', '', 'sistemas'],
      ['habito', 'Hábito', 'ex.: prismático, botrioidal'],
      ['especiais', 'Outras propriedades', 'magnetismo, fluorescência, reação ao HCl...']
    ]},
    { secao: 'Ocorrência e procedência', campos: [
      ['ocorrencia', 'Área de incidência', 'ambientes geológicos onde ocorre'],
      ['procedencia', 'Procedência da amostra', 'cidade, mina, afloramento'],
      ['aquisicao', 'Aquisição', 'data, troca, compra, coleta'],
      ['dimensoes', 'Dimensões e massa', 'ex.: 4 x 3 x 2 cm, 38 g']
    ]},
    { secao: 'Notas', campos: [
      ['curiosidades', 'Curiosidades', '', null, true]
    ]}
  ],
  rocha: [
    { secao: 'Descrição', campos: [
      ['textura', 'Textura', 'ex.: fanerítica, afanítica, clástica', 'texturas'],
      ['granulacao', 'Granulação', 'ex.: grossa, média, fina'],
      ['estrutura', 'Estrutura', 'ex.: maciça, vesicular, foliada, acamadada'],
      ['cor', 'Cor', '']
    ]},
    { secao: 'Composição', campos: [
      ['composicao', 'Composição mineralógica', 'minerais separados por vírgula', null, true],
      ['especiais', 'Outras observações', 'reação ao HCl, fósseis, alteração...']
    ]},
    { secao: 'Ocorrência e procedência', campos: [
      ['ocorrencia', 'Área de incidência', 'ambiente de formação, onde aflora'],
      ['procedencia', 'Procedência da amostra', 'cidade, pedreira, afloramento'],
      ['aquisicao', 'Aquisição', 'data, troca, compra, coleta'],
      ['dimensoes', 'Dimensões e massa', 'ex.: 10 x 7 x 4 cm, 320 g']
    ]},
    { secao: 'Notas', campos: [
      ['curiosidades', 'Curiosidades', '', null, true]
    ]}
  ]
};

const SUGESTOES = {
  brilhos: ['metálico', 'submetálico', 'vítreo', 'adamantino', 'resinoso', 'perolado', 'sedoso', 'gorduroso', 'ceroso', 'terroso'],
  diafaneidades: ['transparente', 'translúcido', 'opaco', 'transparente a translúcido', 'translúcido a opaco'],
  sistemas: ['cúbico', 'tetragonal', 'hexagonal', 'trigonal', 'ortorrômbico', 'monoclínico', 'triclínico', 'amorfo'],
  texturas: ['fanerítica', 'afanítica', 'porfirítica', 'vítrea', 'vesicular', 'clástica', 'cristalina', 'bioclástica', 'granoblástica', 'lepidoblástica', 'nematoblástica']
};

/* Minerais: nome, classe, fórmula, sistema, dureza, densidade, traço, brilho, cor,
   clivagem, fratura, diafaneidade, hábito, área de incidência, outras propriedades */
const REF_MINERAIS = [
  ['Ouro', 'nativos', 'Au', 'cúbico', '2,5 a 3', '19,3', 'amarelo-ouro', 'metálico', 'amarelo-ouro', 'ausente', 'serrilhada', 'opaco', 'pepitas, grãos, dendrítico', 'veios hidrotermais de quartzo e depósitos aluvionares (placers)', 'maleável e dúctil, não escurece'],
  ['Prata', 'nativos', 'Ag', 'cúbico', '2,5 a 3', '10,5', 'branco-prateado', 'metálico', 'branco-prateado, escurece com o tempo', 'ausente', 'serrilhada', 'opaco', 'dendrítico, arborescente, filamentos', 'zonas de oxidação e veios hidrotermais', 'maleável e dúctil'],
  ['Cobre', 'nativos', 'Cu', 'cúbico', '2,5 a 3', '8,9', 'vermelho-cobre brilhante', 'metálico', 'vermelho-cobre, pátina verde', 'ausente', 'serrilhada', 'opaco', 'dendrítico, massas, placas', 'zonas de oxidação de depósitos de cobre e amígdalas de basalto', 'maleável e dúctil'],
  ['Enxofre', 'nativos', 'S', 'ortorrômbico', '1,5 a 2,5', '2,07', 'branco', 'resinoso a adamantino', 'amarelo', 'imperfeita', 'conchoidal a irregular', 'transparente a translúcido', 'bipiramidal, crostas', 'fumarolas vulcânicas e domos salinos', 'queima com chama azul e cheiro sufocante'],
  ['Grafita', 'nativos', 'C', 'hexagonal', '1 a 2', '2,2', 'cinza-escuro a preto', 'metálico a submetálico', 'cinza-chumbo', 'perfeita basal', 'irregular', 'opaco', 'placas, escamas', 'mármores, xistos e gnaisses', 'untuosa ao tato, risca o papel'],
  ['Diamante', 'nativos', 'C', 'cúbico', '10', '3,52', 'incolor', 'adamantino', 'incolor, amarelo, castanho', 'perfeita octaédrica', 'conchoidal', 'transparente', 'octaedros', 'kimberlitos, lamproítos e depósitos aluvionares', 'maior dureza conhecida em mineral'],

  ['Pirita', 'sulfetos', 'FeS2', 'cúbico', '6 a 6,5', '5,0', 'preto-esverdeado', 'metálico', 'amarelo-latão', 'indistinta', 'conchoidal a irregular', 'opaco', 'cubos estriados, piritoedros', 'muito comum em ambientes hidrotermais, sedimentares e metamórficos', 'conhecida como ouro de tolo; solta faísca no impacto'],
  ['Galena', 'sulfetos', 'PbS', 'cúbico', '2,5', '7,5', 'cinza-chumbo', 'metálico', 'cinza-chumbo', 'perfeita cúbica', 'subconchoidal', 'opaco', 'cubos, cubo-octaedros', 'veios hidrotermais e depósitos em rochas carbonáticas', 'principal minério de chumbo'],
  ['Esfalerita', 'sulfetos', 'ZnS', 'cúbico', '3,5 a 4', '4,0', 'branco a amarelo-castanho', 'resinoso a adamantino', 'castanho, preto, amarelo', 'perfeita dodecaédrica', 'conchoidal', 'transparente a translúcido', 'tetraedros, massas', 'com galena em veios hidrotermais e em rochas carbonáticas', 'principal minério de zinco'],
  ['Calcopirita', 'sulfetos', 'CuFeS2', 'tetragonal', '3,5 a 4', '4,2', 'preto-esverdeado', 'metálico', 'amarelo-latão, iridescente quando alterada', 'indistinta', 'irregular', 'opaco', 'massas, cristais pseudotetraédricos', 'pórfiros cupríferos e veios hidrotermais', 'mais mole que a pirita: risca com o canivete'],
  ['Cinábrio', 'sulfetos', 'HgS', 'trigonal', '2 a 2,5', '8,1', 'vermelho-escarlate', 'adamantino a submetálico', 'vermelho', 'perfeita prismática', 'irregular', 'translúcido', 'romboédrico, crostas', 'depósitos hidrotermais rasos ligados a vulcanismo recente', 'minério de mercúrio; tóxico'],
  ['Molibdenita', 'sulfetos', 'MoS2', 'hexagonal', '1 a 1,5', '4,7', 'cinza-azulado', 'metálico', 'cinza-chumbo azulado', 'perfeita basal', 'irregular', 'opaco', 'placas hexagonais', 'pórfiros e greisens', 'parecida com a grafita, porém mais densa e azulada'],
  ['Estibinita', 'sulfetos', 'Sb2S3', 'ortorrômbico', '2', '4,6', 'cinza-chumbo', 'metálico', 'cinza-chumbo', 'perfeita', 'subconchoidal', 'opaco', 'prismas aciculares estriados', 'veios hidrotermais de baixa temperatura', 'funde na chama de um fósforo'],
  ['Arsenopirita', 'sulfetos', 'FeAsS', 'monoclínico', '5,5 a 6', '6,1', 'preto-acinzentado', 'metálico', 'branco-prateado a cinza', 'distinta', 'irregular', 'opaco', 'prismas', 'veios hidrotermais, muitas vezes com ouro', 'cheiro de alho quando golpeada'],
  ['Bornita', 'sulfetos', 'Cu5FeS4', 'ortorrômbico', '3', '5,1', 'cinza-preto', 'metálico', 'bronze com iridescência roxa e azul', 'ausente', 'irregular', 'opaco', 'massas', 'depósitos de cobre', 'apelidada de minério pavão'],

  ['Halita', 'haloides', 'NaCl', 'cúbico', '2,5', '2,17', 'branco', 'vítreo', 'incolor, branco', 'perfeita cúbica', 'conchoidal', 'transparente', 'cubos', 'evaporitos', 'sabor salgado, solúvel em água'],
  ['Fluorita', 'haloides', 'CaF2', 'cúbico', '4', '3,18', 'branco', 'vítreo', 'roxo, verde, amarelo, incolor', 'perfeita octaédrica', 'irregular', 'transparente a translúcido', 'cubos, octaedros', 'veios hidrotermais e greisens', 'fluorescência frequente sob luz ultravioleta'],
  ['Silvita', 'haloides', 'KCl', 'cúbico', '2', '1,99', 'branco', 'vítreo', 'incolor, branco, avermelhado', 'perfeita cúbica', 'irregular', 'transparente', 'cubos', 'evaporitos', 'sabor amargo, solúvel em água; minério de potássio'],

  ['Hematita', 'oxidos', 'Fe2O3', 'trigonal', '5 a 6', '5,3', 'vermelho a castanho-avermelhado', 'metálico a terroso', 'cinza-aço, preto, vermelho', 'ausente', 'irregular a subconchoidal', 'opaco', 'placas, reniforme, especular', 'formações ferríferas bandadas (Quadrilátero Ferrífero, MG)', 'traço vermelho mesmo quando a amostra é preta'],
  ['Magnetita', 'oxidos', 'Fe3O4', 'cúbico', '5,5 a 6,5', '5,2', 'preto', 'metálico', 'preto', 'ausente', 'irregular', 'opaco', 'octaedros, massas granulares', 'rochas ígneas máficas, formações ferríferas, areias pretas', 'fortemente magnética'],
  ['Coríndon', 'oxidos', 'Al2O3', 'trigonal', '9', '4,0', 'branco', 'adamantino a vítreo', 'variada; vermelho no rubi, azul na safira', 'ausente', 'conchoidal', 'transparente a translúcido', 'prismas hexagonais em forma de barril', 'pegmatitos, rochas metamórficas aluminosas, aluviões', 'segundo mineral mais duro da escala de Mohs'],
  ['Cassiterita', 'oxidos', 'SnO2', 'tetragonal', '6 a 7', '7,0', 'branco a castanho-claro', 'adamantino', 'castanho a preto', 'imperfeita', 'subconchoidal', 'translúcido a opaco', 'prismas, geminados', 'greisens, pegmatitos e aluviões (Rondônia, Amazonas)', 'principal minério de estanho; densidade alta'],
  ['Rutilo', 'oxidos', 'TiO2', 'tetragonal', '6 a 6,5', '4,25', 'castanho-claro', 'adamantino a submetálico', 'vermelho-castanho, dourado, preto', 'distinta', 'irregular', 'translúcido a opaco', 'prismas estriados, agulhas', 'rochas metamórficas, pegmatitos, areias pesadas', 'forma as agulhas douradas do quartzo rutilado'],
  ['Pirolusita', 'oxidos', 'MnO2', 'tetragonal', '6 a 6,5 nos cristais; 2 em massa', '5,1', 'preto', 'metálico a terroso', 'preto', 'perfeita', 'irregular', 'opaco', 'dendritos, massas', 'zonas de oxidação de depósitos de manganês', 'suja os dedos de preto'],
  ['Goethita', 'oxidos', 'FeO(OH)', 'ortorrômbico', '5 a 5,5', '4,3', 'castanho-amarelado', 'adamantino a sedoso', 'castanho a preto', 'perfeita', 'irregular', 'opaco', 'botrioidal, fibroso radial', 'lateritas e zonas de alteração de rochas ricas em ferro', 'componente principal da limonita'],
  ['Cromita', 'oxidos', 'FeCr2O4', 'cúbico', '5,5', '4,8', 'castanho', 'metálico a submetálico', 'preto', 'ausente', 'irregular', 'opaco', 'massas granulares', 'rochas ultramáficas: peridotitos e serpentinitos', 'único minério de cromo; pode ser fracamente magnética'],
  ['Espinélio', 'oxidos', 'MgAl2O4', 'cúbico', '7,5 a 8', '3,6', 'branco', 'vítreo', 'vermelho, azul, rosa, preto', 'ausente', 'conchoidal', 'transparente a opaco', 'octaedros', 'mármores, rochas metamórficas e aluviões', ''],
  ['Gibbsita', 'oxidos', 'Al(OH)3', 'monoclínico', '2,5 a 3,5', '2,4', 'branco', 'vítreo a terroso', 'branco, cinza', 'perfeita basal', 'irregular', 'transparente a translúcido', 'massas terrosas, pisolitos', 'bauxitas formadas por intemperismo tropical (Pará, Minas Gerais)', 'principal mineral de minério de alumínio'],

  ['Calcita', 'carbonatos', 'CaCO3', 'trigonal', '3', '2,71', 'branco', 'vítreo', 'incolor, branco, variada', 'perfeita romboédrica em três direções', 'conchoidal', 'transparente a translúcido', 'romboedros, escalenoedros', 'calcários, mármores, veios e espeleotemas', 'efervesce no HCl diluído a frio; dupla refração forte (espato da Islândia)'],
  ['Dolomita', 'carbonatos', 'CaMg(CO3)2', 'trigonal', '3,5 a 4', '2,85', 'branco', 'vítreo a perolado', 'branco, rosado', 'perfeita romboédrica', 'subconchoidal', 'transparente a translúcido', 'romboedros com faces curvas (em sela)', 'dolomitos e mármores dolomíticos', 'só efervesce no HCl quando em pó'],
  ['Aragonita', 'carbonatos', 'CaCO3', 'ortorrômbico', '3,5 a 4', '2,95', 'branco', 'vítreo', 'incolor, branco', 'distinta', 'subconchoidal', 'transparente a translúcido', 'prismas pseudo-hexagonais, aciculares', 'conchas, espeleotemas e fontes termais', 'mesma fórmula da calcita, outra estrutura; efervesce no HCl'],
  ['Siderita', 'carbonatos', 'FeCO3', 'trigonal', '3,5 a 4,5', '3,96', 'branco', 'vítreo', 'castanho', 'perfeita romboédrica', 'irregular', 'translúcido', 'romboedros', 'sedimentos e veios hidrotermais', 'efervesce no HCl quente'],
  ['Malaquita', 'carbonatos', 'Cu2CO3(OH)2', 'monoclínico', '3,5 a 4', '4,0', 'verde-claro', 'adamantino a sedoso', 'verde com bandas', 'perfeita', 'subconchoidal', 'translúcido a opaco', 'botrioidal, bandado', 'zonas de oxidação de depósitos de cobre', 'efervesce no HCl'],
  ['Azurita', 'carbonatos', 'Cu3(CO3)2(OH)2', 'monoclínico', '3,5 a 4', '3,77', 'azul-claro', 'vítreo', 'azul-intenso', 'perfeita', 'conchoidal', 'transparente a translúcido', 'prismas, rosetas', 'zonas de oxidação de depósitos de cobre', 'efervesce no HCl; costuma ocorrer com malaquita'],
  ['Rodocrosita', 'carbonatos', 'MnCO3', 'trigonal', '3,5 a 4', '3,7', 'branco', 'vítreo a perolado', 'rosa', 'perfeita romboédrica', 'irregular', 'transparente a translúcido', 'romboedros, bandado', 'veios hidrotermais', ''],
  ['Magnesita', 'carbonatos', 'MgCO3', 'trigonal', '4 a 4,5', '3,0', 'branco', 'vítreo', 'branco', 'perfeita romboédrica', 'conchoidal nas massas porcelânicas', 'translúcido a opaco', 'massas compactas', 'alteração de rochas ultramáficas e depósitos sedimentares (Brumado, BA)', 'efervesce no HCl quente'],

  ['Gipsita', 'sulfatos', 'CaSO4·2H2O', 'monoclínico', '2', '2,3', 'branco', 'vítreo a perolado', 'incolor, branco', 'perfeita', 'irregular', 'transparente a translúcido', 'tabular, rosa do deserto, fibroso', 'evaporitos', 'risca com a unha; selenita e alabastro são variedades'],
  ['Barita', 'sulfatos', 'BaSO4', 'ortorrômbico', '3 a 3,5', '4,5', 'branco', 'vítreo a perolado', 'incolor, branco, azulado', 'perfeita', 'irregular', 'transparente a translúcido', 'tabular, rosetas', 'veios hidrotermais e sedimentos', 'surpreendentemente pesada para um mineral claro'],
  ['Anidrita', 'sulfatos', 'CaSO4', 'ortorrômbico', '3,5', '2,97', 'branco', 'vítreo a perolado', 'branco, azulado', 'perfeita em três direções em ângulo reto', 'irregular', 'transparente a translúcido', 'massas granulares', 'evaporitos', ''],
  ['Celestina', 'sulfatos', 'SrSO4', 'ortorrômbico', '3 a 3,5', '3,96', 'branco', 'vítreo', 'azul-claro, incolor', 'perfeita', 'irregular', 'transparente a translúcido', 'tabular, geodos', 'geodos em calcários e evaporitos', 'dá chama vermelha (estrôncio)'],

  ['Apatita', 'fosfatos', 'Ca5(PO4)3(F,Cl,OH)', 'hexagonal', '5', '3,2', 'branco', 'vítreo a subresinoso', 'verde, azul, amarelo, castanho', 'indistinta', 'conchoidal', 'transparente a opaco', 'prismas hexagonais', 'acessória em quase todas as rochas ígneas; carbonatitos (Araxá e Tapira, MG)', 'dureza 5 da escala de Mohs; principal fonte de fósforo'],
  ['Monazita', 'fosfatos', '(Ce,La,Nd,Th)PO4', 'monoclínico', '5 a 5,5', '5,1', 'branco', 'resinoso', 'castanho-avermelhado, amarelo', 'distinta', 'conchoidal', 'translúcido', 'grãos, cristais tabulares', 'areias monazíticas do litoral (ES, BA, RJ) e pegmatitos', 'radioativa por causa do tório; fonte de terras raras'],
  ['Turquesa', 'fosfatos', 'CuAl6(PO4)4(OH)8·4H2O', 'triclínico', '5 a 6', '2,7', 'branco a verde-claro', 'ceroso', 'azul a verde', 'perfeita (rara em massas)', 'conchoidal', 'opaco', 'massas criptocristalinas, nódulos', 'zonas de alteração de rochas ricas em alumínio em clima árido', ''],
  ['Piromorfita', 'fosfatos', 'Pb5(PO4)3Cl', 'hexagonal', '3,5 a 4', '7,0', 'branco', 'resinoso a adamantino', 'verde, castanho, amarelo', 'imperfeita', 'subconchoidal', 'translúcido', 'prismas em barril', 'zonas de oxidação de depósitos de chumbo', ''],

  ['Olivina', 'neso', '(Mg,Fe)2SiO4', 'ortorrômbico', '6,5 a 7', '3,3', 'branco', 'vítreo', 'verde-oliva', 'imperfeita', 'conchoidal', 'transparente a translúcido', 'granular', 'basaltos, gabros, peridotitos e xenólitos do manto', 'variedade gema: peridoto'],
  ['Granada (almandina)', 'neso', 'Fe3Al2(SiO4)3', 'cúbico', '7 a 7,5', '4,3', 'branco', 'vítreo', 'vermelho-escuro', 'ausente', 'conchoidal', 'transparente a translúcido', 'dodecaedros, trapezoedros', 'xistos e gnaisses', ''],
  ['Zircão', 'neso', 'ZrSiO4', 'tetragonal', '7,5', '4,6', 'branco', 'adamantino', 'castanho, incolor, variada', 'indistinta', 'conchoidal', 'transparente a translúcido', 'prismas com pirâmides', 'acessório em granitos; areias pesadas', 'usado em datação U-Pb'],
  ['Topázio', 'neso', 'Al2SiO4(F,OH)2', 'ortorrômbico', '8', '3,55', 'branco', 'vítreo', 'incolor, amarelo, azul, laranja-rosado (imperial)', 'perfeita basal', 'conchoidal', 'transparente', 'prismas estriados', 'pegmatitos e greisens; topázio imperial de Ouro Preto (MG)', 'dureza 8 da escala de Mohs'],
  ['Cianita', 'neso', 'Al2SiO5', 'triclínico', '4,5 a 5 ao longo do cristal; 6,5 a 7 na transversal', '3,6', 'branco', 'vítreo a perolado', 'azul', 'perfeita', 'irregular', 'transparente a translúcido', 'laminar alongado', 'xistos e gnaisses de alta pressão', 'dureza muda com a direção'],
  ['Andaluzita', 'neso', 'Al2SiO5', 'ortorrômbico', '6,5 a 7,5', '3,15', 'branco', 'vítreo', 'rosado, castanho', 'boa', 'irregular', 'translúcido a opaco', 'prismas de seção quadrada', 'metamorfismo de contato em rochas aluminosas', 'a variedade quiastolita mostra uma cruz escura na seção'],
  ['Estaurolita', 'neso', 'Fe2Al9Si4O23(OH)', 'monoclínico', '7 a 7,5', '3,7', 'branco a cinza', 'vítreo a resinoso', 'castanho-avermelhado', 'distinta', 'subconchoidal', 'translúcido a opaco', 'prismas, geminados em cruz', 'xistos de médio grau metamórfico', ''],
  ['Titanita', 'neso', 'CaTiSiO5', 'monoclínico', '5 a 5,5', '3,5', 'branco', 'adamantino a resinoso', 'castanho, amarelo, verde', 'distinta', 'conchoidal', 'transparente a translúcido', 'cristais em cunha (envelope)', 'acessória em rochas ígneas intermediárias e metamórficas', ''],

  ['Epidoto', 'soro', 'Ca2(Al,Fe)3(SiO4)(Si2O7)O(OH)', 'monoclínico', '6 a 7', '3,45', 'branco a cinza', 'vítreo', 'verde-pistache', 'perfeita', 'irregular', 'transparente a opaco', 'prismas estriados', 'metamorfismo de baixo grau e alteração hidrotermal', ''],
  ['Vesuvianita', 'soro', 'Ca10(Mg,Fe)2Al4(SiO4)5(Si2O7)2(OH)4', 'tetragonal', '6,5', '3,4', 'branco', 'vítreo', 'verde, castanho', 'indistinta', 'irregular', 'translúcido', 'prismas quadrados', 'escarnitos (calcários em contato com intrusões)', 'também chamada idocrásio'],
  ['Hemimorfita', 'soro', 'Zn4Si2O7(OH)2·H2O', 'ortorrômbico', '4,5 a 5', '3,45', 'branco', 'vítreo', 'incolor, azul-claro', 'perfeita', 'conchoidal', 'transparente a translúcido', 'tabular, botrioidal', 'zonas de oxidação de depósitos de zinco', ''],

  ['Berilo', 'ciclo', 'Be3Al2Si6O18', 'hexagonal', '7,5 a 8', '2,7', 'branco', 'vítreo', 'verde (esmeralda), azul (água-marinha), amarelo (heliodoro), rosa (morganita)', 'imperfeita basal', 'conchoidal', 'transparente a translúcido', 'prismas hexagonais', 'pegmatitos graníticos; Minas Gerais é referência mundial', ''],
  ['Turmalina', 'ciclo', 'NaFe3Al6(BO3)3Si6O18(OH)4', 'trigonal', '7 a 7,5', '3,1', 'branco', 'vítreo', 'preto (schorl), verde, rosa, multicolor', 'indistinta', 'conchoidal a irregular', 'transparente a opaco', 'prismas estriados de seção triangular arredondada', 'pegmatitos e granitos; turmalina Paraíba', 'piezoelétrica e piroelétrica'],
  ['Cordierita', 'ciclo', '(Mg,Fe)2Al4Si5O18', 'ortorrômbico', '7 a 7,5', '2,6', 'branco', 'vítreo', 'azul a violeta', 'regular', 'conchoidal', 'transparente a translúcido', 'grãos, prismas curtos', 'gnaisses e hornfels', 'pleocroísmo forte: muda de cor conforme o ângulo'],
  ['Dioptásio', 'ciclo', 'CuSiO3·H2O', 'trigonal', '5', '3,3', 'verde', 'vítreo', 'verde-esmeralda', 'perfeita romboédrica', 'conchoidal', 'transparente a translúcido', 'prismas curtos', 'zonas de oxidação de depósitos de cobre', ''],

  ['Augita', 'ino', '(Ca,Na)(Mg,Fe,Al,Ti)(Si,Al)2O6', 'monoclínico', '5,5 a 6', '3,4', 'branco-acinzentado a verde-claro', 'vítreo', 'preto, verde-escuro', 'boa, duas direções a cerca de 87°', 'irregular', 'translúcido a opaco', 'prismas curtos de seção octogonal', 'basaltos e gabros', 'piroxênio mais comum'],
  ['Diopsídio', 'ino', 'CaMgSi2O6', 'monoclínico', '5,5 a 6,5', '3,3', 'branco a verde-claro', 'vítreo', 'verde', 'boa, duas direções a cerca de 87°', 'irregular', 'transparente a translúcido', 'prismas curtos', 'mármores e escarnitos', ''],
  ['Hornblenda', 'ino', 'Ca2(Mg,Fe,Al)5(Al,Si)8O22(OH)2', 'monoclínico', '5 a 6', '3,2', 'branco-acinzentado', 'vítreo', 'preto, verde-escuro', 'perfeita, duas direções a 56° e 124°', 'irregular', 'translúcido a opaco', 'prismas alongados de seção losangular', 'granitos, dioritos e anfibolitos', 'anfibólio mais comum'],
  ['Actinolita', 'ino', 'Ca2(Mg,Fe)5Si8O22(OH)2', 'monoclínico', '5 a 6', '3,0', 'branco', 'vítreo a sedoso', 'verde', 'perfeita, duas direções a 56° e 124°', 'irregular', 'translúcido', 'prismas aciculares, fibroso', 'xistos verdes e metamorfismo de baixo grau', ''],
  ['Espodumênio', 'ino', 'LiAlSi2O6', 'monoclínico', '6,5 a 7', '3,15', 'branco', 'vítreo', 'incolor, rosa (kunzita), verde (hiddenita)', 'perfeita, duas direções a cerca de 87°', 'irregular', 'transparente a translúcido', 'prismas achatados e estriados', 'pegmatitos de lítio (Vale do Jequitinhonha, MG)', 'minério de lítio'],
  ['Rodonita', 'ino', '(Mn,Fe,Mg,Ca)SiO3', 'triclínico', '5,5 a 6,5', '3,6', 'branco', 'vítreo', 'rosa com veios pretos', 'perfeita', 'conchoidal', 'translúcido', 'massas granulares', 'depósitos metamórficos de manganês', 'os veios pretos são óxidos de manganês'],
  ['Wollastonita', 'ino', 'CaSiO3', 'triclínico', '4,5 a 5', '2,9', 'branco', 'vítreo a sedoso', 'branco', 'perfeita', 'irregular', 'translúcido', 'fibroso, acicular', 'escarnitos e mármores', ''],

  ['Muscovita', 'filo', 'KAl2(AlSi3O10)(OH)2', 'monoclínico', '2 a 2,5', '2,8', 'branco', 'vítreo a perolado', 'incolor, prateado', 'perfeita basal; lâminas flexíveis e elásticas', 'irregular', 'transparente a translúcido', 'placas pseudo-hexagonais em livros', 'granitos, pegmatitos e xistos', ''],
  ['Biotita', 'filo', 'K(Mg,Fe)3(AlSi3O10)(OH)2', 'monoclínico', '2,5 a 3', '3,1', 'branco-acinzentado', 'vítreo a perolado', 'preto, castanho-escuro', 'perfeita basal; lâminas flexíveis e elásticas', 'irregular', 'translúcido a opaco', 'placas pseudo-hexagonais', 'granitos, gnaisses e xistos', ''],
  ['Talco', 'filo', 'Mg3Si4O10(OH)2', 'monoclínico', '1', '2,75', 'branco', 'perolado a gorduroso', 'branco, verde-claro', 'perfeita basal', 'irregular', 'translúcido', 'massas foliadas', 'alteração de rochas ultramáficas; pedra-sabão de Ouro Preto (MG)', 'untuoso ao tato; dureza 1 da escala de Mohs'],
  ['Caulinita', 'filo', 'Al2Si2O5(OH)4', 'triclínico', '2 a 2,5', '2,6', 'branco', 'terroso', 'branco', 'perfeita basal', 'irregular', 'opaco', 'massas terrosas', 'alteração intempérica de feldspatos', 'cheiro de argila quando umedecida'],
  ['Clorita', 'filo', '(Mg,Fe)5Al(AlSi3O10)(OH)8', 'monoclínico', '2 a 2,5', '2,65', 'branco a verde-claro', 'vítreo a perolado', 'verde', 'perfeita basal; lâminas flexíveis, não elásticas', 'irregular', 'translúcido', 'massas foliadas', 'xistos verdes e alteração hidrotermal', ''],
  ['Serpentina', 'filo', 'Mg3Si2O5(OH)4', 'monoclínico', '2,5 a 3,5', '2,55', 'branco', 'ceroso, gorduroso ou sedoso', 'verde', 'ausente nas massas', 'conchoidal a lascada', 'translúcido a opaco', 'massas, fibroso (crisotila)', 'alteração de rochas ultramáficas (serpentinitos)', ''],
  ['Lepidolita', 'filo', 'K(Li,Al)3(Al,Si)4O10(F,OH)2', 'monoclínico', '2,5 a 3', '2,85', 'branco', 'perolado', 'lilás, rosa', 'perfeita basal', 'irregular', 'translúcido', 'placas, agregados de escamas', 'pegmatitos de lítio', ''],

  ['Quartzo', 'tecto', 'SiO2', 'trigonal', '7', '2,65', 'branco', 'vítreo', 'incolor, roxo (ametista), amarelo (citrino), fumê, rosa', 'ausente', 'conchoidal', 'transparente a translúcido', 'prismas hexagonais terminados em pirâmide', 'granitos, arenitos, quartzitos, veios e geodos', 'dureza 7 da escala de Mohs; piezoelétrico'],
  ['Ágata', 'tecto', 'SiO2', 'trigonal (microcristalino)', '6,5 a 7', '2,6', 'branco', 'ceroso', 'bandada, variada', 'ausente', 'conchoidal', 'translúcido', 'nódulos e geodos bandados', 'basaltos da Formação Serra Geral (RS)', 'variedade bandada de calcedônia'],
  ['Ortoclásio', 'tecto', 'KAlSi3O8', 'monoclínico', '6', '2,56', 'branco', 'vítreo', 'rosa, branco, creme', 'boa, duas direções a 90°', 'irregular', 'translúcido', 'prismas, geminados de Carlsbad', 'granitos, sienitos e pegmatitos', 'dureza 6 da escala de Mohs'],
  ['Microclínio', 'tecto', 'KAlSi3O8', 'triclínico', '6 a 6,5', '2,56', 'branco', 'vítreo', 'branco, rosa, verde (amazonita)', 'perfeita, duas direções a cerca de 90°', 'irregular', 'translúcido', 'prismas, massas', 'granitos e pegmatitos', 'geminação em grade (xadrez) ao microscópio'],
  ['Albita', 'tecto', 'NaAlSi3O8', 'triclínico', '6 a 6,5', '2,62', 'branco', 'vítreo', 'branco', 'perfeita, duas direções a cerca de 94°', 'irregular', 'translúcido', 'tabular', 'granitos e pegmatitos', 'estrias de geminação polissintética nas faces de clivagem'],
  ['Labradorita', 'tecto', '(Ca,Na)(Al,Si)4O8', 'triclínico', '6 a 6,5', '2,7', 'branco', 'vítreo', 'cinza com reflexos azuis', 'perfeita, duas direções a cerca de 86°', 'irregular', 'translúcido', 'massas', 'gabros e anortositos', 'labradorescência: jogo de cores azul e dourado'],
  ['Nefelina', 'tecto', '(Na,K)AlSiO4', 'hexagonal', '5,5 a 6', '2,6', 'branco', 'vítreo a gorduroso', 'cinza, branco', 'indistinta', 'subconchoidal', 'transparente a opaco', 'massas, prismas curtos', 'sienitos nefelínicos (Poços de Caldas, MG)', 'nunca ocorre junto com quartzo'],
  ['Sodalita', 'tecto', 'Na8(Al6Si6O24)Cl2', 'cúbico', '5,5 a 6', '2,3', 'branco', 'vítreo', 'azul-royal com veios brancos', 'ruim', 'conchoidal', 'translúcido', 'massas', 'sienitos nefelínicos; sodalita azul-bahia (Itaju do Colônia, BA)', ''],
  ['Opala', 'tecto', 'SiO2·nH2O', 'amorfo', '5,5 a 6,5', '2,1', 'branco', 'vítreo a resinoso', 'variada, com jogo de cores', 'ausente', 'conchoidal', 'transparente a opaco', 'massas, preenchimentos', 'cavidades em rochas vulcânicas e sedimentares (Pedro II, PI)', 'mineraloide amorfo, contém água'],
  ['Estilbita', 'tecto', 'NaCa4(Al9Si27O72)·28H2O', 'monoclínico', '3,5 a 4', '2,2', 'branco', 'vítreo a perolado', 'branco, salmão', 'perfeita', 'irregular', 'transparente a translúcido', 'agregados em gravata-borboleta', 'amígdalas de basaltos (Serra Geral)', 'zeólita']
];

/* Rochas: nome, classe, textura, granulação, estrutura, cor, composição, área de incidência */
const REF_ROCHAS = [
  ['Granito', 'plutonicas', 'fanerítica', 'média a grossa', 'maciça', 'clara: rosa, cinza, branca', 'quartzo, feldspato potássico, plagioclásio, biotita, muscovita, hornblenda', 'batólitos e plútons da crosta continental'],
  ['Granodiorito', 'plutonicas', 'fanerítica', 'média a grossa', 'maciça', 'cinza-clara', 'plagioclásio, quartzo, feldspato potássico, biotita, hornblenda', 'batólitos de arcos magmáticos continentais'],
  ['Sienito', 'plutonicas', 'fanerítica', 'média a grossa', 'maciça', 'rosa a cinza', 'feldspato potássico, plagioclásio, hornblenda, biotita; pouco ou nenhum quartzo', 'intrusões alcalinas (Poços de Caldas, MG)'],
  ['Diorito', 'plutonicas', 'fanerítica', 'média', 'maciça', 'sal e pimenta', 'plagioclásio, hornblenda, biotita', 'intrusões em arcos magmáticos'],
  ['Gabro', 'plutonicas', 'fanerítica', 'média a grossa', 'maciça', 'escura: cinza-escura a preta', 'plagioclásio cálcico, piroxênio, olivina', 'crosta oceânica e intrusões máficas'],
  ['Peridotito', 'plutonicas', 'fanerítica', 'média a grossa', 'maciça', 'verde-escura', 'olivina, piroxênio, cromita', 'manto superior; complexos ofiolíticos'],
  ['Anortosito', 'plutonicas', 'fanerítica', 'grossa', 'maciça', 'clara a cinza', 'plagioclásio (mais de 90%), piroxênio', 'complexos anortosíticos proterozoicos'],
  ['Pegmatito', 'plutonicas', 'fanerítica', 'muito grossa', 'maciça, zonada', 'clara', 'quartzo, feldspato, muscovita; turmalina, berilo, espodumênio', 'fase final de cristalização de granitos (Província Pegmatítica Oriental, MG)'],

  ['Basalto', 'vulcanicas', 'afanítica, às vezes porfirítica', 'fina', 'maciça, vesicular ou amigdaloidal', 'preta a cinza-escura', 'plagioclásio cálcico, piroxênio, olivina, magnetita', 'derrames continentais (Formação Serra Geral) e fundo oceânico'],
  ['Andesito', 'vulcanicas', 'afanítica a porfirítica', 'fina', 'maciça', 'cinza', 'plagioclásio, hornblenda, piroxênio', 'vulcões de arcos de subducção (Andes)'],
  ['Riolito', 'vulcanicas', 'afanítica a porfirítica', 'fina', 'maciça, bandada por fluxo', 'clara: rosa, cinza, creme', 'quartzo, feldspato potássico, biotita', 'vulcanismo explosivo continental'],
  ['Dacito', 'vulcanicas', 'afanítica a porfirítica', 'fina', 'maciça', 'cinza-clara', 'plagioclásio, quartzo, hornblenda, biotita', 'domos e derrames em arcos vulcânicos'],
  ['Traquito', 'vulcanicas', 'afanítica a porfirítica', 'fina', 'maciça, fluidal', 'clara a cinza', 'feldspato alcalino, biotita, piroxênio', 'vulcanismo alcalino'],
  ['Fonolito', 'vulcanicas', 'afanítica', 'fina', 'maciça, em placas', 'cinza-esverdeada', 'feldspato alcalino, nefelina, piroxênio', 'vulcanismo alcalino (Ilha de Trindade, Fernando de Noronha)'],
  ['Obsidiana', 'vulcanicas', 'vítrea', 'sem cristais', 'maciça', 'preta', 'vidro vulcânico de composição riolítica', 'bordas de derrames riolíticos de resfriamento muito rápido'],
  ['Pedra-pomes', 'vulcanicas', 'vítrea vesicular', 'sem cristais', 'vesicular', 'clara', 'vidro vulcânico', 'erupções explosivas', ],
  ['Diabásio', 'vulcanicas', 'subofítica', 'fina a média', 'maciça', 'preta a cinza-esverdeada', 'plagioclásio, piroxênio', 'diques e soleiras (hipabissal)'],

  ['Conglomerado', 'clasticas', 'clástica', 'grânulos a matacões (> 2 mm), arredondados', 'maciça a acamadada', 'variada', 'seixos de quartzo e de outras rochas em matriz arenosa', 'leques aluviais e leitos de rios de alta energia'],
  ['Brecha sedimentar', 'clasticas', 'clástica', 'fragmentos > 2 mm, angulosos', 'maciça', 'variada', 'fragmentos de rocha em matriz fina', 'depósitos de talude e próximos à área-fonte'],
  ['Arenito', 'clasticas', 'clástica', 'areia (0,062 a 2 mm)', 'acamadada, estratificação cruzada', 'bege, vermelha, cinza', 'quartzo, feldspato, fragmentos líticos, cimento silicoso ou carbonático', 'dunas, rios, praias e deltas (Formação Botucatu)'],
  ['Siltito', 'clasticas', 'clástica', 'silte (0,004 a 0,062 mm)', 'acamadada', 'cinza a castanha', 'quartzo, argilominerais', 'planícies de inundação e ambientes marinhos rasos'],
  ['Argilito', 'clasticas', 'clástica', 'argila (< 0,004 mm)', 'maciça', 'cinza, vermelha, verde', 'argilominerais, quartzo fino', 'lagos e mares calmos'],
  ['Folhelho', 'clasticas', 'clástica', 'argila (< 0,004 mm)', 'físsil, laminada', 'cinza-escura a preta', 'argilominerais, quartzo fino, matéria orgânica', 'ambientes de baixa energia; rocha geradora de petróleo'],

  ['Calcário', 'quimicas', 'cristalina ou bioclástica', 'fina a média', 'maciça a acamadada', 'cinza, creme', 'calcita, fósseis', 'mares rasos de plataforma carbonática (Grupo Bambuí)'],
  ['Dolomito', 'quimicas', 'cristalina', 'fina a média', 'maciça a acamadada', 'cinza-clara a creme', 'dolomita', 'plataformas carbonáticas alteradas por fluidos ricos em magnésio'],
  ['Travertino', 'quimicas', 'cristalina, porosa', 'fina', 'bandada com poros', 'creme a bege', 'calcita, aragonita', 'fontes termais e cavernas'],
  ['Evaporito', 'quimicas', 'cristalina', 'média a grossa', 'acamadada', 'branca a rosada', 'halita, gipsita, anidrita, silvita', 'bacias de evaporação (pré-sal brasileiro)'],
  ['Sílex', 'quimicas', 'criptocristalina', 'muito fina', 'maciça, nódulos', 'cinza, preta, castanha', 'quartzo microcristalino, calcedônia', 'nódulos em calcários e sedimentos de mar profundo'],

  ['Carvão mineral', 'organicas', 'amorfa a bandada', 'fina', 'bandada', 'preta', 'matéria vegetal carbonizada', 'pântanos soterrados (bacias carboníferas de SC e RS)'],
  ['Coquina', 'organicas', 'bioclástica', 'grossa', 'porosa', 'creme', 'fragmentos de conchas cimentados por calcita', 'praias e plataformas rasas'],
  ['Diatomito', 'organicas', 'bioclástica', 'muito fina', 'laminada, leve', 'branca', 'carapaças de diatomáceas (opala)', 'lagos e mares com alta produtividade biológica'],

  ['Ardósia', 'foliadas', 'lepidoblástica muito fina', 'muito fina', 'clivagem ardosiana', 'cinza-escura, verde, preta', 'mica branca fina, clorita, quartzo', 'metamorfismo de baixo grau de folhelhos (Pompéu, MG)'],
  ['Filito', 'foliadas', 'lepidoblástica', 'fina', 'foliada com brilho sedoso', 'cinza-prateada a esverdeada', 'mica branca, clorita, quartzo', 'metamorfismo de baixo grau de rochas pelíticas'],
  ['Xisto', 'foliadas', 'lepidoblástica', 'média a grossa', 'xistosidade', 'variada, brilhante', 'micas, quartzo, granada, estaurolita, cianita', 'metamorfismo de médio grau de rochas pelíticas'],
  ['Gnaisse', 'foliadas', 'granoblástica bandada', 'média a grossa', 'bandamento gnáissico', 'bandas claras e escuras', 'quartzo, feldspato, biotita, hornblenda, granada', 'metamorfismo de alto grau; embasamento cristalino (Pão de Açúcar, RJ)'],
  ['Migmatito', 'foliadas', 'heterogênea', 'média a grossa', 'dobrada, com porções fundidas', 'bandas claras e escuras', 'quartzo, feldspato, biotita', 'metamorfismo de altíssimo grau com fusão parcial'],
  ['Itabirito', 'foliadas', 'granoblástica bandada', 'fina a média', 'bandada', 'bandas de hematita e quartzo', 'hematita, magnetita, quartzo', 'formações ferríferas metamorfisadas (Quadrilátero Ferrífero, MG)'],
  ['Anfibolito', 'foliadas', 'nematoblástica', 'média', 'foliada a lineada', 'preta a verde-escura', 'hornblenda, plagioclásio', 'metamorfismo de médio a alto grau de basaltos e gabros'],

  ['Mármore', 'naofoliadas', 'granoblástica', 'fina a grossa', 'maciça', 'branca, cinza, rosada', 'calcita, dolomita', 'metamorfismo de calcários e dolomitos'],
  ['Quartzito', 'naofoliadas', 'granoblástica', 'fina a média', 'maciça', 'branca, rosa, cinza', 'quartzo, às vezes muscovita', 'metamorfismo de arenitos (Serra do Espinhaço)'],
  ['Hornfels', 'naofoliadas', 'granoblástica', 'fina', 'maciça', 'escura', 'variada: andaluzita, cordierita, biotita, quartzo', 'metamorfismo de contato junto a intrusões'],
  ['Serpentinito', 'naofoliadas', 'fibrosa a maciça', 'fina', 'maciça, com superfícies polidas', 'verde', 'serpentina, magnetita, cromita', 'alteração de rochas ultramáficas'],
  ['Esteatito', 'naofoliadas', 'granoblástica', 'fina', 'maciça', 'cinza-esverdeada', 'talco, clorita, carbonatos', 'alteração de rochas ultramáficas; a pedra-sabão das esculturas de Congonhas (MG)']
];

const CAMPOS_REF_MINERAL = ['classe', 'formula', 'sistema', 'dureza', 'densidade', 'traco', 'brilho', 'cor', 'clivagem', 'fratura', 'diafaneidade', 'habito', 'ocorrencia', 'especiais'];
const CAMPOS_REF_ROCHA = ['classe', 'textura', 'granulacao', 'estrutura', 'cor', 'composicao', 'ocorrencia'];

function referencia(tipo) {
  const lista = tipo === 'mineral' ? REF_MINERAIS : REF_ROCHAS;
  const chaves = tipo === 'mineral' ? CAMPOS_REF_MINERAL : CAMPOS_REF_ROCHA;
  return lista.map(l => {
    const o = { nome: l[0] };
    chaves.forEach((k, i) => { if (l[i + 1]) o[k] = l[i + 1]; });
    return o;
  });
}
