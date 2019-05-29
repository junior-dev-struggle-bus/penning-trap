'use strict';

const pong = document.querySelector('.pong');
const allCircles = document.querySelectorAll('.pong circle');
const mobile = document.querySelectorAll('.mobile>circle');

function differenceVector(a, b) {
  return {
    x: (b.cx.baseVal.valueInSpecifiedUnits - a.cx.baseVal.valueInSpecifiedUnits),
    y: (b.cy.baseVal.valueInSpecifiedUnits - a.cy.baseVal.valueInSpecifiedUnits),
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
  const scale = -1 / (dist ** 2) * 2000;
  return {
    x: normVec.x * scale,
    y: normVec.y * scale,
  };
}

function physics() {
  for(let m of mobile) {
    const sv = [...allCircles].filter(f=>f!==m).map((f)=>forceVector(m, f)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
    const delta = {x: sv.x + parseFloat(m.dataset.dx), y: sv.y + parseFloat(m.dataset.dy)}
    m.dataset.dx = delta.x;
    m.dataset.dy = delta.y;
    m.cx.baseVal.valueInSpecifiedUnits += delta.x;
    m.cy.baseVal.valueInSpecifiedUnits += delta.y;
  }
}

function render() {
  for(let i = 0; i < 1; i++) {
    physics();
  }
  requestAnimationFrame(render);
}

requestAnimationFrame(render);