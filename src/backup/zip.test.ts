import {describe, expect, it} from 'vitest';
import {ArchiveError, decodeZip, encodeZip} from './zip';

describe('safe ZIP codec', () => {
    it('round-trips stored UTF-8 entries and verifies CRC', () => {
        const encoded = encodeZip([{path: 'manifest.json', bytes: new TextEncoder().encode('{"ok":true}')}, {path: 'media/a.bin', bytes: new Uint8Array([1, 2, 3])}]);
        expect(decodeZip(encoded).map((entry) => entry.path)).toEqual(['manifest.json', 'media/a.bin']);
        const corrupted = encoded.slice(); corrupted[45] ^= 0xff;
        expect(() => decodeZip(corrupted)).toThrow();
    });

    it('rejects traversal paths before extraction', () => {
        expect(() => encodeZip([{path: '../evil', bytes: new Uint8Array()}])).toThrowError(ArchiveError);
        const replaced = encodeZip([{path: 'aa/evil', bytes: new Uint8Array([1])}]);
        const safe = new TextEncoder().encode('aa/evil');
        const unsafe = new TextEncoder().encode('../evil');
        for (let offset = 0; offset <= replaced.length - safe.length; offset++) {
            if (safe.every((value, index) => replaced[offset + index] === value)) replaced.set(unsafe, offset);
        }
        expect(() => decodeZip(replaced)).toThrow('Chemin');
        expect(() => decodeZip(encodeZip([{path: 'safe.bin', bytes: new Uint8Array([1, 2])}]), {maxFiles: 1, maxBytes: 1})).toThrow('grande');
    });
});
