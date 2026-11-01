---
title: Game of Life
authors: [Ben]
description: "Turn a row of cells into a grid and you get Conway's Game of Life, which is dead simple and incredibly captivating. In this post we build it up from one-dimensional automata and see what happens when you change its rules."
date: 'June 5, 2024'
slug: 'conway'
series: 'cellular-automata'
seriesOrder: 2
tags: ['Computer Science']
keywords: ['React', 'Computer Science', 'Conway', 'Cellular Automata', 'Game of Life', 'Game']
language: 'English'
---

The Game of Life is the most famous example of a cellular automaton. In [the last part](/blog/elementary-automata) we saw how much a single row of cells can do with an 8-bit rule. Now we add a dimension.

## Adding a dimension

The Game of Life, created by John Conway back in 1970, makes one big change to the row of cells: it becomes a grid. Historically it came more than a decade before Wolfram's survey, but it's the same idea with more neighbors. Each cell now looks at the 8 cells around it instead of 2.

Copying the elementary approach doesn't work here. Nine cells can be in 512 different patterns, which gives 2^512 possible rules, far too many to number or explore. So Conway's game only cares about how many neighbors are alive, not where they are. That leaves two questions, how many neighbors keep a live cell alive and how many bring a dead cell to life, and only 262,144 possible rules. The one he settled on is as such:

- If a cell is alive and has less than two alive neighbors, it dies. This represents underpopulation.
- If a cell is alive and has more than three alive neighbors, it dies. This represents overpopulation.
- If a cell is dead and has exactly three alive neighbors, it becomes alive in the next generation. This represents reproduction.

Having a second dimension costs us those pictures. A grid already fills the page, so the only way left to show time is to actually play it. Every picture below does that, using the same code as the [web demo](/showcase/conway) of the game that I implemented on this very site.

## What the grid can do

Sounds pretty simple right? Well it is. But this small set of rules exposes some pretty emergent behavior. See if you can control future generations with the current one. Are there stable structures? Cyclical structures? Predictable structures? As it turns out there are, and people have been naming them since the game came out.

The simplest ones are still lifes, which never change at all. Every live cell has two or three neighbors, so it survives, and no dead cell has exactly three, so nothing gets born. These two will play for as long as you like and look exactly the same:

```life
pattern=block
pattern=beehive
```

Next up are oscillators, which return to where they started. These three each take two generations to get back:

```life
pattern=blinker delay=400
pattern=toad delay=400
pattern=beacon delay=400
```

Specifically of note here are spaceships, structures that travel in a particular direction across the screen as time moves forward. They're the same kind of thing as the moving structures in Rule 110, only now they have a whole plane to move across. The glider has 5 cells and moves one cell diagonally every 4 generations. The lightweight spaceship moves two cells every 4 generations:

```life
pattern=glider
pattern=lwss
```

If you put these structures together in a particular way you can construct a NAND gate, and with a NAND gate you can construct anything that can be computed. That's right, the Game of Life is Turing Complete too, thanks to the behavior of a 5-cell structure.

Small doesn't have to mean predictable, either. The R-pentomino is also just 5 cells, but on an open board it takes 1,103 generations to settle down, throwing off gliders along the way. This board has walls, so it plays out a little differently here:

```life
pattern=r-pentomino delay=60
```

## Change the numbers

Just like the elementary rules, more unique behavior emerges when you change the numbers. Each picture below starts from the exact same 1,841 live cells and only differs in its thresholds. They're written the usual way, so `B3/S2-3` means a cell is born with 3 neighbors and survives with 2 to 3. The first one is the standard game, which thins out to about 500 cells in 100 generations:

```life
start=random seed=3 delay=60 caption="B3/S2-3: the standard game"
start=random seed=3 delay=60 surviveMax=4 caption="B3/S2-4: crowding allowed"
start=random seed=3 delay=60 surviveMin=1 surviveMax=5 caption="B3/S1-5: Maze"
start=random seed=3 delay=60 surviveMin=0 surviveMax=8 caption="B3/S0-8: Life without Death"
start=random seed=3 delay=60 birth=2 surviveMin=1 surviveMax=0 caption="B2/S none: Seeds"
start=random seed=3 delay=60 surviveMin=3 caption="B3/S3: only 3 survives"
```

Moving the overpopulation threshold from 3 to 4 changes everything. Instead of thinning out, the board fills up to about 3,100 cells. That such a small change in the rules causes such an extreme change in behavior is incredibly captivating, and this dynamic is one of the main reasons why I wanted to implement the game.

The others go further. Widen survival to 1 through 5 and the cells freeze into a maze of corridors in about 25 generations. Let every cell survive and growth stops almost immediately, because nothing can ever make room. Seeds goes the other way: every live cell dies each generation and the board still never settles, staying around 1,300 cells. Narrow survival to exactly 3 neighbors and nearly everything is gone within 25 generations, leaving 12 cells.

Press Open on any of the random starts to run those rules full screen in the demo, with a new random board.

## Where this goes next

So far every cell has only been alive or dead, and adding a dimension was enough to get something this rich. The next step is to give cells more than two states, and that gets us to [Falling Sands](/blog/falling-sands), where the type of a cell decides how it moves.
