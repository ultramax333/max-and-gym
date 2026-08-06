export interface ExerciseMediaAsset {
    kind: 'start-image' | 'end-image' | 'thumbnail';
    path: string;
    altText: string;
}

export interface ReviewedExercise {
    id: string;
    source: 'free-exercise-db' | 'maxgym';
    sourceId: string;
    sourceRevision: string;
    name: string;
    aliases: string[];
    category: string;
    force: string;
    mechanic: string;
    equipmentTags: string[];
    primaryMuscles: string[];
    secondaryMuscles: string[];
    movementPattern: string;
    positionTags: string[];
    transitionTags: string[];
    impactTags: string[];
    setupTags: string[];
    metricType: string;
    defaultRestSeconds: number;
    defaultRepRange: {min: number; max: number};
    defaultRirRange: {min: number; max: number};
    contentStatus: 'reviewed' | 'custom';
    generatorEligible: boolean;
    neverSuggest: boolean;
    archived: boolean;
    setupInstructions: string;
    executionSteps: string[];
    breathingCue: string;
    commonMistakes: string[];
    sourceName: string;
    sourceUrl: string;
    license: string;
    media: ExerciseMediaAsset[];
}

export interface ExercisePreference {
    exerciseId: string;
    favourite: boolean;
    neverSuggest: boolean;
    updatedAt: string;
}

export interface CustomExerciseRecord extends ReviewedExercise {
    source: 'maxgym';
    customImage?: Blob;
    customImageMimeType?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LibraryExercise extends ReviewedExercise {
    favourite: boolean;
    effectiveNeverSuggest: boolean;
}

export interface LibraryFilters {
    search?: string;
    equipment?: string;
    muscle?: string;
    movementPattern?: string;
    position?: string;
    status?: 'all' | 'eligible' | 'never-suggest';
}
