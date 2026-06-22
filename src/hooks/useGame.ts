import { useState, useCallback, useEffect } from 'react';

export type GameStatus = 'idle' | 'playing' | 'cleared' | 'gameover';

export interface CellState {
  code: string;
  isMine: boolean;
  isOpen: boolean;
  neighborMines: number;
  isFlagged: boolean;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_RATES: Record<Difficulty, number> = {
  easy: 0.10,
  normal: 0.15,
  hard: 0.20,
};

export function useGame(featureCodes: string[], adjacency: Record<string, string[]>, prefCode?: string, difficulty: Difficulty = 'normal') {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const [time, setTime] = useState(0);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalMines = Math.max(3, Math.floor(featureCodes.length * DIFFICULTY_RATES[difficulty]));

  const initBoard = useCallback(() => {
    const initialCells: Record<string, CellState> = {};
    featureCodes.forEach(code => {
      initialCells[code] = {
        code,
        isMine: false,
        isOpen: false,
        neighborMines: 0,
        isFlagged: false,
      };
    });
    setCells(initialCells);
    setStatus('idle');
    setTime(0);
    setHighlightedCode(null);
    setIsNewRecord(false);
    // Load best time for this map + difficulty
    if (prefCode) {
      const storageKey = `hakuchizu-best-${prefCode}-${difficulty}`;
      const saved = localStorage.getItem(storageKey);
      setBestTime(saved ? parseInt(saved, 10) : null);
    }
  }, [featureCodes, difficulty, prefCode]);

  useEffect(() => {
    if (featureCodes.length > 0) {
      initBoard();
    }
  }, [featureCodes, initBoard, difficulty]);

  useEffect(() => {
    let timer: any;
    if (status === 'playing') {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'cleared' && prefCode) {
      const storageKey = `hakuchizu-best-${prefCode}-${difficulty}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved || time < parseInt(saved, 10)) {
        localStorage.setItem(storageKey, time.toString());
        setBestTime(time);
        setIsNewRecord(true);
      }
    }
  }, [status, prefCode, time, difficulty]);

  const placeMinesAsync = (firstClickedCode: string): Promise<Record<string, CellState>> => {
    return new Promise((resolve) => {
      const generateBoard = () => {
        const safeCodes = [firstClickedCode, ...(adjacency[firstClickedCode] || [])];
        
        // 孤島（隣接マスがない場所）には地雷を置かない
        const availableCodes = featureCodes.filter(c => !safeCodes.includes(c) && (adjacency[c] || []).length > 0);
        
        const shuffled = [...availableCodes].sort(() => Math.random() - 0.5);
        const mineCodes = shuffled.slice(0, Math.min(totalMines, availableCodes.length));

        const newCells: Record<string, CellState> = {};
        featureCodes.forEach(code => {
          newCells[code] = {
            code,
            isMine: false,
            isOpen: false,
            neighborMines: 0,
            isFlagged: false,
          };
        });

        mineCodes.forEach(code => {
          newCells[code].isMine = true;
        });

        featureCodes.forEach(code => {
          if (newCells[code].isMine) return;
          let count = 0;
          (adjacency[code] || []).forEach(neighborCode => {
            if (newCells[neighborCode]?.isMine) count++;
          });
          newCells[code].neighborMines = count;
        });

        return newCells;
      };

      const isSolvable = (board: Record<string, CellState>) => {
        const safe = new Set<string>();
        const mines = new Set<string>();
        
        featureCodes.forEach(c => {
          if ((adjacency[c] || []).length === 0) {
            safe.add(c);
          }
        });
        safe.add(firstClickedCode);

        let changed = true;
        while (changed) {
          changed = false;
          for (const code of safe) {
            const cell = board[code];
            const neighbors = adjacency[code] || [];
            
            const unknownNeighbors: string[] = [];
            let flaggedCount = 0;
            
            for (const n of neighbors) {
              if (mines.has(n)) {
                flaggedCount++;
              } else if (!safe.has(n)) {
                unknownNeighbors.push(n);
              }
            }

            if (unknownNeighbors.length === 0) continue;

            if (flaggedCount === cell.neighborMines) {
              unknownNeighbors.forEach(n => safe.add(n));
              changed = true;
            }
            
            if (flaggedCount + unknownNeighbors.length === cell.neighborMines) {
              unknownNeighbors.forEach(n => mines.add(n));
              changed = true;
            }
          }
        }

        for (const code of featureCodes) {
          if (!safe.has(code) && !mines.has(code)) {
            return false;
          }
        }
        return true;
      };

      let attempts = 0;
      let bestBoard = generateBoard();
      
      const nextBatch = () => {
        for (let i = 0; i < 10; i++) {
          const board = generateBoard();
          if (isSolvable(board)) {
            return resolve(board);
          }
          bestBoard = board;
          attempts++;
          if (attempts >= 200) {
            console.warn("No-guess board could not be generated after 200 attempts. Using fallback.");
            return resolve(bestBoard);
          }
        }
        // Yield to main thread to prevent freezing
        setTimeout(nextBatch, 0);
      };

      nextBatch();
    });
  };

  const toggleFlag = (code: string) => {
    if (status === 'cleared' || status === 'gameover') return;
    if (cells[code]?.isOpen) return;

    setCells(prev => {
      const newCells = {
        ...prev,
        [code]: {
          ...prev[code],
          isFlagged: !prev[code].isFlagged
        }
      };

      return newCells;
    });
  };

  const openCell = (code: string) => {
    if (status === 'cleared' || status === 'gameover' || isGenerating) return;
    if (cells[code]?.isOpen || cells[code]?.isFlagged) return;

    if (status === 'idle') {
      setIsGenerating(true);
      placeMinesAsync(code).then(newBoard => {
        setIsGenerating(false);
        setStatus('playing');
        processOpen(newBoard, code);
      });
      return;
    }

    processOpen(cells, code);
  };

  const processOpen = (currentCells: Record<string, CellState>, code: string) => {
    const nextCells = { ...currentCells };

    if (nextCells[code].isMine) {
      nextCells[code].isOpen = true;
      setCells(nextCells);
      setStatus('gameover');
      return;
    }

    const queue = [code];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);

      if (!nextCells[curr].isOpen && !nextCells[curr].isFlagged) {
        nextCells[curr].isOpen = true;
      }

      if (nextCells[curr].neighborMines === 0) {
        (adjacency[curr] || []).forEach(neighbor => {
          if (!nextCells[neighbor].isOpen && !nextCells[neighbor].isMine && !nextCells[neighbor].isFlagged) {
            queue.push(neighbor);
          }
        });
      }
    }

    const remainingSafeCells = Object.values(nextCells).filter(c => !c.isMine && !c.isOpen);
    if (remainingSafeCells.length === 0) {
      setStatus('cleared');
    }

    setCells(nextCells);
  };

  const resetGame = () => {
    initBoard();
  };

  const flaggedCount = Object.values(cells).filter(c => c.isFlagged).length;

  return {
    status,
    cells,
    time,
    bestTime,
    isNewRecord,
    highlightedCode,
    setHighlightedCode,
    openCell,
    toggleFlag,
    resetGame,
    totalMines,
    flaggedCount,
    isGenerating
  };
}
