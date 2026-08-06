import {Navigate, Route, Routes} from "react-router-dom";
import {Login} from "./pages/profile/login";
import {WorkoutList} from "./pages/workout-list/workout_list";
import {AppsMenu} from "./pages/apps/appsMenu";
import {Timer} from "./pages/apps/timer";
import {HistoryPage} from "./pages/history/history";
import StatsPage from "./pages/stats/stats";
import MetricsPage from "./pages/profile/metrics";
import {AppearanceSettingsPage} from "./pages/settings/appearanceSettings";
import {Backup} from "./pages/settings/backup";
import {SettingsPage} from "./pages/settings/settings";
import {WorkoutSettingsPage} from "./pages/settings/workoutSettings";
import {SystemSettingsPage} from "./pages/settings/system";
import {WorkoutPage} from "./pages/workout/workout";
import PostWorkout from "./pages/workout/postWorkout";
import {WorkoutEditor} from "./pages/workout-editor/workout_editor";
import {WorkoutExerciseEditor} from "./pages/workout-editor/workoutExercise_editor";
import {ExerciseList} from "./pages/workout-editor/exercise_list";
import {ExerciseEditor} from "./pages/workout-editor/exercise_editor";
import {YoutubePlayer} from "./pages/workout/youtubePlayer";
import {PictureViewer} from "./pages/workout/pictureViewer";
import {WhatsNew} from "./pages/whatsNew/whatsNew";
import {License} from "./pages/whatsNew/license";
import OneRmCalculator from "./components/onermcalc";
import {AccountMenu} from "./pages/profile/accountMenu";
import NotImplemented from "./pages/notImplemented";
import Onboarding from "./pages/onboarding/onboarding";
import React from "react";
import BulkEditor from "./pages/workout-editor/bulkEditor";
import Wrapped from "./pages/wrapped";
import EOLPage from "./pages/eol";
import DiagnosticsPage, {IntentionalRouteError} from './pages/diagnostics/DiagnosticsPage';
import ErrorBoundary from './components/errorBoundary';
import {HomeShellPage, TrainShellPage} from './pages/shell/ShellPages';
import {ActiveWorkoutPage} from './pages/workout-active/ActiveWorkoutPage';
import {WorkoutSummaryPage} from './pages/workout-active/WorkoutSummaryPage';
import {ExerciseDetailPage, LibraryPage} from './pages/library/LibraryPages';
import {GeneratorPage, ProgramDetailWithGeneratorActions, ProgramsWithGeneratorPage} from './pages/programs/GeneratorPage';
import {ProgressionProposalsPage, ProgressWithProposalsPage} from './pages/progression/ProgressionProposalsPage';
import {ExerciseProgressPage, MeasurementsPage, PhotosPage} from './pages/progress/ProgressPages';
import BackupPage from './pages/backup/BackupPage';

const AppRoutes = () => {
    return <ErrorBoundary code="UI_ROUTE_RENDER_FAILED" subsystem="UI"><Routes>
        <Route path="/onboarding" element={<Onboarding/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<HomeShellPage/>}/>
        <Route path="/train" element={<TrainShellPage/>}/>
        <Route path="/programs" element={<ProgramsWithGeneratorPage/>}/>
        <Route path="/programs/generate" element={<GeneratorPage/>}/>
        <Route path="/programs/:programId" element={<ProgramDetailWithGeneratorActions/>}/>
        <Route path="/progress" element={<ProgressWithProposalsPage/>}/>
        <Route path="/progress/proposals" element={<ProgressionProposalsPage/>}/>
        <Route path="/progress/exercise/:exerciseId" element={<ExerciseProgressPage/>}/>
        <Route path="/progress/measurements" element={<MeasurementsPage/>}/>
        <Route path="/progress/photos" element={<PhotosPage/>}/>
        <Route path="/backup" element={<BackupPage/>}/>
        <Route path="/workouts" element={<WorkoutList/>}/>
        <Route path="/apps" element={<AppsMenu/>}/>
        <Route path="/apps/timer" element={<Timer/>}/>
        <Route path="/history" element={<HistoryPage/>}/>
        <Route path="/account/stats" element={<StatsPage/>}/>
        <Route path="/account/measures"
               element={<MetricsPage/>}/>
        <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
        <Route path="/settings/backup"
               element={<Backup/>}/>
        <Route path="/onboarding/backup"
               element={<Backup onboarding/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/diagnostics" element={<DiagnosticsPage/>}/>
        <Route path="/diagnostics/error-test" element={<IntentionalRouteError/>}/>
        <Route path="/settings/workout"
               element={<WorkoutSettingsPage/>}/>
        <Route path="/settings/system"
               element={<SystemSettingsPage/>}/>
        <Route path="/workout" element={<WorkoutPage/>}/>
        <Route path="/workout/active" element={<ActiveWorkoutPage/>}/>
        <Route path="/workout/summary/:sessionId" element={<WorkoutSummaryPage/>}/>
        <Route path="/workout/postworkout"
               element={<PostWorkout/>}/>
        <Route path="/workout/:workoutId"
               element={<WorkoutEditor/>}/>
        <Route path="/bulkEditor/:workoutId"
               element={<BulkEditor/>}/>
        <Route path="/workoutExercise/:workoutExerciseId"
               element={<WorkoutExerciseEditor />}/>
        <Route path="/library" element={<LibraryPage/>}/>
        <Route path="/library/:exerciseId" element={<ExerciseDetailPage/>}/>
        <Route path="/exercises" element={<ExerciseList/>}/>
        <Route path="/exercises/:exerciseId"
               element={<ExerciseEditor/>}/>
        <Route path="/youtube"
               element={<YoutubePlayer/>}/>
        <Route path="/picture"
               element={<PictureViewer/>}/>
        <Route path="/whats-new"
               element={<WhatsNew/>}/>
        <Route path="/license"
               element={<License/>}/>
        <Route path="/onerm" element={<OneRmCalculator/>}/>
        <Route path="/account" element={<AccountMenu/>}/>
        <Route path="/wrapped" element={<Wrapped/>}/>
        <Route path="/eol" element={<EOLPage/>}/>
        <Route path="*" element={<NotImplemented/>}/>
    </Routes></ErrorBoundary>
}

export default AppRoutes;
