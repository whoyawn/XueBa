export interface Chengyu {
  text: string;
  chars: string[];
  pinyin: string[];
  pinyinNoTone: string[];
}

export interface DictionaryMaps {
  chengyuList: Chengyu[];
  tonelessMap: Record<string, Chengyu[]>;
  pinyinMap: Record<string, Chengyu[]>;
  charMap: Record<string, Chengyu[]>;
}

export type StrictnessLevel = 1 | 2 | 3;

export interface AppState {
  currentChengyu: Chengyu | null;
  previousChengyu: Chengyu | null;
  strictness: StrictnessLevel;
}

