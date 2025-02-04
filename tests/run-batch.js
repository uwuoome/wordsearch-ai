import {aiInit, aiFindMove} from '../src/ai/ai.js'
import letterbag from '../src/simulate/letterbag.js'
import {stepTimer} from '../src/ai/util.js'
import {loadWordList} from './load-wordlist.js'
import {scoreRemaining} from '../src/ai/score.js'

/* This either simulates a sequence of games to measure time and scores, or it generates end game states to use for testing min-max*/ 
const GAMES_TO_RUN = 500; 
const DETAIL_LEVEL = 1;                 // 0 = time and score; 1 = +board; 2 = +moves;
const GENERATE_END_GAME_STATE = false;  // false = full game results; true = end game states
const PLAYER_1_SKILL = 6;
const PLAYER_2_SKILL = 5;

const start = Date.now();
const timer = stepTimer();

const wordlist = await loadWordList('../public/dictionary2019.txt');
timer("Word List Loaded");

const scores = [];
let playerOuts = 0;
let p1wins = 0, p2wins = 0;

const averageScore = (scores, pn) => {
  const sum = scores.reduce((acc, cur) => acc+parseInt(cur[pn-1]), 0);
  return Math.round(sum / GAMES_TO_RUN); 
};
aiInit(wordlist, {compress: false, debug: 0});
timer("DAWG Created");
for(let i=0; i<GAMES_TO_RUN; i++){
  playGame(i, DETAIL_LEVEL);
  timer("Time");
}
console.log("Games Played", GAMES_TO_RUN)
console.log("P1 skill",  PLAYER_1_SKILL, "avg score", averageScore(scores, 1));
console.log("P2 skill",  PLAYER_2_SKILL, "avg score", averageScore(scores, 2));
console.log("Player ", (playerOuts > 0)? 2: 1, "out", Math.abs(playerOuts), "more than opponent");
console.log("P1 wins", p1wins, "P2 wins", p2wins);
console.log("Total time elapsed", Date.now()-start, "ms");

function playGame(gameNumber, detailLevel=1){
  const board = Array(225).fill(" ");
  const width = 15;
  const players = [{}, {}];
  let playerNumber = 0;
  letterbag.init();
  players[0].score = 0; 
  players[0].skill = PLAYER_1_SKILL;
  players[0].letters = letterbag.draw();
  players[1].score = 0; 
  players[1].skill = PLAYER_2_SKILL;
  players[1].letters = letterbag.draw();
  takeTurn(false);
  
  function endGameState(){
    console.log(`"${board.join("")}"`);
    console.log("Active Player (p1 = 0, p2 = 1): ", playerNumber);
    console.log("Player 1 remaining: ", players[0].letters.join("")); 
    console.log("Player 2 remaining: ", players[1].letters.join("")); 
  }

  function endGame(finished=true){
    if(detailLevel > 0){
      for(let r = 0; r<15; r++){
        const rowData = board.slice((r*width), (r*width)+15).join(" ");
        console.log(rowData);
      }
    }
    if(finished){
      const remainingLetters = players[playerNumber^1].letters.join("");
      const endModifier = scoreRemaining(remainingLetters);
      players[playerNumber].score += endModifier;
      players[playerNumber ^ 1].score -= endModifier;
      const out = "P"+(playerNumber+1)+" out. Scores:";
      console.log("End game bonus", endModifier); 
      console.log("Game", gameNumber+1, out, "P1:", players[0].score, "P2:", players[1].score);
      scores.push([players[0].score, players[1].score]);
      playerOuts += (playerNumber == 1)? 1: -1; 
    }else{
      console.log("Game", gameNumber+1, "P1:", players[0].score, "P2:", players[1].score);
      console.log("Unfinished game");
    }
    if(players[0].score > players[1].score){
      p1wins += 1;
    }else if(players[1].score > players[0].score){
      p2wins += 1;
    }     
    
   
  }
  function score(playerNumber, toPlace){
    const p = players[playerNumber];
    p.score += toPlace.score;
    p.letters = letterbag.draw(p.letters, toPlace.word);
  }
  
  function endGameLetters(){
    if(letterbag.remaining() == 0) return players[playerNumber^1].letters;
    return null;
  }
  function takeTurn(lastTurnPassed){
    const player = players[playerNumber];
    const toPlace = aiFindMove(board, player.letters.join(""), endGameLetters(), player.skill);
    if(detailLevel > 1){
      console.log("Player", playerNumber+1, "plays", toPlace, "using", players[playerNumber].letters.join("")); 
    }
    if(toPlace == null){
      if(lastTurnPassed) return endGame(false);
      playerNumber ^= 1;
      return takeTurn(true);
    }
    const word = toPlace.word.split("");
    const inc = toPlace.dir == "a"? 1: width;
    for(let i=0; i<word.length; i++){
      board[toPlace.pos+(i*inc)] = word[i];
    }
    score(playerNumber, toPlace);
    if(letterbag.remaining() == 0){
      if(GENERATE_END_GAME_STATE) return endGameState();
      if(player.letters.length == 0) return endGame(true);
    }
    playerNumber ^= 1;
    return takeTurn(false);
  }
}


