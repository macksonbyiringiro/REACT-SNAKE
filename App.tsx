
import React, { useState, useEffect, useCallback } from 'react';
import { Point, Direction, GameState } from './types';
import {
  GRID_SIZE,
  TICK_RATE,
  INITIAL_SNAKE_POSITION,
  INITIAL_FOOD_POSITION,
} from './constants';

// Helper Components (defined outside the main App component)

interface GameBoardProps {
  snake: Point[];
  food: Point;
}

const GameBoard: React.FC<GameBoardProps> = ({ snake, food }) => {
  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
    const x = i % GRID_SIZE;
    const y = Math.floor(i / GRID_SIZE);
    const isSnake = snake.some(seg => seg.x === x && seg.y === y);
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isFood = food.x === x && food.y === y;

    return (
      <div
        key={i}
        className={`w-full h-full ${
          isSnakeHead
            ? 'bg-green-400 rounded-md'
            : isSnake
            ? 'bg-green-600 rounded-sm'
            : isFood
            ? 'bg-red-500 rounded-full'
            : 'bg-gray-800'
        }`}
      ></div>
    );
  });

  return (
    <div
      className="grid bg-gray-700 border-4 border-gray-600 shadow-lg"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        width: 'min(90vw, 600px)',
        height: 'min(90vw, 600px)',
      }}
    >
      {cells}
    </div>
  );
};


interface ScoreboardProps {
    score: number;
    highScore: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score, highScore }) => (
    <div className="flex justify-between items-center w-full max-w-lg p-4 bg-gray-800 rounded-lg shadow-md mb-4 text-white">
        <div className="text-xl">Score: <span className="font-bold text-green-400">{score}</span></div>
        <div className="text-xl">High Score: <span className="font-bold text-yellow-400">{highScore}</span></div>
    </div>
);

interface GameOverlayProps {
  title: string;
  buttonText: string;
  onButtonClick: () => void;
  finalScore?: number;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ title, buttonText, onButtonClick, finalScore }) => (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-white z-10">
        <h2 className="text-5xl font-bold mb-4">{title}</h2>
        {finalScore !== undefined && (
             <p className="text-2xl mb-8">Your Score: {finalScore}</p>
        )}
        <button
            onClick={onButtonClick}
            className="px-8 py-4 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg"
        >
            {buttonText}
        </button>
    </div>
);


// Main App Component
const App: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE_POSITION);
  const [food, setFood] = useState<Point>(INITIAL_FOOD_POSITION);
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
      const savedScore = localStorage.getItem('snakeHighScore');
      return savedScore ? parseInt(savedScore, 10) : 0;
  });
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE_POSITION);
    setFood(INITIAL_FOOD_POSITION);
    setDirection(Direction.RIGHT);
    setScore(0);
    setGameState(GameState.IDLE);
  }, []);

  const generateFood = useCallback((currentSnake: Point[]) => {
    while (true) {
      const newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
        setFood(newFood);
        return;
      }
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newDirection: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp':
        if (direction !== Direction.DOWN) newDirection = Direction.UP;
        break;
      case 'ArrowDown':
        if (direction !== Direction.UP) newDirection = Direction.DOWN;
        break;
      case 'ArrowLeft':
        if (direction !== Direction.RIGHT) newDirection = Direction.LEFT;
        break;
      case 'ArrowRight':
        if (direction !== Direction.LEFT) newDirection = Direction.RIGHT;
        break;
    }
    if (newDirection !== null) {
      setDirection(newDirection);
    }
  }, [direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const gameTick = useCallback(() => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case Direction.UP:
        head.y -= 1;
        break;
      case Direction.DOWN:
        head.y += 1;
        break;
      case Direction.LEFT:
        head.x -= 1;
        break;
      case Direction.RIGHT:
        head.x += 1;
        break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameState(GameState.GAME_OVER);
      return;
    }

    // Self collision
    for (const segment of newSnake) {
      if (segment.x === head.x && segment.y === head.y) {
        setGameState(GameState.GAME_OVER);
        return;
      }
    }

    newSnake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
      setScore(prevScore => prevScore + 1);
      generateFood(newSnake);
    } else {
      newSnake.pop();
    }
    
    setSnake(newSnake);

  }, [snake, direction, food, generateFood]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const interval = setInterval(gameTick, TICK_RATE);
      return () => clearInterval(interval);
    }
  }, [gameState, gameTick]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);
  
  const startGame = () => {
    resetGame();
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl font-bold mb-4 tracking-wider">REACT SNAKE</h1>
      <Scoreboard score={score} highScore={highScore} />
      <div className="relative">
        {gameState === GameState.IDLE && (
            <GameOverlay title="Ready to Play?" buttonText="Start Game" onButtonClick={startGame} />
        )}
        {gameState === GameState.GAME_OVER && (
            <GameOverlay title="Game Over" buttonText="Play Again" onButtonClick={startGame} finalScore={score} />
        )}
        <GameBoard snake={snake} food={food} />
      </div>
      <div className="mt-6 text-center text-gray-400">
        <p>Use Arrow Keys to move the snake.</p>
        <p>Eat the red dots to grow and score points.</p>
      </div>
    </div>
  );
};

export default App;
