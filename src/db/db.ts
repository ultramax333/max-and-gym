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
import {ProgressionProposalRecord} from '../progression/types';
import {AppMetaRecord, BodyMeasurementRecord, MediaBlobRecord, OperationJournalRecord, ProgressPhotoRecord, SafetySnapshotRecord} from '../progress/types';

const schema2 = {
    exercise: "++id, name, type, *tags", workout: "++id, name", workoutHistory: "++id, userName, date, workoutExerciseIds",
    workoutExercise: "++id, exerciseId, setIds", exerciseSet: "++id, exerciseId, type", user: "++name",
    userMetric: "++id", plan: "++id, workoutId, name",
};
const schema3 = {...schema2, userMetric: "++id, metric"};
const schema4 = {...schema3,
    workoutSession: "&id, status, startedAt, updatedAt, creationOperationId, finishOperationId",
    sessionExercise: "&id, sessionId, [sessionId+sequenceIndex], status",
    performedSet: "&id, sessionId, sessionExerciseId, [sessionExerciseId+sequenceIndex], completionOperationId, undoOperationId, status",
    restTimer: "&id, sessionId, status, endsAt", workoutOperation: "&operationId, kind, status, sessionId, startedAt",
};
const schema5 = {...schema4,
    exerciseCatalog: "&id, sourceId, sourceRevision, name, contentStatus, generatorEligible, *equipmentTags, *primaryMuscles, *positionTags",
    exercisePreference: "&exerciseId, favourite, neverSuggest, updatedAt",
    customExercise: "&id, name, contentStatus, generatorEligible, *equipmentTags, *primaryMuscles",
};
const schema6 = {...schema5,
    trainingProgram: "&id, status, updatedAt", programDay: "&id, programId, [programId+sequenceIndex]",
    programExercise: "&id, programDayId, [programDayId+sequenceIndex], exerciseId, groupId", exercisePrescription: "&id", progressionRule: "&id",
};
const schema7 = {...schema6, progressionProposal: "&id, status, sessionId, programId, programExerciseId, createdAt"};
const schema8 = {...schema7,
    bodyMeasurement: "&id, type, recordedAt, [type+recordedAt]", mediaBlob: "&id, purpose, checksum, createdAt",
    progressPhoto: "&id, pose, recordedAt, imageBlobId, thumbnailBlobId", appMeta: "&key",
    operationJournal: "&operationId, type, status, startedAt", safetySnapshot: "&id, createdAt",
};

export const DATABASE_SCHEMAS: Record<number, Record<string, string>> = {2: schema2, 3: schema3, 4: schema4, 5: schema5, 6: schema6, 7: schema7, 8: schema8};

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
    progressionProposal!: Table<ProgressionProposalRecord, string>;
    bodyMeasurement!: Table<BodyMeasurementRecord, string>;
    mediaBlob!: Table<MediaBlobRecord, string>;
    progressPhoto!: Table<ProgressPhotoRecord, string>;
    appMeta!: Table<AppMetaRecord, string>;
    operationJournal!: Table<OperationJournalRecord, string>;
    safetySnapshot!: Table<SafetySnapshotRecord, string>;
    constructor() {
        const maybeUser = localStorage.getItem("userName");
        super(maybeUser && maybeUser !== "Default User" ? `weightlog-${maybeUser}` : 'weightlog');
        for (const version of Object.keys(DATABASE_SCHEMAS).map(Number)) this.version(version).stores(DATABASE_SCHEMAS[version]);
    }
}

export const db = new DexieDB();
