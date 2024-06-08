---
title: Game of Life
authors: [Ben]
description: "Conway's Game of Life is incredibly well known in the world of computer science for two reasons: it's dead simple and its incredibly captivating. In this post we talk about the famous game, showcase it, and discuss some of the unique phenomena that happen when you change the rules."
date: 'June 5, 2024'
slug: 'conway'
tags: ['Computer Science']
keywords: ['React', 'Computer Science', 'Conway', 'Cellular Automata', 'Game of Life', 'Game']
language: 'English'
---

The Game of Life is a famous subset of a unique genre of computer programs created by John Conway back in 1970. The premise is simple, in a world of distinct cells any given cell can be alive or dead at any given time. Whether or not it is alive during the next unit of time is determined by how many of it's neighbors are alive or dead in the current unit of time. The basic rules are as such: 
- If a cell is alive and has less than two alive neighbors, it dies. This represents underpopulation.
- If a cell is alive and has more than three alive neighbors, it dies. This represents overpopulation.
- If a cell is dead and has exactly three alive neighbords, it becomes alive in the next generation. This represents reproduction.

Sounds pretty simple right? Well it is. But as it turns out, this small set of rules exposes some pretty emergent behavior. To see some of this behavior yourself, explore the [web demo](/showcase/conway) of the game that I implemented on this very site. Specifically, see if you can control future generations with the current one. Are there stable structs? Cyclical structures? Predictable structures? As it turns out there are. Specifically of note here are gliders, structures that travel in a particular direction across the screen as time moves forward. 

If you put these structures together in a particular way you can construct a NAND gate, and with a NAND gate you can construct anything that can be computed. That's right, the Game of Life is Turing Complete thanks to the behavior of a 5-cell structure. 

Looking at the broader concept of the game, more unique behavior emerges when you change the thresholds for under/overpopulation and reproduction. By modifying these values you can generate incredible symmetric patterns, and with the right configuration, you can even generate mazes. Check out the game with an overpopulation threhsold bumped up to 4. That such a small change in ruleset reflects shuch an extreme change in behavior is incredibly captivating. This dynamic is one of the main reasons why I wanted to implement the game. 

There's more to come from me on cellular automata. Specifically, keep on the lookout for a demo of the famous Falling Sands, another cellular automata where the type of a cell influences the output of its neighbors, rather than the simple binary states of the Game of Life.

