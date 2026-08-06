export const DATABASE_SCHEMA_VERSION = 6;
export const EXPORT_FORMAT_VERSION = 1;
export const EXERCISE_SEED_VERSION = 'fedb-b0eed061e1c8-reviewed-1';
export const PROGRAM_SEED_VERSION = 'legacy-1';
export const GENERATOR_VERSION = 'not-enabled';
export const CACHE_VERSION = '1';

export interface BuildIdentity {
    appVersion: string;
    gitSha: string;
    buildTimestamp: string;
    environment: string;
    databaseSchemaVersion: number;
    exportFormatVersion: number;
    exerciseSeedVersion: string;
    programSeedVersion: string;
    generatorVersion: string;
    cacheVersion: string;
    buildId: string;
}

export const buildIdentity: BuildIdentity = {
    appVersion: __APP_VERSION__,
    gitSha: __GIT_SHA__,
    buildTimestamp: __BUILD_TIMESTAMP__,
    environment: __BUILD_ENVIRONMENT__,
    databaseSchemaVersion: DATABASE_SCHEMA_VERSION,
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    exerciseSeedVersion: EXERCISE_SEED_VERSION,
    programSeedVersion: PROGRAM_SEED_VERSION,
    generatorVersion: GENERATOR_VERSION,
    cacheVersion: CACHE_VERSION,
    buildId: `${__APP_VERSION__}+${__GIT_SHA__}`,
};
