import { generatePlanIntro } from "../llm/parsers/planCopy";
import type { LLMProvider } from "../llm/types";
import { generateTemplateFromOnboarding } from "../onboarding/templateGenerator";
import { getSessionsForExercise } from "../storage/sessionRepository";
import type { MoodSignal, UserProfile } from "../storage/types";
import { adjustForMoodSignal, applyIntensityAdjustment } from "../workout-engine/adaptiveRules";
import { decideProgression, type ProgressionDecision } from "../workout-engine/progression";
import type { WorkoutTemplate } from "../workout-engine/types";

/** Plans the user must review before Monty is trusted to run fully autonomously. */
export const PLAN_AUTONOMY_THRESHOLD = 3;

export interface DailyPlanResult {
  template: WorkoutTemplate;
  introCopy: string;
  progressionNotes: { exerciseId: string; decision: ProgressionDecision }[];
  requiresApproval: boolean;
}

function profileToOnboardingAnswers(profile: UserProfile) {
  return {
    goal: profile.goal,
    experience: profile.experience,
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    frequencyPerWeek: profile.frequencyPerWeek,
    coachingStyle: profile.coachingStyle,
    language: profile.language,
  };
}

/**
 * Intended to run once per day per user as a batch job (e.g. a scheduled
 * Supabase edge function), not live in the UI thread. The rules engine
 * (progression + mood adjustment + safety clamps) makes every structural
 * decision; the LLM call at the end only writes the intro copy.
 */
export async function generateDailyPlan(
  profile: UserProfile,
  llm: LLMProvider,
  moodSignal?: MoodSignal
): Promise<DailyPlanResult> {
  let template = generateTemplateFromOnboarding(profileToOnboardingAnswers(profile));

  const progressionNotes: DailyPlanResult["progressionNotes"] = [];
  const exercisesWithProgression = [];
  for (const exercise of template.exercises) {
    if (exercise.targetWeight === undefined) {
      exercisesWithProgression.push(exercise);
      continue;
    }
    const history = await getSessionsForExercise(exercise.id, 5);
    const decision = decideProgression(history, exercise.id);
    progressionNotes.push({ exerciseId: exercise.id, decision });
    exercisesWithProgression.push({
      ...exercise,
      targetWeight: Math.round(exercise.targetWeight * decision.weightMultiplier * 2) / 2, // nearest 0.5kg
    });
  }
  template = { ...template, exercises: exercisesWithProgression };

  if (moodSignal) {
    template = applyIntensityAdjustment(template, adjustForMoodSignal(moodSignal));
  }

  const introCopy = await generatePlanIntro(llm, template, profile.language);

  return {
    template,
    introCopy,
    progressionNotes,
    requiresApproval: profile.approvedPlanCount < PLAN_AUTONOMY_THRESHOLD,
  };
}
