import type {
  EngineEvent,
  EngineState,
  Exercise,
  VerbosityLevel,
  VoiceCommand,
  WorkoutTemplate,
} from "./types";

/**
 * Deterministic workout state machine. No LLM, no network calls — every
 * transition here is plain code so it stays reliable mid-set with earbuds
 * in and spotty gym wifi. UI/TTS layers subscribe via onEvent; they never
 * drive state themselves.
 */
export class WorkoutEngine {
  private template: WorkoutTemplate;
  private verbosity: VerbosityLevel;
  private onEvent: (event: EngineEvent) => void;

  private state: EngineState = "idle";
  private exerciseIndex = 0;
  private setNumber = 1;
  private restSecondsRemaining = 0;
  private lastEvent: EngineEvent | null = null;

  constructor(
    template: WorkoutTemplate,
    verbosity: VerbosityLevel,
    onEvent: (event: EngineEvent) => void
  ) {
    this.template = template;
    this.verbosity = verbosity;
    this.onEvent = onEvent;
  }

  getState(): EngineState {
    return this.state;
  }

  getVerbosity(): VerbosityLevel {
    return this.verbosity;
  }

  setVerbosity(level: VerbosityLevel): void {
    this.verbosity = level;
  }

  private get currentExercise(): Exercise {
    return this.template.exercises[this.exerciseIndex];
  }

  private emit(event: EngineEvent): void {
    this.lastEvent = event;
    this.onEvent(event);
  }

  start(): void {
    if (this.state !== "idle") return;
    this.exerciseIndex = 0;
    this.setNumber = 1;
    this.emit({ type: "workout_start" });
    this.announceCurrentExercise();
  }

  private announceCurrentExercise(): void {
    this.state = "announcing";
    this.emit({ type: "exercise_announce", exercise: this.currentExercise });
    this.startSet();
  }

  private startSet(): void {
    this.state = "in_set";
    this.emit({
      type: "set_start",
      exercise: this.currentExercise,
      setNumber: this.setNumber,
      totalSets: this.currentExercise.sets,
    });
  }

  private startRest(): void {
    this.state = "resting";
    this.restSecondsRemaining = this.currentExercise.restSeconds;
    this.emit({
      type: "rest_start",
      exercise: this.currentExercise,
      secondsRemaining: this.restSecondsRemaining,
    });
  }

  /** Move to the next set of the current exercise, or the next exercise, or finish. */
  private advance(): void {
    if (this.setNumber < this.currentExercise.sets) {
      this.setNumber += 1;
      this.startSet();
      return;
    }

    this.exerciseIndex += 1;
    if (this.exerciseIndex >= this.template.exercises.length) {
      this.state = "complete";
      this.emit({ type: "workout_complete" });
      return;
    }

    this.setNumber = 1;
    this.announceCurrentExercise();
  }

  /** Called every second (e.g. from a UI timer) while resting. */
  tick(deltaSeconds: number): void {
    if (this.state !== "resting") return;

    this.restSecondsRemaining = Math.max(0, this.restSecondsRemaining - deltaSeconds);
    if (this.restSecondsRemaining === 0) {
      this.emit({ type: "rest_complete" });
      this.advance();
    }
  }

  handleCommand(command: VoiceCommand): void {
    switch (command) {
      case "end_workout":
        this.state = "complete";
        this.emit({ type: "workout_complete" });
        return;

      case "repeat":
        if (this.lastEvent) this.onEvent(this.lastEvent);
        return;

      case "rest":
        if (this.state === "in_set") {
          this.emit({ type: "set_complete", exercise: this.currentExercise });
          this.startRest();
        }
        return;

      case "next":
        if (this.state === "in_set") {
          this.emit({ type: "set_complete", exercise: this.currentExercise });
          this.advance();
        } else if (this.state === "resting") {
          this.emit({ type: "rest_complete" });
          this.advance();
        }
        return;

      case "unknown":
      default:
        this.emit({ type: "command_unrecognized" });
    }
  }
}
