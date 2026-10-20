# Projeto: Comunhão RARA RIO (rarario)

Site institucional estático da igreja. Produção: **https://rarario.vercel.app/** — push na `main` publica sozinho na Vercel, sem passo de build manual.

## Estrutura

Sem framework, sem bundler, sem `package.json`: só HTML + CSS puro.

- `index.html` — página inicial, com "cards de passo" (Conversão, Avançai, Cura da Alma, Atuação...), cada um linkando pra `/pages/<nome>.html`.
- `pages/<nome>.html` + `css/<nome>.css` — uma página por passo/assunto, sempre em pares (cada página tem seu próprio CSS, exceto as de QR Code, que dividem `css/qrcode.css`).
- `img/` — logo e assets.

## Padrão de cada página de passo

Toda página nova segue o molde de `pages/curadaalma.html` / `css/curadaalma.css`:

- Fonte **Poppins** (Google Fonts), tema escuro, cartões em "vidro fosco" (`--glass-bg` / `--glass-border`), badge do passo com degradê, animações `slideUp` / `fadeIn`.
- Cada página define sua própria cor de destaque numa variável `--*-grad` no topo do CSS (ex.: vermelho em Cura da Alma e Christian Group, cinza em Atuação). Ao criar página nova, usar uma cor ainda não usada por outra página, a menos que o Stanley peça pra repetir alguma.
- A logo do site (`img/logo-rarario-transparente.png`/`.webp`) é **branca/clara com fundo transparente**, feita pra ficar em cima de fundo escuro — em fundo branco ela some. Se precisar dela num fundo claro, dar um fundo colorido/escuro por trás (foi o que resolveu no selo do QR Code).
- Botões de contato usam **WhatsApp** (`https://wa.me/55<DDD><número>?text=...`), nunca `tel:`, com mensagem pré-pronta em português (texto URL-encoded) e `target="_blank" rel="noopener"`.
- Números de telefone: copiar exatamente os dígitos que o Stanley manda. Nunca completar/arredondar um número que pareça "faltando um dígito" — pode ser assim mesmo (já aconteceu de eu inventar um dígito a mais por engano).

## QR Codes (`pages/qrcode.html` e `pages/qrcode-christiangroup.html`)

- Gerados por um script Python (lib `qrcode` + `Pillow`, roda fora do repo, não fica versionado) com **correção de erro alta** (`ERROR_CORRECT_H`), exportado como **SVG vetorial** (não pixeliza ao imprimir grande), salvo em `img/qrcode-*.svg`. A logo da RARA fica num selo com degradê vermelho no centro, ocupando só uma fração pequena da área (dentro do orçamento de ~30% que o nível H tolera).
- Página de impressão (CSS compartilhado em `css/qrcode.css`): folha **A4 paisagem**, QR gigante (200mm) quase encostando na borda, com marcas de corte nos 4 cantos desenhadas **dentro da margem branca do próprio QR** — nunca para fora dele, senão somem/são cortadas quando o QR já está perto da borda da folha.
- Pra gerar um QR Code novo, reaproveitar essa mesma lógica (pedir pra recriar o script), em vez de usar ferramenta online — assim fica tudo versionado e no mesmo padrão visual.
- Antes de entregar um QR novo: decodificar de volta (ex. `pyzbar`) pra confirmar que a logo não quebrou a leitura, e renderizar o PDF de impressão (`google-chrome --headless --print-to-pdf`) pra conferir que sai numa página A4 só, no tamanho certo.

## Git

Regra geral do Stanley vale aqui também: só commit/push quando ele pedir, mensagens em português.
