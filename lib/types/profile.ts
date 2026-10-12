// NOT IMPLEMENTED (MVP): mock profile used by mock views (calendar sign-ups,
// reports). Designed to become the `User` profile once real auth exists.

export interface StudentProfile {
  name: string;
  email: string; // @uc.cl
  /** Admission year, e.g. 2024. */
  generation: number;
  major: string;
}
