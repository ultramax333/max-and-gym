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

## CP2 implementation status

- Implemented: AppShell (via Layout), MobileBottomNavigation, DesktopNavigationRail,
  TopBar, ScreenContainer, SectionHeader, PrimaryButton, SecondaryButton,
  OfflineBanner, StorageWarningBanner, UpdateBanner, RouteErrorState and
  accessible ReorderControls.
- Route shells implemented: Home, Train, Programs and Progress; Library, Settings,
  Diagnostics and onboarding use the same Material UI shell.
- Later tasks own the data-aware variants of cards, inputs, loading states and
  workout/program primitives.

## CP4 implementation status

- Implemented: ExerciseCard, ExerciseThumbnail, ExerciseTagList,
  ExerciseInstructions, ExerciseAlternatives, ExerciseFilterSheet,
  NeverSuggestControl and local custom-image input.
- The library uses a repository boundary; seed records, user preferences and custom
  exercises remain separate.

## v1.11 interface refinement

- Graphite/citron shared theme, floating mobile navigation and compact desktop rail.
- Photo-led session launcher and library cards with separate open/favourite/exclusion controls.
- Paired Load/Repetitions steppers appear before supporting workout panels.
- Existing data services and workout operations remain the owners of persistence.
- Responsive walkthrough and complete-backup navigation coverage: `tests/design.spec.ts`.
- Visual evidence: `docs/reports/104-v1.11.0-ui-studio.md`.
