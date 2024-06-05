"use client"

import { useEffect, useState, useMemo } from 'react';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';

type ConwayProps = {
    width: number;
    height: number;
}

export const WindowConway = () => {
    const {width, height} = useWindowDimensions()

    return (
        <Conway width={width} height={height}/>
    )
}

const Conway = ({ width, height }: ConwayProps) => {
    const [grid, setGrid] = useState<number[]>([])
    const [rowSize, setRowSize] = useState<number>(0)
    const [colSize, setColSize] = useState<number>(0)
    const [diagnostics, setDiagnostics] = useState<boolean>(false)
    const [colorSwap, setColorSwap] = useState<boolean>(false)
    const [pause, setPause] = useState<boolean>(false)
    const [prevPause, setPrevPause] = useState<boolean>(false)
    const [miracleOfLife, setMiracleOfLife] = useState<boolean>(false)
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [rounded, setRounded] = useState<boolean>(false)
    const [drawing, setDrawing] = useState<boolean>(false)
    const [tickRate, setTickRate] = useState<number>(75)
    const [sparsity, setSparsity] = useState<number>(-0.3)
    const [resolution, setResolution] = useState<number>(15)
    const [underpopulatedThreshold, setUnderpopulatedThreshold] = useState<number>(2)
    const [overpopulatedThreshold, setOverpopulatedThreshold] = useState<number>(3)
    const [reproductionThreshold, setReproductionThreshold] = useState<number>(3)
    const [activeColor, setActiveColor] = useState<string>('bg-blue-400')
    const [activeTextColor, setActiveTextColor] = useState<string>('text-blue-400')

    /**
     * Iniitalizes the grid state variable to contain a 1 or a 0 at each element randomly
     */
    const initGrid = () => {
        const temp = []
        const rows = Math.floor(width / resolution)
        const cols = Math.floor(height / resolution)
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                temp.push(Math.round(Math.random() + sparsity))
            }
        }
        setGrid(temp)
        setRowSize(rows)
        setColSize(cols)
    }

    /**
     * Advances the given grid state and returns the resulting array
     * 
     * @param grid grid to advance
     * @returns a new grid one generation ahead of the passed grid
     */
    const advanceGrid = (grid: number[]) => {
        return grid.map((cell, i) => {
            const numNeighbors = getNumberOfAliveNeighbors(i);  
            return getNewStateFromNeighbors(numNeighbors, cell)
        })
    }

    /**
     * Returns the number of alive neighbors in the grid of the given index
     * 
     * @param index index of element in the array to check
     */
    const getNumberOfAliveNeighbors = (i: number) => {
        let count = 0
        // i - r - 1 | i - r | i - r + 1
        //   i - 1   |   i   |   i + 1
        // i + r - 1 | i + r | i + r + 1
        const topLeft = i - rowSize - 1
        const topMiddle = i - rowSize
        const topRight = i - rowSize + 1
        const left = i - 1
        const right = i + 1
        const bottomLeft = i + rowSize - 1
        const bottomMiddle = i + rowSize
        const bottomRight = i + rowSize + 1

        if (topLeft >= 0 && i % rowSize !== 0 && grid[topLeft] === 1) {
            count += 1
        }

        if (topMiddle >= 0 && grid[topMiddle] === 1) {
            count += 1
        }

        if (topRight >= 0 && i % rowSize !== rowSize - 1 && grid[topRight] === 1) {
            count += 1
        }

        if (i % rowSize !== 0 && grid[left] === 1) {
            count += 1
        }

        if (i % rowSize !== rowSize - 1 && grid[right] === 1) {
            count += 1
        }

        if (bottomLeft < rowSize * colSize && i % rowSize !== 0 && grid[bottomLeft] === 1) {
            count += 1
        }

        if (bottomMiddle < rowSize * colSize && grid[bottomMiddle] === 1) {
            count += 1
        }

        if ((bottomRight < rowSize * colSize) && i % rowSize !== rowSize - 1 && grid[bottomRight] === 1) {
            count += 1
        }

        return count
    }


    /**
     * Given the number of neighbors and current state determines whether or not the new state should be alive of dead
     * @param neighbors 
     * @param curState 
     * @returns 1 if cell should be active, 0 otherwise
     */
    const getNewStateFromNeighbors = (neighbors: number, curState: number) => {
        let newState = curState
        if (curState === 1 && (neighbors < underpopulatedThreshold || neighbors > overpopulatedThreshold)) {
            newState = 0
        } else if (curState === 0 && neighbors === reproductionThreshold) {
            newState = 1
        } else if (miracleOfLife && curState === 0) {
            newState = Math.round(Math.random() - 0.49)
        }
        return newState
    }


    /**
     * Updates the grid state based on a set of rules
     */
    const updateGrid = () => {
        setGrid((grid) => advanceGrid(grid))
    }

    /**
     * Restores all relevant settings to defaults
     */
    const restoreToDefaults = () => {
        setDiagnostics(false)
        setColorSwap(false)
        setMiracleOfLife(false)
        setPause(false)
        setOverpopulatedThreshold(3)
        setUnderpopulatedThreshold(2)
        setReproductionThreshold(3)
        setSparsity(-0.3)
        setResolution(15)
        setTickRate(75)
        setActiveColor('bg-blue-400')
        setDrawing(false)
    }

    /**
     * Handles a mouse down event on a cell by triggering drawing mode
     */
    const handleMouseDown = (e: any, i: number) => {
        e.preventDefault()
        setDrawing(true)
        
        setPause(true)

        setGrid((grid) => {
            const newGrid = [...grid]
            newGrid[i] = 1
            return newGrid
        })
    }

    /**
     * Handles a mouse movement event by drawing cells as active if in drawing mode
     */
    const handleMouseMove = (e: any, i: number) => {
        e.preventDefault()
        if (drawing) {
            setGrid((grid) => {
                const newGrid = [...grid]
                newGrid[i] = 1
                return newGrid
            })
        }
    }

    const handleMouseUp = (e: any) => {
        e.preventDefault()
        setDrawing(false)
        setPause(prevPause)
    }

    /**
     * Reinitialize the grid on dimension changes
     */
    useEffect(() => {
        initGrid()
    }, [width, height, sparsity, resolution, initGrid])


    /**
     * Sets an interval to update the grid on 
     */
    useEffect(() => {
        const iid = setInterval(() => {
            if (!pause) {
                updateGrid();
            }
        }, tickRate);

        return () => clearInterval(iid);
    }, [rowSize, colSize, updateGrid, tickRate, pause, updateGrid])

    const gridCells = useMemo(() => {
        return grid.map((cell, i) => {
            const bgColor = cell === 1 ? (colorSwap ? 'bg-white' : activeColor) : (colorSwap ? activeColor : 'bg-white');
            const textColor = cell === 1 ? (colorSwap ? activeTextColor : 'text-white') : (colorSwap ? 'text-white' : activeTextColor);
            return (
                <div 
                    key={i} 
                    className={`flex ${rounded ? 'rounded-full' : ''} justify-center items-center ${bgColor} ${textColor}`} 
                    style={{ width: `${resolution}px`, height: `${resolution}px`}}
                    onMouseDown={(e) => handleMouseDown(e, i)}
                    onMouseUp={(e) => handleMouseUp(e)} 
                    onMouseMove={(e) => handleMouseMove(e, i)} 
                    onTouchStart={(e) => handleMouseDown(e, i)}
                    onTouchMove={(e) => handleMouseMove(e, i)}
                    onTouchEnd={(e) => handleMouseUp(e)}
                >
                    {diagnostics && getNumberOfAliveNeighbors(i)}
                </div>
            );
        });
    }, [grid, diagnostics, resolution, colorSwap, rounded, activeColor, activeTextColor, getNumberOfAliveNeighbors, handleMouseMove, handleMouseUp]);

    return (
        <div className={`w-screen h-screen flex justify-center items-center ${colorSwap ? activeColor : 'bg-white'}`} onMouseDown={(e) => e.preventDefault()} onMouseMove={(e) => e.preventDefault()} onMouseUp={(e) => {e.preventDefault(); setDrawing(false)}}>
            {
                !settingsOpen && 
                <div className="flex justify-between gap-2 absolute top-0 left-0 mx-20 my-10 z-50">
                    <button className="hover-enlarge-sm border border-black border-2 bg-sky-400 opacity-90 px-1 " onClick={() => setSettingsOpen(true)}>
                        Open Settings
                    </button>
                </div>
            }
            { 
                settingsOpen && 
                <div className={`absolute top-0 left-0 px-10 py-5 mx-10 my-5 z-50 bg-white opacity-90 w-72 md:w-96`}>
                    <div className="flex justify-between items-center pb-2">
                        <button title="Close Settings" className="hover-enlarge-sm border border-black border-2 px-1 bg-purple-700" onClick={() => setSettingsOpen(false)}>
                            X
                        </button>
                        <div className="w-full h-full flex justify-end gap-2">
                            <a title="Go Back Home" className='hover-enlarge-sm bg-amber-300 opacity-90 border border-black border-2 px-1' href="/">
                                Home
                            </a>
                            <a title="Visit Conway's Game of Life Blogpost" className='hover-enlarge-sm bg-emerald-400 opacity-90 border border-black border-2 px-1' href="/blog/conway">
                                Blog Post
                            </a>
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <button className={`hover-enlarge-sm border border-black ${activeColor === 'bg-red-400' ? 'border-4' : 'border-2'} bg-red-400 w-1/4 h-6`} onClick={() => {setActiveColor('bg-red-400'); setActiveTextColor('text-red-400')}}/>
                        <button className={`hover-enlarge-sm border border-black ${activeColor === 'bg-blue-400' ? 'border-4' : 'border-2'} bg-blue-400 w-1/4 h-6`} onClick={() => {setActiveColor('bg-blue-400'); setActiveTextColor('text-blue-400')}}/>
                        <button className={`hover-enlarge-sm border border-black ${activeColor === 'bg-emerald-400' ? 'border-4' : 'border-2'} bg-emerald-400 w-1/4 h-6`} onClick={() => {setActiveColor('bg-emerald-400'); setActiveTextColor('text-emerald-400')}}/>
                        <button className={`hover-enlarge-sm border border-black ${activeColor === 'bg-yellow-400' ? 'border-4' : 'border-2'} bg-yellow-400 w-1/4 h-6`} onClick={() => {setActiveColor('bg-yellow-400'); setActiveTextColor('text-yellow-400')}}/>
                        <button className={`hover-enlarge-sm border border-black ${activeColor === 'bg-black' ? 'border-4' : 'border-2'} bg-black w-1/4 h-6`} onClick={() => {setActiveColor('bg-black'); setActiveTextColor('text-black')}}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2">
                        <span>Pause:</span>
                        <Checkbox id="pause" checked={pause} onCheckedChange={(checked) => {setPause(Boolean(checked)); setPrevPause(Boolean(checked))}}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2">
                        <span>Diagnostics:</span>
                        {diagnostics && <div className="hidden md:block">{width}px by {height}px</div>}
                        <Checkbox id="diagnostics" checked={diagnostics} onCheckedChange={(checked) => setDiagnostics(Boolean(checked))}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2">
                        <span>Swap Colors:</span>
                        <Checkbox id="colorSwap" checked={colorSwap} onCheckedChange={(checked) => setColorSwap(Boolean(checked))}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2">
                        <span>Miracle of Life:</span>
                        <Checkbox id="miracleOfLife" checked={miracleOfLife} onCheckedChange={(checked) => setMiracleOfLife(Boolean(checked))}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2">
                        <span>Rounded:</span>
                        <Checkbox id="rounded" checked={rounded} onCheckedChange={(checked) => setRounded(Boolean(checked))}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Resolution: {resolution}</span>
                        <Slider value={[resolution]} className="w-full md:w-3/5" id="resolution" defaultValue={[resolution]} max={20} min={10} step={1} onValueChange={(value) => setResolution(value[0])}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Tick Rate: {tickRate}</span>
                        <Slider value={[tickRate]} className="w-full md:w-3/5" id="tickRate" defaultValue={[tickRate]} max={500} min={1} step={1} onValueChange={(value) => setTickRate(value[0])}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Sparsity: {sparsity}</span>
                        <Slider value={[sparsity]} className="w-full md:w-3/5" id="sparsity" defaultValue={[sparsity]} max={0.5} min={-0.5} step={0.01} onValueChange={(value) => setSparsity(value[0])}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Competition: {overpopulatedThreshold}</span>
                        <Slider value={[overpopulatedThreshold]} className="w-full md:w-3/5" id="competition" defaultValue={[overpopulatedThreshold]} max={8} min={0} step={1} onValueChange={(value) => setOverpopulatedThreshold(value[0])}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Opportunity: {underpopulatedThreshold}</span>
                        <Slider value={[underpopulatedThreshold]} className="w-full md:w-3/5" id="opportunity" defaultValue={[underpopulatedThreshold]} max={8} min={0} step={1} onValueChange={(value) => setUnderpopulatedThreshold(value[0])}/>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-2">
                        <span className="w-full md:w-2/5">Reproduction: {reproductionThreshold}</span>
                        <Slider value={[reproductionThreshold]} className="w-full md:w-3/5" id="reproduction" defaultValue={[reproductionThreshold]} max={8} min={0} step={1} onValueChange={(value) => setReproductionThreshold(value[0])}/>
                    </div>
                    <div className="flex justify-between w-full items-center gap-2 pt-2">
                        <span className="w-full md:w-2/5">Cells Alive: {grid.reduce((count, cell) => count + (cell === 1 ? 1 : 0), 0)}</span>
                        <button title="Reset to Settings to Default Values" className="border border-black border-2 p-1 w-full md:w-3/5 bg-rose-300 hover-enlarge-sm" onClick={restoreToDefaults}>
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            }
            <div className={`flex flex-wrap z-0 relative justify-center items-center`}>
                {gridCells}
            </div>
        </div>
    )
};