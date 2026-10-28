#!/bin/bash
set -e

BUILD_TOOLS="/Users/alexr/Library/Android/sdk/build-tools/36.1.0"
PLATFORM_JAR="/Users/alexr/Library/Android/sdk/platforms/android-36/android.jar"
export JAVA_HOME="/opt/homebrew/opt/openjdk"
export PATH="$JAVA_HOME/bin:$BUILD_TOOLS:$PATH"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DIR"

echo "=== 1. Genererer Keystore hvis mangler ==="
if [ ! -f release.keystore ]; then
  keytool -genkey -v -keystore release.keystore -alias sol -keyalg RSA -keysize 2048 -validity 10000 -storepass solapp -keypass solapp -dname "CN=Sol, OU=Akselsen, O=SolApp, L=Bergen, C=NO"
fi

echo "=== 2. Rydder gamle byggfiler og synkroniserer dist ==="
rm -rf obj res.zip resources.zip classes.dex unaligned.apk Sol-Uteliv-aligned.apk Sol-Uteliv.apk Sol-Uteliv.apk.idsig Utaktiv.apk
mkdir -p obj
mkdir -p assets
cp -r ../dist/* assets/ 2>/dev/null || true
rm -f assets/Utaktiv.apk assets/Sol-Uteliv.apk

echo "=== 3. Kompilerer ressurser med AAPT2 ==="
"$BUILD_TOOLS/aapt2" compile --dir res -o res.zip
"$BUILD_TOOLS/aapt2" link res.zip \
  -I "$PLATFORM_JAR" \
  --manifest AndroidManifest.xml \
  --java src \
  -o resources.zip \
  --auto-add-overlay

echo "=== 4. Kompilerer Java-kildekode (javac) ==="
javac -source 11 -target 11 \
  -cp "$PLATFORM_JAR" \
  -d obj \
  src/no/akselsen/soluteliv/*.java

echo "=== 5. Konverterer til Dalvik bytecode (d8) ==="
"$BUILD_TOOLS/d8" --output . $(find obj -name "*.class")

echo "=== 6. Pakker DEX og web-assets inn i APK ==="
zip -u resources.zip classes.dex
# WebView leser file:///android_asset/ fra mappen assets/ inni APK-en.
zip -r resources.zip assets

echo "=== 7. Zipalign på 4-byte grenser ==="
"$BUILD_TOOLS/zipalign" -v -p 4 resources.zip Sol-Uteliv-aligned.apk

echo "=== 8. Signerer APK med apksigner ==="
"$BUILD_TOOLS/apksigner" sign \
  --ks release.keystore \
  --ks-pass pass:solapp \
  --key-pass pass:solapp \
  --out Utaktiv.apk \
  Sol-Uteliv-aligned.apk

echo "=== 9. Verifiserer signatur ==="
"$BUILD_TOOLS/apksigner" verify Utaktiv.apk

cp Utaktiv.apk Sol-Uteliv.apk
cp Utaktiv.apk ../public/Utaktiv.apk
cp Utaktiv.apk ../dist/Utaktiv.apk

echo "=== FERDIG! APK opprettet: $(pwd)/Utaktiv.apk ==="
ls -lh Utaktiv.apk
