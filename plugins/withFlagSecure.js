/**
 * Expo Config Plugin for FLAG_SECURE Android Security
 * 
 * This plugin adds FLAG_SECURE to the MainActivity at build time to prevent
 * screenshots and screen recordings on Android devices. This is critical for
 * cryptocurrency wallet applications handling sensitive data.
 * 
 * Security Features:
 * - Prevents screenshots via WindowManager.LayoutParams.FLAG_SECURE
 * - Applied at native level for maximum security
 * - Persists across Expo builds (not in ephemeral android folder)
 * - Works with both Expo Dev Client and production builds
 * 
 * Usage: Add this plugin to the plugins array in app.json
 */

const { withMainActivity, AndroidConfig } = require('@expo/config-plugins');

/**
 * Config plugin to add FLAG_SECURE to Android MainActivity
 * @param {import('@expo/config-plugins').ExportedConfig} config 
 * @returns {import('@expo/config-plugins').ExportedConfig}
 */
function withFlagSecure(config) {
  return withMainActivity(config, (config) => {
    let { contents } = config.modResults;

    // Check if FLAG_SECURE is already implemented
    if (contents.includes('FLAG_SECURE')) {
      console.log('FLAG_SECURE already exists in MainActivity');
      return config;
    }

    // Import statements needed for FLAG_SECURE
    const windowManagerImport = 'import android.view.WindowManager';
    
    // Add WindowManager import if not present
    if (!contents.includes(windowManagerImport)) {
      // Find the import section and add WindowManager import
      const importRegex = /(import android\.os\.Bundle\n)/;
      if (importRegex.test(contents)) {
        contents = contents.replace(importRegex, `$1${windowManagerImport}\n`);
      } else {
        // Fallback: add after package declaration
        const packageRegex = /(package .+\n)/;
        contents = contents.replace(packageRegex, `$1\n${windowManagerImport}\n`);
      }
    }

    // Detect if this is a Kotlin or Java file
    const isKotlin = contents.includes('override fun onCreate') || contents.includes('class MainActivity');
    const isJava = contents.includes('public void onCreate') || contents.includes('public class MainActivity');

    // FLAG_SECURE implementation code for Kotlin
    const kotlinFlagSecureCode = `
        // Add FLAG_SECURE to prevent screenshots and screen recording at the native level
        // This provides an additional layer of protection beyond expo-screen-capture
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)`;

    // FLAG_SECURE implementation code for Java
    const javaFlagSecureCode = `
        // Add FLAG_SECURE to prevent screenshots and screen recording at the native level
        // This provides an additional layer of protection beyond expo-screen-capture
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);`;

    let injected = false;

    if (isKotlin) {
      // Try to inject after setTheme in Kotlin
      const kotlinOnCreateRegex = /(override fun onCreate\(savedInstanceState: Bundle\?\) \{[\s\S]*?setTheme\(R\.style\.AppTheme\);?\s*)/;
      if (kotlinOnCreateRegex.test(contents)) {
        contents = contents.replace(kotlinOnCreateRegex, `$1${kotlinFlagSecureCode}
        `);
        injected = true;
      } else {
        // Fallback: inject right after onCreate method declaration
        const kotlinFallbackRegex = /(override fun onCreate\(savedInstanceState: Bundle\?\) \{)/;
        if (kotlinFallbackRegex.test(contents)) {
          contents = contents.replace(kotlinFallbackRegex, `$1${kotlinFlagSecureCode}
            `);
          injected = true;
        }
      }
    } else if (isJava) {
      // Try to inject after setTheme in Java
      const javaOnCreateRegex = /(public void onCreate\(Bundle savedInstanceState\) \{[\s\S]*?setTheme\(R\.style\.AppTheme\);?\s*)/;
      if (javaOnCreateRegex.test(contents)) {
        contents = contents.replace(javaOnCreateRegex, `$1${javaFlagSecureCode}
        `);
        injected = true;
      } else {
        // Fallback: inject right after onCreate method declaration
        const javaFallbackRegex = /(public void onCreate\(Bundle savedInstanceState\) \{)/;
        if (javaFallbackRegex.test(contents)) {
          contents = contents.replace(javaFallbackRegex, `$1${javaFlagSecureCode}
            `);
          injected = true;
        }
      }
    }

    if (!injected) {
      console.warn('Could not find onCreate method in MainActivity to inject FLAG_SECURE');
      console.log('MainActivity language detection: Kotlin =', isKotlin, ', Java =', isJava);
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withFlagSecure;