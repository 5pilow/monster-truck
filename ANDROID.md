# Monster Truck — application Android (Capacitor)

L'app Android est une coquille **Capacitor** qui embarque le build web (`dist/`),
donc le jeu marche 100 % hors-ligne. Les pubs passent par **AdMob** en natif
(l'AdSense du web est désactivé quand `Capacitor.isNativePlatform()` est vrai ;
le bandeau de consentement Funding Choices l'est aussi — rien à consentir sans
AdSense). App id : `fr.pilow.monstertruck`.

## Prérequis (déjà présents sur la machine de dev)

- **JDK 21** — obligatoire pour Capacitor (le 17 est trop vieux, le 25 système
  trop récent pour Gradle). Installé dans `~/Android/jdk-21`.
- **Android SDK** dans `~/Android/Sdk`.

```bash
export JAVA_HOME=~/Android/jdk-21
export ANDROID_HOME=~/Android/Sdk
export ANDROID_SDK_ROOT=~/Android/Sdk
export PATH=$JAVA_HOME/bin:$PATH
```

## Cycle de dev

```bash
npm run build            # (re)génère dist/
npx cap sync android     # copie dist/ + plugins dans android/
cd android && ./gradlew assembleDebug
# APK -> android/app/build/outputs/apk/debug/app-debug.apk

# installer + lancer sur un appareil/émulateur
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p fr.pilow.monstertruck -c android.intent.category.LAUNCHER 1
```

Le jeu a déjà des **contrôles tactiles** (`bindTouchControls` dans `src/game.ts`)
et gère les zones sûres (`env(safe-area-inset-*)` partout dans `index.html`), donc
rien de spécial à faire pour l'edge-to-edge / les encoches.

## Où se branche le natif

- `src/native.ts` — `isNative` (Capacitor). Aiguille entre AdSense/CMP web et AdMob.
- `src/ads-native.ts` — bannière AdMob adaptative, ancrée en bas, affichée
  seulement sur les écrans **accueil** et **pause**, jamais en partie.
- `src/game.ts` — appelle `showBanner()` à l'accueil / retour accueil / pause, et
  `hideBanner()` en partie ; l'AdSense et `setupConsent()` sont sautés si `isNative`.
- `index.html` — le padding bas des `.screen` réserve `var(--ad-banner-height)`
  pour que la bannière (qui flotte au-dessus de la WebView) ne masque rien.

## Pubs (AdMob)

- **App ID** : `android/app/src/main/res/values/strings.xml` → `admob_app_id`,
  référencé par le meta-data `com.google.android.gms.ads.APPLICATION_ID` du
  manifest (sans quoi l'app plante au démarrage).
- ⚠️ **À faire pour la prod** : aujourd'hui c'est l'**App ID de TEST** de Google
  (`ca-app-pub-3940256099942544~3347511713`) et l'unité bannière de test. Il faut
  **créer l'app « Monster Truck » dans la console AdMob**, puis :
  - coller l'**App ID réel** dans `strings.xml` ;
  - coller l'**unité bannière réelle** dans `BANNER_UNIT` (`src/ads-native.ts`).
  Tant que `BANNER_UNIT` est vide, le code **force les pubs de test** : un build de
  prod ne chargera jamais une unité invalide.

**Test vs prod** : par défaut, dès qu'un `BANNER_UNIT` réel est renseigné, un build
sert les **vraies** pubs. Pour forcer les pubs de test : `VITE_ADS_TEST=true npm run build`.
Le serveur de dev (`npm run dev`) est toujours en test. Interrupteur sans pub :
`VITE_ADS=off npm run build`.

## Signature — DÉJÀ configurée

- Keystore : `/home/pierre/dev/android/keystores/monstertruck.keystore`
  (clé **AvelSoft**, alias `avelsoft`, même convention que flag-run/cube-timer).
- Config : `android/keystore.properties` (**gitignoré**) + bloc `signingConfigs`
  dans `android/app/build.gradle`. `bundleRelease` produit un AAB signé
  (`android/app/build/outputs/bundle/release/app-release.aab`).
- ⚠️ **Ne jamais perdre ce keystore** : le perdre = ne plus pouvoir mettre l'app
  à jour sur le Play Store.

## Publication Play Store

Gradle Play Publisher (`com.github.triplet.play`) est câblé, compte de service
partagé (`~/.config/leekwars/gsc-service-account.json`). Envoi piste **internal**
en **DRAFT** :

```bash
cd android && ./gradlew :app:publishReleaseBundle
```

**Prérequis (une seule fois, manuel, l'API ne peut pas le faire)** : créer l'app
`fr.pilow.monstertruck` dans la Play Console. Ensuite fiche, data safety, etc.
peuvent se piloter par API (cf. le workflow flag-run).
