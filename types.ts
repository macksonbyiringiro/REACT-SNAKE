export type Point = {
  x: number;
  y: number;
};

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export enum GameState {
  HOME,
  IDLE,
  PLAYING,
  GAME_OVER,
  PAUSED,
  COUNTDOWN,
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';