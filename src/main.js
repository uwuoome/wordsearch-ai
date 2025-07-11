import './style.css'
import './board.css'
import dict from './dict.js'
import {aiInit, aiFindMove} from './ai/ai.js'
import {getTiles, letterValues} from './ai/score.js'
import {run, changeSkill} from './simulate/run.js'
import {place} from './ai/util.js'

const showLetterScore = true;
const boardWidth = 15;
const board = Array(boardWidth*boardWidth).fill(" ");


async function init(){
  await dict.load();
  aiInit(dict.words(), {skill: 5, priority: "length", compress: true, debug: 1});
  document.getElementById("p0skill").addEventListener("change", changeSkill.bind(null, 0));
  document.getElementById("p1skill").addEventListener("change", changeSkill.bind(null, 1));  
}

addEventListener("load", init);

function render(board, boardWidth){
  const isLowerCase = (ch) => ch >= 'a' && ch <= 'z';
  function cellClass(i){
    if(board[i] != " "){
      if(isLowerCase(board[i])) return "cell letter blank"; 
      return "cell letter";
    }
    const tiles = getTiles();
    const code = (tiles[i] == "★")? "DW": tiles[i];
    return ("cell "+code.toLowerCase()).trim();
  }
  function cellDetails(i, letter){
    if(showLetterScore) return letterValues[letter] || "";
    return `${i % boardWidth},${Math.floor(i / boardWidth)}(${i})`;
  }
  function renderCell(letter, i){
    return `
    <div class="${cellClass(i)}">
      <div class="char">${letter.toUpperCase()}</div>
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
export function addGameOutScore(letters, score, playerNumber, total1, total2){
  document.querySelector("#score"+playerNumber).innerHTML += `<div>${letters.join(",")} bonus: ${score}</div>`;
  document.querySelector("#score"+(playerNumber ^ 1)).innerHTML += `<div>${letters.join(",")} penalty: -${score}</div>`;
  document.querySelector("#player"+playerNumber).innerHTML = `Player ${playerNumber+1}: ${total1}`;
  document.querySelector("#player"+(playerNumber ^ 1)).innerHTML = `Player ${(playerNumber^1)+1}: ${total2}`;
}
export function clearPlayerScores(){
  document.querySelector("#player0").innerHTML = `Player 1`;
  document.querySelector("#score0").innerHTML = ``;  
  document.querySelector("#player1").innerHTML = `Player 2`;
  document.querySelector("#score1").innerHTML = ``;  
}

updateBoard(board, boardWidth);
document.querySelector('#run').addEventListener("click", run.bind(null, board));

document.getElementById("limitvocab").addEventListener("change", async (event) => {
  await dict.load(event.target.checked);
  aiInit(dict.words(), {skill: 5, priority: "length", compress: true, debug: 1});
});