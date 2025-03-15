

# create expo app
npx create-expo-app@latest

# check install
npx expo-doctor
```
14/15 checks passed. 1 checks failed. Possible issues detected:
Use the --verbose flag to see more details about passed checks.

✖ Check that packages match versions required by installed Expo SDK
  The following packages should be updated for best compatibility with the installed expo version:
    expo-router@4.0.18 - expected version: ~4.0.19
  Your project may not work correctly until you install the expected versions of the packages.
  Found outdated dependencies
  Advice: Use 'npx expo install --check' to review and upgrade your dependencies.

1 check failed, indicating possible issues with the project.
```
# fix
npx expo install --check

```
✖ Check that packages match versions required by installed Expo SDK
  The following packages should be updated for best compatibility with the installed expo version:
    expo-router@4.0.18 - expected version: ~4.0.19
  Your project may not work correctly until you install the expected versions of the packages.
  Found outdated dependencies
  Advice: Use 'npx expo install --check' to review and upgrade your dependencies.

1 check failed, indicating possible issues with the project.
❯ npx expo install --check
The following packages should be updated for best compatibility with the installed expo version:
  expo-router@4.0.18 - expected version: ~4.0.19
Your project may not work correctly until you install the expected versions of the packages.
✔ Fix dependencies? … yes
```
# doctor again
❯ npx expo-doctor
15/15 checks passed. No issues detected!


# add eas globally
```
npm install -g eas-cli
```

# init project for eas
```
eas init --id ccd33245-8aca-43cc-89d5-d224e10b1298
```

# need to create eas.json for eas build triggers
```
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

# eas build failed, app.json was missing android.package field
```    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "app.carpe.wallet_base
},
```
