# 🤖 Guida Sviluppo Android (Capacitor)

<div align="center">

[![Capacitor Android](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=android&logoColor=white&style=for-the-badge)](https://capacitorjs.com/docs/android)
[![Gradle](https://img.shields.io/badge/Gradle-Powered-02303A?logo=gradle&logoColor=white&style=for-the-badge)](https://gradle.org/)

**Configurazione e deployment nativo per la piattaforma Android.**

</div>

---

## 📋 Prerequisiti

Per compilare ed eseguire l'app su dispositivi Android, assicurati di avere
installato:

1. **Android Studio**: Ultima versione stabile con SDK API 34+.
2. **Java JDK**: Compatibile con i requisiti di Android Studio.
3. **Capacitor CLI**: Installato globalmente o accessibile tramite `npx`.

---

## 🛠️ Workflow di Build

Il progetto è pre-configurato con script in `package.json` per semplificare il
ciclo di vita dello sviluppo nativo.

### 1. Sincronizzazione (Web -> Android)

Ogni volta che modifichi il codice React, devi sincronizzare il bundle web con
il progetto Android.

```bash
# Esegue la build di Vite e npx cap sync
npm run cap:sync
```

### 2. Apertura in IDE

Utilizza questo comando per lanciare Android Studio direttamente nella cartella
corretta.

```bash
# Apre il progetto ./android in Android Studio
npm run cap:open
```

### 3. Generazione APK (CLI)

Se preferisci compilare direttamente da terminale senza aprire l'IDE:

```bash
# Esegue ./gradlew assembleDebug e genera l'APK in 
# android/app/build/outputs/apk/debug/
npm run build:apk
```

---

## 🎨 Asset Nativi (Icone & Splash)

Per rigenerare le icone e le schermate di avvio con un comando automatizzato:

1. Assicurati di avere `icon.png` e `splash.png` nella root del progetto.
2. Esegui lo strumento di asset generazioni:

   ```bash
   npx @capacitor/assets generate --android
   ```

---

## 🏗️ Configurazione Tecnica

* **Namespace**: `block.drop.infinite.merge` (definito in `capacitor.config.ts`).
* **Permissions**: Haptics e Status Bar sono gestiti nativamente tramite i
  plugin `@capacitor/haptics` e `@capacitor/status-bar`.
* **Safe Areas**: Il layout React risponde automaticamente alle
  `env(safe-area-inset-*)` per evitare ritagli su notch e punch-hole.

---

[Torna al README Principale](README.md)
