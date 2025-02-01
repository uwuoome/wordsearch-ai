import { expect, test } from 'vitest'
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
  console.log(result);
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

test.skip('Using a blank tile', () => {
  expect(1).toBe(1)
});

test.skip('Prioritizing word length over score', () => {
  expect(1).toBe(1)
});

