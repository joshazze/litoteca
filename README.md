# Litoteca

Catálogo pessoal de minerais e rochas que roda no iPhone como app (PWA), feito para um estudante de Engenharia Geológica organizar a própria coleção.

**Abrir:** https://joshazze.github.io/litoteca/ · **Demonstração com dados fictícios:** https://joshazze.github.io/litoteca/?demo

## O que faz

* Abas de **Minerais** e **Rochas**, cada uma dividida em classes (elementos nativos, sulfetos, halóides, óxidos, carbonatos, sulfatos, fosfatos e as seis subclasses de silicatos; ígneas, sedimentares e metamórficas). Cada classe tem uma descrição editável.
* Botão **Adicionar amostra** em cada classe, com a ficha pronta: dureza, densidade, traço, brilho, cor, clivagem, fratura, sistema cristalino, hábito, área de incidência, procedência, curiosidades e fotos.
* **Preenchimento automático:** ao digitar um nome conhecido (83 minerais e 43 rochas na base de referência), os campos vazios se preenchem com valores típicos, marcados em destaque para revisão. Tudo continua editável.
* Fotos pela câmera ou pela galeria, reduzidas antes de guardar.
* Busca por nome, fórmula, cor, procedência ou composição.
* Ligação entre fichas: a rocha lista sua composição mineralógica e aponta para os minerais que estão no acervo; o mineral mostra em quais rochas aparece.
* Cópia de segurança em arquivo `.json` (com as fotos) e restauração.
* Funciona sem internet depois da primeira abertura.

## Instalar no iPhone

1. Abrir o endereço no **Safari**.
2. Compartilhar (quadrado com seta para cima) > **Adicionar à Tela de Início**.

## Onde ficam os dados

No próprio aparelho (IndexedDB). Nada vai para servidor. Apagar o app da tela de início apaga o acervo, por isso a aba **Acervo** tem a cópia de segurança.

## Desenvolvimento

HTML, CSS e JavaScript puros, sem build. `ref.js` guarda as classes e a base de referência; `app.js`, as telas; `sw.js`, o cache offline.

Ao mudar `app.js`, `style.css` ou `ref.js`: subir `V` no `sw.js`, `VERSAO` no `app.js` e o `?v=` no `index.html`, os três com o mesmo número.

Valores de referência são típicos, tirados de manuais de mineralogia; a amostra real pode variar.
