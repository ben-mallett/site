---
title: Falling Sands
authors: [Ben]
description: "Give cells a material instead of just alive or dead, and a few rules about what falls where turn into sand piles and pools of water. Here are the basics of a falling sand game, and how I built one."
date: 'October 31, 2026'
slug: 'falling-sands'
series: 'cellular-automata'
seriesOrder: 3
tags: ['Computer Science']
keywords: ['Cellular Automata', 'Falling Sand', 'Game of Life', 'Simulation', 'Game']
language: 'English'
---

In the last two parts, every cell was either alive or dead. A falling sand game changes that one thing: each cell holds a material, like sand or water. The genre goes back to a Java applet on a Japanese site in 2005, and it spread because it's fun to pour things onto other things. You can [play the version I built](/showcase/falling-sands) while you read.

## One rule for each material

Sand only needs one rule. Each tick, a grain looks below itself and moves to the first open space it finds:

- Straight down.
- Down and to one side, picked at random.
- Down and to the other side.

That's the whole program, and it's enough to make piles. A grain sitting on another grain slides off to the side, so sand forms a slope all on its own. Nothing in the code knows what a pile is.

```sands
scene=pile
```

Water is sand with one extra rule. If it can't fall, it looks along its row for the nearest place to drop and heads there, which is why it levels out into a pool where sand would have stacked up. If there's nowhere to drop, it stays still, so a pool actually comes to rest. In my version it can travel up to 4 cells in a tick, because water that only moves 1 cell at a time looks like syrup.

```sands
scene=pool
```

```ts
const MOVEMENTS = {
    none: () => {},
    powder: (world, x, y, { density }) => { fall(world, x, y, density) },
    liquid: (world, x, y, { density, flow }) => {
        if (!fall(world, x, y, density)) spread(world, x, y, density, flow)
    },
}
```

Materials interact through density. A cell can move into a space if what's there is lighter, and the two trade places. Sand is heavier than water, so it sinks through a pool and pushes the water up. That needs some care: if every grain in a stack just traded places with the water below it, the water would climb the whole stack one grain at a time. So under a stack, the pushed water goes to the pool's surface instead. Stone never moves and nothing can displace it, so it works as walls and floors. Diagonal moves need one extra check, or grains would slip between two stones that only touch at a corner.

Here's what those interactions look like. On the left, sand sinks through a pool. On the right, a tall stack lands on one, and the pool rises around it instead of climbing it:

```sands
scene=sink
scene=displace
```

Stone gives everything else something to work against. It can hold water in a cup, water on a ledge will find a hole one cell wide, and a staircase of stones that only touch at their corners still stops everything:

```sands
scene=cup
scene=hole
scene=diagonal
```

## Bending the rules

The Game of Life computes every cell's next state from a snapshot of the current generation, so all the cells change at once. Falling sand can't really do that. If two grains each decide to move into the same empty space, one of them has to lose. So a falling sand game usually isn't a strict cellular automaton. It updates the grid in place, one cell at a time, and that creates a few problems the rules have to work around.

The order of the sweep matters. Working from the bottom row up lets a whole column of sand fall together, because each grain moves out of the way of the one above it. Working from the top down would carry a single grain all the way to the floor in one tick. Sweeping each row in the same direction every time also makes everything lean to one side, so the direction flips each tick.

Cells can also move twice. A drop of water that spreads into a cell the sweep hasn't reached yet would get another turn, so each cell records the tick it last moved on and gets skipped if it has already gone.

## A framework for adding materials

Each material is one entry in a table, so adding a new one doesn't mean touching the simulation:

```ts
{ name: "Sand", color: "orange", movement: "powder", density: 2 },
{ name: "Water", color: "cyan", movement: "liquid", density: 1, flow: 4 },
{ name: "Stone", color: "muted", movement: "none", density: Infinity },
```

The table has room for the Game of Life too. Spore is a material with a `life` rule, which is the same birth and survival counts from the last part:

```ts
{ name: "Spore", color: "acid", movement: "none", density: Infinity, life: { birth: [3], survive: [2, 3] } },
```

Every 8 ticks by default, Spore takes a true Game of Life step, with its cells all changing at once. The two systems run in the same world and affect each other. Sand piles up on living cells and drops when they die, and a cell can't be born in a space that sand or water is filling. The first scene in the demo starts a pattern on a ledge so you can pour sand on it. On its own, a Spore pattern acts just like it did in the last part, with a block sitting still, a blinker blinking and a glider heading off across the board. Drop sand on it and the two systems collide. In the second picture, an R-pentomino that would have grown to 79 cells by the end is smothered completely, because the sand fills the spaces it needs to be born in:

```sands
scene=spores
scene=spore-sand
```

The demo has its full rules behind an info button on each material, and its settings let you change the tick speed and how often life steps happen.

## Where this goes next

This is only the framework: four materials and two kinds of movement. The next step is a real game, with materials that react to each other and more of the Game of Life's mechanics built in.
