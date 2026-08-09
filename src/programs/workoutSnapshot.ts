import {ProgramDayDetail, ProgramExerciseDetail} from './types';
import {StartWorkoutInput} from '../workout/types';
import {GeneratedDay, GeneratedProgram} from '../generator/types';

function exerciseSnapshot(entry: ProgramExerciseDetail): StartWorkoutInput['exercises'][number] {
    const scheme = entry.prescription.setScheme ?? 'straight';
    const warmupSets = entry.prescription.warmupSets ?? 0;
    const dropSets = entry.prescription.dropSets ?? 0;
    const extras = [warmupSets ? `${warmupSets} warm-up` : '', dropSets ? `${dropSets} drop` : ''].filter(Boolean).join(' · ');
    return {
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseNameSnapshot,
        prescriptionSnapshot: `${entry.prescription.workingSets} × ${entry.prescription.repsMin}–${entry.prescription.repsMax} · ${scheme}${extras ? ` · ${extras}` : ''} · rest ${entry.prescription.restSeconds} s · RIR ${entry.prescription.targetRir}`,
        programExerciseId: entry.id,
        workingSets: entry.prescription.workingSets,
        repsMin: entry.prescription.repsMin,
        repsMax: entry.prescription.repsMax,
        targetLoadKg: entry.prescription.loadReferenceKg,
        targetRir: entry.prescription.targetRir,
        restSeconds: entry.prescription.restSeconds,
        locked: entry.locked,
        alternativeExerciseIds: entry.alternativeExerciseIds,
        groupId: entry.groupId,
        groupType: entry.groupType,
        groupSequenceIndex: entry.groupSequenceIndex,
        setScheme: scheme,
        warmupSets,
        dropSets,
    };
}

export function programDayWorkoutInput(programName: string, day: ProgramDayDetail): StartWorkoutInput {
    return {
        name: `${programName} · ${day.name}`,
        programId: day.programId,
        programDayId: day.id,
        exercises: day.exercises.map(exerciseSnapshot),
    };
}

export function generatedSessionWorkoutInput(program: GeneratedProgram, day: GeneratedDay = program.days[0]): StartWorkoutInput {
    return {
        name: `${program.name} · ${day.name}`,
        exercises: day.exercises.map((entry) => ({
            exerciseId: entry.exerciseId,
            exerciseName: entry.exerciseName,
            prescriptionSnapshot: `${entry.prescription.workingSets} × ${entry.prescription.repsMin}–${entry.prescription.repsMax} · rest ${entry.prescription.restSeconds} s · RIR ${entry.prescription.targetRir}`,
            workingSets: entry.prescription.workingSets,
            repsMin: entry.prescription.repsMin,
            repsMax: entry.prescription.repsMax,
            targetLoadKg: entry.prescription.loadReferenceKg,
            targetRir: entry.prescription.targetRir,
            restSeconds: entry.prescription.restSeconds,
            locked: entry.locked,
            alternativeExerciseIds: entry.alternativeExerciseIds,
            setScheme: entry.prescription.setScheme ?? 'straight',
            warmupSets: entry.prescription.warmupSets ?? 0,
            dropSets: entry.prescription.dropSets ?? 0,
        })),
    };
}
