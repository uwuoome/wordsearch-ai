const base = "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIIOOOOOOOOONNNNNRRRRRSSSSSTTTTTLLLLUUUUDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ__";
let bag = null;

const shuffle = (arr) => arr.sort((a, b) => Math.random() < 0.5? -1: 1);
function init(){
  bag = shuffle( base.split("") );
  console.log("Bag initialized", bag);
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

// TODO: move the remove from hand code into the AI
function draw(hand=[], toRemove=""){
  if(toRemove != ""){
    removeFirstInstances(hand, toRemove);
  }
  const replaceBlanks = (ch) =>{ // 
    if(ch != "_") return ch;
    return shuffle("AEIOUDRS".split("")).pop();
  }
  const n = Math.min(bag.length, 7-hand.length);
  const drawn = bag.splice(0, n)//.map(replaceBlanks);
  const r = [...drawn, ...hand];
  console.log("hand", hand, "replacing", toRemove, "new", r, "bag", bag.length);
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