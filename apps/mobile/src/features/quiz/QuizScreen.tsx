import type { QuizQuestion, StartQuizResponse, SubmitAnswerResponse, Uuid } from '@wanderpop/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { startQuiz, submitAnswer } from '../../services/quiz';
import { theme } from '../../styles/theme';

type ReadyQuizState = {
  status: 'ready';
  attempt: StartQuizResponse['attempt'];
  questions: QuizQuestion[];
  currentQuestionId: Uuid | null;
  feedback: SubmitAnswerResponse['feedback'] | null;
  lastAnswer: SubmitAnswerResponse['answer'] | null;
  isSubmitting: boolean;
  errorMessage: string | null;
};

type QuizScreenState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | ReadyQuizState;

function getFirstUnansweredQuestionId(questions: QuizQuestion[]) {
  return questions.find((question) => !question.answered)?.id ?? null;
}

function getQuestionIndex(questions: QuizQuestion[], questionId: Uuid | null) {
  if (!questionId) {
    return -1;
  }

  return questions.findIndex((question) => question.id === questionId);
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ challengeId?: string | string[] }>();
  const challengeId = Array.isArray(params.challengeId)
    ? params.challengeId[0]
    : params.challengeId;

  const [screenState, setScreenState] = useState<QuizScreenState>({ status: 'loading' });

  const loadQuiz = useCallback(async () => {
    if (!challengeId) {
      setScreenState({
        status: 'error',
        message: 'This quiz is missing its challenge context. Please return home and try again.',
      });
      return;
    }

    setScreenState({ status: 'loading' });

    try {
      const response = await startQuiz({
        daily_challenge_id: challengeId,
        ...getCurrentLocalDateContext(),
      });

      setScreenState({
        status: 'ready',
        attempt: response.attempt,
        questions: response.questions,
        currentQuestionId: getFirstUnansweredQuestionId(response.questions),
        feedback: null,
        lastAnswer: null,
        isSubmitting: false,
        errorMessage: null,
      });
    } catch (error) {
      setScreenState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load this quiz right now. Please try again.',
      });
    }
  }, [challengeId]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const currentQuestion = useMemo(() => {
    if (screenState.status !== 'ready') {
      return null;
    }

    return (
      screenState.questions.find((question) => question.id === screenState.currentQuestionId) ??
      null
    );
  }, [screenState]);

  const currentQuestionIndex = useMemo(() => {
    if (screenState.status !== 'ready') {
      return -1;
    }

    return getQuestionIndex(screenState.questions, screenState.currentQuestionId);
  }, [screenState]);

  const allQuestionsAnswered =
    screenState.status === 'ready' &&
    screenState.questions.length > 0 &&
    screenState.questions.every((question) => question.answered);

  const handleSubmitAnswer = useCallback(
    async (selectedOptionId: Uuid) => {
      if (screenState.status !== 'ready' || !currentQuestion || screenState.isSubmitting) {
        return;
      }

      if (currentQuestion.answered || screenState.feedback) {
        return;
      }

      setScreenState((previous) =>
        previous.status === 'ready'
          ? {
              ...previous,
              isSubmitting: true,
              errorMessage: null,
            }
          : previous,
      );

      try {
        const response = await submitAnswer({
          attempt_id: screenState.attempt.id,
          question_id: currentQuestion.id,
          selected_option_id: selectedOptionId,
          ...getCurrentLocalDateContext(),
        });

        setScreenState((previous) => {
          if (previous.status !== 'ready') {
            return previous;
          }

          return {
            ...previous,
            attempt: {
              ...previous.attempt,
              answered_count: response.attempt.answered_count,
              total_questions: response.attempt.total_questions,
            },
            questions: previous.questions.map((question) =>
              question.id === response.answer.question_id
                ? {
                    ...question,
                    answered: true,
                    selected_option_id: response.answer.selected_option_id,
                  }
                : question,
            ),
            feedback: response.feedback,
            lastAnswer: response.answer,
            isSubmitting: false,
            errorMessage: null,
          };
        });
      } catch (error) {
        setScreenState((previous) =>
          previous.status === 'ready'
            ? {
                ...previous,
                isSubmitting: false,
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : 'Unable to submit this answer right now. Please try again.',
              }
            : previous,
        );
      }
    },
    [currentQuestion, screenState],
  );

  const handleNext = useCallback(() => {
    if (screenState.status !== 'ready') {
      return;
    }

    const currentIndex = getQuestionIndex(screenState.questions, screenState.currentQuestionId);
    const nextQuestion =
      screenState.questions.slice(currentIndex + 1).find((question) => !question.answered) ??
      null;

    if (!nextQuestion) {
      router.push({
        pathname: '/quiz-complete',
        params: { attemptId: screenState.attempt.id },
      });
      return;
    }

    setScreenState({
      ...screenState,
      currentQuestionId: nextQuestion.id,
      feedback: null,
      lastAnswer: null,
      errorMessage: null,
    });
  }, [screenState]);

  if (screenState.status === 'loading') {
    return (
      <Screen>
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.title}>Loading quiz</Text>
          <Text style={styles.body}>
            WanderPop is restoring your attempt and loading today&apos;s question set.
          </Text>
        </View>
      </Screen>
    );
  }

  if (screenState.status === 'error') {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.title}>Quiz unavailable</Text>
          <Text style={styles.body}>{screenState.message}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => void loadQuiz()}>Try Again</Button>
          <Button variant="secondary" onPress={() => router.push('/home')}>
            Back to Home
          </Button>
        </View>
      </Screen>
    );
  }

  if (allQuestionsAnswered || !currentQuestion) {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.step}>All questions answered</Text>
          <Text style={styles.title}>Quiz shell complete</Text>
          <Text style={styles.body}>
            Every question in this attempt has been answered. Phase 9 will finalize the
            result, score, and rewards.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={() =>
              router.push({
                pathname: '/quiz-complete',
                params: { attemptId: screenState.attempt.id },
              })
            }
          >
            Open Result Shell
          </Button>
          <Button variant="secondary" onPress={() => router.push('/home')}>
            Back to Home
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.step}>
          Question {currentQuestionIndex + 1} of {screenState.attempt.total_questions}
        </Text>
        <Text style={styles.title}>{currentQuestion.question_text}</Text>
        <Text style={styles.body}>
          Answers lock immediately after submission. Feedback and the fun fact will appear
          before you move to the next question.
        </Text>

        {screenState.errorMessage ? (
          <Text style={styles.errorText}>{screenState.errorMessage}</Text>
        ) : null}

        {screenState.feedback ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>
              {screenState.feedback.result === 'correct' ? 'Correct' : 'Incorrect'}
            </Text>
            <Text style={styles.body}>{screenState.feedback.fun_fact}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {currentQuestion.options.map((option) => {
          const isSelected = currentQuestion.selected_option_id === option.id;
          const isLocked = currentQuestion.answered || Boolean(screenState.feedback);

          return (
            <Button
              key={option.id}
              disabled={isLocked || screenState.isSubmitting}
              variant="secondary"
              onPress={() => void handleSubmitAnswer(option.id)}
            >
              {isSelected ? `Selected: ${option.text}` : option.text}
            </Button>
          );
        })}

        {screenState.feedback ? (
          <Button onPress={handleNext}>
            {screenState.attempt.answered_count >= screenState.attempt.total_questions
              ? 'Open Result Shell'
              : 'Next Question'}
          </Button>
        ) : null}

        <Button variant="secondary" onPress={() => router.push('/home')}>
          Back to Home
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  step: {
    color: theme.colors.secondary,
    fontSize: theme.typography.small,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  errorText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  feedbackTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  actions: {
    gap: theme.spacing.md,
  },
});
