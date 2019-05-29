'use strict';

const pong = document.querySelector('.pong');
const allCircles = document.querySelectorAll('.pong circle');
const fixed = document.querySelectorAll('.fixed>circle');
const mobile = document.querySelectorAll('.mobile>circle');

function differenceVector(a, b) {
  return {
    x: (b.x - a.x),
    y: (b.y - a.y),
  };
}

function magnitude(a, b) {
  const vec = differenceVector(a, b);
  return vec.x ** 2 + vec.y ** 2;
}

function distance(a, b) {
  return Math.sqrt(magnitude(a, b));
}

function forceVector(a, b) {
  const vec = differenceVector(a, b);
  const dist = distance(a, b);
  const normVec = {x: vec.x / dist, y: vec.y / dist};
  const scale = -1 / (dist ** 2) * 10;
  return {
    x: normVec.x * scale,
    y: normVec.y * scale,
  };
}

const fixedLocations = [...fixed].map(f=> ({x: f.cx.baseVal.valueInSpecifiedUnits, y: f.cy.baseVal.valueInSpecifiedUnits}));

function physics() {
  // let totalEnergy = 0;
  for(let m of mobile) {
    const mp = {x: m.cx.baseVal.valueInSpecifiedUnits, y: m.cy.baseVal.valueInSpecifiedUnits};
    const fv = fixedLocations.map((fp)=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
    const sv = [...mobile].filter(f=>f!==m).map((f)=>forceVector(mp, {x: f.cx.baseVal.valueInSpecifiedUnits, y: f.cy.baseVal.valueInSpecifiedUnits})).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), fv);
    // console.log({mp, fv, sv});
    const delta = {x: sv.x + parseFloat(m.dataset.dx), y: sv.y + parseFloat(m.dataset.dy)}
    m.dataset.dx = delta.x;
    m.dataset.dy = delta.y;
    m.cx.baseVal.valueInSpecifiedUnits += delta.x;
    m.cy.baseVal.valueInSpecifiedUnits += delta.y;
    // totalEnergy += Math.sqrt(delta.x ** 2 + delta.y ** 2);
  }
  // console.log(totalEnergy);
}

function render() {
  // const startTime = performance.now();
  for(let i = 0; i < 40; i++) {
    physics();
  }
  // const finishTime = performance.now();
  // console.log(finishTime - startTime);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);