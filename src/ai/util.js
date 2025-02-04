export function chunk(arr, n) {
    const result = [];
    for(let i=0; i < arr.length; i+=n){
        result.push(arr.slice(i, i+n));
    }
    return result;
}

export function chunkByColumns(array, n) {
    const result = Array.from({ length: n }, () => []);
    array.forEach((item, index) => {
        result[index % n].push(item);
    });
    return result;
}

export function stepTimer(){
  let lastTime = Date.now();
  return (msg=null) => {
    const thisTime = Date.now();
    const delta = thisTime - lastTime;
    lastTime = thisTime;
    if(msg) console.log(msg, ":", delta, "ms");
    return delta;
  }
}

export function place(board, toPlace){
  const inc = toPlace.dir == "a"? 1: 15;
  toPlace.word.split("").forEach((ch, i) => {
    board[toPlace.pos+(i*inc)] = ch;
  });
  return board;
}