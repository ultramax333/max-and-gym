export const NATIVE_MIGRATION_DECISION_KEY = 'maxgym.nativeMigrationDecision.v1';
const LEGACY_MIGRATION_DISMISSED_KEY = 'maxgym.nativeMigrationPromptDismissed';

export type NativeMigrationDecision = 'continue-local' | 'import-selected' | 'import-completed';

type MigrationStorage = Pick<Storage, 'getItem' | 'setItem'>;

const validDecisions = new Set<NativeMigrationDecision>(['continue-local', 'import-selected', 'import-completed']);

export function hasNativeMigrationDecision(storage: MigrationStorage): boolean {
    try {
        const decision = storage.getItem(NATIVE_MIGRATION_DECISION_KEY);
        if (decision && validDecisions.has(decision as NativeMigrationDecision)) return true;

        // Preserve the choice made by users of the first Android build.
        return storage.getItem(LEGACY_MIGRATION_DISMISSED_KEY) === 'true';
    } catch {
        // If storage cannot be read, offering a non-destructive import is safer than
        // silently assuming that migration was already handled.
        return false;
    }
}

export function recordNativeMigrationDecision(storage: MigrationStorage, decision: NativeMigrationDecision): boolean {
    try {
        storage.setItem(NATIVE_MIGRATION_DECISION_KEY, decision);
        return true;
    } catch {
        return false;
    }
}
