const base = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ__";
let bag = null;

function shuffle(array){ // fisher-yates
  for(let i = array.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function init(){
  bag = shuffle( base.split("") );
}

function removeFirstInstances(strArray, removeChars) {
  const isLowerCase = (ch) => ch >= 'a' && ch <= 'z';
  for(let char of removeChars){
    if(isLowerCase(char)){
      let index = strArray.indexOf("_");
      if(index !== -1) strArray.splice(index, 1);
    }else{
      let index = strArray.indexOf(char);
      if(index !== -1) strArray.splice(index, 1);
    }
  }
  return strArray;
}

function draw(hand=[], toRemove=""){
  if(toRemove != ""){
    removeFirstInstances(hand, toRemove);
  }
  const replaceBlanks = (ch) =>{ // 
    if(ch != "_") return ch;
    return shuffle("AEIOUDRS".split("")).pop();
  }
  const n = Math.min(bag.length, 7-hand.length);
  const drawn = bag.splice(0, n);
  const r = [...drawn, ...hand];
  //console.log("hand", hand, "replacing", toRemove, "new", r, "bag", bag.length);
  return r;
}

function change(hand=[]){
  bag = shuffle([...hand, ...bag]);
  return draw([]);
}

const letterbag = {
  init,
  draw,
  change
};
export default letterbag;