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

    it.each(['continue-local', 'import-selected', 'import-completed'] as const)('does not offer migration again after %s', (decision) => {
        const storage = memoryStorage();
        expect(recordNativeMigrationDecision(storage, decision)).toBe(true);
        expect(storage.values.get(NATIVE_MIGRATION_DECISION_KEY)).toBe(decision);
        expect(hasNativeMigrationDecision(storage)).toBe(true);
    });

    it('honours the dismissal marker written by the initial Android release', () => {
        expect(hasNativeMigrationDecision(memoryStorage({'maxgym.nativeMigrationPromptDismissed': 'true'}))).toBe(true);
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
