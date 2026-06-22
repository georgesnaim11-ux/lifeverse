import type {
  CreateCharacterRequest,
  CreateCharacterResponse,
  GetCharacterResponse,
  AgeUpRequest,
  AgeUpResponse,
  ChooseRequest,
  ChooseResponse,
  FocusActionRequest,
  FocusActionResponse,
  PerformActivityRequest,
  PerformActivityResponse,
  CreateSaveRequest,
  CreateSaveResponse,
} from '@lifeverse/shared';

const BASE = '/api';

async function post<TBody, TResult>(path: string, body: TBody): Promise<TResult> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json() as { data?: TResult; error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
  }
  return json.data as TResult;
}

async function get<TResult>(path: string): Promise<TResult> {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json() as { data?: TResult; error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
  }
  return json.data as TResult;
}

export const api = {
  createCharacter: (body: CreateCharacterRequest) =>
    post<CreateCharacterRequest, CreateCharacterResponse>('/character', body),

  getCharacter: (id: string) =>
    get<GetCharacterResponse>(`/character/${id}`),

  ageUp: (body: AgeUpRequest) =>
    post<AgeUpRequest, AgeUpResponse>('/game/age-up', body),

  choose: (body: ChooseRequest) =>
    post<ChooseRequest, ChooseResponse>('/game/choose', body),

  focusAction: (body: FocusActionRequest) =>
    post<FocusActionRequest, FocusActionResponse>('/game/focus-action', body),

  performActivity: (body: PerformActivityRequest) =>
    post<PerformActivityRequest, PerformActivityResponse>('/activity/perform', body),

  // Careers
  applyJob: (characterId: string, jobId: string) =>
    post<{ characterId: string; jobId: string }, { message: string }>('/career/apply', { characterId, jobId }),
  promote: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/career/promote', { characterId }),
  workHard: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/career/work-hard', { characterId }),
  quitJob: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/career/quit', { characterId }),

  // Education
  enroll: (characterId: string, level: 'trade' | 'university' | 'graduate', major?: string) =>
    post<{ characterId: string; level: string; major?: string }, { message: string }>('/education/enroll', { characterId, level, ...(major ? { major } : {}) }),
  study: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/education/study', { characterId }),
  attendClass: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/education/attend-class', { characterId }),
  takeExam: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/education/take-exam', { characterId }),

  // Shopping
  buyProperty: (characterId: string, propertyType: string) =>
    post<{ characterId: string; propertyType: string }, { message: string }>('/shop/buy-property', { characterId, propertyType }),
  buyVehicle: (characterId: string, vehicleType: string) =>
    post<{ characterId: string; vehicleType: string }, { message: string }>('/shop/buy-vehicle', { characterId, vehicleType }),

  // Housing
  rentProperty: (characterId: string, propertyKey: string) =>
    post<{ characterId: string; propertyKey: string }, { message: string }>('/housing/rent', { characterId, propertyKey }),
  buyHome: (characterId: string, propertyKey: string, moveIn = true) =>
    post<{ characterId: string; propertyKey: string; moveIn: boolean }, { message: string }>('/housing/buy', { characterId, propertyKey, moveIn }),
  sellProperty: (characterId: string, propertyId: string) =>
    post<{ characterId: string; propertyId: string }, { message: string }>('/housing/sell', { characterId, propertyId }),
  setResidence: (characterId: string, propertyId: string) =>
    post<{ characterId: string; propertyId: string }, { message: string }>('/housing/set-residence', { characterId, propertyId }),
  toggleRentOut: (characterId: string, propertyId: string) =>
    post<{ characterId: string; propertyId: string }, { message: string }>('/housing/rent-out', { characterId, propertyId }),
  moveInParents: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/housing/move-in-parents', { characterId }),

  // Relationships / love
  findPartner: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/find-partner', { characterId }),
  goOnDate: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/date', { characterId }),
  propose: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/propose', { characterId }),
  planWedding: (characterId: string, tier: string) =>
    post<{ characterId: string; tier: string }, { message: string }>('/relationship/plan-wedding', { characterId, tier }),
  delayWedding: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/delay-wedding', { characterId }),
  cancelEngagement: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/cancel-engagement', { characterId }),
  breakUp: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/break-up', { characterId }),
  tryForBaby: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/try-for-baby', { characterId }),
  toggleBirthControl: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/birth-control', { characterId }),
  divorce: (characterId: string) =>
    post<{ characterId: string }, { message: string }>('/relationship/divorce', { characterId }),

  save: (body: CreateSaveRequest) =>
    post<CreateSaveRequest, CreateSaveResponse>('/save', body),
};
