import Symbiote from '@symbiotejs/symbiote';
import { styles } from './css.js';
import { template } from './tpl.js';
import { configs } from '../../../node/CFG.js';
import { WsClient } from '../../WsClient.js';

/**
 * @param {unknown} tags
 * @returns {string[]}
 */
function normalizeProjectTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
}

/**
 * @param {CITConfig & { index?: number, included?: boolean, readOnly?: boolean }} cfg
 * @param {number} i
 */
function collectionItem(cfg, i) {
  let projectTags = normalizeProjectTags(cfg.projectTags);
  let projectGroup = cfg.projectGroup || 'Collections';
  let projectLabel = cfg.projectName || cfg.name || cfg.projectKey || `Collection ${i}`;
  let editorCfg = { ...cfg };
  delete editorCfg.included;
  delete editorCfg.readOnly;
  let searchText = [
    cfg.name,
    cfg.projectKey,
    cfg.projectName,
    cfg.projectGroup,
    ...projectTags,
  ].filter(Boolean).join(' ').toLowerCase();

  return {
    name: cfg.name || `Collection ${i}`,
    idx: cfg.index ?? i,
    cfg: editorCfg,
    modified: false,
    current: i === 0,
    readOnly: !!cfg.readOnly,
    included: !!cfg.included,
    saveDisabled: true,
    visible: true,
    groupStart: false,
    projectKey: cfg.projectKey || '',
    projectLabel,
    projectGroup,
    projectTags,
    tagsLabel: projectTags.join(', '),
    searchText,
  };
}

/**
 * @param {ReturnType<typeof collectionItem>[]} items
 */
function applyGroupStarts(items) {
  let lastGroup = '';
  for (let item of items) {
    if (!item.visible) {
      item.groupStart = false;
      continue;
    }
    item.groupStart = item.projectGroup !== lastGroup;
    lastGroup = item.projectGroup;
  }
}

function buildCollectionItems() {
  let items = configs.map(collectionItem).sort((a, b) => {
    return a.projectGroup.localeCompare(b.projectGroup)
      || a.projectLabel.localeCompare(b.projectLabel)
      || a.idx - b.idx;
  });
  applyGroupStarts(items);
  return items;
}

export class CitCollectionProfiles extends Symbiote {

  /** @type {number} */
  #filterTimeout;

  init$ = {
    configs: buildCollectionItems(),
    projectFilterSubstr: '',
    hasProjectControls: configs.length > 1 || configs.some((cfg) => {
      return cfg.projectKey || cfg.projectName || cfg.projectGroup || normalizeProjectTags(cfg.projectTags).length;
    }),
    hasVisibleConfigs: true,
    visibleCount: configs.length,
    totalCount: configs.length,

    onCfgChange: (e) => {
      let itemComponent = e.target.closest('cit-collection-item');
      if (itemComponent) {
        itemComponent.$.modified = true;
        itemComponent.$.saveDisabled = !!itemComponent.$.readOnly;
        let xCfg = e.target.closest('x-cfg');
        if (xCfg) {
          itemComponent.$.cfg = xCfg.value;
        }
      }
    },

    applyChanges: async (e) => {
      let itemComponent = e.target.closest('cit-collection-item');
      if (itemComponent && !itemComponent.$.readOnly) {
        let idx = itemComponent.$.idx;
        let newCfg = itemComponent.$.cfg;
        await WsClient.send({
          cmd: 'SAVE_CONFIG',
          data: {
            collectionIndex: idx,
            config: newCfg
          }
        });
        itemComponent.$.modified = false;
        itemComponent.$.saveDisabled = true;
      }
    },

    onActivate: (e) => {
      let itemComponent = e.target.closest('cit-collection-item');
      if (itemComponent) {
        let idx = itemComponent.$.idx;
        this.$['APP/collectionIndex'] = idx;
        
        /** @type {any[]} */
        let domItems = [...this.querySelectorAll('cit-collection-item')];
        domItems.forEach(item => {
          item.$.current = item.$.idx === idx;
        });

        this.$['APP/collectionProfilesActive'] = false;
      }
    },

    toggleUnfold: (e) => {
      let itemComponent = e.target.closest('cit-collection-item');
      if (itemComponent) {
        itemComponent.classList.toggle('unfold');
      }
    },

    onProjectFilter: (e) => {
      if (this.#filterTimeout) {
        clearTimeout(this.#filterTimeout);
      }
      this.#filterTimeout = window.setTimeout(() => {
        this.applyProjectFilter(e.target.value);
      }, 150);
    },
  }

  close() {
    this.$['APP/collectionProfilesActive'] = false;
  }

  applyProjectFilter(value = '') {
    let query = value.trim().toLowerCase();
    this.$.projectFilterSubstr = query;
    let visibleCount = 0;
    for (let item of this.$.configs) {
      item.visible = !query || item.searchText.includes(query);
      if (item.visible) {
        visibleCount++;
      }
    }
    applyGroupStarts(this.$.configs);
    this.$.visibleCount = visibleCount;
    this.$.hasVisibleConfigs = visibleCount > 0;
    this.notify('configs');
    requestAnimationFrame(() => this.syncCollectionItems());
  }

  syncCollectionItems() {
    /** @type {any[]} */
    let domItems = [...this.querySelectorAll('cit-collection-item')];
    domItems.forEach((item) => {
      item.toggleAttribute('hidden', !item.$.visible);
      item.toggleAttribute('read-only', !!item.$.readOnly);
    });
  }

  renderCallback() {
    requestAnimationFrame(() => this.syncCollectionItems());

    this.sub('APP/collectionProfilesActive', (val) => {
      if (val) {
        this.setAttribute('active', '')
        requestAnimationFrame(() => this.syncCollectionItems());
      } else {
        this.removeAttribute('active')
      }
    });
  }
}

CitCollectionProfiles.rootStyles = styles;
CitCollectionProfiles.template = template;

CitCollectionProfiles.reg('cit-collection-profiles');
