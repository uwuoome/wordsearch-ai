import {vi, expect, test } from 'vitest'
import {aiInit, aiFindMove} from '../src/ai/ai.js'
import {loadWordList} from './load-wordlist.js'

const wordlist = await loadWordList('./public/dictionary2019.txt')
aiInit(wordlist, {priority: "score", compress: false, debug: 0});

function place(board, toPlace){
  const inc = toPlace.dir == "a"? 1: 15;
  toPlace.word.split("").forEach((ch, i) => {
    board[toPlace.pos+(i*inc)] = ch;
  });
}

test('Correct word found on empty board', () => {
  const board = Array(225).fill(" ");
  const result = aiFindMove(board, "IYDETDOQ");
  expect(result.word).toBe("ODDITY");
  expect(result.pos).toBe(111);
  expect(result.dir).toBe("a");
  expect(result.score).toBe(30);
});

test('No words found', () => {
  const letters = "QVQVQVQ";
  const board = Array(225).fill(" ");
  const result = aiFindMove(board, letters);
  expect(result).toBe(null);
});

test('Word found on intersection', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:111, dir: "a", word: "ODDITY"});
  const result = aiFindMove(board, "RATINAS");
  expect(result.pos).toBe(11);
  expect(result.dir).toBe("d");
  expect(result.word).toBe("SANITARY");
  expect(result.score).toBe(74);
});

test('Word prepended', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:106, dir: "a", word: "SYNCHRONY"});  
  const result = aiFindMove(board, "AVCDOOA");
  expect(result.pos).toBeOneOf([105, 45]);
  expect(result.dir).toBe("d");
  expect(result.word).toBe("AVOCADO");
  expect(result.score).toBe(155);
});

test('Word appended', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:106, dir: "a", word: "SYNCHRONY"});  
  place(board, {pos:105, dir: "d", word: "AVOCADO"});
  const result = aiFindMove(board, "FSAMTFV");
  expect(result.pos).toBe(210);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("STAFF");
  expect(result.score).toBe(87);
});

test('Parallel word placement', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:112, dir: "a", word: "AGATE"});
  const result = aiFindMove(board, "OUGNIYI");
  expect(result.pos).toBe(127);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("YOGINI");
  expect(result.score).toBe(28);
});

test('Multiple intersections', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:112, dir: "a", word: "ZETA"});
  place(board, {pos:100, dir: "d", word: "TACKS"});
  place(board, {pos:157, dir: "a", word: "MIASMA"});
  const result = aiFindMove(board, "BLOOAEU");
  expect(result.pos).toBe(112);
  expect(result.dir).toBe("d");
  expect(result.word).toBe("ZOOMABLE");
  expect(result.score).toBe(66);  
});

test('Using a blank tile', () => {
  const board = Array(225).fill(" ");
  place(board, {pos:135, dir: "a", word: "PASTA"});
  const result = aiFindMove(board, "BSTIAN_");
  expect(result.pos).toBe(154);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("BASTINg");
  expect(result.score).toBe(90);    
});

test('Altered skill rating of 2', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3); // need to mock random for skill levels below 5
  const board = Array(225).fill(" ");
  place(board, {pos:112, dir: "a", word: "ZETA"});
  place(board, {pos:100, dir: "d", word: "TACKS"});
  place(board, {pos:157, dir: "a", word: "MIASMA"}); 
  const result = aiFindMove(board, "BLOOAEU", null, 2); 
  expect(result.pos).toBe(125);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("BAEL");
  expect(result.score).toBe(22);  
  vi.restoreAllMocks();
});

test('Altered skill rating of 0', () => { 
  vi.spyOn(Math, 'random').mockReturnValue(0.3); 
  const board = Array(225).fill(" ");
  place(board, {pos:112, dir: "a", word: "ZETA"});
  place(board, {pos:100, dir: "d", word: "TACKS"});
  place(board, {pos:157, dir: "a", word: "MIASMA"}); 
  const result = aiFindMove(board, "BLOOAEU", null, 0); 
  expect(result.pos).toBe(98);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("AUTO");
  expect(result.score).toBe(10);  
  vi.restoreAllMocks();
});

test('End game minmax 1', () => {
  const board = "       TINTIESt M   ZEE     U  ATONALLY    G  MASU  E     A PA  NATTERY  R OK   WIRE    I OU     O     E D  WAGON     R   C DOX HINT    JOL VOCEs       QINS L       FEUD   E       R I    V       A S    E       B      R       ".split("");
  const result = aiFindMove(board, "FHIGDAP", "IEB", 6);
  // scores: HAAF - (VIBE + (IGDP * 2))
  expect(result.pos).toBe(56);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("HAAF");
  expect(result.score).toBe(28);   
  expect(result.delta).toBe(-10);   
});

test('End game minmax 2', () => {  
  const board = Array(225).fill(" ");
  place(board, {pos:112, dir: "a", word: "ZETA"});
  const result = aiFindMove(board, "MAUVEGA", "XRUBN", 6);
  expect(result.pos).toBe(98);
  expect(result.dir).toBe("a");
  expect(result.word).toBe("MAA");
  expect(result.score).toBe(19);   
  expect(result.delta).toBe(-15);  
  
  const result2 = aiFindMove(board, "MAUVEGA", "RUBN", 6);
  expect(result2.pos).toBe(126);
  expect(result2.dir).toBe("a");
  expect(result2.word).toBe("GAMA");
  expect(result2.score).toBe(32);   
  expect(result2.delta).toBe(-3);  
});