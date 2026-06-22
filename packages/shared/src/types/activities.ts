import type { LifeStage } from './enums.js';
import type { StatCondition, StatDelta } from './stats.js';
import type { DomainKey, DomainDelta } from './domains.js';

export interface ActivityDefinition {
  id: string;
  label: string;
  description: string;
  domain: DomainKey;
  secondaryDomain?: DomainKey;
  timeCost: number;
  mentalCost?: number;
  physicalCost?: number;
  moneyCost?: number;
  statDeltas?: StatDelta[];
  /** Additional stat deltas that bypass the normal system (e.g. stress reduction). */
  statDeltasOverride?: StatDelta[];
  domainGains?: DomainDelta[];
  energyRestore?: { mental?: number; physical?: number };
  burnoutRisk?: number;
  stages?: LifeStage[];
  minAge?: number;
  maxAge?: number;
  minDomainLevel?: Partial<Record<DomainKey, number>>;
  requiredFlags?: string[];
  blockedFlags?: string[];
  requiredStats?: StatCondition[];
  weight?: number;
  tags?: string[];
}

export interface PerformedActivity {
  activityId: string;
  timeCost: number;
  mentalCost: number;
  physicalCost: number;
  moneyCost: number;
}
