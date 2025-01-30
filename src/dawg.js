/** 
 * This is a Trie, which can be compressed into a DAWG by calling the minimize method after instantiation.
 * While it compression did achieve an 87% node reduction rate on my wordlist. It does require additional preprocessing. 
 */
export default class DirectedAcyclicWordGraph {
  constructor(dict) {
    this.root = {};
    const wordList = dict.words();
    this.checkDictionary = dict.check; 
    if(wordList?.length){
      wordList.forEach(word => {
        this.insert(word);
      });
      console.log("DAWG built using", wordList.length, "words", this.root);
    }
  }

  // Insert a word into the DAWG
  insert(word) {
    let node = this.root;
    for (let char of word) {
      if (!node[char]) {
        node[char] = {}; // Create a new child node
      }
      node = node[char];
    }
    node["."] = 1; // Mark the end of the word
  }
  _getNodeSignature(node) {
    const parts = [];
    const keys = Object.keys(node).sort();
    for(const key of keys){
      if(key == '.'){
        parts.push('.');
      }else{  // store a reference to the child node instead of its contents
        parts.push(key + ':' + this.nodeIds.get(node[key]));
      }
    }
    return parts.join('|');
  }

  minimize() { // needs to be called after building otherwise we just have an ordinary trie
    this.nodeIds = new Map();
    this.nodesBySignature = new Map();
    let nextId = 0;

    // Bottom-up processing
    const processLevel = (depth, maxDepth) => {
      const levelNodes = new Map();
      const processNode = (node, path = '') => {
        if(path.length === depth){
          levelNodes.set(path, node);
          return;
        }  
        for(const [char, childNode] of Object.entries(node)){
          if(char !== '.' && typeof childNode === 'object'){
            processNode(childNode, path + char);
          }
        }
      };

      processNode(this.root);
      
      for(const [path, node] of levelNodes){
        const signature = this._getNodeSignature(node);
        
        if(!this.nodesBySignature.has(signature)){      // unique
          this.nodesBySignature.set(signature, node);
          this.nodeIds.set(node, nextId++);
        }else{                                          // replace
          const existingNode = this.nodesBySignature.get(signature);
          let parent = this.root;
          for (let i=0; i < path.length-1; i++){
            parent = parent[path[i]];
          }
          if(path.length > 0){
            parent[path[path.length-1]] = existingNode;
          }
        }
      }
    };
    const getMaxDepth = (node, depth = 0) => {
      let maxDepth = depth;
      for(const [char, childNode] of Object.entries(node)){
        if(char !== '.' && typeof childNode === 'object'){
          maxDepth = Math.max(maxDepth, getMaxDepth(childNode, depth+1));
        }
      }
      return maxDepth;
    };

    const maxDepth = getMaxDepth(this.root);
    
    // Process levels from bottom to top
    for(let depth = maxDepth; depth >= 0; depth--){
      processLevel(depth, maxDepth);
    }

    this.nodeIds = null;
    this.nodesBySignature = null;    
    return this;
  }

  testCompression() {  // For testing mimimize
    const countNodes = (node, visited = new Set()) => {
      if(visited.has(node)) return 0;
      visited.add(node);
      let count = 1;
      for(const [char, childNode] of Object.entries(node)){
        if(char !== '.' && typeof childNode === 'object'){
          count += countNodes(childNode, visited);
        }
      }
      return count;
    };

    const beforeCount = countNodes(this.root);
    this.minimize();
    const afterCount = countNodes(this.root);

    return {
      nodesBeforeMinimization: beforeCount,
      nodesAfterMinimization: afterCount,
      reduction: `${((beforeCount - afterCount) / beforeCount * 100).toFixed(1)}%`
    };
  }
  
  perpendicularWord(rowOffset, ch, at, slice){
    const behind = (from) => {
      const at = from - 1;
      if(at < 0 || slice[at] == " ") return "";
      return behind(at)+slice[at];
    };
    const ahead = (from) => {
      const at = from + 1;
      if(at >= slice.length || slice[at] == " ") return "";
      return slice[at]+ahead(at);
    };
    const lettersBefore = behind(at);
    const word = lettersBefore + ch + ahead(at);
    const colOffset = 0-lettersBefore.length;
    // get wordlist
    if(word.length == 1) return true;                                 // OK, no perpendicular word
    if(! this.checkDictionary(word.toUpperCase()) ) return false;     // Invalid perpendicular word
    return {colOffset, rowOffset, word};                              // Valid perpendicular word
  }
  
  /**
   * Using letters provided and from the word start index, finds all words in wordlist on row that that match the following:
   *    1) Fit the letters placed on the row defined in constraints object;
   *    2) Straddle the placement index defined by startIndex;
   *    3) Are within length bounds set by minLength and maxLength;
   *    4) If any perpendicular words exist, they are all in the wordlist.
   * The result object contains the word start index, word found, and any perpendicular words
   */
  findWords(letters, startIndex, pointIndex, pointRow, minLength, maxLength, constraints, perpRows) {
    const results = [];
    const letterCounts = this._countLetters(letters);
    
    const traverse = (node, prefix, fixedLettersFound, pWords) => {
      const depth = prefix.length;
      const index = startIndex + depth;
      // If there's a board letter here then we just need evaluate it and traverse to the next tile
      if(constraints[index]){
        const ch = constraints[index];
        if(node[ch] == null) return;
        if(node[ch]["."] != null){                                // if this is a terminal node
          if(depth+1 >= minLength && depth+1 <= maxLength){       // if the word length is within bounds
            if(pointIndex < startIndex + depth){                  // if the word straddles placement point
              if(!constraints[startIndex + depth + 1]){           // if another board letter isnt following
                results.push({ at: startIndex, word: prefix+ch, perp: pWords  });// then it's valid 
              }
            }
          }
        }
        traverse(node[ch], prefix+ch, fixedLettersFound+ch, pWords);    // go to next letter
        return;
      }
      
      // Otherwise we need to check each letter we have left against our trie to see what our possibilities are
      for (let char in node) {
        if (char === ".") continue; // Skip the terminal marker
        if (startIndex + depth >= perpRows[0].length) return;
        const charCounts = this._countLetters(char);
        const prefixCounts = this._countLetters(prefix);
        const fixedCounts = this._countLetters(fixedLettersFound);
        const formation = this._canFormWord(letterCounts, charCounts, prefixCounts, fixedCounts);
        if(formation){
          let toAppend = char;
          if(formation == 2){
            toAppend = char.toLowerCase();
          }
          const newPrefix = prefix + toAppend;
          const perpendicular = this.perpendicularWord(depth, toAppend, pointRow, perpRows[startIndex+depth]);
          if(! perpendicular) return;
          const nextPWords = (typeof perpendicular == "object")? [...pWords, perpendicular]: pWords;// add to perpendicular words so far
          if(node[char]["."] != null){                                          // if this is a terminal node
            if(newPrefix.length >= minLength && newPrefix.length <= maxLength){ // if the word length is within bounds
              if(pointIndex < startIndex + newPrefix.length){                   // if the word straddles placement point
                if(!constraints[startIndex + newPrefix.length]){                // if another board letter isnt following
                  results.push({ at: startIndex, word: newPrefix, perp: nextPWords }); // then it's valid 
                }
              }   
            }
          }

          traverse(node[char], newPrefix, fixedLettersFound, nextPWords);
        }
      }
    };
    traverse(this.root, "", "", []);
    return results;
  }
  
  _countLetters(word){
    const counts = {};
    const isLowerCase = (ch) => ch >= 'a' && ch <= 'z';
    for(let char of word){
      if(isLowerCase(char) || char == "_"){
        counts["_"] = (counts["_"] || 0) + 1;
      }else{
        counts[char] = (counts[char] || 0) + 1;
      }
    }
    return counts;
  }
  
  // TODO: A bug lets wildcards be used twice.
  // available is all letters in hand
  // required is the single characters that's needed this time
  // used is the prefix
  // fixed are characters on the board
  _canFormWord(available, required, used, fixed){
    const num = (val) => val || 0;
    let usedWildcard = false;
    for(let char in required){
      const pool = num(available[char]) + num(fixed[char]); 
      const needed = (required[char] || 0) + (used[char] || 0) + (used["_"] || 0);  
      const remainder = pool - needed ;
      if(remainder < 0){
        const wildcards = num(available["_"])-num(used["_"]) 
        if(wildcards > 0 && remainder == -1 && !usedWildcard){
          usedWildcard = true;
        }else{
          return 0;
        }
      }
    }
    return usedWildcard? 2: 1;
  }
}