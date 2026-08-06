const URL_PATTERN = /https?:\/\/[^\s"'`<>)}]+/g;
const RUNTIME_MARKERS = /(?:<script|<iframe|<img|fetch\s*\(|XMLHttpRequest|WebSocket\s*\(|EventSource\s*\(|createClient\s*\()/i;
const TRACKING_ORIGIN = /(?:sentry\.io|alceris\.com|google-analytics\.com|segment\.com|mixpanel\.com)/i;

export function scanNetworkSource(source, file = 'fixture') {
    const urls = [...source.matchAll(URL_PATTERN)].map((match) => match[0]);
    const origins = [...new Set(urls.map((url) => {
        try { return new URL(url).origin; } catch { return 'invalid'; }
    }))];
    const lines = source.split(/\r?\n/);
    const forbidden = [];
    lines.forEach((line, index) => {
        if ((RUNTIME_MARKERS.test(line) && URL_PATTERN.test(line)) || TRACKING_ORIGIN.test(line)) {
            forbidden.push({file, line: index + 1, excerpt: line.trim().slice(0, 180)});
        }
        URL_PATTERN.lastIndex = 0;
    });
    return {origins, forbidden};
}
