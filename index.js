'use strict';

const pong = document.querySelector('.pong');
const allCircles = document.querySelectorAll('.pong circle');
const fixed = document.querySelectorAll('.fixed circle');
const mobile = document.querySelectorAll('.mobile circle');
const player1 = document.querySelectorAll('.player1 circle');
const player2 = document.querySelectorAll('.player2 circle');
const player1_type = 'mouse' //'mouse' or 'auto';
const player2_type = 'auto' //'mouse' or 'auto';

const distanceScale = 10;//larger number slower particles
const chargeScale = 500;//larger number faster particles
const physicsLoopCount = 40;//larger number smoother physics, higher CPU usage, slower frame rate

const boardDimensions = {
  minX: 0,
  minY: 0,
  maxX: pong.clientWidth,
  maxY: pong.clientHeight,
  width: pong.clientWidth,
  height: pong.clientHeight,
  'center-x': pong.clientWidth / 2,
  'center-y': pong.clientHeight / 2,
};

function renderLoop(func) {
  function renderOnce() {
    func();
    requestAnimationFrame(renderOnce);
  }
  requestAnimationFrame(renderOnce);
}

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
  const scale = -1 / ((dist * distanceScale) ** 2) * chargeScale;
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

function set_particle_position(particle, pos) {
  particle.setAttribute('cx', pos.x);
  particle.setAttribute('cy', pos.y);
}

function physics() {
  const newMobileLocations = new Map();
  for(let [m, mp] of mobileLocations.entries()) {
    const fv = [...fixedLocations.values()].map((fp)=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
    const sv = [...mobileLocations.entries()].filter(([f, fp])=>f!==m).map(([f, fp])=>forceVector(mp, fp)).reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), fv);
    const dx = mp.dx + sv.x;
    const dy = mp.dy + sv.y;
    const x = mp.x + dx;
    const y = mp.y + dy;
    if(x < boardDimensions.minX || y < boardDimensions.minY || x > boardDimensions.maxX || y > boardDimensions.maxY) {
      m.parentNode.removeChild(m);
      /* count the score of a particle leaving */
      continue;
    }
    newMobileLocations.set(m, {x, y, dx, dy});
    set_particle_position(m, {x, y});
  }
  mobileLocations = newMobileLocations;
}

const multiPhysics = ((loopCount = 1)=> {for(let i = 0; i < loopCount; i++) { physics(); } })

renderLoop(multiPhysics.bind(null, physicsLoopCount));

function set_position(group, property, y) {
  for(let e of group) {
    fixedLocations.get(e)[property] = initialFixedLocations.get(e)[property] + y;
    e.cy.baseVal.valueInSpecifiedUnits = fixedLocations.get(e)[property];
  }
}

function sum_mobile_posistions() {
  return [...mobileLocations.values()].reduce((p, c)=> ({x: p.x + c.x, y: p.y + c.y}), {x: 0, y: 0});
}

function average_mobile_positions() {
  const sum_of_positions = sum_mobile_posistions();
  const count = Math.max(mobileLocations.size, 1); // avoid div by zero
  const avg = {
    x: sum_of_positions.x / count,
    y: sum_of_positions.y / count,
  };
  return avg;
}

function select_mobile_position(selectFunc) {
  return [...mobileLocations.values()].reduce((p, c)=> selectFunc(p, c));
}

const selectLargeX = (a, b)=> a.x > b.x?a:b
const selectSmallX = (a, b)=> a.x < b.x?a:b
const selectLargeY = (a, b)=> a.y > b.y?a:b
const selectSmallY = (a, b)=> a.y < b.y?a:b

function auto_player(group, selectFunc, selectedProp) {
  if(!mobileLocations.size) { return; }
  const closest = select_mobile_position(selectFunc);
  set_position(group, selectedProp, closest[selectedProp]);
}

function mouse_player(group, property) {
  document.body.addEventListener('mousemove', ev=> set_position(group, property, ev.y));
  set_position(group, property, boardDimensions[`center-${property}`]);
}

const playerFunctions = {
  player1_auto: renderLoop.bind(null, auto_player.bind(null, player1, selectSmallX, 'y')),
  player2_auto:  renderLoop.bind(null, auto_player.bind(null, player2, selectLargeX, 'y')),
  player1_mouse:  mouse_player.bind(null, player1, 'y'),
  player2_mouse:  mouse_player.bind(null, player2, 'y'),
}

playerFunctions[`player1_${player1_type}`]();
playerFunctions[`player2_${player2_type}`]();
