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
let mobileLocations = new Map([...mobile].map(m=> ([m, {
  x: m.cx.baseVal.valueInSpecifiedUnits,
  y: m.cy.baseVal.valueInSpecifiedUnits,
  dx: parseFloat(m.dataset.dx),
  dy: parseFloat(m.dataset.dy),
}])));

function physics() {
  const newMobileLocations = new Map();
  for(let [m, mp] of mobileLocations.entries()) {
    const fv = fixedLocations.map((fp)=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
    const sv = [...mobile].filter(f=>f!==m).map((f)=>forceVector(mp, {x: f.cx.baseVal.valueInSpecifiedUnits, y: f.cy.baseVal.valueInSpecifiedUnits})).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), fv);
    const dx = mp.dx + sv.x;
    const dy = mp.dy + sv.y;
    const x = mp.x + dx;
    const y = mp.y + dy;
    newMobileLocations.set(m, {x, y, dx, dy});
    m.cx.baseVal.valueInSpecifiedUnits = x;
    m.cy.baseVal.valueInSpecifiedUnits = y;
  }
  mobileLocations = newMobileLocations;
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