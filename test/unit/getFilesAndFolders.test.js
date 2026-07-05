import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFilesAndFolders } from '../../src/ui/getFilesAndFolders.js';

/** @returns {CloudImageDescriptor} */
function mockDescriptor(name) {
  return {
    cdnId: `cdn-${name}`,
    uploadDate: '2026-01-01',
    imageName: name,
    alt: '',
    width: '100',
    height: '100',
    aspectRatio: '1/1',
    srcFormat: 'PNG',
  };
}

describe('getFilesAndFolders', () => {
  it('returns flat files when no subfolders exist', () => {
    let data = {
      './store/img1.png': mockDescriptor('img1.png'),
      './store/img2.png': mockDescriptor('img2.png'),
    };
    let result = getFilesAndFolders(data, './store/');
    assert.equal(Object.keys(result.files).length, 2);
    assert.equal(Object.keys(result.folders).length, 0);
  });

  it('groups nested paths into folders', () => {
    let data = {
      './store/photos/a.png': mockDescriptor('a.png'),
      './store/photos/b.png': mockDescriptor('b.png'),
      './store/icons/c.png': mockDescriptor('c.png'),
    };
    let result = getFilesAndFolders(data, './store/');
    assert.equal(Object.keys(result.files).length, 0);
    assert.equal(Object.keys(result.folders).length, 2);
    assert.equal(result.folders['photos'].size, 2);
    assert.equal(result.folders['icons'].size, 1);
    assert.deepEqual(result.folders['icons'].content, ['./store/icons/c.png']);
  });

  it('filters by substring', () => {
    let data = {
      './store/photos/a.png': mockDescriptor('a.png'),
      './store/icons/b.png': mockDescriptor('b.png'),
    };
    let result = getFilesAndFolders(data, './store/', 'photos');
    assert.equal(Object.keys(result.folders).length, 0);
    assert.equal(Object.keys(result.files).length, 1);
  });

  it('handles filter with folder prefix for navigation', () => {
    let data = {
      './store/photos/a.png': mockDescriptor('a.png'),
      './store/photos/sub/b.png': mockDescriptor('b.png'),
    };
    let result = getFilesAndFolders(data, './store/', 'photos/');
    assert.equal(Object.keys(result.files).length, 1);
    assert.equal(Object.keys(result.folders).length, 1);
    assert.ok(result.folders['sub']);
  });

  it('returns empty results for empty data', () => {
    let result = getFilesAndFolders({}, './store/');
    assert.equal(Object.keys(result.files).length, 0);
    assert.equal(Object.keys(result.folders).length, 0);
  });

  it('works with mixed flat and nested files', () => {
    let data = {
      './store/root.png': mockDescriptor('root.png'),
      './store/sub/nested.png': mockDescriptor('nested.png'),
    };
    let result = getFilesAndFolders(data, './store/');
    assert.equal(Object.keys(result.files).length, 1);
    assert.equal(Object.keys(result.folders).length, 1);
  });

  it('groups project-relative sync-data keys by the source image folder', () => {
    let data = {
      './cit/cit-store/autobox/001.webp': mockDescriptor('001.webp'),
      './cit/cit-store/autobox/002.webp': mockDescriptor('002.webp'),
      './cit/cit-store/logo.webp': mockDescriptor('logo.webp'),
    };

    let result = getFilesAndFolders(data, './cit/cit-store/');

    assert.equal(result.folders.autobox.size, 2);
    assert.deepEqual(result.folders.autobox.content, [
      './cit/cit-store/autobox/001.webp',
      './cit/cit-store/autobox/002.webp',
    ]);
    assert.ok(result.files['./cit/cit-store/logo.webp']);
    assert.equal(result.folders['.'], undefined);
  });

  it('does not create a dot folder when the configured prefix is missing', () => {
    let data = {
      './cit/cit-store/autobox/001.webp': mockDescriptor('001.webp'),
    };

    let result = getFilesAndFolders(data, './other-store/');

    assert.equal(result.folders.cit.size, 1);
    assert.equal(result.folders['.'], undefined);
  });
});
