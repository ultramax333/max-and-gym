import {describe, expect, it} from 'vitest';
import {hasNativeMigrationDecision, NATIVE_MIGRATION_DECISION_KEY, recordNativeMigrationDecision} from './nativeMigrationDecision';

function memoryStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        values,
    };
}

describe('native migration decision', () => {
    it('offers migration when no explicit decision exists, regardless of seeded database content', () => {
        const storage = memoryStorage();
        expect(hasNativeMigrationDecision(storage)).toBe(false);
    });

    it.each(['continue-local', 'import-completed'] as const)('does not offer migration again after %s', (decision) => {
        const storage = memoryStorage();
        expect(recordNativeMigrationDecision(storage, decision)).toBe(true);
        expect(storage.values.get(NATIVE_MIGRATION_DECISION_KEY)).toBe(decision);
        expect(hasNativeMigrationDecision(storage)).toBe(true);
    });

    it('keeps offering migration until an import actually completes', () => {
        const storage = memoryStorage({[NATIVE_MIGRATION_DECISION_KEY]: 'import-selected'});
        expect(hasNativeMigrationDecision(storage)).toBe(false);
    });

    it('re-offers migration for the ambiguous marker written by the initial Android build', () => {
        expect(hasNativeMigrationDecision(memoryStorage({'maxgym.nativeMigrationPromptDismissed': 'true'}))).toBe(false);
    });

    it('does not treat corrupt or unavailable storage as a decision', () => {
        expect(hasNativeMigrationDecision(memoryStorage({[NATIVE_MIGRATION_DECISION_KEY]: 'unknown'}))).toBe(false);
        const unavailable = {
            getItem: () => { throw new Error('unavailable'); },
            setItem: () => { throw new Error('unavailable'); },
        };
        expect(hasNativeMigrationDecision(unavailable)).toBe(false);
        expect(recordNativeMigrationDecision(unavailable, 'continue-local')).toBe(false);
    });
});
