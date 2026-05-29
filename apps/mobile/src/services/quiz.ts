import type {
  CompleteQuizRequest,
  CompleteQuizResponse,
  StartQuizRequest,
  StartQuizResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '@wanderpop/shared';
import { API_ERROR_CODES } from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

const QUIZ_ERROR_MESSAGES: Record<string, string> = {
  [API_ERROR_CODES.CHALLENGE_NOT_AVAILABLE]:
    'Today’s quiz is not available right now. Please try again later.',
  [API_ERROR_CODES.QUIZ_ALREADY_COMPLETED]:
    'This quiz has already been completed.',
  [API_ERROR_CODES.ANSWER_ALREADY_SUBMITTED]:
    'This question has already been answered.',
  [API_ERROR_CODES.QUESTION_NOT_IN_ATTEMPT]:
    'This question does not belong to the current quiz attempt.',
  [API_ERROR_CODES.OPTION_NOT_IN_QUESTION]:
    'That answer option does not belong to the current question.',
  [API_ERROR_CODES.NOT_ALL_QUESTIONS_ANSWERED]:
    'You need to answer every question before finishing this quiz.',
  [API_ERROR_CODES.UNAUTHORIZED]:
    'You must be signed in to continue this quiz.',
};

function getQuizErrorMessage(message: string) {
  const matchedCode = Object.values(API_ERROR_CODES).find((code) => message.includes(code));

  return matchedCode ? QUIZ_ERROR_MESSAGES[matchedCode] : message;
}

export async function startQuiz(request: StartQuizRequest): Promise<StartQuizResponse> {
  const { data, error } = await supabase.rpc('start_quiz', request);

  if (error) {
    throw new Error(getQuizErrorMessage(error.message));
  }

  return data as StartQuizResponse;
}

export async function submitAnswer(
  request: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const { data, error } = await supabase.rpc('submit_answer', request);

  if (error) {
    throw new Error(getQuizErrorMessage(error.message));
  }

  return data as SubmitAnswerResponse;
}

export async function completeQuiz(
  request: CompleteQuizRequest,
): Promise<CompleteQuizResponse> {
  const { data, error } = await supabase.rpc('complete_quiz', request);

  if (error) {
    throw new Error(getQuizErrorMessage(error.message));
  }

  return data as CompleteQuizResponse;
}
