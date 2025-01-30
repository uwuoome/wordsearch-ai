import './style.css'
import './board.css'
import dict from './dict.js'
import ai from './ai.js'
import {tiles, letterValues} from './score.js'
import {run} from './simulate/run.js'

const showLetterScore = true;
const boardWidth = 15;
const board = Array(boardWidth*boardWidth).fill(" ");

/*
  board[48] = "A";
  board[63] = "X";
  board[78] = "E";
 */
async function init(){
  await dict.load();
  ai.init(dict);

 // ai.play(board, "UM");
}
addEventListener("load", init);


function render(board, boardWidth){
  function cellClass(i){
    if(board[i] != " ") return "cell letter";
    const code = (tiles[i] == "★")? "DW": tiles[i];
    return ("cell "+code.toLowerCase()).trim();
  }
  //  <div class="score">${letterValues[letter] || ""}</div>
  function cellDetails(i, letter){
    if(showLetterScore) return letterValues[letter] || "";
    return `${i % boardWidth},${Math.floor(i / boardWidth)}(${i})`;
  }
  function renderCell(letter, i){
    return `
    <div class="${cellClass(i)}">
      <div class="char">${letter}</div>
      <div class="num">${cellDetails(i, letter)}</div>
    </div>`;
  }
  return `<div class="board" style="width:${boardWidth*40}px">${board.map(renderCell).join("")}</div>`;
}

export function updateBoard(board, boardWidth){
  document.querySelector('#main').innerHTML = render(board, boardWidth);
}

export function addScore(playerNumber, toScore, total){
  document.querySelector("#player"+playerNumber).innerHTML = `Player ${playerNumber+1}: ${total}`;
  document.querySelector("#score"+playerNumber).innerHTML += `<div>${toScore.word}: ${toScore.score}</div>`;
  document.querySelector("#player"+(playerNumber^1)).classList.add("active");
  document.querySelector("#player"+playerNumber).classList.remove("active");
}

export function clearPlayerScores(){
  document.querySelector("#player0").innerHTML = `Player 1`;
  document.querySelector("#score0").innerHTML = ``;  
  document.querySelector("#player1").innerHTML = `Player 2`;
  document.querySelector("#score1").innerHTML = ``;  
}

updateBoard(board, boardWidth);
document.querySelector('#run').addEventListener("click", run.bind(null, board));