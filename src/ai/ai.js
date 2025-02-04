import {chunk, chunkByColumns, stepTimer, place} from './util.js'
import DirectedAcyclicWordGraph from './dawg.js'
import {calculateScore, scoreRemaining} from './score.js'

let dawg = null; 
let opts = null;
const defaultOpts = {skill:5, compress: true, debug: 0};

const constrain = (low, high, value) => Math.max(Math.min(parseInt(value, 10), high), low); 
const from0to6 = constrain.bind(null, 0, 6);
const aiSkill = (override) => from0to6(override != null? override: opts.skill);

/**
 * Initializes the AI with a given word list and configuration options.
 * 
 * @param {Array} wordList - The list of words the AI will use. Note: Must be in Upper Case.
 * @param {Object} options - Configuration settings for the AI.
 */
export function aiInit(wordList, options={}){
  opts = {...defaultOpts, ...options};
  opts.skill = from0to6(opts.skill);
  const timer = stepTimer();
  dawg = new DirectedAcyclicWordGraph(wordList, debug);
  if(opts.compress){
    if(opts.debug){
      console.log(dawg.testCompression()); 
    }else{
      dawg.minimize();
    }
  }
  debug("DAWG built in", timer(), "millisecs");
}

/**
 * Finds the best move for the AI in a word game, based on it's skill level.
 * 
 * @param {Array} board - The current board state as a 1D array. Represented by uppercase letters, 
          lower case letters (for blanks), and spaces.
 * @param {Array} letters - The letters available for the AI to use.
 * @param {Array|null} opLetters - (Optional) Letters the opponent has. A non null value signals
          the end game as they can be infered from board and rack, and used to min-max.
 * @param {number|null} skillOverride - (Optional) A value between 0 and 6 for adjusting skill.
          At level 6 the AI will min-max the end game (where opponent's letters can be inferred).
 * @param {boolean} allMoves (Optional) if set all moves found will returned in a list with scores.      
 * @returns {Object|null} - An appropriate move based on skill level, or null if none found.
 */
export function aiFindMove(board, letters, opLetters=null, skillOverride=null, allMoves=false){
  if(! (dawg && opts)) throw Error("AI Not initialized successfully with init method.");
  const width = Math.sqrt(board.length);
  if(Math.floor(width) != width) throw Error("Invalid board passed to AI play method.");
  const attachPoints = findAttachPoints(board, width);
  if(attachPoints.length === 0) return false;
  const moves = {};
  const lookup = createLookupTable(board, width);
  
  const start = Date.now();
  attachPoints.forEach(p => {
    const found = findMoves(lookup, p, letters);
    p.found = found;
  });
 
  const scoredMoves = scoreAllResults(board, attachPoints);
  if(allMoves){
    return scoredMoves;
  }
  const result = selectMove(board, scoredMoves, letters, opLetters, skillOverride);
  
  if(opts.debug){
    const nm = attachPoints.reduce((acc, cur) => acc + cur.found.length, 0);
    console.log(nm, "dawg moves found in ", Date.now()-start, "millisecs");
    console.log("highest scoring:", result);
  }
  return result;
}


function debug(){ 
  if(! opts.debug) return; 
  console.log.apply(null, arguments);
}

function findAttachPoints(board, width){
  const found = new Set([]);
  function letterHere(origin, offset){
    const adjacent = origin + offset;
    if(adjacent < 0 || adjacent >= board.length) return 0;
    if(Math.abs(offset) == 1 && Math.floor(adjacent / width) != Math.floor(origin / width)) return false;
    return board[adjacent] != " ";
  }
  board.forEach((c, i) => {
    if(board[i] != " ") return;
    const edges = [-width, width, -1, 1];
    if( edges.find(letterHere.bind(null, i))) {
      found.add({at: i, dir: "a"});
      found.add({at: i, dir: "d"});
    }
  });
  const result = Array.from(found);
  if(result.length == 0){ // if there are no letters on the board create starting point
    const starIndex = board.findIndex(ch => ch == '★');
    const startIndex = starIndex == -1? Math.floor(board.length / 2): starIndex;
    result.push({at: startIndex, dir: "a"});
    result.push({at: startIndex, dir: "d"});
  }
  return result;
}

function createLookupTable(board, width){
  return {
     rows: chunk(board, width),
     cols: chunkByColumns(board, width)
  };
}

// Returns a a constraints object for a row or column of the board defining indexes where letters are placed
function getSliceConstraints(lookup, dir, px, py){
  function toConstraints(slice){
    return slice.reduce((acc, cur, i) => {
      if(cur != " ") acc[i] = cur;
      return acc;
    }, {});
  }
  if(dir == "a") return toConstraints(lookup.rows[py]);
  return toConstraints(lookup.cols[px]); 
}

// finds all moves that fit on the board
function findMoves(lookup, point, letters, method){
  const width = lookup.rows.length; 
  const [px, py] = [point.at % width, Math.floor(point.at / width)];
  const [pointIndex, pointRow, perpBoard] = point.dir == "a"? [px, py, lookup.cols]: [py, px, lookup.rows];
  const constraints = getSliceConstraints(lookup, point.dir, px, py);
  const result = [];
  for(let i=0; i<=pointIndex; i++){
    if(constraints[i-1]) continue; // if preceding tile has a letter, we cant start here. Or, it would need to be included with the word.
    const minLength = Math.max((pointIndex - i), 2);
    const maxLength = width - i;
    let words = dawg.findWords(letters, i, pointIndex, pointRow, minLength, maxLength, constraints, perpBoard); 
    if(words?.length) result.push(words);   
  }
  return result.flat();
}

function scoreAllResults(board, attachPoints){
  const boardWidth = Math.sqrt(board.length);
  return attachPoints.filter(ap => ap?.found.length).map(ap => {
    const apX = ap.at % boardWidth;
    const apY = Math.floor(ap.at / boardWidth);
    return ap.found.map(found => {
      const pos = ap.dir == "a"? found.at+(apY*boardWidth): (found.at*boardWidth)+apX; 
      const score = calculateScore(board, boardWidth, pos, ap.dir, found.word, found.perp);
      return {pos, dir: ap.dir, word: found.word, score};
    });
  });
}

const topScoring = (acc, cur) => cur.score > acc.score? cur: acc;

function selectMove(board, moves, letters, opLetters, skillOverride){
  if(!moves?.length) return null; 
  const skill = aiSkill(skillOverride);
  if(skill >= 5){ // return best word
    if(skill > 5 && opLetters){ // at end game with opponent's letters inferred
      const finishingMove = findFinishingMove(board, moves, letters);
      if(finishingMove){
        console.log("Getting out with", finishingMove.score, "Opponent letters", opLetters);
        return finishingMove; // this assumes getting out is best which may not be the case
      }
      return minMax(board, moves, letters, opLetters);
    }
    return moves.flat().reduce(topScoring, {score:0});
  }
  const trendTowards = [10, 15, 20, 24, 28];
  const targetScore = trendTowards[skill] + Math.floor(Math.random() * ((skill+1)*3));
  // find a move that's closest to the target score
  return moves.flat().reduce((acc, cur) => Math.abs(targetScore-cur.score) < Math.abs(targetScore-acc.score)? cur: acc, {score:0});
}

// gets the letters that already exist on the board from the word in the move
function getBoardLettersInMove(board, move){
  const inc = move.dir == "a"? 1: Math.sqrt(board.length);
  return move.word.split("").filter((ch, i) => board[move.pos+i*inc] != " ");
}

// removed teh first instance of each letter in toRemove from the letters passed in
function removeLetters(letters, toRemove){
  return toRemove.split("").reduce((acc, cur) => acc.replace(cur, ""), letters);
}

function findFinishingMove(board, moves, letters, allMoves=false){
  const out = moves.flat().filter(move => {
    const boardLetters = getBoardLettersInMove(board, move).length;
    return (move.word.length - boardLetters == letters.length);
  });  
  if(! out?.length) return null;
  if(allMoves) return out;
  return out.reduce(topScoring, {score: 0});
}

function minMax(board, moves, letters, opLetters){
  const timer = stepTimer();
  
  const deltas = moves.map(ap => {
    const best = ap.reduce((acc, cur) => cur.score > acc.score? cur: acc, {score:0});
    const nextBoardState = place(board.join("").split(""), best);    
    const opMoves = aiFindMove(nextBoardState, opLetters, null, 5, true);
    const opBest = opMoves.flat().reduce(topScoring, {score: 0});
    const out = findFinishingMove(nextBoardState, opMoves, opLetters, true);
    if(out?.length){ // if can opponent get out following turn factor that into delta
      const bestOut = out.reduce(topScoring, {score: 0}); 
      const boardLetters = getBoardLettersInMove(board, best).join("");
      const remainingLetters = removeLetters(letters, removeLetters(best.word, boardLetters) );
      best.delta = best.score - (opBest.score + scoreRemaining(remainingLetters) * 2);
    }else{
      best.delta = best.score - opBest.score;
    }
    return best;
  });
  
  const topDelta = deltas.reduce((acc, cur) => cur.delta > acc.delta? cur: acc, {delta:-999});
  if(opts.debug > 0){
    const topScore = deltas.reduce(topScoring, {score:0});
    debug("Delta:", topDelta, "Score:", topScore); 
    timer("Minmax in");
  }
  
  return topDelta;
}