import {aiInit, aiFindMove} from '../src/ai/ai.js'
import letterbag from '../src/simulate/letterbag.js'
import {stepTimer} from '../src/ai/util.js'
import {loadWordList} from './load-wordlist.js'

/* This simulates a sequence of games to measuring time and scores*/ 
const GAMES_TO_RUN = 100; 
const DETAIL_LEVEL = 1;     // 0 = time and score; 1 = +board; 2 = +moves

const start = Date.now();
const timer = stepTimer();

const wordlist = await loadWordList('../public/dictionary2019.txt');
timer("Word List Loaded");

const scores = [];
const averageScore = (scores) => {
  const sum = scores.reduce((acc, cur) => acc+parseInt(cur), 0);
  return Math.round(sum / GAMES_TO_RUN / 2); 
};
aiInit(wordlist, {compress: false, debug: 0});
timer("DAWG Created");
for(let i=0; i<GAMES_TO_RUN; i++){
  playGame(i, DETAIL_LEVEL);
  timer("Time");
}
console.log("Games Played", GAMES_TO_RUN, "Average Score", averageScore(scores));
console.log("Total time elapsed", Date.now()-start, "ms");

function playGame(gameNumber, detailLevel=0){
  const board = Array(225).fill(" ");
  const width = 15;
  const players = [{}, {}];
  let playerNumber = 0;
  letterbag.init();
  players[0].score = 0; 
  players[0].letters = letterbag.draw();
  players[1].score = 0; 
  players[1].letters = letterbag.draw();
  takeTurn(false);

  function endGame(){
    if(detailLevel > 0){
      for(let r = 0; r<15; r++){
        const rowData = board.slice((r*width), (r*width)+15).join(" ");
        console.log(rowData);
      }
    }
    console.log("Game", gameNumber+1, "P1:", players[0].score, "P2:", players[1].score);
    scores.push([players[0].score+players[1].score]);
  }
  function score(playerNumber, toPlace){
    const p = players[playerNumber];
    p.score += toPlace.score;
    p.letters = letterbag.draw(p.letters, toPlace.word);
  }
  function isGameOver(toPlace, lastTurnPassed){
    if(players[playerNumber ^ 1].letters.length == 0) return true;  // player who just passed is out of letters
    if(lastTurnPassed && toPlace == null) return true;              // both players coudln't make a word
    return false;
  }
  function takeTurn(lastTurnPassed){
    const toPlace = aiFindMove(board, players[playerNumber].letters.join(""));
    if(isGameOver(toPlace, lastTurnPassed)) return endGame();
    if(detailLevel > 1){
      console.log("Player", playerNumber+1, "plays", toPlace, "using", players[playerNumber].letters.join("")); 
    }
    if(toPlace == null){
      playerNumber ^= 1;
      return takeTurn(true);
    }
    const word = toPlace.word.split("");
    const inc = toPlace.dir == "a"? 1: width;
    for(let i=0; i<word.length; i++){
      board[toPlace.pos+(i*inc)] = word[i];
    }
    score(playerNumber, toPlace);
    playerNumber ^= 1;
    return takeTurn(false);
  }
}


