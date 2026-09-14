# Equipe Magalhães — nova landing page

Projeto independente, criado do zero. Não utiliza o projeto anterior.

## Abrir localmente

Requer Node.js. Execute nesta pasta:

```sh
node dev-server.mjs
```

Abra http://127.0.0.1:4173. Os arquivos em `dist/` também podem ser servidos em qualquer hospedagem estática via HTTP/HTTPS. Não abra o HTML diretamente por `file://`, pois o mapa carrega um arquivo GeoJSON local.

## Arquivos

- `dist/index.html`: conteúdo, links de contato e metadados.
- `dist/styles.css`: identidade visual e layouts responsivos.
- `dist/app.js`: menu, navegação e carregamento progressivo.
- `dist/support.css` e `dist/support-effect.js`: seção de apoio com botão destacado, esfera da equipe e constelação interativa.
- `dist/gallery.css`, `dist/gallery.js` e `dist/data/team-gallery.json`: rolo interativo e fotos da equipe.
- `dist/map.js`: mapa, seis bairros, seleção, câmera, controles e alternativa 2D.
- `dist/images/equipe-magalhaes.png`: fotografia original enviada, sem alteração nos rostos. Enquadramento realizado com CSS.
- `dist/data/bairros.geojson`: os seis polígonos oficiais, em WGS84.
- `dist/data/source.json`: origem e data de consulta dos dados.
- `dist/vendor/`: MapLibre GL JS 5.6.0 e CSS, carregados apenas quando o mapa se aproxima da tela.

## Conteúdo

A página apresenta a equipe, os seis bairros e uma seção geral sobre a trajetória, legislação e propostas de Wellington José. Os pontos legislativos citam a ALERJ; propostas do site do candidato aparecem como propostas declaradas. Os cargos e números das duas marcas foram conferidos no DivulgaCandContas/TSE em 14/09/2026. A pesquisa de apoio está em `.qa/candidate-facts.md`.

Não há estatísticas de apoiadores, eventos fictícios ou cargos inventados. Os links do WhatsApp, Instagram e página externa vêm do texto de referência e abrem em outra aba. Nenhum formulário coleta dados e nenhuma inscrição ou envio de mensagem acontece automaticamente.

## Seção de apoio

A seção `#apoio` tem um botão grande que abre o endereço de apoio fornecido, preservando seu parâmetro `slug`. O cabeçalho e o menu móvel têm atalhos para essa seção. A antiga linha discreta de apoio foi substituída por esse bloco.

O efeito original usa Canvas 2D com projeção de profundidade: partículas, órbitas luminosas e resposta amortecida ao mouse ou toque. A marca central inclina suavemente e a iluminação acompanha a interação. Carrega perto da seção, pausa fora da tela ou com a aba oculta e limita a densidade de pixels e a quantidade de partículas no celular. A preferência de movimento reduzido mantém uma versão estática. O botão é um link HTML e funciona independentemente do efeito.

## Música ambiente

O arquivo `audio.mp3` fornecido pelo usuário foi copiado sem alterações para `dist/audio.mp3`. A página usa reprodução contínua em loop, com ganho inicial de 25%. O controle fixo permite pausar, retomar e ajustar o volume, inclusive a zero. O ganho Web Audio regula o sinal também no Safari móvel, onde o volume do elemento de áudio pode ser controlado pelo sistema.

O navegador recebe uma tentativa de reprodução ao abrir a página. Se bloquear áudio automático, a reprodução é tentada no primeiro clique, toque ou interação por teclado; o botão “Ouvir música” continua disponível. Uma pausa manual é respeitada durante essa visita: outros cliques não reiniciam a música. Uma nova visita começa novamente com o ajuste inicial. A intensidade ouvida também depende do volume do aparelho. O controle só indica reprodução quando o áudio e o contexto de som estão ativos.

Implementação: `dist/music.js` e `dist/music.css`, sem novas dependências. Limitação de autoplay: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

## Galeria da equipe

A seção final `#galeria` apresenta as dez fotos diferentes fornecidas pelo usuário. Uma das onze imagens recebidas era uma cópia exata e foi incluída uma única vez. O manifesto define arquivos, textos alternativos, dimensões e enquadramento; não há títulos ou legendas inventadas por foto.

O rolo contínuo usa molduras inclinadas, iluminação que acompanha o ponteiro e detalhes decorativos “4479”. Pode ser arrastado com mouse ou toque, navegável por botões e teclado e pausado manualmente. Ao abrir uma foto, um diálogo exibe o arquivo completo sem recorte, com setas, contador e fechamento por Escape. As cópias de continuidade ficam fora da navegação por teclado e da árvore de acessibilidade. A animação pausa durante exploração, fora da tela e com a aba oculta, e respeita movimento reduzido.

As miniaturas carregam progressivamente, e as imagens completas apenas ao abrir a foto. Os arquivos WebP ficam em `dist/images/equipe-galeria/`; totalizam aproximadamente 1,9 MB. Não houve geração por IA, retoque ou ampliação artificial dessas fotos. O carregamento da galeria é independente dos efeitos React Bits.

## Imagens e efeitos React Bits

O hero usa `dist/images/equipe-magalhaes-terno.webp`, versão da foto fornecida restaurada e editada com IA, colocando Magalhães de terno conforme solicitado (1122 × 1402). A seção do candidato usa um retrato real de seu site em `dist/images/wellington-oficial-hd.webp` (1920 × 1280). Ambos mantêm resolução e são codificados em WebP para reduzir o tráfego. O original da equipe e as versões anteriores permanecem preservados. Veja `IMAGE-NOTES.md` para origem, edição, limitações e prompt.

A identidade visual usa azul-marinho, azul vivo, amarelo e branco. Os efeitos **LightRays** e **StarBorder** são componentes React Bits reais, do repositório de David Haz. O hero mantém o conteúdo estático independente da renderização dos efeitos. Eles são desativados ou estabilizados com movimento reduzido; LightRays libera o contexto WebGL quando sai da tela. A licença e os componentes estão em `src/react-bits/`, com licença também em `dist/vendor/react-bits-LICENSE.txt`.

Para recompilar os efeitos após editar `src/effects.jsx`:

```sh
npm install
npm run build
```

O restante da página continua estático, editável diretamente em `dist/`. Não é necessário compilar para editar textos ou os locais do mapa.

## Locais dos áudios

Os sete áudios foram transcritos localmente; notas e transcrições ficam em `.qa/` e **não são publicadas pelo servidor**. As informações necessárias aos dois eventos foram adicionadas a `dist/data/locations.json`:

- Rua Capitão Pires, 31: evento relatado como realizado em 10/09, às 19h30.
- Rua João Vicente, 1109: encontro ainda em planejamento para 25 a 28/09, sem dia ou horário confirmados.

Os dois marcadores de encontros são **referências aproximadas dos trechos das ruas**, provenientes do OpenStreetMap, não coordenadas verificadas dos imóveis. A interface e os pop-ups informam isso. Não há rotas até imóveis baseadas nessas coordenadas. Os nomes das ruas foram consultados sem números nem associação a pessoas ou aos áudios.

As referências públicas solicitadas também aparecem no mapa, na categoria `reference`: Rua Divisória próxima ao Unidos (o endereço comercial publicado é o número 3), Estrada Henrique de Melo e a feira de Honório Gurgel na Rua Jurubaíba. Cada ponto possui fonte pública e indicação da precisão. Esses marcadores identificam lugares; não anunciam presença da equipe, vínculo com o estabelecimento, reunião ou retirada de materiais.

Não foi informado local de retirada de materiais. Por isso, o filtro Materiais exibe um estado vazio explícito. A feira de quarta-feira, os APs de Oswaldo Cruz e as igrejas citadas sem nome/endereço não puderam ser identificados com segurança e não receberam pontos inventados. As fontes oficiais consultadas situam a feira da Rua Jurubaíba no sábado; ela não foi confundida com a menção à quarta-feira.

Para cadastrar um ponto real, acrescente um objeto em `dist/data/locations.json` com: `id`, `neighborhood` (um dos seis IDs de `dist/map.js`), `category` (`meeting`, `materials` ou `reference`), `status`, `statusLabel`, `title`, `address`, `description`, `schedule`, `coordinates` na ordem `[longitude, latitude]`, `precision`, `geographicSource` e `source`. `accuracyNote` define a explicação da precisão no pop-up e `publicSource` permite vincular uma fonte pública do local. Só use coordenadas e horários confirmados; para referências aproximadas, mantenha a indicação expressa na interface. Alterações de data e status podem ser feitas diretamente neste arquivo.

## Mapa real

Os limites são da Prefeitura da Cidade do Rio de Janeiro / Instituto Pereira Passos:

https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/FeatureServer/4

O campo oficial `codbairro` identifica os bairros: 089, 090, 087, 088, 083 e 078. A base municipal usa a grafia “Osvaldo Cruz” para o código 088; a interface usa “Oswaldo Cruz”, como solicitado. A geometria oficial permanece inalterada.

Ruas e edificações usam OpenStreetMap via OpenFreeMap. As atribuições ficam visíveis no mapa. A perspectiva e as edificações têm renderização 3D; a extrusão colorida dos bairros é um efeito de destaque e **não representa a altitude do terreno**. Alturas sem informação específica nas edificações usam o valor de visualização padrão de 10 m.

- Passe o mouse sobre um nome para navegar até o bairro; clique ou use Tab/Enter no teclado.
- No celular, toque no nome ou no marcador. Arraste para explorar e use os controles de zoom.
- O botão 3D/2D alterna a perspectiva; o botão de enquadramento mostra todos os bairros.
- A rolagem da página não é capturada pelo zoom do mapa.
- Sem WebGL ou sem conexão com o mapa-base, os limites reais continuam disponíveis como um mapa vetorial 2D interativo. Há um botão para tentar novamente.
- Google Fonts e o mapa-base precisam de internet. Há fontes locais de fallback; os limites geográficos são servidos pelo próprio site.

Para atualizar a cópia dos dados e a biblioteca, execute `node download-map.mjs`. O script valida os seis bairros antes de gravar o GeoJSON.

## Publicação

Publique o conteúdo completo de `dist/` na raiz da hospedagem. Não publique arquivos de desenvolvimento ou credenciais. A configuração `.openai/hosting.json` conserva o identificador do Site já registrado para eventual continuidade da publicação, sem criar outro Site.

## Acessibilidade

Idioma pt-BR, link para pular ao conteúdo, foco visível, navegação por teclado, botões com rótulos, estado selecionado com `aria-pressed`, retorno de seleção com `aria-live`, menu móvel fechável com Escape e respeito à preferência por movimentos reduzidos.
