import {useContext, useMemo} from 'react';
import {DBContext} from '../context/dbContext';
import {ExerciseCatalogRepository} from './ExerciseCatalogRepository';

export function useExerciseCatalog(): ExerciseCatalogRepository | undefined {
    const {db} = useContext(DBContext);
    return useMemo(() => db ? new ExerciseCatalogRepository(db) : undefined, [db]);
}
