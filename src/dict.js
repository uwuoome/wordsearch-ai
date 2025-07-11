let dictionary = null;

async function load(limited=false){
  if(dictionary == "loading") return;
  async function loadAsSet(){
    const result = await fetch(filePath);
    const text = await result.text();
    return new Set( text.split(/\r?\n/) );
  }
  const filePath = limited? "/vocabulary8000.txt": "/dictionary2019.txt";
  dictionary = "loading";
  await loadAsSet(filePath).then(async (result) => {
      dictionary = result;
      console.log(`Dictionary loaded ${dictionary.size} words.`);
  }).catch(async (error) => {
      console.error(`failed to load dictionary at ${filePath}:`, error);
      dictionary = null;
  });  
}

function ready(){
  return dictionary != null && dictionary != "loading"; 
}

function check(word, limited=false){
  if(dictionary == null) throw new Error("No Dictionary");
  if(dictionary == "loading") throw new Error("Dictionary is Loading");
  return dictionary.has(word);
}

function words() {
  return Array.from(dictionary);
}

const dict = {
  load,
  ready,
  check,
  words,
};

export default dict;