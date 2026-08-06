export function safeMediaSource(source: string | undefined): string | undefined {
    if (!source) return undefined;
    if (source.startsWith('data:image/') || source.startsWith('blob:')) return source;
    try {
        const url = new URL(source, window.location.href);
        return url.origin === window.location.origin ? url.href : undefined;
    } catch {
        return undefined;
    }
}
