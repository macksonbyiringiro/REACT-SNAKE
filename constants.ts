import { Point, Difficulty } from './types';

export const GRID_SIZE = 20;

export const DIFFICULTY_LEVELS: Record<Difficulty, { name: string; tickRate: number }> = {
  EASY: { name: 'Easy', tickRate: 200 },
  MEDIUM: { name: 'Medium', tickRate: 150 },
  HARD: { name: 'Hard', tickRate: 100 },
};

export const INITIAL_SNAKE_POSITION: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export const INITIAL_FOOD_POSITION: Point = { x: 15, y: 15 };
