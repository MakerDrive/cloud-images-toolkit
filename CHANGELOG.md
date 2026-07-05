# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Multi-project dashboard configs can include other `cit-config.json` files with string paths or `{ "configPath": "..." }` entries.
- Include entries support runtime `overrides` for local paths such as `apiKeyPath` and `imgSrcFolder`.
- Added `cit-config_GLOBAL_REFERENCE.json` for workspace-level dashboard setups.
- `CIT_CONFIG_PATH` can point CIT at an alternate config file for scripted runs.
- Collection configs can declare project metadata with `projectKey`, `projectName`, `projectGroup`, and `projectTags`; the dashboard can filter and group collection profiles by that metadata.

## [1.0.0]

### Added
- `npx cloud-images-toolkit` zero-install support
- Interactive config file creation from reference template
- Config validation with clear error messages on startup

### Fixed
- Race condition in upload process (`processSrcFolder`) — async uploads now execute sequentially
- Race condition in fetch/download — promises properly collected and awaited
- API key no longer exposed to browser client
- Server no longer crashes on malformed WebSocket messages
- Graceful shutdown on `SIGINT` / `SIGTERM`
