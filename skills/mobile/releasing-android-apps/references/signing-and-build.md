# Upload signing and reduced release builds

Load this reference when wiring release signing in Gradle, guiding the person through `keytool`, or validating an R8-minified release build on an emulator.

## 1. Play App Signing vs. upload key

- **Play App Signing** is mandatory for all new apps on Google Play. Google holds the final app signing key used to sign APKs delivered to users.
- The developer creates and keeps an **upload key** used to sign `.aab` bundles uploaded to Play Console.
- If the upload key is lost, Play Console supports an upload key reset, but it requires identity verification and takes days. Back up the `.jks` file and its passwords in a password manager immediately.

## 2. Creating the upload key (Person, normal terminal only)

Never run `keytool` through a non-interactive agent shell shortcut (such as a `!` prefix): it receives empty stdin for the password prompt and aborts after three attempts. Never ask the person to paste passwords into chat.

Have the person open a regular interactive terminal and run:

```sh
mkdir -p ~/.android-keys && chmod 700 ~/.android-keys
keytool -genkeypair -v \
  -keystore ~/.android-keys/<app>-upload.jks \
  -alias <app>-upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

Then create `~/.android-keys/<app>-upload.properties` and restrict its permissions:

```properties
storeFile=<app>-upload.jks
storePassword=<keystore-password>
keyAlias=<app>-upload
keyPassword=<key-password>
```

```sh
chmod 600 ~/.android-keys/<app>-upload.properties
```

`storeFile` can be an absolute path or relative to the directory containing the `.properties` file. Keep `~/.android-keys/` outside every Git repository.

## 3. Gradle Kotlin DSL pattern (Agent)

Configure `app/build.gradle.kts` so that:
- Release signing reads `~/.android-keys/<app>-upload.properties` by default, with overrides via `-P<app>.signing=<path>` or `<APP>_SIGNING_PROPERTIES`.
- Debug builds (`assembleDebug`, `testDebugUnitTest`, `lintDebug`) compile with zero signing setup.
- Release packaging (`packageRelease`, `packageReleaseBundle`, `signReleaseBundle`) fails fast with an explicit message if the properties file is missing, instead of silently emitting an unsigned `.aab` or `.apk`.

```kotlin
import java.util.Properties

class UploadSigning(
    val storeFile: File,
    val storePassword: String,
    val keyAlias: String,
    val keyPassword: String,
)

val uploadSigningFile: File = providers.gradleProperty("<app>.signing")
    .orElse(providers.environmentVariable("<APP>_SIGNING_PROPERTIES"))
    .map { File(it) }
    .getOrElse(File(System.getProperty("user.home"), ".android-keys/<app>-upload.properties"))

val uploadSigning: UploadSigning? = uploadSigningFile.takeIf { it.isFile }?.let { file ->
    val properties = Properties().apply { file.inputStream().use { load(it) } }
    fun required(key: String) = properties.getProperty(key)?.trim()?.takeIf { it.isNotEmpty() }
        ?: throw GradleException("Missing '$key' in ${file.path}.")
    val store = File(required("storeFile")).let { if (it.isAbsolute) it else File(file.parentFile, it.path) }
    if (!store.isFile) throw GradleException("Keystore not found: ${store.path} (referenced by ${file.path}).")
    UploadSigning(store, required("storePassword"), required("keyAlias"), required("keyPassword"))
}
```

Wire the signing config, R8 reduction, and fail-fast task guard:

```kotlin
android {
    defaultConfig {
        targetSdk = 36 // Required for new Play apps since August 31, 2026
        versionCode = 1
        versionName = "0.1.0"
    }

    signingConfigs {
        uploadSigning?.let { upload ->
            create("upload") {
                storeFile = upload.storeFile
                storePassword = upload.storePassword
                keyAlias = upload.keyAlias
                keyPassword = upload.keyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("upload")
        }
    }
}

val checkReleaseSigning = tasks.register("checkReleaseSigning") {
    val missing = uploadSigning == null
    val path = uploadSigningFile.path
    doFirst {
        if (missing) {
            throw GradleException(
                "Missing release signing file: $path. " +
                    "Create it with storeFile, storePassword, keyAlias, and keyPassword. " +
                    "Debug builds do not need it."
            )
        }
    }
}

tasks.configureEach {
    if (name in setOf("packageRelease", "packageReleaseBundle", "signReleaseBundle")) {
        dependsOn(checkReleaseSigning)
    }
}
```

## 4. Validating R8 on an emulator with a throwaway key (Agent)

R8 minification and resource shrinking frequently strip reflection targets, serialization models, Room schemas, or dynamic resources that passed debug tests. Validate the minified build **before** asking the person to sign the real upload bundle:

1. Create a temporary directory outside the repository (for example via `mktemp -d`) and generate a throwaway keystore with non-interactive flags (`-storepass`, `-keypass`, `-dname`) strictly for local emulator testing.
2. Write a temporary `throwaway.properties` pointing to that keystore and run:
   ```sh
   ./gradlew assembleRelease bundleRelease -P<app>.signing=/tmp/<temp-dir>/throwaway.properties
   ```
3. Uninstall any debug build on the emulator, install `app/build/outputs/apk/release/app-release.apk`, and walk every primary flow (navigation, serialization, database read/write, media/background service, share intents) while watching `logcat`:
   ```sh
   adb logcat -c
   adb logcat | grep -E "FATAL EXCEPTION|ANR in <package>"
   ```
4. Fix any missing keep rules in `app/proguard-rules.pro` and repeat until clean.
5. Delete the temporary directory containing the throwaway keystore and properties file.

## 5. Production bundle and native debug symbols

- When the person is ready to upload, they run `./gradlew bundleRelease` locally with their real `~/.android-keys/<app>-upload.properties`. The output bundle is `app/build/outputs/bundle/release/app-release.aab`.
- Increment `versionCode` for every upload to Play Console (even across internal and closed tracks).
- If the app includes native libraries (`.so`), Play Console warns when native debug symbols are absent. This warning is non-blocking for initial internal/closed tests; to clear it on the next build, add `ndk { debugSymbolLevel = "SYMBOL_TABLE" }` (or `"FULL"`) inside `buildTypes.release`.
