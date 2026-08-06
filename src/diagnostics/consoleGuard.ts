type ConsoleTarget = Pick<Console, 'error' | 'warn' | 'log'>;

export function installProductionConsoleGuard(target: ConsoleTarget = globalThis.console): () => void {
    const original = {
        error: target.error.bind(target),
        warn: target.warn.bind(target),
        log: target.log.bind(target),
    };
    target.error = () => original.error('[Max & Gym] Application error suppressed. Open Diagnostics for a redacted error ID.');
    target.warn = () => original.warn('[Max & Gym] Runtime warning suppressed. Open Diagnostics for technical status.');
    target.log = () => undefined;
    return () => {
        target.error = original.error;
        target.warn = original.warn;
        target.log = original.log;
    };
}
