export type Gender = 'BOY' | 'GIRL' | 'OTHER';

export interface BabyProfile {
  name: string;
  gender: Gender;
  birthDate: string; // ISO string YYYY-MM-DD
  photoUrl?: string;
  hasCharacter: boolean;
}

export type RecordType = 'SLEEP' | 'FEED' | 'POOP' | 'BATH';

export type FeedType = 'BREAST' | 'FORMULA' | 'FOOD';
export type PoopType = 'PEE' | 'POO';

export interface PHRRecord {
  id: string;
  type: RecordType;
  timestamp: string; // ISO string (Start time)
  endTime?: string; // ISO string (End time for Sleep/Bath)
  subtype?: string; // e.g. BREAST, POO
  value?: string | number; // e.g. amount in ml, duration in min
  memo?: string;
  details?: Record<string, any>; // Flexible for specific data (color, hardness)
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  imageUrl?: string;
  phrSummary?: RecordType[]; // Icons to show
  isAudio?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
