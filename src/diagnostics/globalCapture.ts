import {recordException} from './service';

export function installGlobalDiagnosticCapture(): () => void {
    const onError = (event: ErrorEvent) => {
        recordException(event.error, 'BOOT_UNHANDLED_ERROR', 'BOOT', 'An unexpected application error occurred.');
    };
    const onRejection = (event: PromiseRejectionEvent) => {
        recordException(event.reason, 'BOOT_UNHANDLED_ERROR', 'BOOT', 'An unexpected asynchronous error occurred.');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
    };
}
