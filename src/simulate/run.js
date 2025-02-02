import letterbag from './letterbag.js'
import {aiFindMove} from '../ai/ai.js'
import {updateBoard, addScore, clearPlayerScores} from '../main.js'
/** RUNS SIMULATION GAMES **/

const STEP_TIME = 100;
const players = [{}, {}];
let paused = false;
let playerNumber = 0; // active player

export function changeSkill(pn, event){
  players[pn].skill = parseInt(event.target.value);
}  

// change update letters and score for player
function score(playerNumber, toPlace){
  const p = players[playerNumber];
  p.score += toPlace.score;
  p.letters = letterbag.draw(p.letters, toPlace.word);
  addScore(playerNumber, toPlace, p.score);  
}

function placeWord(board, toPlace, nextTurn){
  if(toPlace == null){
    playerNumber ^= 1;
    return nextTurn(board, true);
  }
  const word = toPlace.word.split("");
  const width = Math.sqrt(board.length);
  const inc = toPlace.dir == "a"? 1: width;
  let i = 0;
  
  const interval = setInterval(() => {
    if(word.length == 0){
      score(playerNumber, toPlace);
      clearInterval(interval);
      playerNumber ^= 1;
      return nextTurn(board, false);
    }
    board[toPlace.pos+i] = word.shift();
    i += inc;
    updateBoard(board, width);
  }, STEP_TIME);
}

function isGameOver(toPlace, lastTurnPassed){
  if(players[playerNumber ^ 1].letters.length == 0) return true; // player who just passed is out of letters
  if(lastTurnPassed && toPlace == null) return true; // both players coudln't make a word
  return false;
}

function takeTurn(board, lastTurnPassed){
  if(paused) return;
  const player = players[playerNumber];
  const toPlace = aiFindMove(board, player.letters.join(""), null, player.skill);
  if(isGameOver(toPlace, lastTurnPassed)) return endGame();
  console.log("Player", playerNumber+1, "plays", toPlace, "using", player.letters.join("")); 
  placeWord(board, toPlace, takeTurn);
}

function endGame(){
  document.getElementById("run").innerText = "Restart";
}

function restart(board, button){
  board = board.map(c => " ");
  button.innerText = "Stop";
  updateBoard(board, Math.sqrt(board.length));
  clearPlayerScores();
  letterbag.init();
  players[0].score = 0; 
  players[0].letters = letterbag.draw();
  players[1].score = 0;
  players[1].letters = letterbag.draw();
  playerNumber = 0;
  takeTurn(board, false); 
}

export function run(board, event){
  if(event.target.innerText == "Stop"){
    paused = true;
    event.target.innerText = "Resume";
  }else if(event.target.innerText == "Resume"){
    paused = false;
    event.target.innerText = "Stop";
    takeTurn(board, false);
  }else if(event.target.innerText == "Restart"){
    restart(board, event.target);
  }else{
    event.target.innerText = "Stop";
    letterbag.init();
    players[0].score = 0; 
    players[0].letters = letterbag.draw();
    players[1].score = 0; 
    players[1].letters = letterbag.draw();
    playerNumber = 0;
    takeTurn(board, false);
  }
}