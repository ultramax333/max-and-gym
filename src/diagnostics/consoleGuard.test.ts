import {describe, expect, it, vi} from 'vitest';
import {installProductionConsoleGuard} from './consoleGuard';

describe('production console guard', () => {
    it('never forwards raw error arguments', () => {
        const errorSink = vi.fn();
        const sink = {error: errorSink, warn: vi.fn(), log: vi.fn()};
        installProductionConsoleGuard(sink);
        sink.error(new Error('private workout note with load 120'));
        expect(errorSink).not.toHaveBeenCalledWith(expect.stringContaining('private workout note'));
        expect(errorSink).toHaveBeenCalledWith(expect.stringContaining('Open Diagnostics'));
    });
});
