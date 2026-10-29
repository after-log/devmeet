import sections from '@/data/value-questions.json';
import type { ValueAnswers } from '@/types';

export const PUBLIC_VALUE_LIMIT = 10;
export const valueQuestions = sections.flatMap((section) => section.questions);
export const publicValueAnswers = (answers: ValueAnswers) =>
  valueQuestions
    .flatMap((question) => {
      const answer = answers[question.id];
      return answer?.choice != null &&
        answer.private === false &&
        question.options.includes(answer.choice)
        ? [{ ...question, choice: answer.choice }]
        : [];
    })
    .slice(0, PUBLIC_VALUE_LIMIT);

/** Keep answers intact while limiting public visibility, including older saved profiles. */
export const normalizeValueAnswers = (answers: ValueAnswers = {}): ValueAnswers => {
  let publicCount = 0;
  return Object.fromEntries(
    valueQuestions.flatMap((question) => {
      const answer = answers[question.id];
      if (!answer || (answer.choice !== null && !question.options.includes(answer.choice)))
        return [];
      const isPublic =
        answer.choice !== null && answer.private === false && publicCount < PUBLIC_VALUE_LIMIT;
      if (isPublic) publicCount++;
      return [[question.id, { choice: answer.choice, private: !isPublic }]];
    }),
  );
};
