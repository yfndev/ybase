export const DEFAULT_APPLICATION_QUESTIONS = [
  "Was reizt dich besonders an dieser Rolle?",
  "Welche Erfahrungen und Fähigkeiten bringst du für diese Rolle mit?",
  "Was möchtest du in den ersten Monaten in dieser Rolle erreichen?",
] as const;

export const APPLICATION_QUESTION_COUNT = 3;

export function jobPostingApplicationQuestions(questions?: string[]): string[] {
  const source = questions ?? [...DEFAULT_APPLICATION_QUESTIONS];
  return Array.from(
    { length: APPLICATION_QUESTION_COUNT },
    (_, index) => source[index] ?? "",
  );
}
