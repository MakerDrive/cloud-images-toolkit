import { css } from '@symbiotejs/symbiote';

export const styles = css`
cit-collection-profiles {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  padding: 10px;
  transition: opacity .3s;

  &:not([active]) {
    opacity: 0;
    pointer-events: none;
  }

  [popup] {
    position: absolute;
    top: 40px;
    bottom: 40px;
    display: grid;
    grid-template-rows: min-content auto;
    max-width: 1200px;
    width: 100%;
    background-color: var(--color-1);
    border-radius: 6px;
    box-shadow: 0 0 12px rgba(0, 0, 0, .4);
    overflow: hidden;

    [p-header] {
      display: flex;
      justify-content: space-between;
      padding: 6px;

      [p-caption] {
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 10px;
      }
    }

    [p-content] {
      background-color: rgba(255, 255, 255, .1);
      padding: 10px;
      overflow: auto;
    }
  }

  [project-filter] {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) min-content;
    gap: var(--gap-mid);
    align-items: center;
    margin-bottom: var(--gap-mid);

    &[hidden] {
      display: none;
    }

    span {
      white-space: nowrap;
      font-size: 12px;
      opacity: .7;
    }
  }

  [empty-state] {
    padding: var(--gap-max);
    text-align: center;
    color: rgba(255, 255, 255, .65);

    &[hidden] {
      display: none;
    }
  }

  cit-collection-item {
    display: block;
    margin-bottom: var(--gap-mid);
    padding: var(--gap-mid);
    background-color: rgba(0, 0, 0, .2);
    color: #fff;
    border-radius: 6px;

    [controls] {
      justify-content: space-between;
    }

    &[hidden] {
      display: none;
    }

    [group-header] {
      margin-bottom: 8px;
      padding-left: 2px;
      color: rgba(255, 255, 255, .7);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;

      &[hidden] {
        display: none;
      }
    }

    [project-meta] {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, .55);

      span {
        display: inline;

        &[hidden] {
          display: none;
        }

        &:not(:first-child):before {
          content: '·';
          margin-right: 6px;
          color: rgba(255, 255, 255, .35);
        }

        &[read-only] {
          color: rgba(255, 255, 255, .45);
        }
      }
    }

    x-cfg {
      margin-top: var(--gap-mid);
    }

    &:not(.unfold) {
      x-cfg {
        display: none;
      }
    }

    &.unfold {
      [controls] {
        span[right-icon] {
          transform: rotate(180deg);
          transform-origin: 11px;
        }
      }
    }
  }
}
`;
