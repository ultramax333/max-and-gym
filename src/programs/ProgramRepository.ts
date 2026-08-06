import {DexieDB} from '../db/db';
import {AddProgramExerciseInput, CreateProgramInput, ExerciseGroupType, ExercisePrescriptionRecord, ProgramDayDetail, ProgramDetail, ProgramExerciseDetail, ProgramExerciseRecord, ProgressionRuleRecord, TrainingProgramRecord} from './types';

export class ProgramDomainError extends Error {
    constructor(public readonly code: 'PROGRAM_NOT_FOUND' | 'PROGRAM_INVALID_FREQUENCY' | 'PROGRAM_INVALID_GROUP' | 'PROGRAM_EMPTY_DAY', message: string) {
        super(message);
        this.name = 'ProgramDomainError';
    }
}

interface ProgramClock { now: () => Date; id: () => string }
const defaultClock: ProgramClock = {now: () => new Date(), id: () => globalThis.crypto?.randomUUID?.() ?? `program-${Date.now()}-${Math.random().toString(16).slice(2)}`};

export class ProgramRepository {
    constructor(private readonly db: DexieDB, private readonly clock: ProgramClock = defaultClock) {}

    private iso(): string { return this.clock.now().toISOString(); }

    async list(): Promise<TrainingProgramRecord[]> {
        return (await this.db.trainingProgram.toArray()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    async get(programId: string): Promise<ProgramDetail | undefined> {
        const program = await this.db.trainingProgram.get(programId);
        if (!program) return undefined;
        const days = await this.db.programDay.where('programId').equals(programId).sortBy('sequenceIndex');
        const detailedDays: ProgramDayDetail[] = [];
        for (const day of days) {
            const rows = await this.db.programExercise.where('programDayId').equals(day.id).sortBy('sequenceIndex');
            const exercises: ProgramExerciseDetail[] = [];
            for (const row of rows) {
                const [prescription, progressionRule] = await Promise.all([this.db.exercisePrescription.get(row.prescriptionId), this.db.progressionRule.get(row.progressionRuleId)]);
                if (prescription && progressionRule) exercises.push({...row, prescription, progressionRule});
            }
            detailedDays.push({...day, exercises});
        }
        return {...program, days: detailedDays};
    }

    async create(input: CreateProgramInput): Promise<ProgramDetail> {
        if (![2, 3].includes(input.weeklyFrequency)) throw new ProgramDomainError('PROGRAM_INVALID_FREQUENCY', 'A program must contain two or three days.');
        const now = this.iso();
        const id = this.clock.id();
        const program: TrainingProgramRecord = {id, name: input.name.trim() || 'Mon programme', description: '', source: 'manual', status: 'draft', weeklyFrequency: input.weeklyFrequency, defaultDurationMinutes: input.defaultDurationMinutes, currentDayIndex: 0, createdAt: now, updatedAt: now};
        const days = Array.from({length: input.weeklyFrequency}, (_, sequenceIndex) => ({id: this.clock.id(), programId: id, name: `Jour ${String.fromCharCode(65 + sequenceIndex)}`, sequenceIndex, emphasis: 'Full body', targetDurationMinutes: input.defaultDurationMinutes, warmupSeconds: input.defaultDurationMinutes === 40 ? 300 : 420, conditioningSeconds: 0, notes: ''} as const));
        await this.db.transaction('rw', [this.db.trainingProgram, this.db.programDay], () => this.db.trainingProgram.add(program).then(() => this.db.programDay.bulkAdd(days)));
        return (await this.get(id))!;
    }

    async updateProgram(programId: string, change: Partial<Pick<TrainingProgramRecord, 'name' | 'description'>>): Promise<ProgramDetail> {
        if (!(await this.db.trainingProgram.update(programId, {...change, updatedAt: this.iso()}))) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program not found.');
        return (await this.get(programId))!;
    }

    async updateDay(dayId: string, change: Partial<Pick<ProgramDayDetail, 'name' | 'emphasis' | 'warmupSeconds' | 'conditioningSeconds' | 'notes'>>): Promise<void> {
        if (!(await this.db.programDay.update(dayId, change))) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program day not found.');
    }

    async addExercise(input: AddProgramExerciseInput): Promise<ProgramExerciseDetail> {
        const day = await this.db.programDay.get(input.dayId);
        if (!day) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program day not found.');
        const now = this.iso();
        const [id, prescriptionId, progressionRuleId] = [this.clock.id(), this.clock.id(), this.clock.id()];
        const count = await this.db.programExercise.where('programDayId').equals(day.id).count();
        const prescription: ExercisePrescriptionRecord = {id: prescriptionId, workingSets: 3, repsMin: input.defaultReps.min, repsMax: input.defaultReps.max, targetRir: 2, restSeconds: input.defaultRestSeconds, loadReferenceKg: 0};
        const progressionRule: ProgressionRuleRecord = {id: progressionRuleId, kind: 'double-progression', description: 'Augmenter la charge après réussite de toutes les séries dans la fourchette.', requiresApproval: true};
        const exercise: ProgramExerciseRecord = {id, programDayId: day.id, exerciseId: input.exerciseId, exerciseNameSnapshot: input.exerciseName, movementPatternSnapshot: input.movementPattern, primaryMusclesSnapshot: input.primaryMuscles, sequenceIndex: count, role: count < 2 ? 'primary' : 'secondary', groupType: 'single', groupSequenceIndex: 0, locked: false, alternativeExerciseIds: [], prescriptionId, progressionRuleId, notes: ''};
        await this.db.transaction('rw', [this.db.programExercise, this.db.exercisePrescription, this.db.progressionRule, this.db.trainingProgram], async () => {
            await this.db.exercisePrescription.add(prescription);
            await this.db.progressionRule.add(progressionRule);
            await this.db.programExercise.add(exercise);
            await this.db.trainingProgram.update(day.programId, {updatedAt: now});
        });
        return {...exercise, prescription, progressionRule};
    }

    async updateExercise(exerciseId: string, change: Partial<Pick<ProgramExerciseRecord, 'role' | 'locked' | 'stableUntil' | 'alternativeExerciseIds' | 'notes'>>): Promise<void> {
        if (!(await this.db.programExercise.update(exerciseId, change))) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program exercise not found.');
    }

    async updatePrescription(id: string, change: Partial<Omit<ExercisePrescriptionRecord, 'id'>>): Promise<void> {
        if (!(await this.db.exercisePrescription.update(id, change))) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Prescription not found.');
    }

    async moveExercise(exerciseId: string, direction: -1 | 1): Promise<void> {
        const exercise = await this.db.programExercise.get(exerciseId);
        if (!exercise) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program exercise not found.');
        const rows = await this.db.programExercise.where('programDayId').equals(exercise.programDayId).sortBy('sequenceIndex');
        const nextIndex = exercise.sequenceIndex + direction;
        const swap = rows.find((entry) => entry.sequenceIndex === nextIndex);
        if (!swap) return;
        await this.db.transaction('rw', this.db.programExercise, async () => {
            await this.db.programExercise.update(exercise.id, {sequenceIndex: -1});
            await this.db.programExercise.update(swap.id, {sequenceIndex: exercise.sequenceIndex});
            await this.db.programExercise.update(exercise.id, {sequenceIndex: nextIndex});
        });
    }

    async removeExercise(exerciseId: string): Promise<void> {
        const exercise = await this.db.programExercise.get(exerciseId);
        if (!exercise) return;
        await this.db.transaction('rw', [this.db.programExercise, this.db.exercisePrescription, this.db.progressionRule], async () => {
            await this.db.programExercise.delete(exercise.id);
            await this.db.exercisePrescription.delete(exercise.prescriptionId);
            await this.db.progressionRule.delete(exercise.progressionRuleId);
            const remaining = await this.db.programExercise.where('programDayId').equals(exercise.programDayId).sortBy('sequenceIndex');
            await Promise.all(remaining.map((entry, index) => this.db.programExercise.update(entry.id, {sequenceIndex: index})));
        });
    }

    async groupExercises(dayId: string, exerciseIds: string[], groupType: ExerciseGroupType): Promise<void> {
        const rows = await this.db.programExercise.where('programDayId').equals(dayId).sortBy('sequenceIndex');
        const selected = rows.filter((entry) => exerciseIds.includes(entry.id));
        const expected = groupType === 'superset' ? 2 : groupType === 'triset' ? 3 : exerciseIds.length;
        const consecutive = selected.every((entry, index) => index === 0 || entry.sequenceIndex === selected[index - 1].sequenceIndex + 1);
        if (selected.length !== expected || (groupType !== 'single' && !consecutive)) throw new ProgramDomainError('PROGRAM_INVALID_GROUP', 'Only consecutive exercises can form the selected group.');
        const groupId = groupType === 'single' ? undefined : this.clock.id();
        await this.db.transaction('rw', this.db.programExercise, async () => Promise.all(selected.map((entry, index) => this.db.programExercise.update(entry.id, {groupId, groupType, groupSequenceIndex: index}))));
    }

    async activate(programId: string): Promise<ProgramDetail> {
        const program = await this.get(programId);
        if (!program) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program not found.');
        if (program.days.some((day) => !day.exercises.length)) throw new ProgramDomainError('PROGRAM_EMPTY_DAY', 'Every day needs at least one exercise before activation.');
        const now = this.iso();
        await this.db.transaction('rw', this.db.trainingProgram, async () => {
            await this.db.trainingProgram.where('status').equals('active').modify({status: 'draft', updatedAt: now});
            await this.db.trainingProgram.update(programId, {status: 'active', archivedAt: undefined, updatedAt: now});
        });
        return (await this.get(programId))!;
    }

    async archive(programId: string): Promise<void> {
        await this.db.trainingProgram.update(programId, {status: 'archived', archivedAt: this.iso(), updatedAt: this.iso()});
    }

    async duplicate(programId: string): Promise<ProgramDetail> {
        const source = await this.get(programId);
        if (!source) throw new ProgramDomainError('PROGRAM_NOT_FOUND', 'Program not found.');
        const copy = await this.create({name: `${source.name} — copie`, weeklyFrequency: source.weeklyFrequency, defaultDurationMinutes: source.defaultDurationMinutes});
        for (const [dayIndex, day] of source.days.entries()) {
            const targetDay = copy.days[dayIndex];
            await this.db.programDay.update(targetDay.id, {name: day.name, emphasis: day.emphasis, notes: day.notes, warmupSeconds: day.warmupSeconds, conditioningSeconds: day.conditioningSeconds});
            for (const exercise of day.exercises) {
                const created = await this.addExercise({dayId: targetDay.id, exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseNameSnapshot, movementPattern: exercise.movementPatternSnapshot, primaryMuscles: exercise.primaryMusclesSnapshot, defaultRestSeconds: exercise.prescription.restSeconds, defaultReps: {min: exercise.prescription.repsMin, max: exercise.prescription.repsMax}});
                const {id: ignoredPrescriptionId, ...prescriptionChange} = exercise.prescription;
                void ignoredPrescriptionId;
                await this.updatePrescription(created.prescriptionId, prescriptionChange);
                await this.updateExercise(created.id, {role: exercise.role, locked: exercise.locked, stableUntil: exercise.stableUntil, alternativeExerciseIds: [...exercise.alternativeExerciseIds], notes: exercise.notes});
            }
        }
        return (await this.get(copy.id))!;
    }

    async active(): Promise<ProgramDetail | undefined> {
        const record = await this.db.trainingProgram.where('status').equals('active').first();
        return record ? this.get(record.id) : undefined;
    }

    async importLegacyPlans(): Promise<number> {
        if (await this.db.trainingProgram.count()) return 0;
        const plans = await this.db.plan.toArray();
        let imported = 0;
        for (const plan of plans.filter((entry) => !entry.deleted && entry.workoutIds.length >= 2 && entry.workoutIds.length <= 3)) {
            const detail = await this.create({name: plan.name, weeklyFrequency: plan.workoutIds.length as 2 | 3, defaultDurationMinutes: 60});
            await this.db.trainingProgram.update(detail.id, {source: 'legacy'});
            const workouts = await this.db.workout.bulkGet(plan.workoutIds);
            await Promise.all(detail.days.map((day, index) => this.db.programDay.update(day.id, {name: workouts[index]?.name ?? day.name})));
            for (const [dayIndex, legacyWorkout] of workouts.entries()) {
                if (!legacyWorkout) continue;
                const legacyRows = await this.db.workoutExercise.bulkGet(legacyWorkout.workoutExerciseIds);
                for (const legacyRow of legacyRows) {
                    if (!legacyRow) continue;
                    const [legacyExercise, legacySets] = await Promise.all([this.db.exercise.get(legacyRow.exerciseId), this.db.exerciseSet.bulkGet(legacyRow.setIds)]);
                    if (!legacyExercise) continue;
                    const workingSets = legacySets.filter((entry) => entry && entry.initial !== false);
                    const reps = workingSets[0]?.reps ?? 8;
                    const created = await this.addExercise({dayId: detail.days[dayIndex].id, exerciseId: `legacy:${legacyExercise.id}`, exerciseName: legacyExercise.name, movementPattern: 'legacy', primaryMuscles: [], defaultRestSeconds: workingSets[0]?.rest ?? 90, defaultReps: {min: reps, max: reps}});
                    await this.updatePrescription(created.prescriptionId, {workingSets: Math.max(1, workingSets.length)});
                }
            }
            imported++;
        }
        return imported;
    }
}
