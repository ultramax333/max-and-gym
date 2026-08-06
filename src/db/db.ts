/*
    This file is part of RepQuest.

    RepQuest is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RepQuest is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with RepQuest.  If not, see <https://www.gnu.org/licenses/>.
 */
import Dexie, {Table} from 'dexie';
import {Exercise} from "../models/exercise";
import {ExerciseSet, Plan, Workout, WorkoutExercise} from "../models/workout";
import {UserMetric} from "../models/user";
import {PerformedSetRecord, RestTimerRecord, SessionExerciseRecord, WorkoutOperationRecord, WorkoutSessionRecord} from '../workout/types';
import {CustomExerciseRecord, ExercisePreference, ReviewedExercise} from '../exerciseCatalog/types';
import {ExercisePrescriptionRecord, ProgramDayRecord, ProgramExerciseRecord, ProgressionRuleRecord, TrainingProgramRecord} from '../programs/types';

export class DexieDB extends Dexie {
    exercise!: Table<Exercise>;
    workout!: Table<Workout>;
    workoutExercise!: Table<WorkoutExercise>;
    exerciseSet!: Table<ExerciseSet>;
    userMetric!: Table<UserMetric>;
    plan!: Table<Plan>;
    workoutSession!: Table<WorkoutSessionRecord, string>;
    sessionExercise!: Table<SessionExerciseRecord, string>;
    performedSet!: Table<PerformedSetRecord, string>;
    restTimer!: Table<RestTimerRecord, string>;
    workoutOperation!: Table<WorkoutOperationRecord, string>;
    exerciseCatalog!: Table<ReviewedExercise, string>;
    exercisePreference!: Table<ExercisePreference, string>;
    customExercise!: Table<CustomExerciseRecord, string>;
    trainingProgram!: Table<TrainingProgramRecord, string>;
    programDay!: Table<ProgramDayRecord, string>;
    programExercise!: Table<ProgramExerciseRecord, string>;
    exercisePrescription!: Table<ExercisePrescriptionRecord, string>;
    progressionRule!: Table<ProgressionRuleRecord, string>;
    constructor() {
        const maybeUser = localStorage.getItem("userName");
        super(maybeUser && maybeUser !== "Default User" ? `weightlog-${maybeUser}` : 'weightlog');
        this.version(2).stores({
            exercise: "++id, name, type, *tags",
            workout: "++id, name",
            workoutHistory: "++id, userName, date, workoutExerciseIds",
            workoutExercise: "++id, exerciseId, setIds",
            exerciseSet: "++id, exerciseId, type",
            user: "++name",
            userMetric: "++id",
            plan: "++id, workoutId, name"
        });
        this.version(3).stores({
            exercise: "++id, name, type, *tags",
            workout: "++id, name",
            workoutHistory: "++id, userName, date, workoutExerciseIds",
            workoutExercise: "++id, exerciseId, setIds",
            exerciseSet: "++id, exerciseId, type",
            user: "++name",
            userMetric: "++id, metric",
            plan: "++id, workoutId, name"
        });
        this.version(4).stores({
            exercise: "++id, name, type, *tags",
            workout: "++id, name",
            workoutHistory: "++id, userName, date, workoutExerciseIds",
            workoutExercise: "++id, exerciseId, setIds",
            exerciseSet: "++id, exerciseId, type",
            user: "++name",
            userMetric: "++id, metric",
            plan: "++id, workoutId, name",
            workoutSession: "&id, status, startedAt, updatedAt, creationOperationId, finishOperationId",
            sessionExercise: "&id, sessionId, [sessionId+sequenceIndex], status",
            performedSet: "&id, sessionId, sessionExerciseId, [sessionExerciseId+sequenceIndex], completionOperationId, undoOperationId, status",
            restTimer: "&id, sessionId, status, endsAt",
            workoutOperation: "&operationId, kind, status, sessionId, startedAt"
        });
        this.version(5).stores({
            exercise: "++id, name, type, *tags",
            workout: "++id, name",
            workoutHistory: "++id, userName, date, workoutExerciseIds",
            workoutExercise: "++id, exerciseId, setIds",
            exerciseSet: "++id, exerciseId, type",
            user: "++name",
            userMetric: "++id, metric",
            plan: "++id, workoutId, name",
            workoutSession: "&id, status, startedAt, updatedAt, creationOperationId, finishOperationId",
            sessionExercise: "&id, sessionId, [sessionId+sequenceIndex], status",
            performedSet: "&id, sessionId, sessionExerciseId, [sessionExerciseId+sequenceIndex], completionOperationId, undoOperationId, status",
            restTimer: "&id, sessionId, status, endsAt",
            workoutOperation: "&operationId, kind, status, sessionId, startedAt",
            exerciseCatalog: "&id, sourceId, sourceRevision, name, contentStatus, generatorEligible, *equipmentTags, *primaryMuscles, *positionTags",
            exercisePreference: "&exerciseId, favourite, neverSuggest, updatedAt",
            customExercise: "&id, name, contentStatus, generatorEligible, *equipmentTags, *primaryMuscles"
        });
        this.version(6).stores({
            trainingProgram: "&id, status, updatedAt",
            programDay: "&id, programId, [programId+sequenceIndex]",
            programExercise: "&id, programDayId, [programDayId+sequenceIndex], exerciseId, groupId",
            exercisePrescription: "&id",
            progressionRule: "&id"
        });
    }
}

export const db = new DexieDB();
