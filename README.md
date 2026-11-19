# 🌴 GTA 6 Cortes Studio — Gerador de Vídeos Virais

Sistema automatizado para baixar vídeos de YouTubers (gameplays, reações, podcasts), detectar momentos virais via IA e gerar cortes verticais (9:16) em **3 modelos profissionais** prontos para **TikTok, Instagram Reels e YouTube Shorts**.

---

## 🚀 Os 3 Modelos Criados

### 📱 1. Modelo "Tela Meio a Meio" (`split`)
* **Parte Superior:** Câmera/reação do YouTuber centralizada com fundo ambiente desfocado.
* **Parte Inferior:** Gameplay de alta ação do GTA 6 / Vice City (com corte inteligente da webcam da fonte).
* **Divisor Central:** Barra neon gradiente Vice City (Rosa/Ciano/Roxo) com badge romano `VI` iluminado.
* **Topo:** Gancho com badge oficial `GTA VI` e título chamativo.
* **Legendas:** Estilo Karaokê com destaque dinâmico palavra por palavra em amarelo neon e contorno preto de alta retenção.

### 📰 2. Modelo "Estilo Página de GTA 6 e Jogo" (`web`)
* *Inspirado no HyperFrames e Prompt-Motion:*
* **Parte Superior:** Card flutuante simulando uma página web oficial da **Rockstar Games Newswire** ou post viral do X/Twitter:
  * Barra de navegador com cadeado de segurança `rockstargames.com/newswire/gta-vi-leak`.
  * Logo oficial Rockstar Games (R*) dourado com badge verificado.
  * Manchete do vazamento/novidade com gradiente neon.
  * Contadores de engajamento (Likes, Retweets, Views).
* **Parte Inferior:** Gameplay rodando em tela cheia com legendas sincronizadas.

### ✂️ 3. Modelo "Só Cortes" (`direct`)
* **Formato 9:16 Vertical Clássico:** Vídeo em foco com ambientação dinâmica em blur, gancho superior ("CORTE DO DIA") e legendas dinâmicas centrais no padrão dos maiores canais de corte do mundo (OpusClip/Hormozi).

---

## 🛠️ Como Usar

### Opção A: Pela Interface Web (Studio Dashboard)
Inicie o estúdio visual com 1 comando:
```bash
npm run studio
```
Abra no seu navegador: **[http://localhost:3333](http://localhost:3333)**

Na interface você pode:
1. Colar o link de qualquer vídeo do YouTube (ou usar os atalhos prontos do Davy Jones / Gameplayrj).
2. Clicar em **"Analisar Vídeo & Detectar Cortes"** (a IA transcreve e pontua os momentos mais emocionantes).
3. Escolher o **Modelo** (Meio a Meio, Página de GTA 6 ou Só Cortes).
4. Personalizar o gancho, badge e tag do canal.
5. Clicar em **"Gerar Corte Viral"** para assistir no player integrado e baixar o MP4 com 1 clique!

---

### Opção B: Pela Linha de Comando (CLI)

#### 1. Corte no Modelo Meio a Meio:
```bash
node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --model split --start 600 --duration 20 --hook "DAVY JONES REAGIU AO GTA 6!"
```

#### 2. Corte no Modelo Página de GTA 6 + Jogo:
```bash
node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --model web --start 600 --duration 25 --hook "VAZAMENTO CONFIRMADO NO GTA VI!"
```

#### 3. Corte no Modelo Só Cortes:
```bash
node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --model direct --start 600 --duration 20
```

#### 4. Modo Totalmente Automático (Detecção de Momentos Virais com IA):
```bash
node cli.js --url "https://www.youtube.com/watch?v=chge7GrCNc0" --auto --count 3 --model split
```

---

## 📁 Estrutura do Projeto

```
f:\GTA 6 CORTES\
├── cli.js                  # Interface de Linha de Comando
├── server.js               # Servidor do Studio Web (Porta 3333)
├── package.json            # Dependências e scripts npm
├── lib\
│   ├── config.js           # Caminhos do FFmpeg, yt-dlp e estilos
│   ├── downloader.js       # Download seletivo e extração de legendas
│   ├── ai_moments.js       # Algoritmo de detecção de momentos virais
│   ├── subtitle_builder.js # Gerador de legendas Karaokê (.ASS)
│   ├── renderer.js         # Orquestrador FFmpeg para compor os vídeos
│   └── templates\
│       ├── split_screen.js # Template Modelo 1 (Meio a Meio)
│       ├── web_page_game.js# Template Modelo 2 (Página GTA 6 + Jogo)
│       └── direct_cut.js   # Template Modelo 3 (Só Cortes)
├── assets\
│   └── fonts\              # Fontes Montserrat e Pricedown (GTA)
├── public\
│   └── index.html          # Dashboard visual do estúdio
└── output\                 # Pasta onde os vídeos renderizados são salvos
```
