'use strict';

const pong = document.querySelector('.pong');
const allCircles = document.querySelectorAll('.pong circle');
const fixed = document.querySelectorAll('.fixed circle');
const mobileGroup = document.querySelector('.mobile');
const mobile = document.querySelectorAll('.mobile circle');
const player1 = document.querySelectorAll('.player1 circle');
const player2 = document.querySelectorAll('.player2 circle');

const players = {
  1: player1,
  2: player2,
};

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

const eventHistory = [];

function start() {
  mobileLocations = new Map(initialMobileLocations.entries());
  mobileLocations.forEach(({x, y}, m)=> {
    mobileGroup.appendChild(m);
    set_particle_position(m, {x, y});
  });
}

document.querySelectorAll('.select-player').forEach((element)=> element.addEventListener('click', ({target: {dataset}})=> {
  location.hash=`#${JSON.stringify({player: JSON.parse(dataset.player)})}`;
}));

let localOnly = true;
function connectToEventSource() {
  localOnly = false;
  const evtSource = new EventSource('/sse');
  const startMessage = postJSON.bind(null, {type: 'start'});
  document.querySelector('.start').addEventListener('click', startMessage);

  evtSource.addEventListener('mousemove', function({data}) {
    const curTime = performance.now();
    const {type, hrtime, now, player, x, y} = JSON.parse(data);
    const biTime = BigInt(hrtime);
    eventHistory.push({biTime, type, player, x, y});
    // console.log(type, biTime);
    const diff = curTime - now;
    if(player > 0) {
      set_position(players[player], 'y', y);
    }
  });

  evtSource.addEventListener('start', function({data}) {
    eventHistory.length = 0;
    const curTime = performance.now();
    const {type, hrtime, now} = JSON.parse(data);
    const biTime = BigInt(hrtime);
    eventHistory.push({biTime, type});
    // console.log(type, biTime);
    const diff = curTime - now;
    start();
  });

  bindPlayerData();

}

if(window.location.host === "76.191.127.35") {
  connectToEventSource();
}


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

const initialMobileLocations = new Map([...mobile].map(m=> ([m, {
  x: m.cx.baseVal.valueInSpecifiedUnits,
  y: m.cy.baseVal.valueInSpecifiedUnits,
  dx: parseFloat(m.dataset.dx),
  dy: parseFloat(m.dataset.dy),
}])));

let mobileLocations = new Map([...mobile].map(m=> ([m, {
  x: m.cx.baseVal.valueInSpecifiedUnits,
  y: -m.cy.baseVal.valueInSpecifiedUnits, /* set negative to force offscreen */
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
  let playerGroup;
  try {
    playerGroup = players[JSON.parse(decodeURI(window.location.hash.slice(1))).player];
  } catch(err) {

  }
  if(group !== playerGroup) {
    const closest = select_mobile_position(selectFunc);
    set_position(group, selectedProp, closest[selectedProp]);
  }
}

async function postJSON(data) {
  const requestHeaders = new Headers({'content-type': 'application/json'});
  const requestOptions = { /* see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request */
    method: 'POST',/*The request method, e.g., GET, POST.*/
    headers: requestHeaders, /*Any headers you want to add to your request, contained within a Headers object or an object literal with ByteString values.*/
    body: JSON.stringify(Object.assign({now: performance.now()}, data)), /*Any body that you want to add to your request: this can be a Blob, BufferSource, FormData, URLSearchParams, USVString, or ReadableStream object. Note that a request using the GET or HEAD method cannot have a body.*/
    mode: 'cors', /*The mode you want to use for the request, e.g., cors, no-cors, same-origin, or navigate. The default is cors. In Chrome the default is no-cors before Chrome 47 and same-origin starting with Chrome 47.*/
    credentials: 'omit', /*The request credentials you want to use for the request: omit, same-origin, or include. The default is omit. In Chrome the default is same-origin before Chrome 47 and include starting with Chrome 47.*/
    cache: 'no-store', /*The cache mode you want to use for the request.*/
    redirect: 'error', /*The redirect mode to use: follow, error, or manual. In Chrome the default is follow (before Chrome 47 it defaulted to manual).*/
    referrer: 'client', /*A USVString specifying no-referrer, client, or a URL. The default is client.*/
    keepalive: false,/* not supported yet */
  };
  const request = new Request('/sse-post', requestOptions);
  const fetchOptions = {

  };
  const fetchPromise = fetch(request);
  const fetchBody = await fetchPromise;
  const jsonPromise = fetchBody.json();
  const jsonResult = await jsonPromise;
}

function bindPlayerData() {
  document.body.addEventListener('mousemove', async ({x, y, type})=> await postJSON({player: JSON.parse(decodeURI(window.location.hash.slice(1))).player, x, y, type}));
}

function mouse_player(group, property) {
  try {
    document.body.addEventListener('mousemove', ({x, y})=> {
      try {
        set_position(players[JSON.parse(decodeURI(window.location.hash.slice(1))).player], property, y);
      } catch(err) {
        
      }
    });
    const player = JSON.parse(decodeURI(window.location.hash.slice(1))).player;
    set_position(players[player], property, boardDimensions[`center-${property}`]);
  } catch(err) {

  }
}

const playerFunctions = {
  player1_auto: renderLoop.bind(null, auto_player.bind(null, player1, selectSmallX, 'y')),
  player2_auto:  renderLoop.bind(null, auto_player.bind(null, player2, selectLargeX, 'y')),
  player1_mouse:  mouse_player.bind(null, player1, 'y'),
  player2_mouse:  mouse_player.bind(null, player2, 'y'),
}

if(localOnly) {
  playerFunctions.player1_auto();
  playerFunctions.player2_auto();
  playerFunctions.player1_mouse();
  document.querySelector('.start').addEventListener('click', start);
}