import {chunk, chunkByColumns, stepTimer} from './util.js'
import DirectedAcyclicWordGraph from './dawg.js'
import {calculateScore} from './score.js'

let dawg = null;
let letters = [];

function init(dict, letterList){
  const timer = stepTimer();
  dawg = new DirectedAcyclicWordGraph(dict);
  dawg.minimize();
  console.log("DAWG built in", timer());
  console.log(dawg.testCompression());
  letters = letterList; 
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

function play(board, letters){
  // TODO: if the board is empty straddle start
  
  const width = Math.sqrt(board.length);
  if(Math.floor(width) != width) throw Error("Invalid board passed to ai play.");
  const attachPoints = findAttachPoints(board, width);
  //console.log("attach points found", attachPoints);
  if(attachPoints.length === 0) return false;
  const moves = {};
  const lookup = createLookupTable(board, width);
  
  const start = Date.now();
  attachPoints.forEach(p => {
    const found = findMoves(lookup, p, letters);
    p.found = found;
  });
  const nm = attachPoints.reduce((acc, cur) => acc + cur.found.length, 0);
  //console.log("Best scoring", bestResult(board, attachPoints));
  console.log(nm, "dawg moves found in ", Date.now()-start, "millisecs");
  return bestResult(board, attachPoints);
}

function bestResult(board, attachPoints){
  const boardWidth = Math.sqrt(board.length);
  //const placementCells = {};
  let best = {score: 0};
  attachPoints.filter(ap => ap?.found.length).forEach(ap =>  {
    const apX = ap.at % boardWidth;
    const apY = Math.floor(ap.at / boardWidth);
    ap.found.forEach(found => {
      const pos = ap.dir == "a"? found.at+(apY*boardWidth): (found.at*boardWidth)+apX;
      //if(! placementCells[pos]) placementCells[pos] = {"a": [], "d": []}; 
      const score = calculateScore(board, boardWidth, pos, ap.dir, found.word, found.perp);
      if(score > best.score){
        best = {pos, dir: ap.dir, word: found.word, score};
       // if(found.perp) console.log("New Best", best, "perpendicular", found.perp)
      }
      //placementCells[pos][ap.dir].push({word: found.word, score});
    });
  });
  console.log("Best result", best);
  
  return best.score > 0? best: null;
  //return placementCells;
}


const ai ={
  init, play
};

export default ai;