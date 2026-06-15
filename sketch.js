// Copyright (c) 2024 ml5
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
// Requires: https://unpkg.com/ml5@1/dist/ml5.js
// Documentation: https://docs.ml5js.org/#/reference/handpose

let handpose;
let video;
let hands = [];
let puppet;
let options = { maxHands: 2, flipHorizontal: true, runtime: "mediapipe" };
// The camera keeps its original low-cost inference resolution.
// The canvas uses the actual browser viewport resolution.
const BASE_CANVAS_WIDTH = 640;
const BASE_CANVAS_HEIGHT = 480;
const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;

// Give the suspended puppet extra vertical travel on shallow screens.
// When the hand reaches the top of the camera image, its control anchor is
// allowed to move above the visible canvas so the whole puppet can be lifted.
// Increase this value if the puppet still cannot be raised high enough.
const EXTRA_TOP_LIFT_RATIO = 0.48;
const EXTRA_TOP_LIFT_CURVE = 1.65;

// Keep gravity stable across resolutions. Scaling gravity together with the
// viewport makes the puppet sag too much on larger full-screen canvases.
const PUPPET_GRAVITY_Y = 40;

let xMax = BASE_CANVAS_WIDTH;
let yMax = BASE_CANVAS_HEIGHT;
let screenScale = 1;
let resizeReloadTimer = null;
let whichHand;
let pScale = 1;  // Scale the puppet
let yGap = 150; 	 // Have the puppet hang below the hand
let upBody,lowBody,leftUarm,leftLarm,leftHand,rightUarm,rightLarm,rightHand,headM,leftFoot,rightFoot;
let bgm;
let sceneBackground;
let stoneGround;
let cloudImage;
let mountainLeft;
let mountainRight;
let muFlag;
let muFlagPole;
let muFlagTassel;
let shuaiFlag;
let clouds = [];
let scaleParam=0.1;
const BACKGROUND_IMAGE_WIDTH = 1672;
const BACKGROUND_IMAGE_HEIGHT = 941;
const SCREEN_LIGHT_CENTER = [255, 232, 166];
const SCREEN_LIGHT_EDGE = [170, 112, 58];
const MIDGROUND_CAMP_SCALE = 1;
const MIDGROUND_CAMP_Y_OFFSET_RATIO = 0;
const MIDGROUND_CAMP_TINT = [168, 176, 164];
const MIDGROUND_CAMP_OPACITY = 190;
const MIDGROUND_FLAG_TINT = [176, 170, 156];
const MIDGROUND_FLAG_OPACITY = 182;
const MIDGROUND_SHADOW_ALPHA = 44;
const FOREGROUND_SHADOW_ALPHA = 90;
const FOREGROUND_RIM_LIGHT = [255, 205, 84];
const FOREGROUND_RIM_ALPHA = 34;
const FOREGROUND_CENTER_LIGHT_ALPHA = 16;
const FOREGROUND_WARM_CORE_ALPHA = 22;
const MU_FLAG_BOX = { x: 32, y: 17, width: 522, height: 673 };
const MU_FLAG_POLE_RATIO = 0.22;
const MU_FLAG_TASSEL_BOX = { x: 1, y: 235, width: 132, height: 501 };
const SHUAI_FLAG_BOX = { x: 1198, y: 17, width: 290, height: 258 };
const SHUAI_FLAG_POLE_RATIO = 0.18;
const MOUNTAIN_SPECS = [
  { image: "left", xRatio: 0.12, yRatio: 0.25, widthRatio: 0.54, opacity: 98 },
  { image: "right", xRatio: 0.42, yRatio: 0.18, widthRatio: 0.62, opacity: 108 }
];
const CLOUD_SPECS = [
  { xRatio: 0.08, yRatio: 0.05, widthRatio: 0.12, speed: 7, drift: 3, phase: 0.4, opacity: 82 },
  { xRatio: 0.38, yRatio: 0.16, widthRatio: 0.07, speed: 5, drift: 2, phase: 2.1, opacity: 72 },
  { xRatio: 0.66, yRatio: 0.09, widthRatio: 0.20, speed: 13, drift: 5, phase: 4.3, opacity: 96 },
  { xRatio: 1.05, yRatio: 0.24, widthRatio: 0.10, speed: 9, drift: 3, phase: 1.3, opacity: 78 },
  { xRatio: 1.42, yRatio: 0.13, widthRatio: 0.16, speed: 11, drift: 4, phase: 5.4, opacity: 88 },
  { xRatio: 1.72, yRatio: 0.02, widthRatio: 0.06, speed: 4, drift: 2, phase: 3.2, opacity: 62 }
];
function preload() {
  // Load the handPose model.
  handpose = ml5.handPose(options);

  upBody = loadImage("datasets/上身.png");
  lowBody = loadImage("datasets/下身.png");
  leftUarm = loadImage("datasets/左手-上.png");
  leftLarm = loadImage("datasets/左手-下.png");
  leftHand = loadImage("datasets/左手.png");
  rightUarm = loadImage("datasets/右手-上.png");
  rightLarm = loadImage("datasets/右手-下.png");
  rightHand = loadImage("datasets/右手.png");
  headM = loadImage("datasets/头.png");
  leftFoot = loadImage("datasets/左腿.png");
  rightFoot = loadImage("datasets/右腿.png");
  sceneBackground = loadImage("datasets/background-transparent.png");
  stoneGround = loadImage("datasets/stone-ground.png");
  cloudImage = loadImage("datasets/cloud.png");
  mountainLeft = loadImage("datasets/mountain-left.png");
  mountainRight = loadImage("datasets/mountain-right.png");
  muFlag = loadImage("datasets/flag-mu.png");
  muFlagPole = loadImage("datasets/flag-mu-pole-static.png");
  muFlagTassel = loadImage("datasets/flag-mu-tassel.png");
  shuaiFlag = loadImage("datasets/flag-shuai.png");
    bgm=loadSound("datasets/muguiying.mp3");
}

function setup() {
  applyViewportMetrics();
  pixelDensity(1);

  const canvas = createCanvas(xMax, yMax);
  canvas.elt.style.display = "block";
  canvas.elt.style.position = "fixed";
  canvas.elt.style.inset = "0";
  initializeClouds();

  bgm.loop();

  // Keep webcam inference at 640 x 480 for stable performance.
  // Hand keypoints are mapped to the real full-screen canvas later.
  video = createCapture(VIDEO);
  video.size(CAMERA_WIDTH, CAMERA_HEIGHT);
  video.hide();
  // start detecting hands from the webcam video
  handpose.detectStart(video, gotHands);



    pieces = new Group();
    pieces.color = 'white';
    pieces.overlaps(pieces);
    pieces.stroke = 'white';
    pieces.drag = 1;


  upBody.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*screenScale),0);
  lowBody.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*screenScale),0);
  leftUarm.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.6*screenScale),0);
  leftLarm.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.6*screenScale),0);
  leftHand.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.6*screenScale),0);
  rightUarm.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.75*screenScale),0);
  rightLarm.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.6*screenScale),0);
  rightHand.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*0.6*screenScale),0);
  headM.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*screenScale),0);
  leftFoot.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*screenScale),0);
  rightFoot.resize(Math.round(BASE_CANVAS_WIDTH*scaleParam*screenScale),0);
	world.gravity.y = PUPPET_GRAVITY_Y;
	pieces = new Group();
	pieces.color = 'white';
	pieces.overlaps(pieces);
	pieces.stroke = 'white';
	pieces.drag = 1;
	
	makePuppet();

  // Rebuild once after a viewport size change so all physics joints remain correct.
}

function getViewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.round(viewport ? viewport.width : window.innerWidth)),
    height: Math.max(1, Math.round(viewport ? viewport.height : window.innerHeight))
  };
}

function applyViewportMetrics() {
  const viewport = getViewportSize();
  xMax = viewport.width;
  yMax = viewport.height;
  screenScale = Math.min(xMax / BASE_CANVAS_WIDTH, yMax / BASE_CANVAS_HEIGHT);
  pScale = screenScale;
}

function mapHandPoint(point) {
  const normalizedX = constrain(point.x / CAMERA_WIDTH, 0, 1);
  const normalizedY = constrain(point.y / CAMERA_HEIGHT, 0, 1);

  // Normal tracking still covers the full visible canvas. Near the top edge,
  // add a smooth upward extension. At normalizedY === 0, the anchor can reach
  // EXTRA_TOP_LIFT_RATIO * canvasHeight above the screen. At the bottom edge,
  // the mapping remains exactly yMax, so the original lower interaction range
  // is preserved.
  const extraTopLift = yMax * EXTRA_TOP_LIFT_RATIO;
  const upwardExtension = Math.pow(1 - normalizedY, EXTRA_TOP_LIFT_CURVE) * extraTopLift;

  return {
    x: normalizedX * xMax,
    y: normalizedY * yMax - upwardExtension
  };
}

function scheduleViewportReload() {
  clearTimeout(resizeReloadTimer);
  resizeReloadTimer = setTimeout(() => {
    const viewport = getViewportSize();
    const changed = Math.abs(viewport.width - xMax) > 2 || Math.abs(viewport.height - yMax) > 2;
    if (changed) {
      window.location.reload();
    }
  }, 250);
}

function windowResized() {
  scheduleViewportReload();
}

// Callback function for when handpose outputs data
function gotHands(results) {
    // save the output to the hands variable
    hands = results;
}
// function draw() {
//     background(255);
// }

function getSceneBackgroundBasePlacement() {
  const imageRatio = BACKGROUND_IMAGE_WIDTH / BACKGROUND_IMAGE_HEIGHT;
  const canvasRatio = xMax / yMax;
  let bgWidth;
  let bgHeight;
  let bgX;
  let bgY;

  if (canvasRatio > imageRatio) {
    bgWidth = xMax;
    bgHeight = bgWidth / imageRatio;
    bgX = 0;
    bgY = (yMax - bgHeight) / 2;
  } else {
    bgHeight = yMax;
    bgWidth = bgHeight * imageRatio;
    bgX = (xMax - bgWidth) / 2;
    bgY = 0;
  }

  return { x: bgX, y: bgY, width: bgWidth, height: bgHeight };
}

function getSceneBackgroundPlacement() {
  const base = getSceneBackgroundBasePlacement();
  const width = base.width * MIDGROUND_CAMP_SCALE;
  const height = base.height * MIDGROUND_CAMP_SCALE;
  const x = base.x + (base.width - width) / 2;
  const y = base.y + (base.height - height) / 2 + yMax * MIDGROUND_CAMP_Y_OFFSET_RATIO;

  return { x, y, width, height };
}

function drawSceneBackground() {
  if (!sceneBackground) {
    return;
  }

  const bg = getSceneBackgroundPlacement();

  push();
  drawingContext.shadowColor = `rgba(48, 24, 8, ${MIDGROUND_SHADOW_ALPHA / 255})`;
  drawingContext.shadowBlur = 22 * Math.max(0.8, screenScale);
  drawingContext.shadowOffsetX = 18 * Math.max(0.8, screenScale);
  drawingContext.shadowOffsetY = 24 * Math.max(0.8, screenScale);
  tint(MIDGROUND_CAMP_TINT[0], MIDGROUND_CAMP_TINT[1], MIDGROUND_CAMP_TINT[2], MIDGROUND_CAMP_OPACITY);
  image(sceneBackground, bg.x, bg.y, bg.width, bg.height);
  pop();

  noTint();
}

function drawSkyBackground() {
  background(SCREEN_LIGHT_EDGE[0], SCREEN_LIGHT_EDGE[1], SCREEN_LIGHT_EDGE[2]);

  const centerX = xMax * 0.55;
  const centerY = yMax * 0.48;
  const maxRadius = Math.max(xMax, yMax) * 1.48;

  noStroke();
  for (let i = 72; i >= 1; i--) {
    const radiusRatio = i / 72;
    const colorAmount = Math.pow(1 - radiusRatio, 0.55);
    const r = lerp(SCREEN_LIGHT_EDGE[0], SCREEN_LIGHT_CENTER[0], colorAmount);
    const g = lerp(SCREEN_LIGHT_EDGE[1], SCREEN_LIGHT_CENTER[1], colorAmount);
    const b = lerp(SCREEN_LIGHT_EDGE[2], SCREEN_LIGHT_CENTER[2], colorAmount);

    fill(r, g, b);
    ellipse(centerX, centerY, maxRadius * radiusRatio, maxRadius * 0.78 * radiusRatio);
  }
}

function drawMidgroundLighting() {
  noStroke();

  for (let i = 24; i >= 0; i--) {
    const progress = i / 36;
    fill(196, 202, 190, 2.8);
    ellipse(xMax * 0.55, yMax * 0.48, xMax * 1.05 * progress, yMax * 0.72 * progress);
  }

  for (let i = 0; i < 26; i++) {
    const progress = i / 31;
    fill(28, 31, 34, Math.pow(progress, 2.1) * 1.45);
    rect(0, 0, xMax, yMax * 0.38 * progress);
    rect(0, yMax - yMax * 0.34 * progress, xMax, yMax * 0.34 * progress);
    rect(0, 0, xMax * 0.34 * progress, yMax);
    rect(xMax - xMax * 0.34 * progress, 0, xMax * 0.34 * progress, yMax);
  }
}

function drawForegroundPuppetShadow() {
  if (!lowerBody) {
    return;
  }

  const footY = Math.max(
    lowerBody.y + lowerBody.height * 0.42,
    lFoot ? lFoot.y + lFoot.height * 0.32 : 0,
    rFoot ? rFoot.y + rFoot.height * 0.32 : 0
  );
  const shadowX = lowerBody.x + 12 * screenScale;
  const shadowY = constrain(footY + 10 * screenScale, yMax * 0.46, yMax - 24 * screenScale);
  const shadowWidth = Math.max(92 * screenScale, lowerBody.width * 1.75);
  const shadowHeight = Math.max(18 * screenScale, shadowWidth * 0.16);

  push();
  noStroke();
  for (let i = 10; i >= 1; i--) {
    const progress = i / 10;
    fill(34, 16, 4, FOREGROUND_SHADOW_ALPHA * Math.pow(progress, 1.7) / 10);
    ellipse(shadowX, shadowY, shadowWidth * progress, shadowHeight * progress);
  }
  pop();
}

function drawForegroundFocus() {
  if (!head || !upperBody || !lowerBody) {
    return;
  }

  const focusX = (head.x + upperBody.x + lowerBody.x) / 3;
  const focusY = (head.y + upperBody.y + lowerBody.y) / 3;
  const focusWidth = Math.max(110 * screenScale, upperBody.width * 2.2);
  const focusHeight = Math.max(170 * screenScale, (head.height + upperBody.height + lowerBody.height) * 0.72);

  noStroke();

  for (let i = 18; i >= 1; i--) {
    const progress = i / 18;
    fill(
      FOREGROUND_RIM_LIGHT[0],
      FOREGROUND_RIM_LIGHT[1],
      FOREGROUND_RIM_LIGHT[2],
      FOREGROUND_RIM_ALPHA * Math.pow(1 - progress, 1.7)
    );
    ellipse(focusX, focusY, focusWidth * progress, focusHeight * progress);
  }

  for (let i = 10; i >= 1; i--) {
    const progress = i / 10;
    fill(255, 244, 184, FOREGROUND_CENTER_LIGHT_ALPHA * Math.pow(1 - progress, 1.3));
    ellipse(focusX - 6 * screenScale, focusY - 18 * screenScale, focusWidth * 0.42 * progress, focusHeight * 0.56 * progress);
  }

  for (let i = 8; i >= 1; i--) {
    const progress = i / 8;
    fill(255, 194, 76, FOREGROUND_WARM_CORE_ALPHA * Math.pow(1 - progress, 1.45));
    ellipse(upperBody.x, upperBody.y - 8 * screenScale, upperBody.width * 1.45 * progress, upperBody.height * 1.25 * progress);
  }
}

function drawStoneGround() {
  if (!stoneGround) {
    return;
  }

  const groundWidth = xMax;
  const groundHeight = groundWidth * stoneGround.height / stoneGround.width;
  const groundX = 0;
  const groundY = yMax - groundHeight + 80;

  image(stoneGround, groundX, groundY, groundWidth, groundHeight);
}

function drawMountains() {
  if (!mountainLeft || !mountainRight) {
    return;
  }

  for (const spec of MOUNTAIN_SPECS) {
    const mountainImage = spec.image === "left" ? mountainLeft : mountainRight;
    const mountainWidth = xMax * spec.widthRatio;
    const mountainHeight = mountainWidth * mountainImage.height / mountainImage.width;
    const mountainX = xMax * spec.xRatio;
    const mountainY = yMax * spec.yRatio;

    tint(255, spec.opacity);
    image(mountainImage, mountainX, mountainY, mountainWidth, mountainHeight);
  }

  noTint();
}

function drawMuFlag() {
  if (!muFlag || !muFlagPole || !muFlagTassel) {
    return;
  }

  const bg = getSceneBackgroundPlacement();
  const flagX = bg.x + MU_FLAG_BOX.x / BACKGROUND_IMAGE_WIDTH * bg.width;
  const flagY = bg.y + MU_FLAG_BOX.y / BACKGROUND_IMAGE_HEIGHT * bg.height;
  const flagWidth = MU_FLAG_BOX.width / BACKGROUND_IMAGE_WIDTH * bg.width;
  const flagHeight = MU_FLAG_BOX.height / BACKGROUND_IMAGE_HEIGHT * bg.height;
  const poleSourceWidth = Math.round(muFlag.width * MU_FLAG_POLE_RATIO);
  const poleWidth = flagWidth * MU_FLAG_POLE_RATIO;

  push();
  tint(MIDGROUND_FLAG_TINT[0], MIDGROUND_FLAG_TINT[1], MIDGROUND_FLAG_TINT[2], MIDGROUND_FLAG_OPACITY);
  image(muFlagPole, flagX, flagY, poleWidth, flagHeight, 0, 0, poleSourceWidth, muFlag.height);
  drawMuFlagTassel(flagX, flagY, flagWidth, flagHeight);

  const stripCount = 34;
  const clothSourceWidth = muFlag.width - poleSourceWidth;
  const stripSourceWidth = clothSourceWidth / stripCount;
  const stripWidth = (flagWidth - poleWidth) / stripCount;
  const t = millis() / 1000;

  for (let i = 0; i < stripCount; i++) {
    const progress = i / Math.max(1, stripCount - 1);
    const sx = poleSourceWidth + i * stripSourceWidth;
    const dx = flagX + poleWidth + i * stripWidth;
    const wave = Math.sin(t * 2.0 - progress * 5.2);
    const secondaryWave = Math.sin(t * 3.1 - progress * 8.0) * 0.35;
    const amplitude = (2 + progress * 10) * screenScale;
    const yOffset = (wave + secondaryWave) * amplitude;
    const xOffset = Math.sin(t * 1.5 - progress * 4.0) * progress * 5 * screenScale;
    const heightScale = 1 + Math.sin(t * 2.0 - progress * 5.2) * progress * 0.015;

    image(
      muFlag,
      dx + xOffset,
      flagY + yOffset,
      stripWidth + 1,
      flagHeight * heightScale,
      sx,
      0,
      stripSourceWidth + 1,
      muFlag.height
    );
  }

  pop();
  noTint();
}

function drawMuFlagTassel(flagX, flagY, flagWidth, flagHeight) {
  const tasselX = flagX + MU_FLAG_TASSEL_BOX.x / muFlag.width * flagWidth;
  const tasselY = flagY + MU_FLAG_TASSEL_BOX.y / muFlag.height * flagHeight;
  const tasselWidth = MU_FLAG_TASSEL_BOX.width / muFlag.width * flagWidth;
  const tasselHeight = MU_FLAG_TASSEL_BOX.height / muFlag.height * flagHeight;
  const t = millis() / 1000;
  const angle = Math.sin(t * 1.7) * 0.075;
  const swayX = Math.sin(t * 1.35 + 0.8) * 4 * screenScale;
  const swayY = Math.sin(t * 2.1 + 1.4) * 2 * screenScale;
  const pivotX = tasselWidth * 0.66;
  const pivotY = tasselHeight * 0.03;

  push();
  translate(tasselX + pivotX + swayX, tasselY + pivotY + swayY);
  rotate(angle);
  image(muFlagTassel, -pivotX, -pivotY, tasselWidth, tasselHeight);
  pop();
}

function drawShuaiFlag() {
  if (!shuaiFlag) {
    return;
  }

  const bg = getSceneBackgroundPlacement();
  const flagX = bg.x + SHUAI_FLAG_BOX.x / BACKGROUND_IMAGE_WIDTH * bg.width;
  const flagY = bg.y + SHUAI_FLAG_BOX.y / BACKGROUND_IMAGE_HEIGHT * bg.height;
  const flagWidth = SHUAI_FLAG_BOX.width / BACKGROUND_IMAGE_WIDTH * bg.width;
  const flagHeight = SHUAI_FLAG_BOX.height / BACKGROUND_IMAGE_HEIGHT * bg.height;
  const poleSourceWidth = Math.round(shuaiFlag.width * SHUAI_FLAG_POLE_RATIO);
  const poleWidth = flagWidth * SHUAI_FLAG_POLE_RATIO;

  push();
  tint(MIDGROUND_FLAG_TINT[0], MIDGROUND_FLAG_TINT[1], MIDGROUND_FLAG_TINT[2], MIDGROUND_FLAG_OPACITY);
  image(shuaiFlag, flagX, flagY, poleWidth, flagHeight, 0, 0, poleSourceWidth, shuaiFlag.height);

  const stripCount = 24;
  const clothSourceWidth = shuaiFlag.width - poleSourceWidth;
  const stripSourceWidth = clothSourceWidth / stripCount;
  const stripWidth = (flagWidth - poleWidth) / stripCount;
  const t = millis() / 1000 + 1.6;

  for (let i = 0; i < stripCount; i++) {
    const progress = i / Math.max(1, stripCount - 1);
    const sx = poleSourceWidth + i * stripSourceWidth;
    const dx = flagX + poleWidth + i * stripWidth;
    const wave = Math.sin(t * 1.35 - progress * 4.4);
    const secondaryWave = Math.sin(t * 2.25 - progress * 6.6) * 0.25;
    const amplitude = (1.2 + progress * 5.2) * screenScale;
    const yOffset = (wave + secondaryWave) * amplitude;
    const xOffset = Math.sin(t * 1.05 - progress * 3.2) * progress * 2.8 * screenScale;
    const heightScale = 1 + Math.sin(t * 1.35 - progress * 4.4) * progress * 0.01;

    image(
      shuaiFlag,
      dx + xOffset,
      flagY + yOffset,
      stripWidth + 1,
      flagHeight * heightScale,
      sx,
      0,
      stripSourceWidth + 1,
      shuaiFlag.height
    );
  }

  pop();
  noTint();
}

function initializeClouds() {
  clouds = CLOUD_SPECS.map((spec) => createCloud(spec, spec.xRatio * xMax));
}

function createCloud(spec, x) {
  const cloudWidth = Math.max(90, xMax * spec.widthRatio);
  const resetGap = xMax * (0.12 + spec.widthRatio);
  return {
    x,
    baseY: yMax * spec.yRatio,
    width: cloudWidth,
    height: cloudWidth * cloudImage.height / cloudImage.width,
    speed: spec.speed * Math.max(0.8, screenScale),
    drift: spec.drift * Math.max(0.8, screenScale),
    phase: spec.phase,
    opacity: spec.opacity,
    loopStart: xMax + resetGap,
    loopEnd: -cloudWidth - resetGap
  };
}

function updateClouds() {
  if (!cloudImage || clouds.length === 0) {
    return;
  }

  const dt = Math.min(deltaTime || 16.67, 50) / 1000;
  const t = millis() / 1000;

  for (const cloud of clouds) {
    cloud.x -= cloud.speed * dt;

    if (cloud.x < cloud.loopEnd) {
      cloud.x = cloud.loopStart;
    }

    const y = cloud.baseY + Math.sin(t * 0.22 + cloud.phase) * cloud.drift;
    tint(255, cloud.opacity);
    image(cloudImage, cloud.x, y, cloud.width, cloud.height);
  }

  noTint();
}

function update() {
	drawSkyBackground();
	drawStoneGround();
	drawMountains();
	updateClouds();
	drawSceneBackground();
	drawMuFlag();
	drawShuaiFlag();
	drawMidgroundLighting();
	head.debug = mouse.pressing();
	neck.debug = mouse.pressing();
	upperBody.debug = mouse.pressing();
	lowerBody.debug = mouse.pressing();
	lFoot.debug = mouse.pressing();
    lFootTop.debug = mouse.pressing();
	rFoot.debug = mouse.pressing();
    rFootTop.debug = mouse.pressing();
    lUarm.debug = mouse.pressing();
    lLarm.debug = mouse.pressing();
    rUarm.debug = mouse.pressing();
    rLarm.debug = mouse.pressing();
    rHand.debug = mouse.pressing();
    // middleFinger.moveTowards(mouse);
    // topLeftHand.moveTowards(mouse);
	getHandedness();
    movePuppet();
    drawForegroundPuppetShadow();
    drawForegroundFocus();
    showHandPoints();
}

function showHandPoints() {
	// Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = mapHandPoint(hand.keypoints[j]);
      fill(255,255,100);
      noStroke();
			textSize(16 * pScale);
			// text(j, keypoint.x, keypoint.y);
      circle(keypoint.x, keypoint.y, 10 * pScale);
    }
		
	}
}

function getHandedness() {
	for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
		whichHand = hand.handedness;
		let wrist = mapHandPoint(hand.keypoints[ML5HAND_WRIST]);
		let wx = wrist.x;
		let wy = wrist.y;
		textSize(24 * pScale); 
		fill('lime');
		// text(whichHand, wx, wy+30); 
	}
}

function movePuppet() {		
	// Make the puppet get lifted by the hand, with yGap between them
	stroke('white');
	if (hands.length>0) {
		// Tip of middle finger, for head
		let jointToTrack = mapHandPoint(hands[0].keypoints[12]);
        middleFinger.moveTowards(jointToTrack);
        let scalerL=1;
		if (whichHand=='Left') {
			jointToTrack = mapHandPoint(hands[0].keypoints[16]);
            topLeftHand.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	else {
			jointToTrack = mapHandPoint(hands[0].keypoints[8]);
            topLeftHand.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	
		if (whichHand=='Left') {
			jointToTrack = mapHandPoint(hands[0].keypoints[8]);
            topRightHand.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	else {
			jointToTrack = mapHandPoint(hands[0].keypoints[16]);
            topRightHand.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	

        
		if (whichHand=='Left') {
			jointToTrack = mapHandPoint(hands[0].keypoints[20]);
            topLeftFoot.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	else {
			jointToTrack = mapHandPoint(hands[0].keypoints[4]);
            topLeftFoot.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	

		if (whichHand=='Left') {4
			jointToTrack = mapHandPoint(hands[0].keypoints[4]);
            topRightFoot.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	else {
			jointToTrack = mapHandPoint(hands[0].keypoints[20]);
            topRightFoot.moveTowards(jointToTrack.x*scalerL,jointToTrack.y*scalerL);
		}	
    }
}
function makePuppet() {
    middleFinger = new pieces.Sprite();
	middleFinger.diameter = 40 * pScale;
    middleFinger.stroke=color(0,0,0,0);
    middleFinger.color=color(0,0,0,0);
	middleFinger.x = xMax/2;
	middleFinger.y = yMax/2-140*pScale;

    
    topHead = new pieces.Sprite();
    topLeftHand = new pieces.Sprite();
    topRightHand = new pieces.Sprite();
    topLeftFoot = new pieces.Sprite();
    topRightFoot = new pieces.Sprite();

	topHead.diameter = 10 * pScale;
    topHead.stroke=color(0,0,0,0);
    topHead.color=color(0,0,0,0);
	topHead.x = xMax/2;
	topHead.y = yMax/2-120*pScale;
	let j=new DistanceJoint(topHead, middleFinger);

	j.collideConnected = true;

	j.springiness = 0.01; // try changing this!

	head = new pieces.Sprite();
	head.diameter = 40 * pScale;
	head.x = xMax/2;
	head.y = yMax/2-60*pScale-headM.height/2*0.5;
	head.img = headM;
	head.img.offset.x = headM.width/4;
	head.img.offset.y = -headM.height/2*0.25;
	new GlueJoint(head, topHead);

	neck = new pieces.Sprite();
	neck.diameter = 20 * pScale;
    neck.stroke=color(0,0,0,0);
    neck.color=color(0,0,0,0);
	neck.x = xMax/2;
	neck.y = yMax/2-60*pScale-headM.height/2*0.25;
	new HingeJoint(neck, head);
    

	upperBody = new pieces.Sprite();
	
    upperBody.width = upBody.width;
    upperBody.height = upBody.height;
	upperBody.x = xMax/2;
	upperBody.y = yMax/2-60*pScale;
	upperBody.img = upBody;
	upperBody.img.offset.x = upBody.width/4;
	//upperBody.img.offset.y = upBody.height/1*0;
	
	new GlueJoint(upperBody, neck);

	lowerSkeBody = new pieces.Sprite();
	lowerSkeBody.x = xMax/2;
	lowerSkeBody.y = yMax/2-15*pScale;
	lowerSkeBody.offset.x = pScale*2.5;
    lowerSkeBody.diameter = 10 * pScale;
    lowerSkeBody.stroke=color(0,0,0,0);
    lowerSkeBody.color=color(0,0,0,0);
	new GlueJoint(lowerSkeBody, upperBody);


	lowerBody = new pieces.Sprite();
	lowerBody.x = xMax/2;
	lowerBody.y = yMax/2+0*pScale;
    lowerBody.width = lowBody.width;
    lowerBody.height = lowBody.height;
	lowerBody.img = lowBody;
	lowerBody.img.offset.x = lowBody.width/6+pScale*0;
	//lowerBody.img.offset.y = lowBody.height/2*0.5;
	
	new HingeJoint(lowerSkeBody, lowerBody);

    lFootTop = new pieces.Sprite();
	lFootTop.x = xMax/2-pScale*5;
	lFootTop.y = yMax/2+lowBody.height/6;
	lFootTop.stroke = color(0,0,0,0);
	lFootTop.color = color(0,0,0,0);
    lFootTop.diameter=40 * pScale;
	new GlueJoint(lowerBody, lFootTop);



	lFoot = new pieces.Sprite();
	lFoot.img = leftFoot;
    lFoot.width = leftFoot.width/3;
    lFoot.height = leftFoot.height/1.5;
	lFoot.x = xMax/2-6*pScale;
	lFoot.y = yMax/2+lowBody.height/6+lFoot.height/2;
	// lFoot.img.offset.x = leftFoot.width/6;
	lFoot.img.offset.y = 0;
	
	new HingeJoint(lFootTop, lFoot);

    
	lFootB = new pieces.Sprite();
	lFootB.x = xMax/2-6*pScale;
	lFootB.y = yMax/2+lowBody.height/6+lFoot.height;
    lFootB.diameter=10 * pScale;
    lFootB.color=color(0,0);
    lFootB.stroke=color(0,0);
	new GlueJoint(lFoot, lFootB);

    topLeftFoot.diameter = 10 * pScale;
	topLeftFoot.x = xMax/2-6*pScale;
	topLeftFoot.y = yMax/2+lowBody.height/6+lFoot.height/2-100*pScale;
    topLeftFoot.color=color(0,0);
    topLeftFoot.stroke=color(0,0);
	j=new DistanceJoint(topLeftFoot, lFootB);

	j.collideConnected = true;

	j.springiness = 0.1; // try changing this!


    rFootTop = new pieces.Sprite();
	rFootTop.x = xMax/2+pScale*10;
	rFootTop.y = yMax/2+lowBody.height/6*1.0;
	rFootTop.stroke = color(0,0,0,0);
	rFootTop.color = color(0,0,0,0);
    rFootTop.diameter=40 * pScale;
	new GlueJoint(lowerBody, rFootTop);



	rFoot = new pieces.Sprite();
    rFoot.width = rightFoot.width/3;
    rFoot.height = rightFoot.height/1.5;
	rFoot.x = xMax/2+pScale*10;
	rFoot.y = yMax/2+lowBody.height/6*1.0+rFoot.height/2;
	rFoot.img = rightFoot;
	rFoot.img.offset.x = +pScale*15;
	rFoot.img.offset.y = 0;
	
	new HingeJoint(rFootTop, rFoot);


	rFootB = new pieces.Sprite();
	rFootB.x = xMax/2+pScale*10+rightFoot.width/4;
	rFootB.y = yMax/2+lowBody.height/6*1.0+rFoot.height;
    rFootB.diameter=10 * pScale;
    rFootB.color=color(0,0);
    rFootB.stroke=color(0,0);
	new GlueJoint(rFoot, rFootB);
    
    topRightFoot.diameter = 10 * pScale;
	topRightFoot.x = xMax/2+pScale*10+rightFoot.width/2;
	topRightFoot.y = yMax/2+lowBody.height/6*1.0+rFoot.height-100*pScale;
    topRightFoot.color=color(0,0);
    topRightFoot.stroke=color(0,0);
	j=new DistanceJoint(topRightFoot, rFootB);

	j.collideConnected = true;

	j.springiness = 0.1; // try changing this!

    
	lShoulder = new pieces.Sprite();
    lShoulder.diameter = 10 * pScale;
	lShoulder.x = xMax/2+8*pScale;
	lShoulder.y = yMax/2-58*pScale;
    lShoulder.color=color(0,0);
    lShoulder.stroke=color(0,0);
	let g=new GlueJoint(upperBody, lShoulder);
	// lShoulderArm = new pieces.Sprite();
    // lShoulderArm.diameter = 20;
	// lShoulderArm.x = xMax/2-1*pScale;
	// lShoulderArm.y = yMax/2-60*pScale;
	// new HingeJoint(lShoulder, lShoulderArm);

	lUarm = new pieces.Sprite();
	lUarm.img = leftUarm;
    lUarm.width = leftUarm.width;
    lUarm.height = leftUarm.height/2;
	lUarm.x = xMax/2+pScale*10-leftUarm.width/2 ;
	lUarm.y = yMax/2-58*pScale;
	lUarm.img.offset.x = 5*pScale;
	lUarm.img.offset.y = +leftUarm.height/4;
	
	new HingeJoint(lShoulder, lUarm);

    
	lMiddlArm = new pieces.Sprite();
    lMiddlArm.diameter = 5 * pScale;
	lMiddlArm.x = xMax/2+8*pScale-lUarm.width*0.65;
	lMiddlArm.y = yMax/2-58*pScale+lUarm.height;
    lMiddlArm.color=color(0,0);
    lMiddlArm.stroke=color(0,0);
	g=new GlueJoint(lUarm, lMiddlArm);
    g.visible=false;

    
	lLarm = new pieces.Sprite();
	lLarm.img = leftLarm;
    lLarm.width = leftLarm.width;
    lLarm.height = leftLarm.height/2;
	lLarm.x = xMax/2+pScale*10-lUarm.width*0.65 -leftLarm.width/2*0.8;
	lLarm.y = yMax/2-58*pScale+lUarm.height +leftLarm.height/2*0.9*0.6;
	new HingeJoint(lMiddlArm, lLarm);


    
    
	lHand = new pieces.Sprite();
	lHand.img = leftHand;
    lHand.width = leftHand.width;
    lHand.height = leftHand.height/2;
	lHand.x = xMax/2+pScale*10-lUarm.width*0.65 -leftLarm.width/2*0.8-leftLarm.width/2*0.75;
	lHand.y = yMax/2-58*pScale+lUarm.height +leftLarm.height/2*0.9*0.6+leftLarm.height/2*0.75;
	// lLarm.img.offset.x = 5*pScale;
	// lLarm.img.offset.y = +leftLarm.height/4;
	
	new GlueJoint(lLarm, lHand);
    
    topLeftHand.diameter=10 * pScale;
	topLeftHand.x = xMax/2+pScale*10-lUarm.width*0.65 -leftLarm.width/2*0.8-leftLarm.width/2*0.75;
	topLeftHand.y = yMax/2-58*pScale+lUarm.height +leftLarm.height/2*0.9*0.6+leftLarm.height/2*0.75-50*pScale;
    topLeftHand.color=color(0,0);
    topLeftHand.stroke=color(0,0);
	j=new DistanceJoint(topLeftHand, lHand);
	j.collideConnected = true;

	j.springiness = 0.0; // try changing this!
	// rShoulder = new pieces.Sprite();
    // rShoulder.diameter = 10;
	// rShoulder.x = xMax/2+8*pScale;
	// rShoulder.y = yMax/2-58*pScale;
	// new GlueJoint(upperBody, rShoulder);

    

	rUarm = new pieces.Sprite();
	rUarm.img = rightUarm;
    rUarm.width = rightUarm.width;
    rUarm.height = rightUarm.height/2;
	rUarm.x = xMax/2+pScale*10+rightUarm.width/2*0.4 ;
	rUarm.y = yMax/2-58*pScale;
	rUarm.img.offset.x = 5*pScale;
	rUarm.img.offset.y = +rightUarm.height/4;
	new HingeJoint(lShoulder, rUarm);

	rMiddlArm = new pieces.Sprite();
    rMiddlArm.diameter = 5 * pScale;
	rMiddlArm.x = xMax/2+8*pScale+rUarm.width*0.65;
	rMiddlArm.y = yMax/2-58*pScale+lUarm.height*0.7;
    rMiddlArm.color=color(0,0);
    rMiddlArm.stroke=color(0,0);
	g=new GlueJoint(rUarm, rMiddlArm);
    g.visible=false;

	rLarm = new pieces.Sprite();
	rLarm.img = rightLarm;
    rLarm.width = rightLarm.width;
    rLarm.height = rightLarm.height/2;
	rLarm.x = xMax/2-pScale*10+rUarm.width*0.65+rightLarm.width/2*1.2;
	rLarm.y = yMax/2-58*pScale+rUarm.height +rightLarm.height/2*0.1;
	new HingeJoint(rMiddlArm, rLarm);

	rHand = new pieces.Sprite();
	rHand.img = rightHand;
    rHand.width = rightHand.width;
    rHand.height = rightHand.height/2;
	rHand.x = xMax/2-pScale*10+rUarm.width*0.65+rightLarm.width/2*1.2-rightHand.width/1*0.35;
	rHand.y = yMax/2-58*pScale+rUarm.height +rightLarm.height/2*0.1+rightHand.height*0.3;
	// lLarm.img.offset.x = 5*pScale;
	// lLarm.img.offset.y = +leftLarm.height/4;
	new GlueJoint(rLarm, rHand);

    topRightHand.diameter=10 * pScale;
	topRightHand.x = xMax/2-pScale*10+rUarm.width*0.65+rightLarm.width/2*1.2-rightHand.width/1*0.35;
	topRightHand.y = yMax/2-58*pScale+rUarm.height +rightLarm.height/2*0.1+rightHand.height*0.3-50*pScale;
    topRightHand.color=color(0,0);
    topRightHand.stroke=color(0,0);
	j=new DistanceJoint(topRightHand, rHand);
	j.collideConnected = true;

	j.springiness = 0.0; // try changing this!

	box = new Sprite([
		[1, 1],
		[xMax, 1],
		[xMax, yMax],
		[1, yMax],
		[1, 1]
	]);
	box.collider = "static";
	box.shape = "chain";
	box.color = "skyblue";
	
}



// The following index labels may be helpful:
const ML5HAND_WRIST = 0; 
const ML5HAND_THUMB_CMC = 1; 
const ML5HAND_THUMB_MCP = 2; 
const ML5HAND_THUMB_IP = 3; 
const ML5HAND_THUMB_TIP = 4; 
const ML5HAND_INDEX_FINGER_MCP = 5; 
const ML5HAND_INDEX_FINGER_PIP = 6; 
const ML5HAND_INDEX_FINGER_DIP = 7; 
const ML5HAND_INDEX_FINGER_TIP = 8; 
const ML5HAND_MIDDLE_FINGER_MCP = 9; 
const ML5HAND_MIDDLE_FINGER_PIP = 10; 
const ML5HAND_MIDDLE_FINGER_DIP = 11; 
const ML5HAND_MIDDLE_FINGER_TIP = 12; 
const ML5HAND_RING_FINGER_MCP = 13; 
const ML5HAND_RING_FINGER_PIP = 14; 
const ML5HAND_RING_FINGER_DIP = 15; 
const ML5HAND_RING_FINGER_TIP = 16; 
const ML5HAND_PINKY_MCP = 17; 
const ML5HAND_PINKY_PIP = 18; 
const ML5HAND_PINKY_DIP = 19; 
const ML5HAND_PINKY_TIP = 20; 
