import {chunk, chunkByColumns, stepTimer} from './util.js'
import DirectedAcyclicWordGraph from './dawg.js'
import {calculateScore} from './score.js'

let dawg = null; 
let opts = null;
const defaultOpts = {skill:5, compress: true, debug: 0};

const constrain = (low, high, value) => Math.max(Math.min(parseInt(value, 10), high), low); 
const from0to5 = constrain.bind(null, 0, 5);
const aiSkill = (override) => from0to5(override != null? override: opts.skill);

/**
 * Initializes the AI with a given word list and configuration options.
 * 
 * @param {Array} wordList - The list of words the AI will use. Note: Must be in Upper Case.
 * @param {Object} options - Configuration settings for the AI.
 */
export function aiInit(wordList, options={}){
  opts = {...defaultOpts, ...options};
  opts.skill = from0to5(opts.skill);
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
 * @param {Array|null} opLetters - (Optional) Letters the opponent has. In the end game this can 
          be infered from board and rack, and used to min-max.
 * @param {number|null} skillOverride - (Optional) A value between 0 and 5 for adjusting skill.

 * @returns {Object|null} - An appropriate move based on skill level, or null if none found.
 */
export function aiFindMove(board, letters, opLetters=null, skillOverride=null){
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
 
  const result = selectMove(scoreAllResults(board, attachPoints), skillOverride);
  
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
  }).flat();
}

function selectMove(moves, skillOverride){
  if(!moves?.length) return null; 
  const skill = aiSkill(skillOverride);
  if(skill >= 5){ // return best word
    return moves.reduce((acc, cur) => cur.score > acc.score? cur: acc, {score:0});
  }
  const trendTowards = [10, 15, 20, 24, 28];
  const targetScore = trendTowards[skill] + Math.floor(Math.random() * ((skill+1)*3));
  // find a move that's closest to the target score
  return moves.reduce((acc, cur) => Math.abs(targetScore-cur.score) < Math.abs(targetScore-acc.score)? cur: acc, {score:0});
}
