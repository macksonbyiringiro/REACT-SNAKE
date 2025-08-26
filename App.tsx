import React, { useState, useEffect, useCallback } from 'react';
import { Point, Direction, GameState, Difficulty } from './types';
import {
  GRID_SIZE,
  INITIAL_SNAKE_POSITION,
  INITIAL_FOOD_POSITION,
  DIFFICULTY_LEVELS,
} from './constants';
import { initAudio, playEatSound, playGameOverSound } from './audio';
import { GoogleGenAI } from '@google/genai';

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
  children: React.ReactNode;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ children }) => (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-white z-10 p-4 text-center rounded-lg">
        {children}
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
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [countdown, setCountdown] = useState<string>('3');
  const [snakeFact, setSnakeFact] = useState<string>('');
  const [isFactLoading, setIsFactLoading] = useState<boolean>(true);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE_POSITION);
    setFood(INITIAL_FOOD_POSITION);
    setDirection(Direction.RIGHT);
    setScore(0);
    setGameState(GameState.IDLE);
  }, []);
  
  useEffect(() => {
    if (gameState === GameState.HOME) {
        const fetchSnakeFact = async () => {
            try {
                setIsFactLoading(true);
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: 'Tell me a fun, short fact about snakes suitable for a game loading screen. Keep it under 150 characters.',
                });
                setSnakeFact(response.text);
            } catch (error) {
                console.error("Failed to fetch snake fact:", error);
                setSnakeFact("Snakes are fascinating creatures that can be found all over the world!"); // Fallback fact
            } finally {
                setIsFactLoading(false);
            }
        };
        fetchSnakeFact();
    }
}, [gameState]);


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
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault(); // Prevents page scroll
      if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
      } else if (gameState === GameState.PAUSED) {
        setGameState(GameState.PLAYING);
      }
      return;
    }

    if (gameState !== GameState.PLAYING) {
        return;
    }

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
  }, [direction, gameState]);

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
      playGameOverSound();
      setGameState(GameState.GAME_OVER);
      return;
    }

    // Self collision
    for (const segment of newSnake) {
      if (segment.x === head.x && segment.y === head.y) {
        playGameOverSound();
        setGameState(GameState.GAME_OVER);
        return;
      }
    }

    newSnake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
      playEatSound();
      setScore(prevScore => prevScore + 1);
      generateFood(newSnake);
    } else {
      newSnake.pop();
    }
    
    setSnake(newSnake);

  }, [snake, direction, food, generateFood]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const tickRate = DIFFICULTY_LEVELS[difficulty].tickRate;
      const interval = setInterval(gameTick, tickRate);
      return () => clearInterval(interval);
    }
  }, [gameState, gameTick, difficulty]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);
  
  const startGame = (selectedDifficulty: Difficulty) => {
    initAudio(); // Initialize audio on first user interaction
    setDifficulty(selectedDifficulty);
    setSnake(INITIAL_SNAKE_POSITION);
    setFood(INITIAL_FOOD_POSITION);
    setDirection(Direction.RIGHT);
    setScore(0);
    setCountdown('3');
    setGameState(GameState.COUNTDOWN);
  };

  useEffect(() => {
    if (gameState !== GameState.COUNTDOWN) {
      return;
    }

    const sequence = ['3', '2', '1', 'Go!'];
    let step = 0;

    const timer = setInterval(() => {
      step += 1;
      if (step < sequence.length) {
        setCountdown(sequence[step]);
      } else {
        clearInterval(timer);
        setGameState(GameState.PLAYING);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);
  
  const resumeGame = () => {
    setGameState(GameState.PLAYING);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl font-bold mb-4 tracking-wider">REACT SNAKE</h1>
      <Scoreboard score={score} highScore={highScore} />
      <div className="relative">
        {gameState === GameState.HOME && (
             <GameOverlay>
                <div className="flex flex-col items-center justify-center h-full max-w-xl">
                    <h2 className="text-5xl font-bold mb-6">Welcome!</h2>
                    <div className="w-full min-h-[8rem] flex items-center justify-center p-4 mb-8 bg-gray-800 rounded-lg shadow-inner">
                        {isFactLoading ? (
                            <p className="text-gray-400 italic">Fetching a fun snake fact...</p>
                        ) : (
                            <p className="text-lg text-center text-yellow-300 font-medium">{snakeFact}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setGameState(GameState.IDLE)}
                        disabled={isFactLoading}
                        className="px-10 py-4 bg-blue-600 text-white font-bold text-2xl rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                        Play Game
                    </button>
                </div>
            </GameOverlay>
        )}
        {gameState === GameState.IDLE && (
            <GameOverlay>
                <h2 className="text-4xl font-bold mb-6">Select Difficulty</h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={() => startGame('EASY')}
                        className="px-8 py-4 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg w-48"
                    >
                        Easy
                    </button>
                    <button
                        onClick={() => startGame('MEDIUM')}
                        className="px-8 py-4 bg-yellow-500 text-white font-bold text-xl rounded-lg hover:bg-yellow-600 transition-colors duration-200 shadow-lg w-48"
                    >
                        Medium
                    </button>
                    <button
                        onClick={() => startGame('HARD')}
                        className="px-8 py-4 bg-red-500 text-white font-bold text-xl rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-lg w-48"
                    >
                        Hard
                    </button>
                </div>
            </GameOverlay>
        )}
        {gameState === GameState.COUNTDOWN && (
            <GameOverlay>
                <div className="text-8xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8)' }}>
                    {countdown}
                </div>
            </GameOverlay>
        )}
        {gameState === GameState.GAME_OVER && (
            <GameOverlay>
                <h2 className="text-5xl font-bold mb-4">Game Over</h2>
                <p className="text-2xl mb-8">Your Score: {score}</p>
                <button
                    onClick={resetGame}
                    className="px-8 py-4 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg"
                >
                    Play Again
                </button>
            </GameOverlay>
        )}
        {gameState === GameState.PAUSED && (
            <GameOverlay>
                <h2 className="text-5xl font-bold mb-8">Paused</h2>
                <button
                    onClick={resumeGame}
                    className="px-8 py-4 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-lg"
                >
                    Resume
                </button>
            </GameOverlay>
        )}
        <GameBoard snake={snake} food={food} />
      </div>
      <div className="mt-6 text-center text-gray-400">
        <p>Use Arrow Keys to move the snake.</p>
        <p>Press <span className="font-semibold text-green-400">Spacebar</span> to Pause/Resume.</p>
        <p>Eat the red dots to grow and score points.</p>
      </div>
    </div>
  );
};

export default App;