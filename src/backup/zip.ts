const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface ZipEntry {path: string; bytes: Uint8Array}

export class ArchiveError extends Error {
    constructor(public readonly code: 'ARCHIVE_PATH_INVALID' | 'ARCHIVE_FORMAT_INVALID' | 'ARCHIVE_CHECKSUM_INVALID' | 'ARCHIVE_LIMIT_EXCEEDED', message: string) { super(message); this.name = 'ArchiveError'; }
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function safePath(path: string): void {
    if (!path || path.length > 240 || path.startsWith('/') || path.startsWith('\\') || /^[a-z]:/i.test(path) || path.split(/[\\/]/).includes('..') || path.includes('\\') || /\0/.test(path)) throw new ArchiveError('ARCHIVE_PATH_INVALID', 'Unsafe archive path.');
}

function u16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value >>> 0, true); }

export function encodeZip(entries: ZipEntry[]): Uint8Array {
    if (entries.length > 2000) throw new ArchiveError('ARCHIVE_LIMIT_EXCEEDED', 'Too many files.');
    const seen = new Set<string>();
    const locals: Uint8Array[] = [];
    const centrals: Uint8Array[] = [];
    let offset = 0;
    for (const entry of entries) {
        safePath(entry.path);
        if (seen.has(entry.path)) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Duplicate path.');
        seen.add(entry.path);
        const name = encoder.encode(entry.path);
        const crc = crc32(entry.bytes);
        const local = new Uint8Array(30 + name.length + entry.bytes.length);
        const localView = new DataView(local.buffer);
        u32(localView, 0, 0x04034b50); u16(localView, 4, 20); u16(localView, 6, 0x0800); u16(localView, 8, 0);
        u32(localView, 14, crc); u32(localView, 18, entry.bytes.length); u32(localView, 22, entry.bytes.length); u16(localView, 26, name.length);
        local.set(name, 30); local.set(entry.bytes, 30 + name.length); locals.push(local);
        const central = new Uint8Array(46 + name.length);
        const centralView = new DataView(central.buffer);
        u32(centralView, 0, 0x02014b50); u16(centralView, 4, 20); u16(centralView, 6, 20); u16(centralView, 8, 0x0800); u16(centralView, 10, 0);
        u32(centralView, 16, crc); u32(centralView, 20, entry.bytes.length); u32(centralView, 24, entry.bytes.length); u16(centralView, 28, name.length); u32(centralView, 42, offset);
        central.set(name, 46); centrals.push(central); offset += local.length;
    }
    const centralSize = centrals.reduce((total, entry) => total + entry.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    u32(endView, 0, 0x06054b50); u16(endView, 8, entries.length); u16(endView, 10, entries.length); u32(endView, 12, centralSize); u32(endView, 16, offset);
    const output = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    for (const entry of [...locals, ...centrals, end]) { output.set(entry, cursor); cursor += entry.length; }
    return output;
}

export function decodeZip(input: ArrayBuffer | Uint8Array, limits = {maxFiles: 2000, maxBytes: 256 * 1024 * 1024}): ZipEntry[] {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.length < 22 || bytes.length > limits.maxBytes) throw new ArchiveError('ARCHIVE_LIMIT_EXCEEDED', 'Archive is empty or too large.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let endOffset = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) if (view.getUint32(offset, true) === 0x06054b50) { endOffset = offset; break; }
    if (endOffset < 0) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Missing ZIP end record.');
    const count = view.getUint16(endOffset + 10, true);
    const centralOffset = view.getUint32(endOffset + 16, true);
    if (count > limits.maxFiles) throw new ArchiveError('ARCHIVE_LIMIT_EXCEEDED', 'Too many files.');
    const entries: ZipEntry[] = [];
    const seen = new Set<string>();
    let cursor = centralOffset;
    let expanded = 0;
    for (let index = 0; index < count; index++) {
        if (cursor + 46 > endOffset || view.getUint32(cursor, true) !== 0x02014b50) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Invalid ZIP directory.');
        const method = view.getUint16(cursor + 10, true);
        const expectedCrc = view.getUint32(cursor + 16, true);
        const size = view.getUint32(cursor + 24, true);
        const nameLength = view.getUint16(cursor + 28, true);
        const extraLength = view.getUint16(cursor + 30, true);
        const commentLength = view.getUint16(cursor + 32, true);
        const localOffset = view.getUint32(cursor + 42, true);
        if (method !== 0 || cursor + 46 + nameLength + extraLength + commentLength > endOffset) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Unsupported ZIP compression.');
        const path = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
        safePath(path);
        if (seen.has(path)) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Duplicate path.');
        seen.add(path);
        if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Invalid local ZIP entry.');
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
        if (dataOffset + size > bytes.length) throw new ArchiveError('ARCHIVE_FORMAT_INVALID', 'Truncated ZIP entry.');
        const data = bytes.slice(dataOffset, dataOffset + size);
        if (crc32(data) !== expectedCrc) throw new ArchiveError('ARCHIVE_CHECKSUM_INVALID', 'Invalid ZIP CRC.');
        expanded += data.length;
        if (expanded > limits.maxBytes) throw new ArchiveError('ARCHIVE_LIMIT_EXCEEDED', 'Expanded archive is too large.');
        entries.push({path, bytes: data});
        cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}
