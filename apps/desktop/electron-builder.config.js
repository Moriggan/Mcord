module.exports = {
  appId: 'com.mcord.app',
  productName: 'Mcord',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**',
    'electron/**',
    'package.json'
  ],
  extraResources: [],
  win: {
    target: 'nsis',
    artifactName: 'Mcord-Setup-${version}.exe'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true
  },
  afterSign: async () => {
    // Hook for codesigning if needed later
  },
  publish: {
    provider: 'generic',
    url: 'https://example.com/downloads'
  }
};
