export interface CharacterResources {
  characterId: string;
  totalTimeSlots: number;
  usedTimeSlots: number;
  mentalEnergy: number;
  physicalEnergy: number;
  mentalEnergyMax: number;
  physicalEnergyMax: number;
  consecutiveLowMentalYears: number;
  burnoutState: boolean;
  updatedAt: string;
}
