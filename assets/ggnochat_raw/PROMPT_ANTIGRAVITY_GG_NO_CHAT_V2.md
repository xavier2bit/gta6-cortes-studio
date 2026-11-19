# GG NO CHAT — MISSÃO ANTIGRAVITY: GTA 6 CORTES STUDIO V2

**Objetivo:** evoluir o aplicativo existente, SEM recomeçar do zero, de três templates estáticos para um editor vertical com composição inteligente, identidade visual consistente, edição narrativa e controle de qualidade. Trabalhar no repositório local existente; preservar renderização/CLI e fazer branch ou backup antes de alterar.

## 1. Material avaliado (evidências)
- Três testes entregues: 15 s, 1080×1920, 60 FPS, H.264/AAC. O áudio PCM dos três é IDÊNTICO (mesmo MD5 ao decodificar); loudness integrado medido no arquivo de teste: −29,57 LUFS, true peak −15,41 dBTP.
- Split: streamer ocupa a parte superior, separador VI no centro, cena embaixo. A cena no tempo ~7s tem uma personagem importante cortada na borda esquerda devido a crop fixo. Texto do topo diz “DAVY JONES REAGIU AO GTA 6!”, mas o início não comunica a reação nem justifica o gancho.
- Web/news: cartão tipo site da Rockstar ocupa o alto durante os 15 s e diz “ROCKSTAR NEWSWIRE - OFICIAL”, mostra um suposto endereço `rockstargames.com/newswire/gta-vi-leak`, métricas de engajamento e uma suposta fala da Rockstar sobre um “novo motor de física”, SEM fonte verificável nos materiais analisados. O texto `ROCKSTAR CON` também aparece. O vídeo abaixo não demonstra claramente a afirmação.
- Direct: jogo aparece numa faixa horizontal relativamente pequena, deixando grande parte do 9:16 preenchida com fundo desfocado. O título “O MOMENTO MAIS ÉPICO DO GTA 6!” não corresponde evidentemente ao trecho de conversa na cela. Começa com um frame dominado por blur e sem acontecimento visível.
- Os três arquivos mostram a marca `@GTA6CORTES`; o pacote de identidade visual entregue é `GG NO CHAT (@ggnochat)`. Tratar como configuração de marca, NUNCA trocar arbitrariamente.
- O pacote `ggnochat_identidade_visual_assets.zip` traz avatar em JPG e três molduras em JPG RGB OPACO (não são máscaras PNG com alpha). O centro escuro de um JPG NÃO ficará transparente apenas por colocá-lo em camada superior.

## 2. Bloqueadores P0 (antes de publicar qualquer vídeo)
1. **Verdade editorial:** eliminar qualquer card que se apresente como post, Newswire, anúncio, fonte ou citação oficial da Rockstar sem URL real verificável e prova. Nunca inventar postagem, endereço, citação, selo de verificado, contagem de likes, visualizações, “HOJE”, `GAMEPLAY AO VIVO` ou vazamento. Usar `GG NO CHAT • ANÁLISE` / `CONCEITO ILUSTRATIVO` quando o usuário quiser um gráfico fictício. O modo notícia exige URL, data e texto confirmados.
2. **Gancho aderente à cena:** não usar títulos genéricos “mais épico” ou “novo motor de física” se o clipe não mostrar o prometido. O usuário deve ver e entender o motivo para continuar nos primeiros 0,0–1,5 s.
3. **Marca única:** criar `brand.json` com `display_name`, `handle`, `logo_path`, `palette`, `watermark_position`. Definir padrão do projeto como `GG NO CHAT` e `@ggnochat`; se o dono quiser outro arroba, perguntar no painel, sem hardcode `@GTA6CORTES`.
4. **Legibilidade e segurança:** conteúdo não pode ficar atrás de botões de Shorts/Reels/TikTok. Adicionar guias por plataforma no preview e escolher manualmente safes; usar indicação parametrizada (não afirmar que há uma só regra universal).
5. **Exportação e checks:** relatório QA por vídeo que mostre se existem frames pretos, texto cortado, sujeitos importantes cortados, fonte incorreta, clips mudos, áudio baixo, legendas fora de sincronia, fontes/citações não verificadas. Impedir publicação automática em caso P0.

## 3. Refatoração visual por modelo
### A — Reação / split (prioritário)
- Iniciar na frase/reação mais forte, não em fade de entrada. Reação real precisa corresponder ao mesmo momento do vídeo original; não montar reação de outra cena como se fosse sincronizada.
- Crop inteligente (keyframes `x/y/zoom` com preview): localizar rosto/personagem e acompanhar movimento sem cortar protagonista. Permitir fixar alvo e alternar momento a momento `facecam_focus` ↔ `gameplay_focus`.
- Em passagens que exigirem detalhe de gameplay, mover facecam para PiP de 16–22% da tela, com foco no jogo. Usar divisor VI como assinatura em transição curta, não ícone gigante o tempo inteiro.
- O botão CTA/logo deve ser discreto e nunca cobrir legenda/cena.
### B — Notícia / análise (reprojetar)
- Não simular site da Rockstar como se fosse autêntico. Se houver notícia verdadeira, mostrar fonte, data e link verificável; caso contrário cartão editorial `GG NO CHAT ANALISA`.
- Em 0–2s: manchete CURTA e comprovável; 2–5s: mostrar um detalhe e zoom da cena; 5–11s: análise visual com 1–2 callouts; 11–15s: conclusão/pergunta. A caixa de notícia deve recolher depois de introduzir o tema e deixar gameplay maior.
- Corrigir ortografia, hierarquia e contraste. Remover números de engajamento fictícios e botões falsos.
### C — Highlight / direct (prioritário)
- Remover as enormes bandas de blur. Introduzir reframe vertical guiado por detecção de pessoas/movimento (configurável). Se o 16:9 não puder ser recortado sem perda, usar tratamento de fundo intencional compacto, não 70% de tela vazia.
- Opções de `smart_crop` e `letterbox` acessíveis no editor; oferecer antes/depois e controle manual de anchor.
- Colocar legenda em região legível, sem bloquear rostos ou o HUD principal, e adaptar posição por cena.
- Gancho visual no frame zero, sem animação de entrada vazia.

## 4. Linguagem gráfica e identidade
- Paleta recebida: rosa #FF2A85, magenta #FF6EC7, laranja #FF7B00, ciano #00F0FF, roxo #1A0B2E, branco #F8F9FA. Limitar cada composição a um destaque principal + um secundário. Diminuir glow pesado; deixar jogo ser protagonista.
- Avatar GG NO CHAT deve ter uma versão reduzida legível em tamanho de perfil de 40–48 px (símbolo `GG` sem pequenos subtítulos). Não usar a arte 1024 px inteira como watermark.
- Converter as três molduras RGB JPG para overlays com **máscara alpha VERDADEIRA**. Não fazer simplesmente chroma key global do preto (apagaria detalhes escuros do desenho); selecionar a janela interna por geometria/contorno e validar. Oferecer `no_frame`, `subtle_dark`, `vice_pink` e `wide_16x9` como presets opcionais — não aplicar moldura saturada por padrão em todo vídeo.
- `Pricedown` apenas para assinaturas visuais pontuais, não para legenda corrida. Usar Bebas/Anton para títulos curtos; Montserrat/Inter bold para legenda. O logo da Rockstar não deve ser confundido com branding próprio do canal.

## 5. Fluxo automatizado de edição (sem 'AI slop')
**Passo 1 — Ingest:** obter origem legal do clipe e metadados; detectar idioma/fala, resolução, duração, FPS, loudness, facecam/HUD; preservar link do original.
**Passo 2 — Entendimento:** transcrever com timestamps confiáveis; detectar cortes de cena e picos de movimento; amostrar frames ao redor de mudanças de plano e a cada 0,25–0,5s no início; usar análise visual sobre regiões relevantes e contexto temporal, não apenas 3 prints soltos.
**Passo 3 — Candidatos:** IA propõe 3 cortes apenas quando há momentos realmente distintos, cada um com intervalo `in/out`, evidência do gancho, expectativa do público e score justificável. Sem inventar eventos, falas, citações ou notícias.
**Passo 4 — Edição inteligente:** escolher preset pelo TIPO de conteúdo (reação, highlight, notícia comprovada, explicação) e não ao acaso. Enquadrar os sujeitos com `crop_keyframes`; edit de timing antes de adicionar efeitos.
**Passo 5 — Legendas:** alinhar palavra/trecho por áudio, e não usar apenas texto genérico. Corrigir transcrição e nomenclatura; evitar exibir descritores como `[SUSPIRANDO]` no modo viral salvo se fizerem sentido. Máx. ~2 linhas/4–6 palavras por bloco como ponto de partida, sempre validar no preview móvel.
**Passo 6 — Áudio:** usar loudness-alvo inicial de −16 LUFS integrado (reavaliar conforme plataforma e conteúdo), true peak ≤ −1 dBTP, normalização final e ducking automático. Música é controlada em relação à voz, não somente por slider de porcentagem; efeito/SFX discreto. Não mascarar fala original.
**Passo 7 — QA e revisão humana:** preview web, escolher gancho, editar manchete, conferir fonte, revisar legendas e aprovar antes de exportar/postar. Nunca publicar 100% automático sem revisão.

## 6. Interface do Web Studio — implementação incremental
- Aba **Biblioteca**: clipes e fontes, direitos/licença, duração, áudio, thumbnails reais.
- Aba **Análise IA**: timeline com transcrição, picos, cortes, 3 hipóteses de gancho e justificativas.
- Aba **Editor**: timeline de clipes; janelas separadas para crop, PiP, áudio, legendas, overlays, callouts, brand; presets sem alterar conteúdo.
- Aba **Review**: preview em escala celular, botões de simular Shorts / Reels / TikTok, grade safe-zone, quadro 0, quadro de 2s, quadro de 7s, quadro final; resultado QA em vermelho/amarelo/verde.
- Aba **Export**: 1080×1920, FPS preservado ou 60 se fonte e motion justificarem, H.264 AAC, relatório .json de proveniência (`source_url`, `source_in/out`, `caption_transcript`, `audio_metrics`, `fact_checked_claims`, `brand_handle`).

## 7. Critérios de aceitação — V2 piloto
- Renderizar novamente os 3 presets com o MESMO conteúdo de 15 s para comparação, mais **1 versão editorial própria** com gancho ligado à conversa de cena.
- Nada com `OFICIAL`, URL Rockstar falsa ou métricas fabricadas.
- O primeiro frame já contém cena ou gancho legível; não ser só blur.
- O personagem principal não é cortado em nenhum shot crucial. O modo direct usa a área 9:16 com intenção visual e tem crop com keyframe ajustável.
- Música e fala permanecem claras; relatório mostra LUFS e true peak final; os três modelos não ficam com som acidentalmente baixo.
- Legenda textual é checada e alinhada com a fala do vídeo (erro máximo orientativo ≤ 120 ms nos trechos conferidos manualmente).
- Mostra `@ggnochat` por padrão e respeita safe areas nos três simuladores.
- As molduras mostram transparência interna real com gameplay visível por baixo.
- A UI conserva todos os recursos anteriores e o CLI atual; criar testes de regressão para render e funcionalidades novas.
- Entregar 3 MP4s, 3 contact sheets (amostragem 0/0.5/1/2/4/7/10/13/15 s), 1 relatório JSON de QA e capturas do Studio. Não declarar concluído apenas por logs — conferir arquivos visual e auditivamente.

## 8. Ordem de execução — fazer de verdade, sem responder com plano abstrato
**Fase 1:** consertar claims falsos, branding, bugs de crop e loudness; exportar comparativos.
**Fase 2:** reduzir áreas mortas, corrigir legenda e implementar safe zones + controle de keyframe.
**Fase 3:** integrar análise multimodal de timeline e editor manual + sugestões de IA.
**Fase 4:** qualidade automatizada, relatórios e exportação com gate humano.

**Regra de trabalho:** antes de alterar código, auditar arquivos do projeto e explicar em no máximo 1 página as partes afetadas; depois IMPLEMENTAR fase por fase. Registrar logs, snapshots e comandos usados. Se faltar integração, fazer fallback local. Perguntar somente quando a escolha afetar materialmente a marca, os direitos ou a publicação.
