declare module '../../scripts/audit-network-lib.mjs' {
    export function scanNetworkSource(source: string, file?: string): {
        origins: string[];
        forbidden: Array<{file: string; line: number; excerpt: string}>;
    };
}
