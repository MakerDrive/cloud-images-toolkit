import { defineConfig } from '@playwright/test';

const HTTP_PORT = 19381;
const WS_PORT = 19380;

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: `http://localhost:${HTTP_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `node -e "
      import fs from 'fs';
      import path from 'path';
      let tmp = './TMP/test-e2e';
      fs.mkdirSync(tmp + '/store', { recursive: true });
      fs.mkdirSync(tmp + '/included/store', { recursive: true });
      let config = {
        name: 'Direct Test Collection',
        syncDataPath: path.resolve(tmp, 'sync-data.json'),
        imsDataFolder: path.resolve(tmp, 'ims-widgets/'),
        imgSrcFolder: path.resolve(tmp, 'store/'),
        apiKeyPath: path.resolve(tmp, 'API_KEY'),
        projectId: 'test-project',
        projectKey: 'direct-project',
        projectName: 'Direct Project',
        projectGroup: 'Local Projects',
        projectTags: ['direct', 'test'],
        imgUrlTemplate: 'https://example.com/{UID}/{VARIANT}',
        previewUrlTemplate: 'https://example.com/{UID}/{VARIANT}',
        uploadUrlTemplate: 'https://api.example.com/{PROJECT}/upload',
        fetchUrlTemplate: 'https://api.example.com/{PROJECT}/{UID}/blob',
        removeUrlTemplate: 'https://api.example.com/{PROJECT}/{UID}',
        variants: ['320', '640', '1024', 'max'],
        imgTypes: ['png', 'jpg', 'webp'],
        wsPort: ${WS_PORT},
        httpPort: ${HTTP_PORT},
      };
      let includedConfig = {
        ...config,
        name: 'Included Test Collection',
        syncDataPath: path.resolve(tmp, 'included/sync-data.json'),
        imsDataFolder: path.resolve(tmp, 'included/ims-widgets/'),
        imgSrcFolder: path.resolve(tmp, 'included/store/'),
        projectKey: 'included-source',
        projectName: 'Included Source Project',
        projectGroup: 'Source Projects',
        projectTags: ['source'],
      };
      fs.writeFileSync(path.resolve(tmp, 'included/cit-config.json'), JSON.stringify(includedConfig));
      fs.writeFileSync(path.resolve(tmp, 'cit-config.json'), JSON.stringify([
        config,
        {
          configPath: path.resolve(tmp, 'included/cit-config.json'),
          overrides: {
            apiKeyPath: path.resolve(tmp, 'API_KEY'),
            projectKey: 'included-project',
            projectName: 'Included Project',
            projectGroup: 'GitHub Pages',
            projectTags: ['included', 'pages'],
          },
        },
      ]));
      fs.writeFileSync(path.resolve(tmp, 'API_KEY'), 'test-api-key');
      fs.writeFileSync(path.resolve(tmp, 'sync-data.json'), JSON.stringify({}));

      process.env.CIT_CONFIG_PATH = path.resolve(tmp, 'cit-config.json');
      await import('./src/node/serve.js');
    "`,
    port: HTTP_PORT,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
