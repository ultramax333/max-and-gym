import {SafeContext, SafeContextValue} from './types';

const SAFE_CONTEXT_KEYS = new Set([
    'recordCount', 'tableCount', 'schemaVersion', 'routeId', 'errorClass', 'byteSize',
    'elapsedMs', 'expectedVersion', 'actualVersion', 'capability', 'available', 'status',
    'workerState', 'cacheVersion', 'originCount', 'checkCount', 'failedCount',
]);

const SENSITIVE_VALUE = /(?:bearer\s+|token|secret|password|authorization|data:image|blob:|[A-Z]:\\|\/Users\/|\/home\/|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)/i;

export function redactText(value: unknown): string {
    if (value instanceof Error) return value.name || 'Error';
    if (typeof value !== 'string') return String(value ?? '');
    if (SENSITIVE_VALUE.test(value)) return '[REDACTED]';
    return value.slice(0, 160);
}

export function redactContext(input: Record<string, unknown> | undefined): SafeContext | undefined {
    if (!input) return undefined;
    const output: SafeContext = {};
    for (const [key, rawValue] of Object.entries(input)) {
        if (!SAFE_CONTEXT_KEYS.has(key)) continue;
        if (!['string', 'number', 'boolean'].includes(typeof rawValue) && rawValue !== null) continue;
        const value = rawValue as SafeContextValue;
        output[key] = typeof value === 'string' ? redactText(value) : value;
    }
    return Object.keys(output).length ? output : undefined;
}

export function safeErrorClass(error: unknown): string {
    return error instanceof Error ? redactText(error.name) : 'UnknownError';
}
