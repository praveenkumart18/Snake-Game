import { SnakeGame } from "@/components/snake-game"

export default function Page() {
  return (
    <main className="h-screen flex flex-col items-center justify-start pt-4 md:pt-6 px-4 md:px-8 overflow-hidden">
      <header className="text-center mb-3 md:mb-4 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1.5 md:mb-2">
          <span className="text-primary">SNAKE</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-accent">GAME</span>
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">Eat food. Grow longer. Don't crash.</p>
      </header>
      
      <SnakeGame />
      
      <footer className="mt-4 md:mt-6 text-xs text-muted-foreground hidden md:block shrink-0">
        Built with Next.js
      </footer>
    </main>
  )
}
