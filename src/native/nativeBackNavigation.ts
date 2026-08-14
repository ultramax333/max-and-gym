export const NATIVE_BACK_EVENT = 'maxgym:native-back';

export function resolveNativeBackTarget(pathname: string): string | undefined {
    if (pathname === '/') return undefined;
    if (pathname === '/workout/active') return '/train';
    if (pathname.startsWith('/workout/summary/') || pathname === '/workout/postworkout') return '/';
    if (pathname === '/train/core-videos') return '/train';
    if (pathname === '/programs/generate' || pathname.startsWith('/programs/')) return '/programs';
    if (pathname === '/progress/proposals' || pathname.startsWith('/progress/')) return '/progress';
    if (pathname.startsWith('/library/')) return '/library';
    if (pathname.startsWith('/settings/')) return '/settings';
    if (pathname.startsWith('/diagnostics/')) return '/diagnostics';
    if (pathname === '/apps/timer') return '/apps';
    if (pathname.startsWith('/account/')) return '/account';
    if (pathname.startsWith('/workoutExercise/') || pathname.startsWith('/bulkEditor/') || pathname.startsWith('/exercises/')) return '/workouts';
    return '/';
}
