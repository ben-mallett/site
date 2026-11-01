---
title: One-Dimensional Automata
authors: [Ben]
description: "The simplest cellular automata fit on a single row of cells. Eight yes or no answers make a complete program, and those programs can draw fractals, model traffic and compute anything."
date: 'October 31, 2026'
slug: 'elementary-automata'
series: 'cellular-automata'
seriesOrder: 1
tags: ['Computer Science']
keywords: ['Cellular Automata', 'Elementary Automata', 'Rule 30', 'Rule 110', 'Wolfram']
language: 'English'
---

A cellular automaton is a genre of computer program where a world of cells updates itself using nothing but local rules. This series builds them up one step at a time, from a single row of cells to a game with sand, water and living things in it. We'll start with the smallest version there is.

## One row of cells

Picture a row of cells where each one is alive or dead. To get the next generation, every cell looks at three cells: itself and its left and right neighbors. Those three cells can only be in 8 different patterns, so a complete set of rules is just an answer for each pattern. Eight yes or no answers make an 8-bit number, which means there are exactly 256 possible rules. These are the elementary cellular automata, which Stephen Wolfram studied in the 1980s, and each one goes by its number.

Take Rule 30. In binary, 30 is `00011110`. Line those bits up with the 8 patterns, counting down from `111`, and you have the whole program:

- `111`, `110`, `101` and `000` produce a dead cell.
- `100`, `011`, `010` and `001` produce a live cell.

The neat part is how you get to look at it. A row only takes up one dimension, so we can use the other one for time, drawing each generation under the last. Here is Rule 30 starting from a single live cell:

```automaton
rule=30 generations=64
```

The left side settles into diagonal stripes, while the right side looks like noise. It's noisy enough that its center column was used as a random number generator in Mathematica. There's no randomness anywhere in the rule, and the picture will be the same every time you run it. Skip ahead 500 generations and the start is long gone:

```automaton
rule=30 from=500 generations=60 cells=120
```

## Change one number

Every rule uses the same machinery, but the results have very little in common. Rule 254 makes any cell with a live cell nearby come alive, so it grows into a solid triangle and nothing else ever happens:

```automaton
rule=254 generations=32
```

Rule 90 makes a cell alive when exactly one of its two neighbors is alive. That single line of logic draws a Sierpinski triangle:

```automaton
rule=90 generations=64
```

Rule 184 looks like traffic. Treat each live cell as a car on a one-lane road: a car moves right if the space ahead is empty, and waits if it isn't. From a random start, you can watch the jams drift backwards and dissolve while the cars move forward. The number of cars never changes:

```automaton
rule=184 start=random seed=7 density=0.48 cells=100 generations=70
```

Then there is Rule 110, the one that makes all of this feel a little unfair. Its structures move around and collide with each other, and those collisions can be arranged to do work. Matthew Cook proved that Rule 110 is Turing Complete, so a row of cells following an 8-bit rule can, in principle, compute anything your laptop can:

```automaton
rule=110 generations=100
```

You can run all 256 of these yourself in the [elementary automata demo](/showcase/elementary-automata). Step through the rule numbers and see how little it takes to go from order to noise.

## Where this goes next

Everything here happens on one row, where a cell only has two neighbors. In the next part we give it eight, by turning the row into a grid, and get the [Game of Life](/blog/conway).
