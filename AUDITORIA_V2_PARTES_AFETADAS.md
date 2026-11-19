# GTA 6 CORTES STUDIO V2 — AUDITORIA DE CÓDIGO E PARTES AFETADAS
**Canal / Marca:** GG NO CHAT (`@ggnochat`)  
**Data:** 18/11/2026 | **Branch:** `v2-evolution` (Baseline preservada na branch `main`)

---

## 1. Diagnóstico do Estado Anterior (V1) e Bloqueadores P0 Identificados

| Módulo / Arquivo | Problema Diagnosticado na V1 | Impacto Crítico | Ação Corretiva V2 |
| :--- | :--- | :--- | :--- |
| **`lib/templates/split_screen.js`** | Crop fixo (`iw*0.24`) corta Lucia no lado esquerdo da cela aos ~7s; gancho estático; divisor VI permanente. | Bloqueador visual P0; corta personagem principal da cena. | Implementar `crop_keyframes` inteligentes com tracking dinâmico de enquadramento; suporte a PiP (16-22%) opcional; divisor como transição elegante. |
| **`lib/templates/web_page_game.js`** | Card falso "Rockstar Newswire Oficial", typo "ROCKSTAR CON", URL inexistente, métricas de engajamento inventadas (482.5K likes). | Bloqueador editorial P0; falsificação jornalística sem fonte. | Eliminar qualquer simulação falsa da Rockstar. Adotar `GG NO CHAT • ANÁLISE / CONCEITO ILUSTRATIVO` (ou notícias reais com fonte verificada); card recolhe aos 2s dando foco total à gameplay. |
| **`lib/templates/direct_cut.js`** | Jogo em letterbox minúsculo no centro com ~70% da tela preenchida por blur escuro desnecessário; gancho genérico. | Baixa retenção e qualidade amadora. | Reframe vertical inteligente (`smart_crop`) focado na ação/personagem com keyframes, sem barras de blur gigante; gancho imediato no frame 0.0s. |
| **`lib/subtitle_builder.js`** | Subtítulos automáticos exibindo marcações técnicas e ruídos como `[SUSPIRANDO]`, `[MÚSICA]`; falta de controle de safe-zones. | Ruído visual na leitura. | Sanitização de legendas (filtro de descritores entre colchetes em modo viral); posicionamento seguro respeitando botões de Shorts/Reels/TikTok. |
| **`lib/renderer.js`** | Áudio mixado sem normalização EBU R128; medido em -29.57 LUFS (muito baixo!); marca hardcoded `@GTA6CORTES`. | Áudio inaudível no celular; violação de marca. | Normalização integrada via filtro `loudnorm` (-16.0 LUFS, true peak <= -1.0 dBTP); ducking inteligente voz vs música; suporte à marca única via `brand.json` e molduras com canal alpha. |
| **`brand.json` & Assets** | Molduras originais vieram em JPG RGB opaco (centro preto cobria o jogo); ausência de arquivo central de marca. | Impossível usar moldura original sem máscara alpha. | Processamento das 3 molduras em PNG RGBA 1080x1920 com canal alpha geométrico verificado; criação de `brand.json` com paleta, handle `@ggnochat` e avatar micro (48px). |
| **`public/index.html` & `server.js`** | Interface de painel único sem abas, sem visualizador de safe-zones para TikTok/Reels/Shorts, sem relatório QA. | Falta de controle editorial antes de exportar. | Arquitetura modular de 5 abas (Biblioteca, Análise IA, Editor, Review com simulador de safe-zones, Export + QA Report JSON). |

---

## 2. Mapa de Fases de Implementação

- **Fase 1 (Fundação & Bloqueadores P0):** Marca única `brand.json`, remoção de claims falsos, normalização de áudio para -16 LUFS, e correção do crop do split-screen para não cortar a personagem Lucia.
- **Fase 2 (Composição Visual & Safe Zones):** Reframe vertical inteligente no modelo Direct (sem blur vazio), sanitização de legendas (remover `[SUSPIRANDO]`), aplicação opcional de molduras transparentes e guias de corte Shorts/Reels/TikTok.
- **Fase 3 (Editor & Timeline Multimodal):** Expansão do Web Studio para 5 abas, timeline de corte e parâmetros manuais de keyframe e PiP.
- **Fase 4 (Controle de Qualidade & Exportação):** Relatório automatizado `qa_report.json`, contact sheets de amostragem de frames e validação audiovisual final.
