# Rende+

Aplicação web de **gestão de finanças pessoais** — simples e privada, para qualquer pessoa.
Regista rendimentos e despesas (fixas ou variáveis), define metas de poupança, liga contas
(Revolut / Wise) e acompanha gráficos que se atualizam a cada movimento.

Os dados ficam guardados no **navegador** (localStorage) — não há servidor nem base de dados.

## Estrutura do projeto

```
.
├── index.html                 # Ponto de entrada (deploy)
├── Rende+.html                 # Cópia (pré-visualização)
├── README.md
└── assets/
    ├── css/
    │   └── styles.css         # Tokens de design + temas (claro/escuro)
    └── js/
        ├── data.js            # Catálogo (categorias, bancos) + helpers
        ├── finance.jsx        # Estado: conta, dados, persistência, seletores
        ├── icons.jsx          # Conjunto de ícones (SVG)
        ├── charts.jsx         # Gráficos (donut, linha, barras, sparkline)
        ├── components.jsx     # UI partilhada (sidebar, topbar, cards…)
        ├── screens1.jsx       # Auth, Dashboard, Despesas, Rendimentos
        ├── screens2.jsx       # Poupança, Relatórios, Histórico, Definições
        ├── contas.jsx         # Contas ligadas (Revolut / Wise)
        ├── app.jsx            # Shell: rotas, tema, modais
        └── tweaks-panel.jsx   # Painel de ajustes (opcional)
```

## Como correr localmente

A app usa módulos carregados via HTTP, por isso precisa de um servidor estático
(abrir o ficheiro com `file://` não funciona). Qualquer um destes serve:

```bash
# Python 3
python3 -m http.server 8000

# Node
npx serve .
```

Depois abre `http://localhost:8000`.

## Deploy

É um site **100% estático** — basta publicar a pasta inteira:

- **Netlify** — arrasta a pasta para netlify.com/drop, ou liga o repositório (sem build command).
- **Vercel** — `vercel` (framework: *Other*, sem build).
- **GitHub Pages** — faz push para um repositório e ativa Pages na branch `main` (pasta `/`).
- **Cloudflare Pages / Firebase Hosting** — publica a pasta como output estático.

Não é necessário passo de build.

## Notas

- **Privacidade:** os dados nunca saem do dispositivo (localStorage).
- **Contas (Revolut/Wise):** a ligação é **simulada** para fins de demonstração.
  Numa versão de produção seria substituída por Open Banking real.
- **Evoluir para produção:** migrar `finance.jsx` de localStorage para uma base de
  dados (ex.: Firebase/Firestore) e adicionar um passo de build (Vite) para
  pré-compilar o JSX em vez de o transpilar no browser.
