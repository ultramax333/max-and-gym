export const DATABASE_SCHEMA_VERSION = 8;
export const EXPORT_FORMAT_VERSION = 2;
export const EXERCISE_SEED_VERSION = 'fedb-b0eed061e1c8-reviewed-2';
export const PROGRAM_SEED_VERSION = 'maxgym-seed-programs-v1';
export const GENERATOR_VERSION = 'deterministic-v2';
export const CACHE_VERSION = '3';

export interface BuildIdentity {
    appVersion: string;
    buildNumber: string;
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
    buildNumber: __BUILD_NUMBER__,
    gitSha: __GIT_SHA__,
    buildTimestamp: __BUILD_TIMESTAMP__,
    environment: __BUILD_ENVIRONMENT__,
    databaseSchemaVersion: DATABASE_SCHEMA_VERSION,
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    exerciseSeedVersion: EXERCISE_SEED_VERSION,
    programSeedVersion: PROGRAM_SEED_VERSION,
    generatorVersion: GENERATOR_VERSION,
    cacheVersion: CACHE_VERSION,
    buildId: `${__APP_VERSION__}+${__BUILD_NUMBER__}.${__GIT_SHA__}`,
};
