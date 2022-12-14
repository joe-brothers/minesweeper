import { createSlice } from "@reduxjs/toolkit";
import { getRandomNumber } from "utils/math";

// 게임 판(board)에 관련된 정보와 함수를 갖고 있는 slice
export const boardSlice = createSlice({
  name: "boardSlice",
  // boardArray: 2차원 배열로 나타낸 게임판
  // revealedCells: 열린 칸의 개수
  // flaggedCells: 깃발을 꽂은 칸의 개수
  initialState: { boardArray: [], revealedCells: 0, flaggedCells: 0 },
  reducers: {
    // 빈 board를 난이도별 크기에 맞게 2차원 배열로 만드는 함수
    createEmptyBoard: (state, action) => {
      const { width, height } = action.payload;
      let newArray = [];
      for (let i = 0; i < height; i++) {
        newArray.push([]);
        for (let j = 0; j < width; j++) {
          newArray[i][j] = {
            // y, x: 해당 칸의 좌표
            // isFalseAlarm: 지뢰가 없는데 깃발을 꽂은 칸이라면 true
            // isRevealed: 칸이 열렸으면 true
            // isMine: 지뢰가 있는 칸이라면 true
            // isFlagged: 깃발이 꼽혀있는 칸이라면 true
            // isQuestionable: 물음표로 표시된 칸이라면 true
            // didBust: 해당 칸을 눌러서 게임오버됐다면 true
            // minesNeighbor: 이웃한(상하좌우대각선) 지뢰의 개수
            y: i,
            x: j,
            isFalseAlarm: false,
            isRevealed: false,
            isMine: false,
            isFlagged: false,
            isQuestionable: false,
            didBust: false,
            minesNeighbor: 0,
          };
        }
      }
      state.boardArray = newArray;
      state.revealedCells = 0;
      state.flaggedCells = 0;
    },
    // board 배열에 지뢰를 난이도별 지뢰 개수에 맞게 심는 함수
    plantMines: (state, action) => {
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;
      const { mine } = action.payload;
      let minesPlanted = 0;
      while (minesPlanted < mine) {
        let y = getRandomNumber(0, height);
        let x = getRandomNumber(0, width);
        if (!state.boardArray[y][x].isMine) {
          state.boardArray[y][x].isMine = true;
          minesPlanted += 1;
        }
      }
    },
    // board를 처음부터 끝까지 훑으며, 지뢰가 없는 칸의 경우
    // 인접한(가로, 세로, 대각선) 칸에 있는 지뢰의 개수를 기록하는 함수
    getMinesNeighbor: (state, action) => {
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;
      const dy = [1, -1, 0, 1, -1, 0, 1, -1];
      const dx = [0, 0, 1, 1, 1, -1, -1, -1];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (state.boardArray[y][x].isMine) {
            continue;
          }

          let minesNeighbor = 0;
          for (let i = 0; i < 8; i++) {
            const ny = y + dy[i];
            const nx = x + dx[i];
            if (0 <= ny && ny < height && 0 <= nx && nx < width && state.boardArray[ny][nx].isMine) {
              minesNeighbor += 1;
            }
          }
          state.boardArray[y][x].minesNeighbor = minesNeighbor;
        }
      }
    },
    // 특정 cell부터 bfs를 수행하는 함수
    bfsCells: (state, action) => {
      const dy = [1, -1, 0, 1, -1, 0, 1, -1];
      const dx = [0, 0, 1, 1, 1, -1, -1, -1];

      const { y, x } = action.payload;
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;
      const queue = [{ y, x }];
      const visited = new Set([JSON.stringify({ y, x })]);

      while (queue.length) {
        let { y, x } = queue.shift();
        const { isMine, isFlagged, isQuestionable, isRevealed, minesNeighbor } = state.boardArray[y][x];
        if (isMine || isFlagged || isQuestionable || isRevealed) continue;
        state.boardArray[y][x].isRevealed = true;
        state.revealedCells += 1;
        if (minesNeighbor !== 0) continue;

        for (let i = 0; i < 8; i++) {
          const ny = y + dy[i];
          const nx = x + dx[i];
          const next_pos = { y: ny, x: nx };
          if (0 <= ny && ny < height && 0 <= nx && nx < width && !visited.has(JSON.stringify(next_pos))) {
            queue.push(next_pos);
            visited.add(JSON.stringify(next_pos));
          }
        }
      }
    },
    // 지뢰 하나를 옮겨심는 함수
    moveOneMine: (state, action) => {
      const { y, x } = action.payload;
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;

      let candidates = [];
      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          if (!state.boardArray[i][j].isMine ) {
            candidates.push({ y: i, x: j });
          }
        }
      }
      const nextPos = candidates[getRandomNumber(0, candidates.length)];
      state.boardArray[y][x].isMine = false;
      state.boardArray[nextPos.y][nextPos.x].isMine = true;
    },
    // 칸 한개를 여는 함수
    revealCell: (state, action) => {
      const { y, x } = action.payload;
      state.boardArray[y][x].isRevealed = true;
      state.revealedCells += 1;
    },
    // 지뢰가 있는 모든 칸을 여는 함수 (지뢰 클릭시 실행)
    revealAllMines: (state) => {
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;

      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          // 깃발이 지뢰 있는 칸에 꼽혀있었던 경우 칸을 열지 않는다.
          const { isMine, isFlagged } = state.boardArray[i][j];
          if (isMine && !isFlagged) {
            state.boardArray[i][j].isRevealed = true;
          }
        }
      }
    },
    // 게임오버를 하게 만든 지뢰를 표시하는 함수
    indicateBust: (state, action) => {
      const { y, x } = action.payload;
      state.boardArray[y][x].didBust = true;
    },
    // 칸에 우클릭 했을 때 기능을 처리하는 함수
    // 칸이 열려있는 경우 아무 기능도 수행하지 않는다.
    // 칸이 닫혀있는 경우 빈칸 -> 깃발 -> 물음표 -> 빈칸 .. 순으로 순환한다.
    handleCellRightClick: (state, action) => {
      const { y, x, isRevealed, isFlagged, isQuestionable } = action.payload;
      if (isRevealed) {
        return;
      }
      if (isFlagged) {
        state.boardArray[y][x].isFlagged = false;
        state.boardArray[y][x].isQuestionable = true;
        state.flaggedCells -= 1;
        return;
      }
      if (isQuestionable) {
        state.boardArray[y][x].isQuestionable = false;
        return;
      }
      state.boardArray[y][x].isFlagged = true;
      state.flaggedCells += 1;
    },
    // 지뢰가 있는 모든 칸에 깃발을 꼽는 함수 (게임 이길시 실행)
    flagAllMines: (state) => {
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;

      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          if (state.boardArray[i][j].isMine) {
            state.boardArray[i][j].isFlagged = true;
          }
        }
      }
    },
    // 지뢰가 없는데 깃발 꽂은 칸들을 표시하는 함수 (게임 질시 실행)
    indicateFalseAlarms: (state) => {
      const height = state.boardArray.length;
      const width = state.boardArray[0].length;

      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          let { didBust, isMine, isFlagged } = state.boardArray[i][j];
          if (!didBust && !isMine && isFlagged) {
            state.boardArray[i][j].isFalseAlarm = true;
            state.boardArray[i][j].isRevealed = true;
          }
        }
      }
    },
  },
});

export const {
  createEmptyBoard,
  plantMines,
  getMinesNeighbor,
  moveOneMine,
  revealCell,
  revealAllMines,
  indicateBust,
  handleCellRightClick,
  bfsCells,
  flagAllMines,
  indicateFalseAlarms,
} = boardSlice.actions;
