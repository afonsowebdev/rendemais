// Build do Rende+: pré-compila o JSX (sem Babel em runtime) para a pasta dist/.
// Mantém a arquitetura de globais — cada ficheiro continua a ser um <script> normal.
// Corre com:  node build.mjs   (ou: npm run build)   — precisa de:  npm i -D esbuild
import esbuild from "esbuild";
import { rmSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "dist";
// ORDEM importa: é a mesma ordem em que o index.html carrega os scripts.
const JSX = ["tweaks-panel", "icons", "charts", "finance", "components", "screens1", "screens2", "contas", "landing", "app"];
const BUILD = Date.now().toString(36); // id de versão para a cache (?v=)

// limpa e recria dist/
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/assets/js`, { recursive: true });

// 1) transpila cada .jsx -> .js  (JSX clássico: React.createElement; o React continua global)
for (const name of JSX) {
  const src = readFileSync(`assets/js/${name}.jsx`, "utf8");
  const res = await esbuild.transform(src, {
    loader: "jsx",
    jsx: "transform",          // -> React.createElement (usa o React global da CDN)
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    target: "es2019",
    // minify: true,           // ativa quando quiseres ficheiros mais pequenos
  });
  writeFileSync(`${OUT}/assets/js/${name}.js`, res.code);
}

// 2) copia os JS simples (sem JSX) e o CSS tal como estão
for (const f of ["data.js", "api.js"]) cpSync(`assets/js/${f}`, `${OUT}/assets/js/${f}`);
cpSync("assets/css", `${OUT}/assets/css`, { recursive: true });

// 3) copia os estáticos da raiz (ícones, manifest, service worker, og-image…)
const estaticos = [
  "manifest.webmanifest", "sw.js", "favicon.svg", "favicon.ico",
  "favicon-16.png", "favicon-32.png", "favicon-48.png", "favicon-96.png", "favicon-512.png",
  "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "og-image.png",
];
for (const f of estaticos) if (existsSync(f)) cpSync(f, `${OUT}/${f}`);

// 4) gera dist/index.html a partir do teu index.html:
//    - remove o Babel (já não é preciso em runtime)
//    - troca os scripts .jsx (text/babel) por .js compilados
//    - atualiza a versão (?v=) de todos os assets para o id deste build
let html = readFileSync("index.html", "utf8");
html = html.replace(/\s*<script[^>]*@babel\/standalone[^>]*><\/script>/g, "");
html = html.replace(/type="text\/babel"\s+/g, "");
html = html.replace(/(assets\/js\/[\w-]+)\.jsx\?v=[\w]+/g, `$1.js?v=${BUILD}`);
html = html.replace(/(assets\/(?:js|css)\/[\w-]+\.(?:js|css))\?v=[\w]+/g, `$1?v=${BUILD}`);
writeFileSync(`${OUT}/index.html`, html);

console.log(`✓ build pronto em ${OUT}/  (id: ${BUILD})`);
