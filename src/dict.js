let dictionary = null;


async function load(){
  if(dictionary != null) return dict;

  async function loadAsSet(){
    const result = await fetch(filePath);
    const text = await result.text();
    return new Set( text.split(/\r?\n/) );
  }
  const filePath = "/dictionary2019.txt";
  dictionary = "loading";
  await loadAsSet(filePath).then(async (result) => {
      dictionary = result;
      console.log(`${name} dictionary loaded ${dictionary.size} words.`);
      return dictionary;
  }).catch(async (error) => {
      console.error(`failed to load ${name} dictionary at ${filePath}:`, error);
      dictionary = null;
      return null;
  });  
}

function ready(){
  return dictionary != null && dictionary != "loading"; 
}

function check(word){
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
  words
};

export default dict;