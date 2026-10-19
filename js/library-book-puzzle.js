// Story 02 Chapter 01 book order. The same IDs drive art, inside-cover stamps, and sorting.
((global)=>{
  'use strict';
  function normalize(order,ids){
    return Array.isArray(order)&&order.length===ids.length&&new Set(order).size===ids.length&&order.every(id=>ids.includes(id))?[...order]:[...ids];
  }
  function insert(order,from,to){
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=order.length||to>=order.length)return [...order];
    const next=[...order];
    next.splice(to,0,next.splice(from,1)[0]);
    return next;
  }
  function isSolved(order,answer){return Array.isArray(order)&&order.length===answer.length&&order.every((id,index)=>id===answer[index]);}
  global.MetrivaBookPuzzle={normalize,insert,isSolved};
})(typeof window==='undefined'?globalThis:window);
