
import { Point } from './types';

export const GRID_SIZE = 20;
export const TICK_RATE = 150; // ms

export const INITIAL_SNAKE_POSITION: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export const INITIAL_FOOD_POSITION: Point = { x: 15, y: 15 };
