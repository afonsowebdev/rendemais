# Rende+ — App nativa com Capacitor

Transformar o Rende+ (web) em apps para **Google Play** e **App Store** usando Capacitor 8.

## Requisitos na tua máquina
- **Node.js 22+** (Capacitor 8 exige Node 22)
- **Android:** Android Studio (Otter / 2025.2.1 ou mais recente) + Java JDK 21 (vem com o Android Studio)
- **iOS:** um **Mac** com **Xcode 26+** e CocoaPods (`sudo gem install cocoapods`). Sem Mac, não há submissão à App Store.
- Contas: **Google Play** (~25 USD, uma vez) e **Apple Developer** (~99 USD/ano)

## Passo a passo (corre na raiz do projeto)

```bash
# 1. instalar as dependências
npm install

# 2. inicializar o Capacitor (só na 1.ª vez; já tens capacitor.config.json)
#    se pedir dados, usa: appId = pt.rendemais.app, appName = Rende+
npx cap init "Rende+" "pt.rendemais.app" --web-dir=www

# 3. preparar a pasta web e adicionar as plataformas
npm run copy:web
npx cap add android
npx cap add ios        # só funciona num Mac

# 4. sempre que mudares a app web, sincroniza:
npm run sync           # = copy:web + cap sync

# 5. abrir nos IDEs nativos para correr/compilar
npx cap open android   # -> Android Studio
npx cap open ios       # -> Xcode (Mac)
```

No Android Studio: liga um telemóvel ou usa um emulador e carrega em **Run**.
No Xcode: escolhe um simulador/iPhone e carrega em **Run**.

## ⚠️ Importante — backend (CORS)
A app nativa NÃO corre em `rendemais.pt`; corre numa origem interna:
- iOS: `capacitor://localhost`
- Android: `https://localhost`

O teu backend Express (no Render) só vai responder a estas origens se as **autorizares no CORS**.
No teu servidor, acrescenta-as à lista de origens permitidas, por exemplo:

```js
const cors = require("cors");
const origensPermitidas = [
  "https://rendemais.pt",
  "https://www.rendemais.pt",
  "capacitor://localhost",   // iOS
  "https://localhost",       // Android
  "http://localhost:3000",   // desenvolvimento
];
app.use(cors({ origin: origensPermitidas, credentials: true }));
```

Sem isto, o login e a sincronização falham dentro da app (erros de CORS).

## ✅ Já tratado por mim
- `capacitor.config.json`, `package.json`, `copy-web.mjs` criados.
- `api.js` corrigido: dentro da app nativa usa sempre o backend de produção (Render),
  mesmo o hostname sendo "localhost".

## Notas honestas
1. **A app depende de internet para arrancar.** O `index.html` transpila o JSX em tempo real
   (Babel) e carrega fontes/BoxIcons de CDN. Funciona, mas para uma app de loja mais robusta
   e rápida o ideal é fazeres o **build com Vite** (que já tinhas começado) e apontar o
   `webDir` para o `dist/`. Podemos fazer isso a seguir.
2. **Risco na App Store (regra 4.2):** a Apple pode recusar apps que são "só um site".
   Como agrupamos os ficheiros dentro da app (não carregamos um URL), já estás melhor posicionado;
   ainda assim ajuda teres pelo menos uma função nativa (ex.: notificações push, login biométrico).
3. **Ícones e splash nativos:** o Android/iOS usam ícones próprios (não os do PWA). Há um plugin
   `@capacitor/assets` que gera tudo a partir de uma imagem 1024×1024 — tratamos disso quando chegarmos aí.

## Pastas (a versionar no Git)
- versiona: `android/`, `ios/`, `capacitor.config.json`, `package.json`, `copy-web.mjs`
- ignora (`.gitignore`): `node_modules/`, `www/`
