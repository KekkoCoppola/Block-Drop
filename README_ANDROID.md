# Guida per Android (APK)

Questo progetto è stato configurato con **Capacitor** per essere eseguito come un'app nativa Android.

## Prerequisiti
1. **Node.js** installato sul tuo computer.
2. **Android Studio** installato e configurato.

## Come generare l'APK

1. **Installa le dipendenze** (se non lo hai già fatto):
   ```bash
   npm install
   ```

2. **Sincronizza il progetto**:
   Questo comando builda l'app web e copia i file nella cartella Android.
   ```bash
   npm run cap:sync
   ```

3. **Apri in Android Studio**:
   ```bash
   npm run cap:open
   ```
   *Oppure apri Android Studio e seleziona la cartella `android` del progetto.*

4. **Genera l'APK in Android Studio**:
   - Vai su `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - Una volta completato, apparirà una notifica con il link alla cartella contenente l'APK.

## Personalizzazione Icona e Splash Screen

Per cambiare l'icona e la schermata di avvio:
1. Sostituisci i file in `android/app/src/main/res/mipmap-*` con le tue icone.
2. Oppure usa lo strumento ufficiale:
   - Metti un file `icon.png` e `splash.png` nella cartella principale.
   - Esegui: `npx @capacitor/assets generate --android`

## Note per Mobile
- L'app è già ottimizzata per i bordi arrotondati e le "safe areas" dei telefoni moderni.
- Il feedback aptico (vibrazione) è attivo per impostazione predefinita.
