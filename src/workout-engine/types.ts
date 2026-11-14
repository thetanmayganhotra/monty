export type ExerciseKind = "bodyweight" | "dumbbell";

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  sets: number;
  reps: number;
  restSeconds: number;
  /** Suggested starting weight for dumbbell exercises; undefined for bodyweight. */
  targetWeight?: number;
  weightUnit?: "kg" | "lb";
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
}

export type VerbosityLevel = "silent" | "minimal" | "coach" | "hype";

export type EngineEventType =
  | "workout_start"
  | "exercise_announce"
  | "set_start"
  | "set_complete"
  | "rest_start"
  | "rest_complete"
  | "workout_complete"
  | "command_unrecognized";

export interface EngineEvent {
  type: EngineEventType;
  exercise?: Exercise;
  setNumber?: number;
  totalSets?: number;
  secondsRemaining?: number;
}

export type VoiceCommand = "next" | "rest" | "end_workout" | "repeat" | "unknown";

export type EngineState =
  | "idle"
  | "announcing"
  | "in_set"
  | "resting"
  | "complete";
