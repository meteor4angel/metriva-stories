const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('../js/library-book-puzzle.js');
const puzzle=global.MetrivaBookPuzzle;
const ids=['640','120','810','305'];
const answer=['120','305','640','810'];

test('drag insert moves one whole book and shifts its neighbors',()=>{
  const result=puzzle.insert(ids,3,1);
  assert.deepEqual(result,['640','305','120','810']);
  assert.deepEqual(ids,['640','120','810','305']);
  assert.deepEqual(puzzle.insert(result,1,3),ids);
});

test('saved book order resumes only for a valid four-book permutation',()=>{
  assert.deepEqual(puzzle.normalize(answer,ids),answer);
  assert.deepEqual(puzzle.normalize(['640','640','810','305'],ids),ids);
  assert.deepEqual(puzzle.normalize(undefined,ids),ids);
  assert.equal(puzzle.isSolved(answer,answer),true);
  assert.equal(puzzle.isSolved(ids,answer),false);
});

test('all four book identities have matching spine and inside-cover artwork',()=>{
  const images=path.join(__dirname,'..','images','story02');
  assert.ok(fs.existsSync(path.join(images,'library-puzzle-bookshelf.png')));
  for(const id of ids){
    assert.ok(fs.existsSync(path.join(images,`generated-spine-${id}.png`)),`spine ${id}`);
    assert.ok(fs.existsSync(path.join(images,`approved-open-${id}.png`)),`inside cover ${id}`);
  }
});
