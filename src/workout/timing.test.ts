import {describe, expect, it} from 'vitest';
import {learnExerciseTiming, estimatedSetSeconds, remainingPlanSeconds} from './timing';
import {ActiveWorkoutSnapshot, RestTimerRecord} from './types';

function history(paused = 0): ActiveWorkoutSnapshot & {timers: RestTimerRecord[]} {
    const base = Date.parse('2026-10-10T10:00:00Z');
    const stamp = (seconds: number) => new Date(base + seconds * 1000).toISOString();
    const session = {id:'s', creationOperationId:'start', nameSnapshot:'Synthetic', status:'completed' as const, startedAt:stamp(0), pausedDurationSeconds:paused, currentSessionExerciseId:'e', currentSetId:'3', createdAt:stamp(0), updatedAt:stamp(600)};
    const exercises = [{id:'e', sessionId:'s', exerciseId:'curl', exerciseNameSnapshot:'Synthetic curl', prescriptionSnapshot:'4 × 10', lockedSnapshot:false, alternativeExerciseIdsSnapshot:[], sequenceIndex:0, status:'completed' as const, createdAt:stamp(0), updatedAt:stamp(600)}];
    const sets = [0,1,2,3].map(index => ({id:String(index), sessionId:'s', sessionExerciseId:'e', sequenceIndex:index, status:'completed' as const, targetRepsMin:10, targetRepsMax:10, actualReps:10, targetLoadKg:0, targetRir:2, restSeconds:60, completedAt:stamp(100+index*160+paused), activeElapsedAtCompletionSeconds:100+index*160, createdAt:stamp(0), updatedAt:stamp(600)}));
    const timers = sets.map(set => ({id:`t${set.id}`,sessionId:'s',performedSetId:set.id,startedAt:set.completedAt,endsAt:stamp(Date.parse(set.completedAt)/1000-base/1000+60),status:'completed' as const,durationSeconds:60,activeElapsedAtStartSeconds:set.activeElapsedAtCompletionSeconds,createdAt:set.completedAt,updatedAt:set.completedAt}));
    return {session,exercises,sets,timers};
}

describe('personal exercise timing', () => {
    it('learns slower per-exercise pace after three samples, preserving recovery separately', () => {
        const profiles = learnExerciseTiming([history()]);
        expect(profiles[0]).toMatchObject({exerciseId:'curl',sampleCount:3,meanSecondsPerSet:100});
        expect(estimatedSetSeconds('curl',10,profiles)).toBeGreaterThan(40);
        expect(estimatedSetSeconds('unseen',10,profiles)).toBe(40);
    });
    it('excludes workout pauses using active elapsed snapshots and skips ambiguous old paused history', () => {
        expect(learnExerciseTiming([history(600)])).toEqual(learnExerciseTiming([history()]));
        const old = history(600);
        old.sets.forEach(set => delete set.activeElapsedAtCompletionSeconds);
        expect(learnExerciseTiming([old])).toEqual([]);
    });
    it('does not learn from too few samples, abandoned sessions, supersets or long interruptions', () => {
        const sparse = history(); sparse.sets = sparse.sets.slice(0,2);
        expect(learnExerciseTiming([sparse])).toEqual([]);
        const grouped = history(); grouped.exercises[0].groupIdSnapshot = 'pair';
        expect(learnExerciseTiming([grouped])).toEqual([]);
        const abandoned = history(); abandoned.session.status = 'abandoned';
        expect(learnExerciseTiming([abandoned])).toEqual([]);
        const missingTimers = history(); missingTimers.timers = [];
        expect(learnExerciseTiming([missingTimers])).toEqual([]);
        const outlier = history(); outlier.sets[1].activeElapsedAtCompletionSeconds = 20000;
        expect(learnExerciseTiming([outlier])).toEqual([]);
    });
    it('recalculates the remaining duration after changing a set or repetitions', () => {
        const snapshot = history(); snapshot.sets.forEach(set => {set.status='planned';});
        expect(remainingPlanSeconds(snapshot)).toBe(340);
        snapshot.sets.pop();
        expect(remainingPlanSeconds(snapshot)).toBe(240);
        snapshot.sets.forEach(set => {set.targetRepsMin=5;set.targetRepsMax=5;});
        expect(remainingPlanSeconds(snapshot)).toBe(210);
    });
    it('does not count elapsed time in the current set a second time in the live forecast', () => {
        const snapshot=history(); snapshot.sets.forEach(set=>{set.status='planned';});
        expect(remainingPlanSeconds(snapshot,[],0,20)).toBe(320);
        expect(remainingPlanSeconds(snapshot,[],0,500)).toBe(300);
    });
    it('does not credit work during recovery, or forecast recovery after all work is complete', () => {
        const snapshot=history(); snapshot.sets.forEach(set=>{set.status='planned';});
        expect(remainingPlanSeconds(snapshot,[],30,500)).toBe(370);
        expect(remainingPlanSeconds(history(),[],30,700)).toBe(0);
    });
});
