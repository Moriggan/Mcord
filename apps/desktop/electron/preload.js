const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(process.cwd(), '.mcord-token');

contextBridge.exposeInMainWorld('mcord', {
  saveToken(token) {
    fs.writeFileSync(tokenPath, token, 'utf-8');
  },
  loadToken() {
    try {
      return fs.readFileSync(tokenPath, 'utf-8');
    } catch (e) {
      return '';
    }
  },
  clearToken() {
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
  }
});
