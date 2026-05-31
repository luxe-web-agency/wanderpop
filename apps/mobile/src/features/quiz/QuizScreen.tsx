import {
  ANALYTICS_EVENTS,
  type QuizQuestion,
  type QuizQuestionOption,
  type StartQuizResponse,
  type SubmitAnswerResponse,
  type Uuid,
} from '@wanderpop/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { trackAnalyticsEvent } from '../../services/analytics';
import { startQuiz, submitAnswer } from '../../services/quiz';
import { theme } from '../../styles/theme';

const FEEDBACK_COLORS = {
  successBackground: '#DCFCE7',
  successBorder: '#16A34A',
  successText: '#166534',
  errorBackground: '#FEE2E2',
  errorBorder: '#DC2626',
  errorText: '#991B1B',
} as const;

const TIMING_MS = {
  correctFunFactDelay: 1000,
  incorrectRevealCorrectDelay: 350,
  incorrectFunFactDelayAfterReveal: 1100,
} as const;

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

type OptionVisualState = 'default' | 'muted' | 'successSelected' | 'errorSelected' | 'successCorrect';

function getFirstUnansweredQuestionId(questions: QuizQuestion[]) {
  return questions.find((question) => !question.answered)?.id ?? null;
}

function getQuestionIndex(questions: QuizQuestion[], questionId: Uuid | null) {
  if (!questionId) {
    return -1;
  }

  return questions.findIndex((question) => question.id === questionId);
}

function getOptionVisualState(
  option: QuizQuestionOption,
  params: {
    isLocked: boolean;
    selectedOptionId: Uuid | null;
    correctOptionId: Uuid | null;
    showCorrectHighlight: boolean;
  },
): OptionVisualState {
  if (!params.isLocked) {
    return 'default';
  }

  const isSelected = option.id === params.selectedOptionId;
  const isCorrectOption = option.id === params.correctOptionId;

  if (isSelected && isCorrectOption) {
    return 'successSelected';
  }

  if (isSelected && !isCorrectOption) {
    return 'errorSelected';
  }

  if (isCorrectOption && params.showCorrectHighlight) {
    return 'successCorrect';
  }

  return 'muted';
}

function getOptionStatusLabel(visualState: OptionVisualState) {
  switch (visualState) {
    case 'successSelected':
      return '✓ Correct';
    case 'errorSelected':
      return '✕ Your answer';
    case 'successCorrect':
      return '✓ Correct answer';
    default:
      return null;
  }
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    challengeDate?: string | string[];
    citySlug?: string | string[];
    seasonSlug?: string | string[];
  }>();
  const challengeId = Array.isArray(params.challengeId)
    ? params.challengeId[0]
    : params.challengeId;
  const challengeDate = Array.isArray(params.challengeDate)
    ? params.challengeDate[0]
    : params.challengeDate;
  const citySlug = Array.isArray(params.citySlug) ? params.citySlug[0] : params.citySlug;
  const seasonSlug = Array.isArray(params.seasonSlug)
    ? params.seasonSlug[0]
    : params.seasonSlug;

  const [screenState, setScreenState] = useState<QuizScreenState>({ status: 'loading' });
  const [showCorrectHighlight, setShowCorrectHighlight] = useState(false);
  const [funFactVisible, setFunFactVisible] = useState(false);

  const trackedAttemptViewRef = useRef<string | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const windowHeight = Dimensions.get('window').height;

  const clearTimers = useCallback(() => {
    for (const timeoutId of timeoutRefs.current) {
      clearTimeout(timeoutId);
    }
    timeoutRefs.current = [];
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);
    timeoutRefs.current.push(timeoutId);
  }, []);

  const resetFeedbackUi = useCallback(() => {
    clearTimers();
    setShowCorrectHighlight(false);
    setFunFactVisible(false);
    slideAnim.setValue(windowHeight);
  }, [clearTimers, slideAnim, windowHeight]);

  const openFunFactTakeover = useCallback(() => {
    setFunFactVisible(true);
    slideAnim.setValue(windowHeight);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, windowHeight]);

  const closeFunFactTakeover = useCallback(
    (onClosed?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: windowHeight,
        duration: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setFunFactVisible(false);
          onClosed?.();
        }
      });
    },
    [slideAnim, windowHeight],
  );

  const scheduleFeedbackSequence = useCallback(
    (isCorrect: boolean) => {
      clearTimers();

      if (isCorrect) {
        setShowCorrectHighlight(true);
        scheduleTimeout(() => {
          openFunFactTakeover();
        }, TIMING_MS.correctFunFactDelay);
        return;
      }

      setShowCorrectHighlight(false);
      scheduleTimeout(() => {
        setShowCorrectHighlight(true);
      }, TIMING_MS.incorrectRevealCorrectDelay);
      scheduleTimeout(() => {
        openFunFactTakeover();
      }, TIMING_MS.incorrectRevealCorrectDelay + TIMING_MS.incorrectFunFactDelayAfterReveal);
    },
    [clearTimers, openFunFactTakeover, scheduleTimeout],
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const loadQuiz = useCallback(async () => {
    if (!challengeId) {
      setScreenState({
        status: 'error',
        message: 'This quiz is missing its challenge context. Please return home and try again.',
      });
      return;
    }

    resetFeedbackUi();
    setScreenState({ status: 'loading' });

    try {
      const response = await startQuiz({
        daily_challenge_id: challengeId,
        ...getCurrentLocalDateContext(),
      });

      if (citySlug && challengeDate) {
        const eventName =
          response.attempt.answered_count > 0
            ? ANALYTICS_EVENTS.QUIZ_RESUMED
            : ANALYTICS_EVENTS.QUIZ_STARTED;
        const eventKey = `${eventName}:${response.attempt.id}`;

        if (trackedAttemptViewRef.current !== eventKey) {
          trackedAttemptViewRef.current = eventKey;

          if (eventName === ANALYTICS_EVENTS.QUIZ_RESUMED) {
            trackAnalyticsEvent(ANALYTICS_EVENTS.QUIZ_RESUMED, {
              city_slug: citySlug,
              challenge_date: challengeDate,
              answered_count: response.attempt.answered_count,
              total_questions: response.attempt.total_questions,
            });
          } else if (seasonSlug) {
            trackAnalyticsEvent(ANALYTICS_EVENTS.QUIZ_STARTED, {
              city_slug: citySlug,
              season_slug: seasonSlug,
              challenge_date: challengeDate,
              total_questions: response.attempt.total_questions,
            });
          }
        }
      }

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
  }, [challengeDate, challengeId, citySlug, resetFeedbackUi, seasonSlug]);

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

  const isLastQuestion = useMemo(() => {
    if (screenState.status !== 'ready' || !screenState.currentQuestionId) {
      return false;
    }

    const currentIndex = getQuestionIndex(screenState.questions, screenState.currentQuestionId);
    const nextUnansweredQuestion =
      screenState.questions.slice(currentIndex + 1).find((question) => !question.answered) ??
      null;

    return nextUnansweredQuestion === null;
  }, [screenState]);

  const funFactImageUrl: string | null = null;

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

        if (citySlug && challengeDate) {
          trackAnalyticsEvent(ANALYTICS_EVENTS.QUESTION_ANSWERED, {
            city_slug: citySlug,
            challenge_date: challengeDate,
            question_order: currentQuestion.order,
            difficulty: currentQuestion.difficulty,
            is_correct: response.answer.is_correct,
          });
        }

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

        scheduleFeedbackSequence(response.answer.is_correct);
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
    [
      challengeDate,
      citySlug,
      currentQuestion,
      scheduleFeedbackSequence,
      screenState,
    ],
  );

  const handleNext = useCallback(() => {
    if (screenState.status !== 'ready') {
      return;
    }

    const currentIndex = getQuestionIndex(screenState.questions, screenState.currentQuestionId);
    const nextQuestion =
      screenState.questions.slice(currentIndex + 1).find((question) => !question.answered) ??
      null;

    const navigateToComplete = () => {
      router.push({
        pathname: '/quiz-complete',
        params: {
          attemptId: screenState.attempt.id,
          challengeDate,
          citySlug,
          seasonSlug,
        },
      });
    };

    const advance = () => {
      resetFeedbackUi();

      if (!nextQuestion) {
        navigateToComplete();
        return;
      }

      setScreenState({
        ...screenState,
        currentQuestionId: nextQuestion.id,
        feedback: null,
        lastAnswer: null,
        errorMessage: null,
      });
    };

    if (funFactVisible) {
      closeFunFactTakeover(advance);
      return;
    }

    advance();
  }, [
    challengeDate,
    citySlug,
    closeFunFactTakeover,
    funFactVisible,
    resetFeedbackUi,
    screenState,
    seasonSlug,
  ]);

  const renderFunFactTakeover = () => {
    if (screenState.status !== 'ready' || !screenState.feedback) {
      return null;
    }

    const nextLabel = isLastQuestion ? 'Complete Quiz' : 'Next Question';

    return (
      <Modal animationType="none" transparent visible={funFactVisible}>
        <View style={styles.takeoverBackdrop}>
          <Animated.View
            style={[styles.takeoverSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <SafeAreaView style={styles.takeoverSafeArea} edges={['top', 'bottom']}>
              <View style={styles.takeoverTopHalf}>
                {funFactImageUrl ? (
                  <Image
                    accessibilityLabel="Fun fact illustration"
                    resizeMode="cover"
                    source={{ uri: funFactImageUrl }}
                    style={styles.takeoverImage}
                  />
                ) : (
                  <View style={styles.takeoverImageFallback}>
                    <Text style={styles.takeoverFallbackBadge}>Fun fact</Text>
                    <Text style={styles.takeoverFallbackTitle}>Did you know?</Text>
                    <Text style={styles.takeoverFallbackBody}>
                      Image coming soon for this city&apos;s trivia moment.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.takeoverBottomHalf}>
                <View style={styles.takeoverHeaderRow}>
                  <Text style={styles.takeoverFunFactLabel}>Fun fact</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => closeFunFactTakeover()}
                    style={styles.reviewAnswerButton}
                  >
                    <Text style={styles.reviewAnswerLabel}>Review Answer</Text>
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.takeoverScrollContent}
                  style={styles.takeoverScroll}
                >
                  <Text style={styles.takeoverFunFactText}>{screenState.feedback.fun_fact}</Text>
                </ScrollView>

                <Button onPress={handleNext}>{nextLabel}</Button>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

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
        </View>
      </Screen>
    );
  }

  if (
    !currentQuestion ||
    (allQuestionsAnswered && !screenState.feedback && !funFactVisible)
  ) {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.step}>All questions answered</Text>
          <Text style={styles.title}>Quiz complete</Text>
          <Text style={styles.body}>
            Every question in this attempt has been answered. Finish the quiz to see your score
            and stamp.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={() =>
              router.push({
                pathname: '/quiz-complete',
                params: {
                  attemptId: screenState.attempt.id,
                  challengeDate,
                  citySlug,
                  seasonSlug,
                },
              })
            }
          >
            Complete Quiz
          </Button>
        </View>
      </Screen>
    );
  }

  const isQuestionLocked =
    currentQuestion.answered || Boolean(screenState.feedback) || screenState.isSubmitting;
  const correctOptionId = screenState.lastAnswer?.correct_option_id ?? null;
  const selectedOptionId = screenState.lastAnswer?.selected_option_id ?? null;
  const showReviewActions = Boolean(screenState.feedback) && !funFactVisible;

  return (
    <>
      <Screen>
        <View style={styles.card}>
          <Text style={styles.step}>
            Question {currentQuestionIndex + 1} of {screenState.attempt.total_questions}
          </Text>
          <Text style={styles.title}>{currentQuestion.question_text}</Text>

          {screenState.errorMessage ? (
            <Text style={styles.errorText}>{screenState.errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {currentQuestion.options.map((option) => {
            const visualState = getOptionVisualState(option, {
              isLocked: isQuestionLocked,
              selectedOptionId,
              correctOptionId,
              showCorrectHighlight,
            });
            const statusLabel = getOptionStatusLabel(visualState);
            const isPressable = visualState === 'default' && !screenState.isSubmitting;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !isPressable }}
                disabled={!isPressable}
                key={option.id}
                onPress={() => void handleSubmitAnswer(option.id)}
                style={({ pressed }) => [
                  styles.answerOption,
                  visualState === 'default' && styles.answerOptionDefault,
                  visualState === 'muted' && styles.answerOptionMuted,
                  visualState === 'successSelected' && styles.answerOptionSuccess,
                  visualState === 'successCorrect' && styles.answerOptionSuccess,
                  visualState === 'errorSelected' && styles.answerOptionError,
                  pressed && isPressable && styles.answerOptionPressed,
                ]}
              >
                {statusLabel ? (
                  <Text
                    style={[
                      styles.answerStatusLabel,
                      (visualState === 'successSelected' || visualState === 'successCorrect') &&
                        styles.answerStatusSuccess,
                      visualState === 'errorSelected' && styles.answerStatusError,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.answerOptionText,
                    visualState === 'muted' && styles.answerOptionTextMuted,
                    (visualState === 'successSelected' || visualState === 'successCorrect') &&
                      styles.answerOptionTextSuccess,
                    visualState === 'errorSelected' && styles.answerOptionTextError,
                  ]}
                >
                  {option.text}
                </Text>
              </Pressable>
            );
          })}

          {showReviewActions ? (
            <>
              <Button onPress={openFunFactTakeover}>Show Fun Fact</Button>
              <Button onPress={handleNext}>
                {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
              </Button>
            </>
          ) : null}
        </View>
      </Screen>

      {renderFunFactTakeover()}
    </>
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
  actions: {
    gap: theme.spacing.md,
  },
  answerOption: {
    borderRadius: theme.radius.md,
    borderWidth: 2,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  answerOptionDefault: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  answerOptionMuted: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.disabled,
    opacity: 0.7,
  },
  answerOptionSuccess: {
    backgroundColor: FEEDBACK_COLORS.successBackground,
    borderColor: FEEDBACK_COLORS.successBorder,
  },
  answerOptionError: {
    backgroundColor: FEEDBACK_COLORS.errorBackground,
    borderColor: FEEDBACK_COLORS.errorBorder,
  },
  answerOptionPressed: {
    opacity: 0.85,
  },
  answerStatusLabel: {
    fontSize: theme.typography.small,
    fontWeight: '800',
  },
  answerStatusSuccess: {
    color: FEEDBACK_COLORS.successText,
  },
  answerStatusError: {
    color: FEEDBACK_COLORS.errorText,
  },
  answerOptionText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  answerOptionTextMuted: {
    color: theme.colors.mutedText,
  },
  answerOptionTextSuccess: {
    color: FEEDBACK_COLORS.successText,
  },
  answerOptionTextError: {
    color: FEEDBACK_COLORS.errorText,
  },
  takeoverBackdrop: {
    backgroundColor: 'rgba(31, 41, 55, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  takeoverSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    flex: 1,
    overflow: 'hidden',
  },
  takeoverSafeArea: {
    flex: 1,
  },
  takeoverTopHalf: {
    flex: 1,
  },
  takeoverImage: {
    flex: 1,
    width: '100%',
  },
  takeoverImageFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  takeoverFallbackBadge: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  takeoverFallbackTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  takeoverFallbackBody: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  takeoverBottomHalf: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flex: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  takeoverHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  takeoverFunFactLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reviewAnswerButton: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  reviewAnswerLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
  },
  takeoverScroll: {
    flex: 1,
  },
  takeoverScrollContent: {
    paddingBottom: theme.spacing.sm,
  },
  takeoverFunFactText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 26,
  },
});
