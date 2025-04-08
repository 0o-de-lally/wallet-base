# Troubleshooting Common Issues

## React Native DevTools Connection Issues

If you encounter the error:
```
Failed to open the React Native DevTools.
Error: Runtime.evaluate
```

Try the following solutions:

### Solution 1: Restart the development server with a clean cache
```bash
# Stop any running instances first
expo start --clear
```

### Solution 2: Use non-dev mode for testing
Sometimes the DevTools connection issues only affect development mode but not the app functionality:
```bash
expo start --no-dev --minify
```

### Solution 3: Check for port conflicts
Make sure nothing else is using the DevTools port (typically 19000-19002):
```bash
# On macOS/Linux
lsof -i :19000
lsof -i :19001
lsof -i :19002

# Kill the process if needed
kill -9 <PID>
```

### Solution 4: Reinstall DevTools
```bash
npm uninstall -g react-devtools
npm install -g react-devtools
```

### Solution 5: Try alternative development clients
If the Expo Go app is having issues, try building a development client:
```bash
expo run:android  # For Android
expo run:ios      # For iOS
```

## Other Common Issues

### Metro bundler crashes
If the bundler keeps crashing, try:
```bash
expo start --no-dev --minify
```

### Network connection issues
If you're getting network-related errors:
- Ensure your device is on the same network as your development machine
- Try using a tunnel connection: `expo start --tunnel`
