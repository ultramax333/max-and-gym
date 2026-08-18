export function parseNonNegativeDecimal(value: string): number | undefined {
    if (value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function shouldInitializeNumericDraft(initializedSetId: string | undefined, currentSetId: string | undefined): boolean {
    return Boolean(currentSetId && initializedSetId !== currentSetId);
}
