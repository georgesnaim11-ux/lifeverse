export const DomainKey = {
  Academic: 'academic',
  Physical: 'physical',
  Career: 'career',
  Social: 'social',
  Creative: 'creative',
  Mental: 'mental',
} as const;
export type DomainKey = (typeof DomainKey)[keyof typeof DomainKey];
export const DOMAIN_KEYS: readonly DomainKey[] = Object.values(DomainKey);

export interface DomainState {
  characterId: string;
  academic: number;
  physical: number;
  career: number;
  social: number;
  creative: number;
  mental: number;
  academicMomentum: number;
  physicalMomentum: number;
  careerMomentum: number;
  socialMomentum: number;
  creativeMomentum: number;
  mentalMomentum: number;
  academicNeglect: number;
  physicalNeglect: number;
  careerNeglect: number;
  socialNeglect: number;
  creativeNeglect: number;
  mentalNeglect: number;
  updatedAt: string;
}

export interface DomainDelta {
  domain: DomainKey;
  amount: number;
}
