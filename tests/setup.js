const { LocalStorage } = require('node-localstorage');
const path = require('path');
const fs = require('fs');

// Create a directory for localStorage if it doesn't exist
const storagePath = path.join(__dirname, '.localStorage');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Create a localStorage instance
const localStorage = new LocalStorage(storagePath);

// Make localStorage available globally
global.localStorage = localStorage;
