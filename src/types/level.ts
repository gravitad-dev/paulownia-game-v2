import { Media } from "./user";

export type LevelDifficulty =
  | "easy"
  | "easy2"
  | "medium"
  | "medium2"
  | "hard"
  | "hard2";

export interface Level {
  id: number;
  documentId?: string;
  uuid: string;
  name: string;
  description?: string;
  cover?: Media;
  puzzleImage?: Media[];
  difficulty?: LevelDifficulty;
  password?: string;
  user_game_histories?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}
