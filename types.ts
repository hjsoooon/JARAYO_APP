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

export interface VoiceNote {
  id: string;
  timestamp: string; // ISO string for sorting
  transcript: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string; // 동화 형식 내용
  babyContent?: string; // 원본 부모 입력 내용
  imageUrl?: string; // mainImageUrl로 사용
  mainImageUrl?: string; // 메인 커버 이미지
  phrSummary?: RecordType[]; // Icons to show
  isAudio?: boolean;
  mood?: 'happy' | 'calm' | 'sleepy' | 'playful';
  voiceNotes?: VoiceNote[];
  gallery?: string[]; // 추가 갤러리 이미지들
  babyAgeWeeks?: number;
}

export interface StoryBook {
  title: string;
  coverImage: string;
  content: string;
  generatedDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
