'use strict';

const pong = document.querySelector('.pong');
const allCircles = document.querySelectorAll('.pong circle');
const fixed = document.querySelectorAll('.fixed circle');
const mobile = document.querySelectorAll('.mobile circle');
const player1 = document.querySelectorAll('.player1 circle');

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
  const scale = -1 / (dist ** 2) * 5;
  return {
    x: normVec.x * scale,
    y: normVec.y * scale,
  };
}
const initialFixedLocations = new Map([...fixed].map(f=> ([f,{x: f.cx.baseVal.valueInSpecifiedUnits, y: f.cy.baseVal.valueInSpecifiedUnits}])));

const fixedLocations = new Map([...fixed].map(f=> ([f,{x: f.cx.baseVal.valueInSpecifiedUnits, y: f.cy.baseVal.valueInSpecifiedUnits}])));
let mobileLocations = new Map([...mobile].map(m=> ([m, {
  x: m.cx.baseVal.valueInSpecifiedUnits,
  y: m.cy.baseVal.valueInSpecifiedUnits,
  dx: parseFloat(m.dataset.dx),
  dy: parseFloat(m.dataset.dy),
}])));

function physics() {
  const newMobileLocations = new Map();
  for(let [m, mp] of mobileLocations.entries()) {
    const fv = [...fixedLocations.values()].map((fp)=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
    const sv = [...mobileLocations.entries()].filter(([f, fp])=>f!==m).map(([f, fp])=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), fv);
    const dx = mp.dx + sv.x;
    const dy = mp.dy + sv.y;
    const x = mp.x + dx;
    const y = mp.y + dy;
    if(x < 0 || y < 0 || x > 1920 || y > 1080) {
      m.parentNode.removeChild(m);
      /* count the score of a particle leaving */
      continue;
    }
    newMobileLocations.set(m, {x, y, dx, dy});
    m.cx.baseVal.valueInSpecifiedUnits = x;
    m.cy.baseVal.valueInSpecifiedUnits = y;
  }
  mobileLocations = newMobileLocations;
}

function render() {
  for(let i = 0; i < 40; i++) {
    physics();
  }
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

document.body.addEventListener('mousemove', ev=> {
  const positions = [];
  for(let e of player1) {
    fixedLocations.get(e).y = initialFixedLocations.get(e).y + ev.y;
    e.cy.baseVal.valueInSpecifiedUnits = fixedLocations.get(e).y;
    positions.push(fixedLocations.get(e));
  }
})