import {GeneratorRole} from './types';

export interface WeeklyRoleDay {name: string; emphasis: string; roles: GeneratorRole[]}

export const WEEKLY_ROLE_TEMPLATES: Record<2 | 3, WeeklyRoleDay[]> = {
    2: [
        {name: 'Full Body A', emphasis: 'Squat and horizontal push', roles: ['knee-dominant', 'horizontal-push', 'supported-pull', 'posterior-assistance', 'accessory']},
        {name: 'Full Body B', emphasis: 'Hip extension and vertical work', roles: ['hinge', 'vertical-push', 'vertical-pull', 'leg-assistance', 'accessory']},
    ],
    3: [
        {name: 'Full Body A', emphasis: 'Strength: squat and horizontal push', roles: ['knee-dominant', 'horizontal-push', 'supported-pull', 'posterior-assistance', 'accessory']},
        {name: 'Full Body B', emphasis: 'Strength: hip extension and vertical work', roles: ['hinge', 'vertical-push', 'vertical-pull', 'leg-assistance', 'accessory']},
        {name: 'Full Body C', emphasis: 'Balanced hypertrophy and conditioning', roles: ['leg-assistance', 'horizontal-push', 'supported-pull', 'posterior-assistance', 'accessory']},
    ],
};

export const SEED_PROGRAM_FIXTURES = [
    {id: 'seed-2x40', frequency: 2 as const, durationMinutes: 40 as const, warmupMinutes: 5, conditioningMinutes: 4},
    {id: 'seed-2x60', frequency: 2 as const, durationMinutes: 60 as const, warmupMinutes: 7, conditioningMinutes: 6},
    {id: 'seed-3x40', frequency: 3 as const, durationMinutes: 40 as const, warmupMinutes: 5, conditioningMinutes: 4},
    {id: 'seed-3x60', frequency: 3 as const, durationMinutes: 60 as const, warmupMinutes: 7, conditioningMinutes: 6},
];

export const CORE_SEED_FIXTURES = [{id: 'core-10', minutes: 10 as const, rounds: 2}, {id: 'core-15', minutes: 15 as const, rounds: 3}];
