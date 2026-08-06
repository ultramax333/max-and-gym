import {DiagnosticEvent} from './types';

export const MAX_DIAGNOSTIC_EVENTS = 1000;
export const MAX_DIAGNOSTIC_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function retainDiagnosticEvents(events: DiagnosticEvent[], now = Date.now()): DiagnosticEvent[] {
    const oldest = now - MAX_DIAGNOSTIC_AGE_MS;
    return [...events]
        .filter((event) => Date.parse(event.timestamp) >= oldest)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, MAX_DIAGNOSTIC_EVENTS);
}
