import type {
  CompleteQuizRequest,
  CompleteQuizResponse,
  StartQuizRequest,
  StartQuizResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

export async function startQuiz(request: StartQuizRequest): Promise<StartQuizResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: startQuiz');
}

export async function submitAnswer(
  request: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: submitAnswer');
}

export async function completeQuiz(
  request: CompleteQuizRequest,
): Promise<CompleteQuizResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: completeQuiz');
}
