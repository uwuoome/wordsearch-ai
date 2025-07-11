export const letterValues = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, 
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const tiles = [
  "TW", "  ", "  ", "DL", "  ", "  ", "  ", "TW", "  ", "  ", "  ", "DL", "  ", "  ", "TW", 
  "  ", "DW", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "DW", "  ",
  "  ", "  ", "DW", "  ", "  ", "  ", "DL", "  ", "DL", "  ", "  ", "  ", "DW", "  ", "  ",
  "DL", "  ", "  ", "DW", "  ", "  ", "  ", "DL", "  ", "  ", "  ", "DW", "  ", "  ", "DL", 
  "  ", "  ", "  ", "  ", "DW", "  ", "  ", "  ", "  ", "  ", "DW", "  ", "  ", "  ", "  ", 
  "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", 
  "  ", "  ", "DL", "  ", "  ", "  ", "DL", "  ", "DL", "  ", "  ", "  ", "DL", "  ", "  ", 
  "TW", "  ", "  ", "DL", "  ", "  ", "  ", "★" , "  ", "  ", "  ", "DL", "  ", "  ", "TW", 
  "  ", "  ", "DL", "  ", "  ", "  ", "DL", "  ", "DL", "  ", "  ", "  ", "DL", "  ", "  ", 
  "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", 
  "  ", "  ", "  ", "  ", "DW", "  ", "  ", "  ", "  ", "  ", "DW", "  ", "  ", "  ", "  ", 
  "DL", "  ", "  ", "DW", "  ", "  ", "  ", "DL", "  ", "  ", "  ", "DW", "  ", "  ", "DL",
  "  ", "  ", "DW", "  ", "  ", "  ", "DL", "  ", "DL", "  ", "  ", "  ", "DW", "  ", "  ", 
  "  ", "DW", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "TL", "  ", "  ", "  ", "DW", "  ", 
  "TW", "  ", "  ", "DL", "  ", "  ", "  ", "TW", "  ", "  ", "  ", "DL", "  ", "  ", "TW" 
];

let customTiles = null;
export function getTiles(){
  return customTiles || tiles;
}
export function setCustomTiles(custom){
  if(custom == null){
    customTiles = null;
    return;
  }
  if(! Array.isArray(custom) ) throw new Error("Custom tiles must be an array");
  const width = Math.sqrt(custom.length);
  if(Math.floor(width) != width) throw new Error("Custom tiles must represent a square grid");
  if(width < 5 || width > 50) throw new Error("Custom tiles grid width not between 5 and 5"); 
  customTiles = custom;
}

export function calculateScore(board, width, at, dir, word, perp){
  const tiles = getTiles();
  const [inc, pinc] = dir == "a"? [1, width]: [width, 1];
  function letterModifier(board, at){
    if(board[at] != " ") return 1;
    if(tiles[at] == "DL") return 2;
    if(tiles[at] == "TL") return 3;
    return 1;
  }
  function wordMultiplier(board, word, at, offset){
    const multipliers = {"DW": 2, "TW": 3, "★": 2};
    const getMultiplier = (pos) => board[pos] != " "? 1: (multipliers[tiles[pos]] || 1); 
    return word.split("").reduce((acc, cur, i) => acc * getMultiplier(at+(i*offset)), 1);
  }  
  const sumLetters = (inc, acc, cur, i) => {
    const letterValue = (letterValues[cur] || 0) * letterModifier(board, at+inc*i);
    return acc + letterValue;
  };
  const sum = (acc, cur) => acc + cur;
  const wordValue = word.split("").reduce(sumLetters.bind(null, inc), 0) * wordMultiplier(board, word, at, inc);
  const pValue = perp.map(p => {
    const pos = at + (p.rowOffset * inc) + (p.colOffset * pinc);
    return p.word.split("").map((ch, i) => {
      return (letterValues[ch] || 0) * letterModifier(board, pos + (i*pinc));
    }).reduce(sum, 0) * wordMultiplier(board, p.word, pos, pinc);
  }).reduce(sum, 0);
  const lettersUsed = word.split("").reduce((acc, cur, i) => acc + (board[at+i*inc] == " "? 1: 0), 0);  
  const bonus = lettersUsed == 7? 50: 0;
  return wordValue + pValue + bonus; 
}

export function scoreRemaining(letters){
  const sumScore = (acc, cur) => acc +  (letterValues[cur] || 0)
  return letters.split("").reduce(sumScore, 0);
}