import { html } from '@symbiotejs/symbiote';
import { icon } from '../../icon.js';

export const template = html`
<div popup>
  <div p-header>
    <div p-caption>${icon('settings')} &nbsp;Projects</div>
    <button round ${{onclick: 'close'}}>${icon('close')}</button>
  </div>
  <div p-content>
    <div project-filter ${{'@hidden': '!hasProjectControls'}}>
      <input type="search" placeholder="Filter projects, groups, tags..." ${{oninput: 'onProjectFilter'}}>
      <span>{{visibleCount}}/{{totalCount}}</span>
    </div>
    <div empty-state ${{'@hidden': 'hasVisibleConfigs'}}>No matching projects</div>
    <div itemize="configs" item-tag="cit-collection-item">
      <template>
        <div group-header ${{'@hidden': '!groupStart'}}>{{projectGroup}}</div>
        <div controls>
          <button ${{onclick: '^toggleUnfold'}} title="Edit">{{name}} ${icon('keyboard_arrow_down', true)}</button>
          <div>
            <button ${{onclick: '^applyChanges', '@disabled': 'saveDisabled'}} title="Save Changes">${icon('save')} Save Changes</button>
            <button accent ${{onclick: '^onActivate'}} title="View Project">${icon('check')} View</button>
          </div>
        </div>
        <div project-meta>
          <span>{{projectLabel}}</span>
          <span ${{'@hidden': '!projectKey'}}>{{projectKey}}</span>
          <span ${{'@hidden': '!tagsLabel'}}>{{tagsLabel}}</span>
          <span read-only ${{'@hidden': '!readOnly'}}>Read-only include</span>
        </div>
        <x-cfg ${{'$.data': 'cfg', onchange: '^onCfgChange'}} editable></x-cfg>
      </template>
    </div>
  </div>
</div>
`;
