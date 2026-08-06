# Component catalogue

Build these components as reusable max&gym primitives. Names are conceptual.

## Foundation

- `AppShell`
- `MobileBottomNavigation`
- `DesktopNavigationRail`
- `TopBar`
- `ScreenContainer`
- `SectionHeader`
- `AppErrorBoundary`
- `RouteErrorState`
- `OfflineBanner`
- `UpdateBanner`
- `StorageWarningBanner`

## Actions

- `PrimaryButton`
- `SecondaryButton`
- `DestructiveButton`
- `IconAction`
- `FloatingAction`
- `StickyActionBar`
- `OverflowMenu`
- `UndoToast`

## Inputs

- `NumberStepper`
- `LoadInput`
- `RepetitionInput`
- `EffortInput`
- `DurationInput`
- `SearchField`
- `FilterChip`
- `SegmentedControl`
- `ToggleRow`
- `ValidatedTextField`
- `ExercisePicker`
- `DateInput`
- `MeasurementInput`

## Workout

- `NextWorkoutCard`
- `WorkoutProgressHeader`
- `ExerciseHero`
- `PreviousPerformanceStrip`
- `SetCard`
- `SetTable`
- `SetTypeBadge`
- `RestTimerBar`
- `RestTimerSheet`
- `SupersetIndicator`
- `ExerciseActionsSheet`
- `PlateCalculatorSheet`
- `WorkoutRecoveryCard`
- `WorkoutSummaryCard`
- `ProgressionProposalCard`

## Exercise

- `ExerciseCard`
- `ExerciseThumbnail`
- `TwoPositionMedia`
- `ExerciseTagList`
- `ExerciseInstructions`
- `ExerciseAlternatives`
- `ExerciseHistoryPreview`
- `ExerciseFilterSheet`
- `ReviewedBadge`
- `NeverSuggestControl`

## Programs

- `ProgramCard`
- `ProgramDayCard`
- `ProgramExerciseRow`
- `WorkoutBlockCard`
- `DurationBreakdown`
- `WeeklyBalanceChart`
- `GeneratorStep`
- `GeneratorExplanation`
- `LockExerciseControl`
- `GroupEditor`

## Progress

- `MetricCard`
- `TrendCard`
- `ChartCard`
- `ChartTextSummary`
- `RecordBadge`
- `MeasurementHistory`
- `PhotoTile`
- `BlurredPhotoTile`
- `PhotoComparison`

## Diagnostics

- `BuildIdentityCard`
- `DatabaseHealthCard`
- `PwaHealthCard`
- `StorageHealthCard`
- `CapabilityList`
- `SelfTestRunner`
- `DiagnosticEventList`
- `ErrorIdBadge`
- `DiagnosticExportAction`

## States

Every data-bearing component defines:

- loading;
- empty;
- normal;
- stale;
- offline;
- recoverable error;
- blocking error;
- permission unavailable.

## Component contract rules

- no component directly accesses a Dexie table;
- business logic is passed as typed data/actions;
- accessibility names are explicit;
- critical actions show disabled/busy state;
- repeated submission is guarded;
- numeric components use tabular numerals;
- mobile target size is at least 48 × 48 pixels where practical;
- no component depends on hover for essential information;
- no component imports Workout.cool server or UI-framework infrastructure.
