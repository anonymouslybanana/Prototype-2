title = `WOODCHUCK CHUCK`;

description = `
[Press]
Chuck Wood
[Hold]
Stop and Chuck
[Release]
Move
Forward
`;

characters = [
  `
yppppy  
 y  y
yyByBy
yyyryy
 y  y
 y  y
    `,
  `
yppppy
y    y  
 y  y
yyByBy
yyyryy
 y  y

    `,
 `
lll ll
l ll l
l ll l
l ll l
l ll l
ll lll
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 50,
};

/**
 * @type {{
 * x: number, size: number, speed: number,
 * interval: number, intervalVariation: number, ticks: number
 * }[]}
 */
let rockSpawns;
let nextRockSpawnDist;
/** @type {{pos: Vector, vy: number, size: number, speed: number}[]} */
let rocks;
/** @type {{pos: Vector, vy: number, speed: number, mode: "fall" | "slide", angle: number }[]} */
let slidingRocks;
let slidingRocksTicks;
/** @type {{pos: Vector, vx: number, shotTicks: number}} */
let player;
/** @type {{pos: Vector, vx: number, angle: number}[]} */
let shots;
/** @type {Vector} */
let distance;
let lx;
let multiplier;
let counter;
let decider;
let mode;

function update() {
  if (!ticks) {
    rockSpawns = [];
    nextRockSpawnDist = 0;
    rocks = [];
    slidingRocks = [];
    slidingRocksTicks = 0;
    distance = vec();
    player = { pos: vec(10, 87), vx: 0, shotTicks: 0 };
    shots = [];
    lx = 50;
    multiplier = 1;
    decider = 0;
    mode = "run";
  }
  slidingRocksTicks -= sqrt(difficulty);
  let scr = difficulty * 0.1;
  if (player.pos.x > 30) {
    scr += (player.pos.x - 30) * 0.05;
  }
  if (slidingRocksTicks < 0) {
    play("laser");
    const size = rnd(5, 15);
    let interval = rnd(10, 50) / difficulty;
    const speed = (rnd(2, 3) / sqrt(size)) * sqrt(difficulty);
    interval /= sqrt(speed) / sqrt(size);
    color("yellow");
    slidingRocks.push({
      pos: vec(200),
      vy: 0,
      speed: speed,
      mode: "fall",
      angle: rnd(interval),
    });
    slidingRocksTicks += rndi(30, 90);
  }

  //color("blue");
  //rect(0, 100, 100, 10);
  //console.log("player position: " + player.pos.x);
  //console.log("player vx: " + player.vx);

  if(player.vx != 0){
    counter += 1;
  }

  lx = wrap(lx - scr, 0, 99);
  color("green");
  rect(0, 90, 100, 10);
  color("yellow");
  rect(lx, 90, 1, 10);
  player.shotTicks--;
  if (input.isPressed) {
    if (input.isJustPressed) {
      multiplier = 1;
      player.vx = 0;
    }
    if (player.shotTicks < 0) {
      play("laser");
      color("purple");
      shots.push({ pos: vec(player.pos), vx: 2 * difficulty, angle: floor(rnd(1, 360))});
      player.shotTicks = 10 / difficulty;
      shots.filter((s) =>{
        s.angle += rnd(1, sqrt(difficulty)) * sqrt(difficulty) * 0.2
        char("s", s.pos, { rotation: 3 - floor(s.angle % 4) });
      })
    }
  } else if (input.isJustReleased) {
    play("select");
    player.vx = difficulty * 1.2;
  }
  player.pos.x += player.vx - scr;
  color("purple");
  remove(shots, (s) => {
    s.pos.y -= scr;
    s.pos.x += s.vx;
    box(s.pos, 6, 3);
    return s.pos.y < 0;
  });

  distance.x = sqrt(sqrt(difficulty))/100 * (input.isPressed ? 1 : 2);
  addScore(distance.x - sqrt(sqrt(difficulty))/100);

  slidingRocks = slidingRocks.filter((r) => {
    if (r.mode === "fall") {
      r.vy += r.speed * 0.2;
      r.vy *= 0.92;
      r.pos.y += r.vy * sqrt(sqrt(difficulty));
      if (r.pos.y > 85) {
        //play("select");
        r.pos.y = 86;
        r.mode = "slide";
  
      }
    } else {
      r.pos.x -= r.speed * sqrt(difficulty);
      r.angle += r.speed * sqrt(difficulty) * 0.2;
    }
    r.pos.x -= distance.x;
    char("c", r.pos, { rotation: 3 - floor(r.angle % 4) });
    return r.pos.x > -5;
   });

  nextRockSpawnDist -= scr;
  if (nextRockSpawnDist < 0) {
    const size = rnd(5, 15);
    let interval = rnd(10, 50) / difficulty;
    const speed = (rnd(5, 10) / sqrt(size)) * sqrt(difficulty);
    interval /= sqrt(speed) / sqrt(size);
    rockSpawns.push({
      x: 200,
      size,
      speed,
      interval,
      intervalVariation: rnd(0.3, 0.9),
      ticks: rnd(interval),
    });
    nextRockSpawnDist += rnd(50, 60);
    //decider = 1;
    //decider = floor(rnd(1, 15));
    //if(decider == 1){
    //}
  }
  remove(rockSpawns, (r) => {
    r.x -= scr;
    r.ticks--;
    if (r.ticks < 0) {
      rocks.push({
        pos: vec(r.x, -r.size / 2),
        vy: 0,
        size: r.size,
        speed: r.speed,
      });
      r.ticks = r.interval * (1 + rnds(r.intervalVariation));
    }
    return r.x < 0;
  });
  color("light_black");
  remove(rocks, (r) => {
    r.vy += r.speed * 0.01;
    r.pos.x -= scr;
    r.pos.y += r.vy;
    if (box(r.pos, r.size).isColliding.rect.purple) {
      r.size *= 0.7;
      color("purple");
      particle(r.pos, 5, 3, PI / 2, 0.5);
      color("green");
      if (r.size < 5) {
        play("powerUp");
        addScore(multiplier * 10, r.pos.x, clamp(r.pos.y, 20, 99));
        particle(r.pos, 19, 3);
        return true;
      } else {
        play("hit");
        addScore(multiplier, r.pos.x, clamp(r.pos.y, 20, 99));
        multiplier++;
      }
    }
    if (r.pos.y > 90 - r.size / 2) {
      particle(r.pos, r.size * 0.3, sqrt(r.size) * 0.3);
      return true;
    }
  });

  color("black");
  if (
    char(
      input.isPressed ? "b" : addWithCharCode("a", floor(ticks / 20) % 2),
      player.pos
    ).isColliding.rect.light_black || 
    player.pos.x < -2
  ) {
    play("explosion");
    end();
  }

  color("transparent");
  remove(shots, (s) => {
    return box(s.pos, 6, 3).isColliding.rect.light_black;
  });
  color("transparent");
  remove(shots, (s) => {
    return box(s.pos, 6, 3).isColliding.char.a;
  });
}