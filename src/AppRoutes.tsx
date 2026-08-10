import {Route, Routes} from "react-router-dom";
import React from "react";
import ErrorBoundary from './components/errorBoundary';
import Loader from './components/Loader';

const Login = React.lazy(() => import('./pages/profile/login').then((module) => ({default: module.Login})));
const WorkoutList = React.lazy(() => import('./pages/workout-list/workout_list').then((module) => ({default: module.WorkoutList})));
const AppsMenu = React.lazy(() => import('./pages/apps/appsMenu').then((module) => ({default: module.AppsMenu})));
const Timer = React.lazy(() => import('./pages/apps/timer').then((module) => ({default: module.Timer})));
const HistoryPage = React.lazy(() => import('./pages/history/history').then((module) => ({default: module.HistoryPage})));
const StatsPage = React.lazy(() => import('./pages/stats/stats'));
const MetricsPage = React.lazy(() => import('./pages/profile/metrics'));
const AppearanceSettingsPage = React.lazy(() => import('./pages/settings/appearanceSettings').then((module) => ({default: module.AppearanceSettingsPage})));
const Backup = React.lazy(() => import('./pages/settings/backup').then((module) => ({default: module.Backup})));
const SettingsPage = React.lazy(() => import('./pages/settings/settings').then((module) => ({default: module.SettingsPage})));
const WorkoutSettingsPage = React.lazy(() => import('./pages/settings/workoutSettings').then((module) => ({default: module.WorkoutSettingsPage})));
const SystemSettingsPage = React.lazy(() => import('./pages/settings/system').then((module) => ({default: module.SystemSettingsPage})));
const RestAlarmSettingsPage = React.lazy(() => import('./pages/settings/RestAlarmSettingsPage').then((module) => ({default: module.RestAlarmSettingsPage})));
const AboutPage = React.lazy(() => import('./pages/settings/AboutPage').then((module) => ({default: module.AboutPage})));
const WorkoutPage = React.lazy(() => import('./pages/workout/workout').then((module) => ({default: module.WorkoutPage})));
const PostWorkout = React.lazy(() => import('./pages/workout/postWorkout'));
const WorkoutEditor = React.lazy(() => import('./pages/workout-editor/workout_editor').then((module) => ({default: module.WorkoutEditor})));
const WorkoutExerciseEditor = React.lazy(() => import('./pages/workout-editor/workoutExercise_editor').then((module) => ({default: module.WorkoutExerciseEditor})));
const ExerciseList = React.lazy(() => import('./pages/workout-editor/exercise_list').then((module) => ({default: module.ExerciseList})));
const ExerciseEditor = React.lazy(() => import('./pages/workout-editor/exercise_editor').then((module) => ({default: module.ExerciseEditor})));
const YoutubePlayer = React.lazy(() => import('./pages/workout/youtubePlayer').then((module) => ({default: module.YoutubePlayer})));
const PictureViewer = React.lazy(() => import('./pages/workout/pictureViewer').then((module) => ({default: module.PictureViewer})));
const WhatsNew = React.lazy(() => import('./pages/whatsNew/whatsNew').then((module) => ({default: module.WhatsNew})));
const License = React.lazy(() => import('./pages/whatsNew/license').then((module) => ({default: module.License})));
const OneRmCalculator = React.lazy(() => import('./components/onermcalc'));
const AccountMenu = React.lazy(() => import('./pages/profile/accountMenu').then((module) => ({default: module.AccountMenu})));
const NotImplemented = React.lazy(() => import('./pages/notImplemented'));
const Onboarding = React.lazy(() => import('./pages/onboarding/onboarding'));
const BulkEditor = React.lazy(() => import('./pages/workout-editor/bulkEditor'));
const Wrapped = React.lazy(() => import('./pages/wrapped'));
const EOLPage = React.lazy(() => import('./pages/eol'));
const DiagnosticsPage = React.lazy(() => import('./pages/diagnostics/DiagnosticsPage'));
const IntentionalRouteError = React.lazy(() => import('./pages/diagnostics/DiagnosticsPage').then((module) => ({default: module.IntentionalRouteError})));
const HomeShellPage = React.lazy(() => import('./pages/shell/ShellPages').then((module) => ({default: module.HomeShellPage})));
const TrainShellPage = React.lazy(() => import('./pages/shell/ShellPages').then((module) => ({default: module.TrainShellPage})));
const ActiveWorkoutPage = React.lazy(() => import('./pages/workout-active/ActiveWorkoutPage').then((module) => ({default: module.ActiveWorkoutPage})));
const WorkoutSummaryPage = React.lazy(() => import('./pages/workout-active/WorkoutSummaryPage').then((module) => ({default: module.WorkoutSummaryPage})));
const ExerciseDetailPage = React.lazy(() => import('./pages/library/LibraryPages').then((module) => ({default: module.ExerciseDetailPage})));
const LibraryPage = React.lazy(() => import('./pages/library/LibraryPages').then((module) => ({default: module.LibraryPage})));
const GeneratorPage = React.lazy(() => import('./pages/programs/GeneratorPage').then((module) => ({default: module.GeneratorPage})));
const ProgramDetailWithGeneratorActions = React.lazy(() => import('./pages/programs/GeneratorPage').then((module) => ({default: module.ProgramDetailWithGeneratorActions})));
const ProgramsWithGeneratorPage = React.lazy(() => import('./pages/programs/GeneratorPage').then((module) => ({default: module.ProgramsWithGeneratorPage})));
const ProgressionProposalsPage = React.lazy(() => import('./pages/progression/ProgressionProposalsPage').then((module) => ({default: module.ProgressionProposalsPage})));
const ProgressWithProposalsPage = React.lazy(() => import('./pages/progression/ProgressionProposalsPage').then((module) => ({default: module.ProgressWithProposalsPage})));
const ExerciseProgressPage = React.lazy(() => import('./pages/progress/ProgressPages').then((module) => ({default: module.ExerciseProgressPage})));
const MeasurementsPage = React.lazy(() => import('./pages/progress/ProgressPages').then((module) => ({default: module.MeasurementsPage})));
const PhotosPage = React.lazy(() => import('./pages/progress/ProgressPages').then((module) => ({default: module.PhotosPage})));
const BackupPage = React.lazy(() => import('./pages/backup/BackupPage'));
const CoreVideosPage = React.lazy(() => import('./pages/core/CoreVideosPage'));

const AppRoutes = () => {
    return <ErrorBoundary code="UI_ROUTE_RENDER_FAILED" subsystem="UI"><React.Suspense fallback={<Loader prompt="Loading…"/>}><Routes>
        <Route path="/onboarding" element={<Onboarding/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<HomeShellPage/>}/>
        <Route path="/train" element={<TrainShellPage/>}/>
        <Route path="/train/core-videos" element={<CoreVideosPage/>}/>
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
        <Route path="/settings/rest-alarm" element={<RestAlarmSettingsPage/>}/>
        <Route path="/settings/about" element={<AboutPage/>}/>
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
    </Routes></React.Suspense></ErrorBoundary>
}

export default AppRoutes;
