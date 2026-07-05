import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { resolveConfigs, getConfigMeta } from '../../src/node/resolveConfigs.js';

function collection(overrides = {}) {
  return {
    syncDataPath: './cit/cit-sync-data.json',
    imsDataFolder: './cit/ims-widgets-data/',
    imgSrcFolder: './cit/cit-store/',
    apiKeyPath: './cit/CIT_API_KEY',
    projectId: 'test-project',
    imgUrlTemplate: 'https://example.com/{UID}/{VARIANT}',
    previewUrlTemplate: 'https://example.com/{UID}/{VARIANT}',
    uploadUrlTemplate: 'https://api.example.com/{PROJECT}/upload',
    fetchUrlTemplate: 'https://api.example.com/{PROJECT}/{UID}/blob',
    removeUrlTemplate: 'https://api.example.com/{PROJECT}/{UID}',
    variants: ['320', '640'],
    imgTypes: ['png', 'jpg'],
    ...overrides,
  };
}

function readFileFromMap(files) {
  return (filePath) => {
    let normalized = path.resolve(filePath);
    if (!Object.hasOwn(files, normalized)) {
      throw new Error(`Missing test file: ${normalized}`);
    }
    return files[normalized];
  };
}

describe('resolveConfigs', () => {
  it('keeps root collection paths cwd-relative', () => {
    let cwd = path.resolve('/workspace');
    let configPath = path.join(cwd, 'cit-config.json');
    let result = resolveConfigs(collection(), {
      cwd,
      configPath,
      readFile: readFileFromMap({}),
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].syncDataPath, './cit/cit-sync-data.json');
    assert.equal(result[0].imgSrcFolder, './cit/cit-store/');
    assert.equal(result[0].imsDataFolder, './cit/ims-widgets-data/');
    assert.equal(result[0].apiKeyPath, './cit/CIT_API_KEY');
    assert.deepEqual(getConfigMeta(result[0]), {
      sourceFile: configPath,
      sourceIndex: 0,
      sourceIsArray: false,
      included: false,
    });
  });

  it('loads string includes and resolves paths relative to the included config file', () => {
    let cwd = path.resolve('/workspace');
    let rootConfigPath = path.join(cwd, 'cit-config.json');
    let projectConfigPath = path.join(cwd, 'cv/cit-config.json');
    let files = {
      [projectConfigPath]: JSON.stringify(collection()),
    };

    let result = resolveConfigs(['./cv/cit-config.json'], {
      cwd,
      configPath: rootConfigPath,
      readFile: readFileFromMap(files),
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].syncDataPath, './cv/cit/cit-sync-data.json');
    assert.equal(result[0].imgSrcFolder, './cv/cit/cit-store/');
    assert.equal(result[0].imsDataFolder, './cv/cit/ims-widgets-data/');
    assert.equal(result[0].apiKeyPath, './cv/cit/CIT_API_KEY');
    assert.deepEqual(getConfigMeta(result[0]), {
      sourceFile: projectConfigPath,
      sourceIndex: 0,
      sourceIsArray: false,
      included: true,
    });
  });

  it('loads object includes, nested arrays, and root-relative overrides', () => {
    let cwd = path.resolve('/workspace');
    let rootConfigPath = path.join(cwd, 'cit-config.json');
    let projectConfigPath = path.join(cwd, 'project/cit-config.json');
    let files = {
      [projectConfigPath]: JSON.stringify([
        collection({ name: 'One' }),
        collection({ name: 'Two', syncDataPath: './cit/two-sync-data.json' }),
      ]),
    };

    let result = resolveConfigs([
      {
        configPath: './project/cit-config.json',
        overrides: {
          apiKeyPath: './cit/CIT_API_KEY',
          imgSrcFolder: './shared-cit/project-store/',
        },
      },
    ], {
      cwd,
      configPath: rootConfigPath,
      readFile: readFileFromMap(files),
    });

    assert.equal(result.length, 2);
    assert.equal(result[0].apiKeyPath, './cit/CIT_API_KEY');
    assert.equal(result[0].imgSrcFolder, './shared-cit/project-store/');
    assert.equal(result[0].syncDataPath, './project/cit/cit-sync-data.json');
    assert.equal(result[1].syncDataPath, './project/cit/two-sync-data.json');
    assert.equal(getConfigMeta(result[0]).sourceIndex, 0);
    assert.equal(getConfigMeta(result[1]).sourceIndex, 1);
    assert.equal(getConfigMeta(result[1]).sourceIsArray, true);
    assert.equal(getConfigMeta(result[1]).included, true);
  });

  it('can mix inline collections and includes', () => {
    let cwd = path.resolve('/workspace');
    let rootConfigPath = path.join(cwd, 'cit-config.json');
    let projectConfigPath = path.join(cwd, 'project/cit-config.json');
    let files = {
      [projectConfigPath]: JSON.stringify(collection({ name: 'Included' })),
    };

    let result = resolveConfigs([
      collection({ name: 'Inline' }),
      './project/cit-config.json',
    ], {
      cwd,
      configPath: rootConfigPath,
      readFile: readFileFromMap(files),
    });

    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'Inline');
    assert.equal(result[1].name, 'Included');
    assert.equal(getConfigMeta(result[0]).included, false);
    assert.equal(getConfigMeta(result[1]).included, true);
  });

  it('rejects circular includes', () => {
    let cwd = path.resolve('/workspace');
    let rootConfigPath = path.join(cwd, 'cit-config.json');
    let nestedConfigPath = path.join(cwd, 'nested/cit-config.json');
    let files = {
      [nestedConfigPath]: JSON.stringify(['../cit-config.json']),
      [rootConfigPath]: JSON.stringify(['./nested/cit-config.json']),
    };

    assert.throws(() => {
      resolveConfigs(['./nested/cit-config.json'], {
        cwd,
        configPath: rootConfigPath,
        readFile: readFileFromMap(files),
      });
    }, /Circular config include|include depth exceeded/);
  });
});
