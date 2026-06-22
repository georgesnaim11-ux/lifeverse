import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type {
  CharacterCreationInput,
  CharacterState,
  GetCharacterResponse,
  PresentedEvent,
  EarnedAchievement,
  Finance,
  Career,
  Education,
  EventLogEntry,
  Relationship,
  FocusBudget,
  FocusAction,
  EarnedAchievement as AchievementType,
  DomainState,
  CharacterResources,
  ActivityDefinition,
  LifeSummary,
} from '@lifeverse/shared';

type GamePhase = 'home' | 'creating' | 'playing' | 'events' | 'outcome' | 'dead';

interface GameState {
  phase: GamePhase;
  charState: CharacterState | null;
  fullData: GetCharacterResponse | null;
  pendingEvents: PresentedEvent[];
  currentEventIndex: number;
  lastOutcome: string | null;
  newAchievements: AchievementType[];
  isDead: boolean;
  isLoading: boolean;
  error: string | null;
  actionMessage: string | null;
  lifeSummary: LifeSummary | null;
}

const INITIAL_STATE: GameState = {
  phase: 'home',
  charState: null,
  fullData: null,
  pendingEvents: [],
  currentEventIndex: 0,
  lastOutcome: null,
  newAchievements: [],
  isDead: false,
  isLoading: false,
  error: null,
  actionMessage: null,
  lifeSummary: null,
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const setLoading = (loading: boolean) =>
    setState((s) => ({ ...s, isLoading: loading, error: null }));

  const setError = (error: string) =>
    setState((s) => ({ ...s, isLoading: false, error }));

  const startCreation = useCallback(() => {
    setState((s) => ({ ...s, phase: 'creating', error: null }));
  }, []);

  const createCharacter = useCallback(async (input: CharacterCreationInput) => {
    setLoading(true);
    try {
      const { state: charState } = await api.createCharacter(input);
      const fullData = await api.getCharacter(charState.character.id);
      setState((s) => ({ ...s, phase: 'playing', charState, fullData, isLoading: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create character');
    }
  }, []);

  const ageUp = useCallback(async () => {
    if (!state.charState) return;
    setLoading(true);
    try {
      const result = await api.ageUp({ characterId: state.charState.character.id });
      if (result.isDead) {
        setState((s) => ({
          ...s, phase: 'dead', charState: result.state, isDead: true, isLoading: false,
          lifeSummary: result.lifeSummary ?? null,
        }));
        return;
      }
      if (result.events.length === 0) {
        // Refresh full data and stay in playing phase
        const fullData = await api.getCharacter(result.state.character.id);
        setState((s) => ({
          ...s, phase: 'playing', charState: result.state, fullData,
          newAchievements: result.newAchievements, isLoading: false,
        }));
      } else {
        const fullData = await api.getCharacter(result.state.character.id);
        setState((s) => ({
          ...s, phase: 'events', charState: result.state, fullData,
          pendingEvents: result.events, currentEventIndex: 0,
          newAchievements: result.newAchievements, lastOutcome: null, isLoading: false,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to age up');
    }
  }, [state.charState]);

  const makeChoice = useCallback(async (eventId: string, choiceId: string) => {
    if (!state.charState) return;
    setLoading(true);
    try {
      const result = await api.choose({
        characterId: state.charState.character.id,
        eventId,
        choiceId,
      });

      const isLastEvent = state.currentEventIndex >= state.pendingEvents.length - 1;
      const outcome = result.logEntry.outcomeText;

      if (isLastEvent) {
        const fullData = await api.getCharacter(result.state.character.id);
        setState((s) => ({
          ...s, phase: 'outcome', charState: result.state, fullData,
          lastOutcome: outcome, currentEventIndex: s.currentEventIndex,
          newAchievements: [...s.newAchievements, ...result.newAchievements],
          isLoading: false,
        }));
      } else {
        setState((s) => ({
          ...s, charState: result.state, lastOutcome: outcome,
          currentEventIndex: s.currentEventIndex + 1,
          newAchievements: [...s.newAchievements, ...result.newAchievements],
          isLoading: false,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply choice');
    }
  }, [state.charState, state.currentEventIndex, state.pendingEvents.length]);

  const spendFocus = useCallback(async (actionKey: string) => {
    if (!state.charState) return;
    setLoading(true);
    try {
      const result = await api.focusAction({ characterId: state.charState.character.id, actionKey });
      const fullData = await api.getCharacter(result.state.character.id);
      setState((s) => ({ ...s, charState: result.state, fullData, isLoading: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to spend focus');
    }
  }, [state.charState]);

  const performActivity = useCallback(async (activityId: string) => {
    if (!state.charState) return;
    setLoading(true);
    try {
      await api.performActivity({ characterId: state.charState.character.id, activityId });
      const fullData = await api.getCharacter(state.charState.character.id);
      setState((s) => ({ ...s, charState: { ...s.charState!, stats: fullData.state.stats }, fullData, isLoading: false, error: null }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to perform activity');
    }
  }, [state.charState]);

  /**
   * Run any action that returns { message }, then refresh full state.
   * Returns the server message (or throws-as-error into state).
   */
  const runAction = useCallback(async (fn: (characterId: string) => Promise<{ message: string }>) => {
    if (!state.charState) return;
    const characterId = state.charState.character.id;
    setLoading(true);
    try {
      const { message } = await fn(characterId);
      const fullData = await api.getCharacter(characterId);
      setState((s) => ({
        ...s,
        charState: { ...s.charState!, stats: fullData.state.stats, character: fullData.state.character, traits: fullData.state.traits },
        fullData, isLoading: false, error: null, actionMessage: message,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  }, [state.charState]);

  const applyJob     = useCallback((jobId: string) => runAction((id) => api.applyJob(id, jobId)), [runAction]);
  const promote      = useCallback(() => runAction(api.promote), [runAction]);
  const workHard     = useCallback(() => runAction(api.workHard), [runAction]);
  const quitJob      = useCallback(() => runAction(api.quitJob), [runAction]);
  const enroll       = useCallback((level: 'trade' | 'university' | 'graduate', major?: string) => runAction((id) => api.enroll(id, level, major)), [runAction]);
  const study        = useCallback(() => runAction(api.study), [runAction]);
  const attendClass  = useCallback(() => runAction(api.attendClass), [runAction]);
  const takeExam     = useCallback(() => runAction(api.takeExam), [runAction]);
  const buyProperty  = useCallback((t: string) => runAction((id) => api.buyProperty(id, t)), [runAction]);
  const buyVehicle   = useCallback((t: string) => runAction((id) => api.buyVehicle(id, t)), [runAction]);
  const findPartner      = useCallback(() => runAction(api.findPartner), [runAction]);
  const goOnDate         = useCallback(() => runAction(api.goOnDate), [runAction]);
  const propose          = useCallback(() => runAction(api.propose), [runAction]);
  const planWedding      = useCallback((tier: string) => runAction((id) => api.planWedding(id, tier)), [runAction]);
  const delayWedding     = useCallback(() => runAction(api.delayWedding), [runAction]);
  const cancelEngagement = useCallback(() => runAction(api.cancelEngagement), [runAction]);
  const breakUp          = useCallback(() => runAction(api.breakUp), [runAction]);
  const rentProperty       = useCallback((key: string) => runAction((id) => api.rentProperty(id, key)), [runAction]);
  const buyHome            = useCallback((key: string, moveIn = true) => runAction((id) => api.buyHome(id, key, moveIn)), [runAction]);
  const sellProperty       = useCallback((propertyId: string) => runAction((id) => api.sellProperty(id, propertyId)), [runAction]);
  const setResidence       = useCallback((propertyId: string) => runAction((id) => api.setResidence(id, propertyId)), [runAction]);
  const toggleRentOut      = useCallback((propertyId: string) => runAction((id) => api.toggleRentOut(id, propertyId)), [runAction]);
  const moveInParents      = useCallback(() => runAction(api.moveInParents), [runAction]);
  const buyCar             = useCallback((modelKey: string, year: number, condition: string, primary = false) => runAction((id) => api.buyCar(id, modelKey, year, condition, primary)), [runAction]);
  const sellVehicle        = useCallback((vehicleId: string) => runAction((id) => api.sellVehicle(id, vehicleId)), [runAction]);
  const setPrimaryVehicle  = useCallback((vehicleId: string) => runAction((id) => api.setPrimaryVehicle(id, vehicleId)), [runAction]);
  const serviceVehicle     = useCallback((vehicleId: string) => runAction((id) => api.serviceVehicle(id, vehicleId)), [runAction]);
  const repairVehicle      = useCallback((vehicleId: string) => runAction((id) => api.repairVehicle(id, vehicleId)), [runAction]);
  const washVehicle        = useCallback((vehicleId: string) => runAction((id) => api.washVehicle(id, vehicleId)), [runAction]);
  const tryForBaby         = useCallback(() => runAction(api.tryForBaby), [runAction]);
  const toggleBirthControl = useCallback(() => runAction(api.toggleBirthControl), [runAction]);
  const divorce            = useCallback(() => runAction(api.divorce), [runAction]);
  const clearMessage = useCallback(() => setState((s) => ({ ...s, actionMessage: null })), []);

  const continueAfterOutcome = useCallback(async () => {
    if (!state.charState) return;
    const fullData = await api.getCharacter(state.charState.character.id);
    setState((s) => ({
      ...s, phase: 'playing', fullData, pendingEvents: [],
      currentEventIndex: 0, lastOutcome: null, newAchievements: [],
    }));
  }, [state.charState]);

  const dismissAchievements = useCallback(() => {
    setState((s) => ({ ...s, newAchievements: [] }));
  }, []);

  const resetGame = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    currentEvent: state.pendingEvents[state.currentEventIndex] ?? null,
    totalEvents: state.pendingEvents.length,
    startCreation,
    createCharacter,
    ageUp,
    makeChoice,
    spendFocus,
    performActivity,
    applyJob,
    promote,
    workHard,
    quitJob,
    enroll,
    study,
    attendClass,
    takeExam,
    buyProperty,
    buyVehicle,
    findPartner,
    goOnDate,
    propose,
    planWedding,
    delayWedding,
    cancelEngagement,
    breakUp,
    tryForBaby,
    toggleBirthControl,
    divorce,
    rentProperty,
    buyHome,
    sellProperty,
    setResidence,
    toggleRentOut,
    moveInParents,
    buyCar,
    sellVehicle,
    setPrimaryVehicle,
    serviceVehicle,
    repairVehicle,
    washVehicle,
    clearMessage,
    continueAfterOutcome,
    dismissAchievements,
    resetGame,
  };
}

// Re-export types for component use
export type {
  CharacterCreationInput,
  CharacterState,
  GetCharacterResponse,
  PresentedEvent,
  EarnedAchievement,
  Finance,
  Career,
  Education,
  EventLogEntry,
  Relationship,
  FocusBudget,
  FocusAction,
  DomainState,
  CharacterResources,
  ActivityDefinition,
};
