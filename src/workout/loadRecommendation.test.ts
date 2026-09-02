import {recommendExerciseLoad} from './loadRecommendation';

const session = (
    sessionId: string,
    sets: Array<{loadKg: number; reps: number; rir?: number}>,
    performedAt = '2026-08-20T10:00:00.000Z',
) => ({sessionId, sessionName: 'Anonymous session', performedAt, suggestedLoadKg: sets.at(-1)?.loadKg ?? 0, sets});

describe('recommendExerciseLoad', () => {
    it('requests a calibration set instead of inventing an absolute load', () => {
        const recommendation = recommendExerciseLoad({repsMin: 8, repsMax: 12, targetRir: 2, history: []});
        expect(recommendation).toEqual(expect.objectContaining({
            status: 'calibration',
            confidence: 'none',
        }));
        expect(recommendation.suggestedLoadKg).toBeUndefined();
    });

    it('converts a recent performance into a goal-specific load range', () => {
        const recommendation = recommendExerciseLoad({
            repsMin: 4,
            repsMax: 6,
            targetRir: 2,
            incrementKg: 0.5,
            history: [session('one', [{loadKg: 12, reps: 10, rir: 2}, {loadKg: 12, reps: 10, rir: 2}])],
        });

        expect(recommendation).toEqual(expect.objectContaining({
            status: 'recommended',
            confidence: 'medium',
            loadMinKg: 13.5,
            loadMaxKg: 14,
            suggestedLoadKg: 13.5,
            evidenceSetCount: 2,
            evidenceSessionCount: 1,
        }));
        expect(recommendation.estimatedOneRepMaxKg).toBeCloseTo(16.8, 1);
    });

    it('keeps the latest load when it already falls inside the target range', () => {
        const recommendation = recommendExerciseLoad({
            repsMin: 8,
            repsMax: 12,
            targetRir: 2,
            history: [session('one', [{loadKg: 22, reps: 9, rir: 2}, {loadKg: 22, reps: 9, rir: 2}])],
        });

        expect(recommendation.suggestedLoadKg).toBe(22);
    });

    it('raises confidence only with comparable explicit-RIR evidence across sessions', () => {
        const recommendation = recommendExerciseLoad({
            repsMin: 8,
            repsMax: 12,
            targetRir: 2,
            history: [
                session('new', [{loadKg: 20, reps: 10, rir: 2}, {loadKg: 20, reps: 10, rir: 2}], '2026-08-20T10:00:00.000Z'),
                session('old', [{loadKg: 19.5, reps: 11, rir: 2}, {loadKg: 19.5, reps: 10, rir: 2}], '2026-08-13T10:00:00.000Z'),
            ],
        });

        expect(recommendation.confidence).toBe('high');
        expect(recommendation.evidenceSessionCount).toBe(2);
    });

    it('marks high-repetition or missing-RIR evidence as low confidence', () => {
        const highRepetition = recommendExerciseLoad({
            repsMin: 15,
            repsMax: 25,
            targetRir: 2,
            history: [session('one', [{loadKg: 10, reps: 22, rir: 2}])],
        });
        const missingRir = recommendExerciseLoad({
            repsMin: 8,
            repsMax: 12,
            targetRir: 2,
            history: [session('one', [{loadKg: 10, reps: 10}])],
        });

        expect(highRepetition).toEqual(expect.objectContaining({status: 'recommended', confidence: 'low'}));
        expect(missingRir).toEqual(expect.objectContaining({status: 'recommended', confidence: 'low'}));
    });

    it('does not calculate kilogram advice from bodyweight-only evidence', () => {
        expect(recommendExerciseLoad({
            repsMin: 8,
            repsMax: 12,
            targetRir: 2,
            history: [session('one', [{loadKg: 0, reps: 12, rir: 2}])],
        }).status).toBe('calibration');
    });
});
