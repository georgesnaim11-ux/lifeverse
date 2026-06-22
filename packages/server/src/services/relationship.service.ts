import { RelationshipsModel, FlagsModel, FinanceModel, StatsModel, CharacterModel, EventLogModel } from '../models/index.js';
import { GAME_CONSTANTS, RelationType, RelationStage, WeddingTier, randomFirstName, randomSurname } from '@lifeverse/shared';
import type { Relationship, PartnerMeta, TraitKey } from '@lifeverse/shared';
import { getBondDecayMultiplier } from '../engine/trait.engine.js';

const PARTNER_OCCUPATIONS = [
  'Nurse', 'Graphic Designer', 'Barista', 'Teacher', 'Software Developer',
  'Accountant', 'Chef', 'Photographer', 'Sales Rep', 'Electrician',
  'Marketing Coordinator', 'Physiotherapist', 'Writer', 'Bartender', 'Engineer',
];
const PARTNER_EDUCATION = ['High School', 'Trade School', "Bachelor's Degree", "Master's Degree"];
const FAMILY_OCCUPATIONS = ['Teacher', 'Accountant', 'Nurse', 'Electrician', 'Manager', 'Chef', 'Driver', 'Retired', 'Shopkeeper', 'Engineer', 'Homemaker', 'Mechanic', 'Clerk', 'Farmer'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1]! : 'Smith';
}

/** Map a child's age to an education stage label. */
function childEducationForAge(age: number): string {
  if (age >= 18) return 'Graduated';
  if (age >= 14) return 'High School';
  if (age >= 12) return 'Middle School';
  if (age >= 5) return 'Elementary';
  return 'Not in school';
}

/** Log a romantic milestone to the life feed. */
function logMilestone(characterId: string, age: number, kind: string, text: string): void {
  EventLogModel.create(characterId, `milestone:${kind}`, age, 'milestone', text);
}

const WEDDING_TIERS: Record<WeddingTier, { cost: number; happiness: number; label: string }> = {
  [WeddingTier.Small]:    { cost: 5000,  happiness: 12, label: 'a small, intimate wedding' },
  [WeddingTier.Standard]: { cost: 20000, happiness: 20, label: 'a beautiful standard wedding' },
  [WeddingTier.Luxury]:   { cost: 60000, happiness: 34, label: 'a lavish luxury wedding' },
};

export const RelationshipService = {
  annualDecay(characterId: string, traitKeys: TraitKey[]): void {
    const multiplier = getBondDecayMultiplier(traitKeys);
    const decayAmount = Math.round(GAME_CONSTANTS.relationships.bondDecayPerYear * multiplier);
    RelationshipsModel.decayBonds(characterId, decayAmount);
  },

  nurtureRelationships(characterId: string): void {
    const all = RelationshipsModel.findByCharacterId(characterId);
    for (const rel of all) {
      if (rel.isAlive && rel.bond < 100) {
        RelationshipsModel.updateBondAndTrust(rel.id, 5, 2);
      }
    }
  },

  /* ───────────── Romantic progression ───────────── */

  /** Find a new partner and start dating. Gated by age 16+ and being single. */
  findPartner(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    if (character.age < 16) throw new Error('You are too young to date.');
    const existing = RelationshipsModel.findPartner(characterId);
    if (existing) throw new Error('You already have a partner.');

    // Marriage rule (this version): male ↔ female. Partner is the opposite gender.
    const partnerGender: 'male' | 'female' = character.gender === 'male' ? 'female' : 'male';
    const partnerMeta: PartnerMeta = {
      age: Math.max(16, character.age + Math.floor(Math.random() * 7) - 3),
      occupation: character.age >= 22 ? pick(PARTNER_OCCUPATIONS) : 'Student',
      education: character.age >= 22 ? pick(PARTNER_EDUCATION) : 'In School',
      happiness: 55 + Math.floor(Math.random() * 30),
      gender: partnerGender,
      datingStartAge: character.age,
      sharedAssets: [],
    };
    // Culturally-matched name from the character's country; partner keeps own surname.
    const name = `${randomFirstName(character.country, partnerGender)} ${randomSurname(character.country)}`;
    RelationshipsModel.create({
      characterId, name, type: RelationType.Partner,
      bond: 50, trust: 50, stage: RelationStage.Dating, partner: partnerMeta,
    });
    FlagsModel.set(characterId, 'hasPartner', true);
    FlagsModel.set(characterId, 'becameExclusive', false);
    logMilestone(characterId, character.age, 'first_meeting', `You met ${name} and started dating.`);
    return { message: `You started dating ${name}!` };
  },

  /** Go on a date — strengthens the bond and lifts both partners' happiness. */
  goOnDate(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner) throw new Error('You need a partner first.');

    const meta = partner.partner;
    const newBond = Math.min(100, partner.bond + 8);
    const updatedMeta: PartnerMeta = meta
      ? { ...meta, happiness: Math.min(100, meta.happiness + 5) }
      : { age: character.age, occupation: 'Unknown', education: 'Unknown', happiness: 60, datingStartAge: character.age };
    RelationshipsModel.updatePartner(partner.id, { bond: newBond, trust: Math.min(100, partner.trust + 3), partner: updatedMeta });

    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, stats.happiness + 4) });

    // Auto-upgrade to "exclusive" once, the first time the bond crosses 70.
    if (newBond >= 70 && partner.stage === RelationStage.Dating && !FlagsModel.get(characterId, 'becameExclusive')) {
      FlagsModel.set(characterId, 'becameExclusive', true);
      logMilestone(characterId, character.age, 'exclusive', `You and ${partner.name} became exclusive.`);
    }
    return { message: `You had a lovely time with ${partner.name}.` };
  },

  /** Propose. Requires dating + a strong bond. */
  propose(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    if (character.age < 18) throw new Error('You must be 18 to get engaged.');
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner) throw new Error('You need a partner first.');
    if (partner.stage === RelationStage.Engaged) throw new Error('You are already engaged.');
    if (partner.stage === RelationStage.Married) throw new Error('You are already married.');
    if (partner.bond < GAME_CONSTANTS.relationships.marriageBondThreshold) {
      throw new Error(`${partner.name} isn't ready — strengthen your relationship first.`);
    }

    const meta: PartnerMeta = { ...(partner.partner as PartnerMeta), engagementAge: character.age };
    RelationshipsModel.updatePartner(partner.id, { stage: RelationStage.Engaged, partner: meta, bond: Math.min(100, partner.bond + 5) });
    FlagsModel.set(characterId, 'isEngaged', true);
    logMilestone(characterId, character.age, 'engagement', `You proposed to ${partner.name} — they said yes!`);
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, stats.happiness + 10) });
    return { message: `${partner.name} said YES! You're engaged.` };
  },

  /** Plan a wedding of a given tier (costs money). Marries the couple. */
  planWedding(characterId: string, tier: WeddingTier): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner) throw new Error('You have no partner.');
    if (partner.stage !== RelationStage.Engaged) throw new Error('You need to be engaged first.');

    const tierDef = WEDDING_TIERS[tier];
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < tierDef.cost) {
      throw new Error(`You can't afford ${tierDef.label} ($${tierDef.cost.toLocaleString()}).`);
    }
    FinanceModel.update(characterId, { cash: finance.cash - tierDef.cost });

    const meta: PartnerMeta = { ...(partner.partner as PartnerMeta), marriageAge: character.age };
    RelationshipsModel.updatePartner(partner.id, { stage: RelationStage.Married, partner: meta, bond: Math.min(100, partner.bond + 8) });
    FlagsModel.set(characterId, 'isMarried', true);
    FlagsModel.set(characterId, 'isEngaged', false);
    logMilestone(characterId, character.age, 'wedding', `You married ${partner.name} in ${tierDef.label}.`);
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, stats.happiness + tierDef.happiness) });
    return { message: `You married ${partner.name}! 💍` };
  },

  delayWedding(characterId: string): { message: string } {
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner || partner.stage !== RelationStage.Engaged) throw new Error('You are not engaged.');
    const meta = partner.partner;
    if (meta) {
      RelationshipsModel.updatePartner(partner.id, { partner: { ...meta, happiness: Math.max(0, meta.happiness - 6) } });
    }
    return { message: `You postponed the wedding. ${partner.name} is a little disappointed.` };
  },

  cancelEngagement(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner || partner.stage !== RelationStage.Engaged) throw new Error('You are not engaged.');
    RelationshipsModel.updatePartner(partner.id, { stage: RelationStage.Dating, bond: Math.max(0, partner.bond - 25) });
    FlagsModel.set(characterId, 'isEngaged', false);
    if (character) logMilestone(characterId, character.age, 'engagement_cancelled', `You called off your engagement with ${partner.name}.`);
    return { message: `You called off the engagement with ${partner.name}.` };
  },

  breakUp(characterId: string): { message: string } {
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner) throw new Error('You have no partner.');
    RelationshipsModel.markDeceased(partner.id); // remove from active set
    FlagsModel.set(characterId, 'hasPartner', false);
    FlagsModel.set(characterId, 'isEngaged', false);
    FlagsModel.set(characterId, 'isMarried', false);
    return { message: `You broke up with ${partner.name}.` };
  },

  /* ───────────── Family helpers (used by events) ───────────── */

  marry(characterId: string): Relationship | null {
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner || partner.bond < GAME_CONSTANTS.relationships.marriageBondThreshold) return null;
    FlagsModel.set(characterId, 'isMarried', true);
    return RelationshipsModel.updatePartner(partner.id, { stage: RelationStage.Married, bond: Math.min(100, partner.bond + 10) });
  },

  addChild(characterId: string, childName: string): Relationship {
    FlagsModel.set(characterId, 'hasChildren', true);
    return RelationshipsModel.create({
      characterId, name: childName, type: RelationType.Child, bond: 70, trust: 70,
    });
  },

  /* ───────────── Family generation (at birth) ───────────── */

  /**
   * Generate a culturally-matched family at birth. Blood relatives share the
   * family surname; in-laws (uncle/cousin on that side) get a country surname
   * of their own.
   */
  generateFamily(characterId: string, countryId: string, surname: string): void {
    const mk = (type: RelationType, gender: 'male' | 'female', age: number, bond: number, useFamilySurname = true): void => {
      const last = useFamilySurname ? surname : randomSurname(countryId);
      const name = `${randomFirstName(countryId, gender)} ${last}`;
      const meta: PartnerMeta = {
        age,
        occupation: age >= 65 ? 'Retired' : pick(FAMILY_OCCUPATIONS),
        education: pick(PARTNER_EDUCATION),
        happiness: randInt(55, 90),
        health: randInt(55, 95),
        gender,
      };
      RelationshipsModel.create({ characterId, name, type, bond, trust: bond, partner: meta });
    };

    // Immediate family (share the family surname)
    mk(RelationType.Parent, 'female', randInt(26, 40), randInt(70, 90)); // Mother
    mk(RelationType.Parent, 'male', randInt(28, 44), randInt(65, 88));   // Father

    // Siblings (0–3)
    const siblings = randInt(0, 3);
    for (let i = 0; i < siblings; i++) {
      mk(RelationType.Sibling, Math.random() < 0.5 ? 'male' : 'female', randInt(0, 12), randInt(45, 85));
    }

    // Grandparents (2–4 still living)
    const grandparents = randInt(2, 4);
    for (let i = 0; i < grandparents; i++) {
      mk(RelationType.Grandparent, i % 2 === 0 ? 'female' : 'male', randInt(58, 78), randInt(55, 85));
    }

    // Extended family
    if (Math.random() < 0.8) mk(RelationType.Aunt, 'female', randInt(30, 55), randInt(40, 75));
    if (Math.random() < 0.8) mk(RelationType.Uncle, 'male', randInt(30, 55), randInt(40, 75), false);
    const cousins = randInt(0, 2);
    for (let i = 0; i < cousins; i++) {
      mk(RelationType.Cousin, Math.random() < 0.5 ? 'male' : 'female', randInt(2, 18), randInt(35, 70), false);
    }
  },

  /* ───────────── Children & family planning ───────────── */

  toggleBirthControl(characterId: string): { message: string } {
    const on = FlagsModel.get(characterId, 'birthControl');
    FlagsModel.set(characterId, 'birthControl', !on);
    return { message: on ? 'Birth control turned off — open to having children.' : 'Birth control turned on.' };
  },

  /** Try for a baby. Requires a partner and reasonable age. */
  tryForBaby(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner) throw new Error('You need a partner to start a family.');
    if (character.age < 18) throw new Error('You are too young to start a family.');
    if (character.age > 55) throw new Error('You are past the age to have children naturally.');
    if (FlagsModel.get(characterId, 'birthControl')) throw new Error('Turn off birth control first.');

    const childCount = RelationshipsModel.findByCharacterId(characterId).filter((r) => r.type === RelationType.Child).length;
    if (childCount >= 4) throw new Error('You already have a large family.');

    // Conception chance falls with age
    const chance = character.age <= 35 ? 0.7 : character.age <= 45 ? 0.4 : 0.15;
    if (Math.random() > chance) {
      return { message: 'No luck this year. Keep trying.' };
    }
    const gender: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female';
    const surname = surnameOf(character.name);
    const name = `${randomFirstName(character.country, gender)} ${surname}`;
    const meta: PartnerMeta = { age: 0, occupation: 'Child', education: 'Not in school', happiness: 80, health: 90, gender };
    RelationshipsModel.create({ characterId, name, type: RelationType.Child, bond: 80, trust: 80, partner: meta });
    FlagsModel.set(characterId, 'hasChildren', true);
    EventLogModel.create(characterId, 'milestone:birth', character.age, 'milestone', `Welcomed a new ${gender === 'male' ? 'son' : 'daughter'}, ${name}, into the world.`);
    return { message: `Congratulations! ${name} was born. 👶` };
  },

  /* ───────────── Divorce ───────────── */

  divorce(characterId: string): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner || partner.stage !== RelationStage.Married) throw new Error('You are not married.');

    // Split assets: spouse takes half the cash.
    const finance = FinanceModel.findByCharacterId(characterId);
    let lost = 0;
    if (finance) {
      lost = Math.round(finance.cash / 2);
      FinanceModel.update(characterId, { cash: finance.cash - lost });
    }
    RelationshipsModel.markDeceased(partner.id);
    FlagsModel.set(characterId, 'isMarried', false);
    FlagsModel.set(characterId, 'hasPartner', false);
    FlagsModel.set(characterId, 'isEngaged', false);

    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.max(0, stats.happiness - 15), stress: Math.min(100, stats.stress + 15) });

    EventLogModel.create(characterId, 'milestone:divorce', character.age, 'milestone', `Divorced ${partner.name}. The settlement cost $${lost.toLocaleString()}.`);
    return { message: `You divorced ${partner.name}. They took $${lost.toLocaleString()} in the settlement.` };
  },

  /* ───────────── Annual family upkeep ───────────── */

  /** Age every family member by one year and update children's schooling. */
  annualAge(characterId: string): void {
    for (const rel of RelationshipsModel.findByCharacterId(characterId)) {
      if (!rel.isAlive || !rel.partner) continue;
      const meta = rel.partner;
      const newAge = meta.age + 1;
      const updated: PartnerMeta = { ...meta, age: newAge };
      if (rel.type === RelationType.Child) {
        updated.education = childEducationForAge(newAge);
        updated.occupation = newAge >= 18 ? pick(FAMILY_OCCUPATIONS) : 'Child';
      }
      RelationshipsModel.updatePartner(rel.id, { partner: updated });
    }
  },

  /** Auto-divorce risk when a marriage's bond collapses. Returns a message if it fired. */
  checkMarriageHealth(characterId: string): string | null {
    const partner = RelationshipsModel.findPartner(characterId);
    if (!partner || partner.stage !== RelationStage.Married) return null;
    if (partner.bond >= 15) return null;
    const risk = (15 - partner.bond) / 100 + 0.05;
    if (Math.random() < risk) {
      const { message } = this.divorce(characterId);
      return message;
    }
    return null;
  },

  addFriend(characterId: string, friendName: string): Relationship | null {
    const all = RelationshipsModel.findByCharacterId(characterId);
    const activeFriends = all.filter((r) => r.type === RelationType.Friend && r.isAlive);
    if (activeFriends.length >= GAME_CONSTANTS.relationships.maxFriends) return null;
    return RelationshipsModel.create({
      characterId, name: friendName, type: RelationType.Friend, bond: 40, trust: 40,
    });
  },
};
