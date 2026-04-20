"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Play, Pause, Info } from "lucide-react"

const GRID_SIZE = 20
const MAX_BOARD_SIZE = 420
const MIN_BOARD_SIZE = 180
const INITIAL_SPEED = 250
const BEST_SCORE_STORAGE_KEY = "snake-best-score"
const NORMAL_FOOD_SCORE = 5
const NORMAL_FOOD_COUNT_FOR_BIG_FOOD = 5
const BIG_FOOD_DURATION_SECONDS = 8

const BIG_FOOD_SCORE_BY_SECOND: Record<number, number> = {
  8: 40,
  7: 35,
  6: 30,
  5: 25,
  4: 20,
  3: 15,
  2: 10,
  1: 8,
}

type Position = { x: number; y: number }
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

function getBigFoodScore(remainingSeconds: number): number {
  const safeSeconds = Math.max(1, Math.min(BIG_FOOD_DURATION_SECONDS, Math.floor(remainingSeconds)))
  return BIG_FOOD_SCORE_BY_SECOND[safeSeconds]
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [normalFoodStreak, setNormalFoodStreak] = useState(0)
  const [bigFood, setBigFood] = useState<Position | null>(null)
  const [bigFoodTimeLeft, setBigFoodTimeLeft] = useState(0)
  const [boardSize, setBoardSize] = useState(320)
  const directionRef = useRef<Direction>("RIGHT")

  useEffect(() => {
    try {
      const storedBestScore = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY)
      if (storedBestScore) {
        const parsedBestScore = Number(storedBestScore)
        if (!Number.isNaN(parsedBestScore) && parsedBestScore >= 0) {
          setHighScore(parsedBestScore)
        }
      }
    } catch {
      // Ignore storage access issues in restricted environments.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(highScore))
    } catch {
      // Ignore storage write failures.
    }
  }, [highScore])

  useEffect(() => {
    const updateBoardSize = () => {
      const viewportWidth = window.innerWidth - 32
      const verticalReserve = window.innerWidth < 768 ? 340 : 420
      const viewportHeight = window.innerHeight - verticalReserve
      const nextSize = Math.max(
        MIN_BOARD_SIZE,
        Math.min(MAX_BOARD_SIZE, Math.floor(Math.min(viewportWidth, viewportHeight))),
      )

      setBoardSize(nextSize)
    }

    updateBoardSize()
    window.addEventListener("resize", updateBoardSize)

    return () => window.removeEventListener("resize", updateBoardSize)
  }, [])

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (
      snakeBody.some((segment) => segment.x === newFood.x && segment.y === newFood.y) ||
      (bigFood !== null && bigFood.x === newFood.x && bigFood.y === newFood.y)
    )
    return newFood
  }, [bigFood])

  const generateBigFood = useCallback(
    (snakeBody: Position[], currentFood: Position): Position => {
      let newBigFood: Position
      do {
        newBigFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        }
      } while (
        snakeBody.some((segment) => segment.x === newBigFood.x && segment.y === newBigFood.y) ||
        (newBigFood.x === currentFood.x && newBigFood.y === currentFood.y)
      )

      return newBigFood
    },
    [],
  )

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    setDirection("RIGHT")
    directionRef.current = "RIGHT"
    setGameOver(false)
    setIsPaused(true)
    setScore(0)
    setNormalFoodStreak(0)
    setBigFood(null)
    setBigFoodTimeLeft(0)
  }, [generateFood])

  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    return snakeBody.slice(1).some((segment) => segment.x === head.x && segment.y === head.y)
  }, [])

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] }

      switch (directionRef.current) {
        case "UP":
          head.y -= 1
          break
        case "DOWN":
          head.y += 1
          break
        case "LEFT":
          head.x -= 1
          break
        case "RIGHT":
          head.x += 1
          break
      }

      if (checkCollision(head, prevSnake)) {
        setGameOver(true)
        setHighScore((prev) => Math.max(prev, score))
        return prevSnake
      }

      const newSnake = [head, ...prevSnake]
      const ateNormalFood = head.x === food.x && head.y === food.y
      const ateBigFood = bigFood !== null && head.x === bigFood.x && head.y === bigFood.y

      if (ateNormalFood) {
        setScore(score + NORMAL_FOOD_SCORE)
        const nextFood = generateFood(newSnake)
        setFood(nextFood)

        const nextStreak = normalFoodStreak + 1
        if (nextStreak >= NORMAL_FOOD_COUNT_FOR_BIG_FOOD && bigFood === null) {
          setBigFood(generateBigFood(newSnake, nextFood))
          setBigFoodTimeLeft(BIG_FOOD_DURATION_SECONDS)
          setNormalFoodStreak(0)
        } else {
          setNormalFoodStreak(nextStreak)
        }
      }

      if (ateBigFood) {
        setScore(score + getBigFoodScore(bigFoodTimeLeft))
        setBigFood(null)
        setBigFoodTimeLeft(0)
      }

      if (!ateNormalFood && !ateBigFood) {
        newSnake.pop()
      }

      return newSnake
    })
  }, [
    gameOver,
    isPaused,
    food,
    bigFood,
    bigFoodTimeLeft,
    checkCollision,
    generateFood,
    generateBigFood,
    normalFoodStreak,
    score,
  ])

  useEffect(() => {
    if (!bigFood || gameOver || isPaused) return

    const timer = window.setInterval(() => {
      setBigFoodTimeLeft((prev) => {
        if (prev <= 1) {
          setBigFood(null)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [bigFood, gameOver, isPaused])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (directionRef.current !== "DOWN") {
            setDirection("UP")
            directionRef.current = "UP"
          }
          break
        case "ArrowDown":
        case "s":
        case "S":
          if (directionRef.current !== "UP") {
            setDirection("DOWN")
            directionRef.current = "DOWN"
          }
          break
        case "ArrowLeft":
        case "a":
        case "A":
          if (directionRef.current !== "RIGHT") {
            setDirection("LEFT")
            directionRef.current = "LEFT"
          }
          break
        case "ArrowRight":
        case "d":
        case "D":
          if (directionRef.current !== "LEFT") {
            setDirection("RIGHT")
            directionRef.current = "RIGHT"
          }
          break
        case " ":
          e.preventDefault()
          setIsPaused((prev) => !prev)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameOver])

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED)
    return () => clearInterval(interval)
  }, [moveSnake])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cellSize = boardSize / GRID_SIZE

    // Clear canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, boardSize, boardSize)

    // Draw grid lines
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, boardSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(boardSize, i * cellSize)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      ctx.fillStyle = isHead ? "#4ade80" : "#22c55e"
      ctx.shadowColor = "#22c55e"
      ctx.shadowBlur = isHead ? 10 : 5
      
      const padding = 1
      ctx.beginPath()
      ctx.roundRect(
        segment.x * cellSize + padding,
        segment.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
        isHead ? 6 : 4
      )
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw food with glow
    ctx.fillStyle = "#facc15"
    ctx.shadowColor = "#facc15"
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2 - 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.shadowBlur = 0
    if (bigFood) {
      const centerX = bigFood.x * cellSize + cellSize / 2
      const centerY = bigFood.y * cellSize + cellSize / 2

      ctx.fillStyle = "#fb923c"
      ctx.shadowColor = "#fb923c"
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(centerX, centerY, cellSize / 2 - 0.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#fff7ed"
      ctx.shadowBlur = 0
      ctx.font = `${Math.max(9, Math.floor(cellSize * 0.45))}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("B", centerX, centerY + 1)
    }
  }, [snake, food, bigFood, boardSize])

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameOver) return
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameOver || !touchStartRef.current) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.max(absX, absY) < 24) {
      touchStartRef.current = null
      return
    }

    if (absX > absY) {
      handleDirectionButton(deltaX > 0 ? "RIGHT" : "LEFT")
    } else {
      handleDirectionButton(deltaY > 0 ? "DOWN" : "UP")
    }

    touchStartRef.current = null
  }

  const handleDirectionButton = (newDirection: Direction) => {
    if (gameOver) return
    
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    }
    
    if (directionRef.current !== opposites[newDirection]) {
      setDirection(newDirection)
      directionRef.current = newDirection
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-[520px]">
      {/* Score Display */}
      <div className="flex items-center justify-between w-full px-2 md:px-4">
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Score</span>
          <span className="text-2xl md:text-3xl font-mono font-bold text-primary">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Best</span>
          <span className="text-2xl md:text-3xl font-mono font-bold text-accent">{highScore}</span>
        </div>
      </div>

      {bigFood && (
        <div className="text-xs md:text-sm text-accent font-medium tracking-wide">
          Big Food: {bigFoodTimeLeft}s left | Reward: +{getBigFoodScore(bigFoodTimeLeft)}
        </div>
      )}

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={boardSize}
          height={boardSize}
          style={{ width: boardSize, height: boardSize }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="rounded-lg border-2 border-border shadow-2xl touch-none"
        />
        
        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-destructive mb-2">Game Over</h2>
            <p className="text-muted-foreground mb-4">Final Score: {score}</p>
            <Button onClick={resetGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        )}

        {/* Start Overlay */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {score === 0 ? "Ready to Play?" : "Paused"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Press Space or tap Play</p>
            <Button onClick={() => setIsPaused(false)} className="gap-2">
              <Play className="w-4 h-4" />
              {score === 0 ? "Start Game" : "Resume"}
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {/* Pause/Play Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPaused((prev) => !prev)}
            disabled={gameOver}
            className="size-8 md:size-9"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Game instructions" className="size-8 md:size-9">
                <Info className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm leading-6">
              <p className="font-medium text-foreground mb-2">How to play</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Use arrow keys or WASD to move the snake.</li>
                <li>Eat food to grow and increase your score.</li>
                <li>Avoid walls and your own body.</li>
                <li>Press Space to pause or resume.</li>
              </ul>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={resetGame} className="size-8 md:size-9">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Direction Pad */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          <div />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionButton("UP")}
            disabled={gameOver || isPaused}
            className="h-11 w-11 md:h-12 md:w-12"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
          <div />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionButton("LEFT")}
            disabled={gameOver || isPaused}
            className="h-11 w-11 md:h-12 md:w-12"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionButton("DOWN")}
            disabled={gameOver || isPaused}
            className="h-11 w-11 md:h-12 md:w-12"
          >
            <ArrowDown className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionButton("RIGHT")}
            disabled={gameOver || isPaused}
            className="h-11 w-11 md:h-12 md:w-12"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
