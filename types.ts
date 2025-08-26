
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
  IDLE,
  PLAYING,
  GAME_OVER,
}
