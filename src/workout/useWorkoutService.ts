import {useContext, useMemo} from 'react';
import {DBContext} from '../context/dbContext';
import {DexieWorkoutRepository} from './DexieWorkoutRepository';
import {WorkoutApplicationService} from './WorkoutApplicationService';

export function useWorkoutService(): WorkoutApplicationService | undefined {
    const {db} = useContext(DBContext);
    return useMemo(() => db ? new WorkoutApplicationService(new DexieWorkoutRepository(db)) : undefined, [db]);
}
