import type { Exercise, WorkoutTemplate } from "./types";

/**
 * Fixed v0 library. No generation, no personalization — every user gets
 * the same default template until v1's rule-based onboarding lands.
 */
export const EXERCISE_LIBRARY: Exercise[] = [
  { id: "squat", name: "Bodyweight Squat", kind: "bodyweight", sets: 3, reps: 15, restSeconds: 45 },
  { id: "pushup", name: "Push Up", kind: "bodyweight", sets: 3, reps: 12, restSeconds: 45 },
  { id: "lunge", name: "Alternating Lunge", kind: "bodyweight", sets: 3, reps: 12, restSeconds: 45 },
  { id: "plank", name: "Plank Hold", kind: "bodyweight", sets: 3, reps: 30, restSeconds: 30 },
  { id: "db_row", name: "Dumbbell Row", kind: "dumbbell", sets: 3, reps: 12, restSeconds: 60, targetWeight: 10, weightUnit: "kg" },
  { id: "db_press", name: "Dumbbell Shoulder Press", kind: "dumbbell", sets: 3, reps: 10, restSeconds: 60, targetWeight: 8, weightUnit: "kg" },
  { id: "db_curl", name: "Dumbbell Bicep Curl", kind: "dumbbell", sets: 3, reps: 12, restSeconds: 45, targetWeight: 6, weightUnit: "kg" },
  { id: "db_deadlift", name: "Dumbbell Romanian Deadlift", kind: "dumbbell", sets: 3, reps: 10, restSeconds: 60, targetWeight: 12, weightUnit: "kg" },
];

const byId = (id: string): Exercise => {
  const exercise = EXERCISE_LIBRARY.find((e) => e.id === id);
  if (!exercise) throw new Error(`Unknown exercise id: ${id}`);
  return exercise;
};

export const DEFAULT_WORKOUT_TEMPLATE: WorkoutTemplate = {
  id: "default_full_body",
  name: "Full Body — Bodyweight + Dumbbell",
  exercises: [
    byId("squat"),
    byId("pushup"),
    byId("db_row"),
    byId("lunge"),
    byId("db_press"),
    byId("plank"),
  ],
};
