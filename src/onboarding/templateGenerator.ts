import { EXERCISE_LIBRARY } from "../workout-engine/exerciseLibrary";
import type { Exercise, WorkoutTemplate } from "../workout-engine/types";
import type { OnboardingAnswers } from "./types";

const GOAL_ADJUSTMENTS: Record<
  OnboardingAnswers["goal"],
  { setsDelta: number; repsDelta: number; restDeltaSeconds: number }
> = {
  strength: { setsDelta: 1, repsDelta: -5, restDeltaSeconds: 20 },
  hypertrophy: { setsDelta: 0, repsDelta: 0, restDeltaSeconds: 0 },
  fat_loss: { setsDelta: 0, repsDelta: 4, restDeltaSeconds: -10 },
  general_fitness: { setsDelta: 0, repsDelta: 0, restDeltaSeconds: 0 },
};

const EXPERIENCE_SET_DELTA: Record<OnboardingAnswers["experience"], number> = {
  beginner: -1,
  intermediate: 0,
  advanced: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function applyAdjustments(exercise: Exercise, answers: OnboardingAnswers): Exercise {
  const goalAdj = GOAL_ADJUSTMENTS[answers.goal];
  const experienceDelta = EXPERIENCE_SET_DELTA[answers.experience];

  return {
    ...exercise,
    sets: clamp(exercise.sets + goalAdj.setsDelta + experienceDelta, 2, 5),
    reps: clamp(exercise.reps + goalAdj.repsDelta, 6, 20),
    restSeconds: clamp(exercise.restSeconds + goalAdj.restDeltaSeconds, 20, 90),
  };
}

/**
 * Rule-based first-workout generation — templates + fixed rules, no LLM.
 * Exercise count scales with session length (~7 min/exercise incl. rest);
 * sets/reps/rest scale with goal and experience.
 */
export function generateTemplateFromOnboarding(answers: OnboardingAnswers): WorkoutTemplate {
  const pool = EXERCISE_LIBRARY.filter((e) =>
    answers.equipment === "bodyweight_only" ? e.kind === "bodyweight" : true
  );

  const exerciseCount = clamp(Math.round(answers.sessionDurationMinutes / 7), 3, pool.length);

  // Round-robin bodyweight/dumbbell for balance when both are available.
  const bodyweight = pool.filter((e) => e.kind === "bodyweight");
  const dumbbell = pool.filter((e) => e.kind === "dumbbell");
  const ordered: Exercise[] = [];
  let bi = 0;
  let di = 0;
  while (ordered.length < exerciseCount && (bi < bodyweight.length || di < dumbbell.length)) {
    if (bi < bodyweight.length) ordered.push(bodyweight[bi++]);
    if (ordered.length < exerciseCount && di < dumbbell.length) ordered.push(dumbbell[di++]);
  }

  return {
    id: `generated_${answers.goal}_${answers.equipment}`,
    name: `${answers.sessionDurationMinutes}-Minute ${goalLabel(answers.goal)} Session`,
    exercises: ordered.map((e) => applyAdjustments(e, answers)),
  };
}

function goalLabel(goal: OnboardingAnswers["goal"]): string {
  switch (goal) {
    case "strength": return "Strength";
    case "hypertrophy": return "Muscle";
    case "fat_loss": return "Fat Loss";
    case "general_fitness": return "Fitness";
  }
}
