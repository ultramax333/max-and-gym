import {describe, expect, it} from 'vitest';
import {redactContext, redactText, safeErrorClass} from './redaction';

describe('diagnostic redaction', () => {
    it('blocks fixture secrets and sensitive personal values', () => {
        const fixtures = [
            'Bearer abc.def.ghi',
            'password=hunter2',
            'max@example.test',
            'C:\\Users\\max\\private-photo.jpg',
            'data:image/jpeg;base64,AAAA',
        ];
        for (const fixture of fixtures) expect(redactText(fixture)).toBe('[REDACTED]');
    });

    it('only keeps allow-listed safe context', () => {
        expect(redactContext({recordCount: 4, notes: 'private note', actualLoad: 120, status: 'ok'})).toEqual({recordCount: 4, status: 'ok'});
    });

    it('keeps only an error class from exceptions', () => {
        expect(safeErrorClass(new Error('secret workout note'))).toBe('Error');
    });
});
