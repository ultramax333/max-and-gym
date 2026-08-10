import {Capacitor, registerPlugin} from '@capacitor/core';

interface NativeBackupDocumentPlugin {
    beginStage(options: {fileName: string; size: number}): Promise<{token: string}>;
    appendStage(options: {token: string; offset: number; base64Data: string}): Promise<{nextOffset: number}>;
    commitStage(options: {token: string; fileName: string; size: number}): Promise<{cancelled: boolean}>;
    abortStage(options: {token: string}): Promise<void>;
}

const NativeBackupDocument = registerPlugin<NativeBackupDocumentPlugin>('BackupDocument');
const CHUNK_BYTES = 256 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
}

export const backupDocumentGateway = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async save(blob: Blob, fileName: string): Promise<boolean> {
        if (!this.isNativeAndroid()) throw new Error('The Android document picker is only available in the installed app.');
        const {token} = await NativeBackupDocument.beginStage({fileName, size: blob.size});
        try {
            let offset = 0;
            while (offset < blob.size) {
                const bytes = new Uint8Array(await blob.slice(offset, offset + CHUNK_BYTES).arrayBuffer());
                const result = await NativeBackupDocument.appendStage({token, offset, base64Data: bytesToBase64(bytes)});
                offset = result.nextOffset;
            }
            const result = await NativeBackupDocument.commitStage({token, fileName, size: blob.size});
            return !result.cancelled;
        } catch (error) {
            await NativeBackupDocument.abortStage({token}).catch(() => undefined);
            throw error;
        }
    },
};
