import React from 'react';
import {render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ErrorBoundary from './errorBoundary';
import {recordException} from '../diagnostics/service';

vi.mock('../diagnostics/service', () => ({recordException: vi.fn(() => 'diagnostic-test-id')}));

function BrokenRoute(): JSX.Element {
    throw new Error('secret=must-not-render');
}

describe('route error boundary', () => {
    beforeEach(() => {
        vi.mocked(recordException).mockClear();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => { vi.restoreAllMocks(); });

    it('assigns the route code and exposes a copyable diagnostic ID', () => {
        render(<ErrorBoundary code="UI_ROUTE_RENDER_FAILED" subsystem="UI"><BrokenRoute/></ErrorBoundary>);
        expect(recordException).toHaveBeenCalledWith(expect.any(Error), 'UI_ROUTE_RENDER_FAILED', 'UI', expect.any(String));
        expect(screen.getByText('diagnostic-test-id')).toBeInTheDocument();
        expect(screen.queryByText(/must-not-render/)).not.toBeInTheDocument();
    });
});
