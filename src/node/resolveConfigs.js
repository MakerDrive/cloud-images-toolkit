import path from 'path';

export const CONFIG_META = Symbol('cit.configMeta');

const DEFAULT_CONFIG_FILE = 'cit-config.json';
const MAX_INCLUDE_DEPTH = 8;
const PATH_FIELDS = new Set([
  'syncDataPath',
  'imsDataFolder',
  'imgSrcFolder',
  'apiKeyPath',
]);

const TRAILING_SLASH_FIELDS = new Set([
  'imsDataFolder',
  'imgSrcFolder',
]);

/**
 * @param {unknown} entry
 * @returns {entry is CITConfigInclude}
 */
export function isConfigInclude(entry) {
  return typeof entry === 'string'
    || !!entry && typeof entry === 'object' && typeof /** @type {{ configPath?: unknown }} */ (entry).configPath === 'string';
}

/**
 * @param {CITConfig} cfg
 * @returns {CITConfigMeta | undefined}
 */
export function getConfigMeta(cfg) {
  return cfg[CONFIG_META];
}

/**
 * @param {CITConfig} cfg
 * @param {CITConfigMeta} meta
 * @returns {CITConfig}
 */
function withMeta(cfg, meta) {
  Object.defineProperty(cfg, CONFIG_META, {
    value: meta,
    enumerable: false,
    configurable: true,
  });
  return cfg;
}

/**
 * @param {string} value
 * @param {string} field
 * @param {string} baseDir
 * @param {string} cwd
 * @returns {string}
 */
function toRuntimePath(value, field, baseDir, cwd) {
  let hadTrailingSlash = /[\\/]$/.test(value);
  let absolutePath = path.isAbsolute(value)
    ? value
    : path.resolve(baseDir, value);
  let relativePath = path.relative(cwd, absolutePath).replaceAll(path.sep, '/');

  if (!relativePath || relativePath === '.') {
    relativePath = '.';
  } else if (!relativePath.startsWith('.') && !path.isAbsolute(relativePath)) {
    relativePath = `./${relativePath}`;
  }

  if (TRAILING_SLASH_FIELDS.has(field) && hadTrailingSlash && !relativePath.endsWith('/')) {
    relativePath += '/';
  }

  return relativePath;
}

/**
 * @param {Partial<CITConfig>} cfg
 * @param {string} baseDir
 * @param {string} cwd
 * @returns {Partial<CITConfig>}
 */
function normalizePathFields(cfg, baseDir, cwd) {
  let next = { ...cfg };
  for (let field of PATH_FIELDS) {
    if (typeof next[field] === 'string') {
      next[field] = toRuntimePath(next[field], field, baseDir, cwd);
    }
  }
  return next;
}

/**
 * @param {CITRawConfig} rawConfig
 * @returns {CITConfigEntry[]}
 */
function toConfigEntries(rawConfig) {
  return Array.isArray(rawConfig) ? rawConfig : [rawConfig];
}

/**
 * @param {CITConfigInclude} include
 * @returns {string}
 */
function getIncludePath(include) {
  return typeof include === 'string' ? include : include.configPath;
}

/**
 * @param {CITConfigInclude} include
 * @returns {Partial<CITConfig> | undefined}
 */
function getIncludeOverrides(include) {
  return typeof include === 'string' ? undefined : include.overrides;
}

/**
 * @param {unknown} parsed
 * @param {string} filePath
 * @returns {CITRawConfig}
 */
function assertRawConfig(parsed, filePath) {
  if (Array.isArray(parsed) || typeof parsed === 'string' || parsed && typeof parsed === 'object') {
    return /** @type {CITRawConfig} */ (parsed);
  }
  throw new Error(`Config must be an object, array, or include string: ${filePath}`);
}

/**
 * @param {CITRawConfig} rawConfig
 * @param {ResolveConfigOptions} options
 * @returns {CITConfig[]}
 */
export function resolveConfigs(rawConfig, options) {
  let cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  let configPath = options.configPath
    ? path.resolve(options.configPath)
    : path.resolve(cwd, DEFAULT_CONFIG_FILE);
  let configDir = path.dirname(configPath);
  let readFile = options.readFile;
  let visited = options.visited || new Set();
  let chain = options.chain || [];
  let depth = options.depth || 0;

  if (depth > (options.maxDepth || MAX_INCLUDE_DEPTH)) {
    throw new Error(`Config include depth exceeded: ${[...chain, configPath].join(' -> ')}`);
  }

  let entries = toConfigEntries(rawConfig);
  let collections = [];

  for (let i = 0; i < entries.length; i++) {
    let entry = entries[i];

    if (isConfigInclude(entry)) {
      let includePath = getIncludePath(entry);
      let includeConfigPath = path.resolve(configDir, includePath);
      let includeChain = [...chain, configPath];

      if (visited.has(includeConfigPath)) {
        throw new Error(`Circular config include: ${[...includeChain, includeConfigPath].join(' -> ')}`);
      }

      let includeRaw;
      try {
        includeRaw = assertRawConfig(JSON.parse(readFile(includeConfigPath, 'utf8')), includeConfigPath);
      } catch (err) {
        throw new Error(`Failed to load included config "${includePath}" from ${configPath}: ${err.message}`);
      }

      visited.add(includeConfigPath);
      let includedConfigs = resolveConfigs(includeRaw, {
        ...options,
        configPath: includeConfigPath,
        visited,
        chain: includeChain,
        depth: depth + 1,
      });
      visited.delete(includeConfigPath);

      let overrides = getIncludeOverrides(entry);
      if (overrides) {
        let normalizedOverrides = normalizePathFields(overrides, configDir, cwd);
        includedConfigs = includedConfigs.map((cfg) => {
          let nextCfg = { ...cfg, ...normalizedOverrides };
          return withMeta(nextCfg, getConfigMeta(cfg));
        });
      }

      for (let cfg of includedConfigs) {
        let meta = getConfigMeta(cfg);
        collections.push(withMeta(cfg, {
          sourceFile: meta?.sourceFile || includeConfigPath,
          sourceIndex: meta?.sourceIndex ?? 0,
          sourceIsArray: meta?.sourceIsArray ?? Array.isArray(includeRaw),
          included: true,
        }));
      }
      continue;
    }

    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid config entry in ${configPath} at index ${i}`);
    }

    let cfg = /** @type {CITConfig} */ (normalizePathFields(entry, configDir, cwd));
    collections.push(withMeta(cfg, {
      sourceFile: configPath,
      sourceIndex: i,
      sourceIsArray: Array.isArray(rawConfig),
      included: depth > 0,
    }));
  }

  return collections;
}
