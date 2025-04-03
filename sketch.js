let stars = [];
let numStars = 100;
let currentView = "galaxy"; 
let selectedStar = null;
let zoomLevel = 1;
let targetZoomLevel = 1;
let cameraX = 0;
let cameraY = 0;
let targetCameraX = 0;
let targetCameraY = 0;
let starNames = [
  "Proxima", "Sirius", "Vega", "Altair", "Antares", "Rigel", "Deneb", 
  "Canopus", "Arcturus", "Aldebaran", "Pollux", "Spica", "Betelgeuse", 
  "Castor", "Regulus", "Polaris", "Fomalhaut", "Capella", "Achernar"
];
let starSuffixes = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Theta",
  "Prime", "Secundus", "Tertius", "Minor", "Major", "Centauri"
];


let oscillators = [];
let isAudioStarted = false;

let debugMode = false;

let isTransitioning = false;
let transitionStartTime = 0;
let transitionDuration = 2000; 
let transitionStar = null;
let transitionStartCameraX = 0;
let transitionStartCameraY = 0;
let transitionStartZoom = 1;
let transitionEndZoom = 5; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);

  let seed = random(1000);
  noiseSeed(seed);
  
  
  let attempts = 0;
  const maxAttempts = 1000; 
  const minDistance = 30;
  while (stars.length < numStars && attempts < maxAttempts) {
    attempts++;
    
    let angle = noise(attempts * 0.1) * TWO_PI * 4;
    let radius = noise(attempts * 0.05 + 100) * min(width, height) * 0.45;
    let x = width/2 + cos(angle) * radius;
    let y = height/2 + sin(angle) * radius;
    
    x = constrain(x, 50, width-50);
    y = constrain(y, 50, height-50);
    
  
    let tooClose = false;
    let starSize = random(2, 6);
    let minDistanceRequired = minDistance + starSize; 
    
    for (let i = 0; i < stars.length; i++) {
      let existingStar = stars[i];
      let d = dist(x, y, existingStar.x, existingStar.y);
      if (d < minDistanceRequired + existingStar.size) {
        tooClose = true;
        break;
      }
    }
    
   
    if (!tooClose) {
      let starName = random(starNames) + " " + random(starSuffixes);
      let starColor = color(
        random(150, 255), 
        random(150, 255), 
        random(150, 255)
      );
      
      let numPlanets = floor(random(1, 6));
      let planets = [];
      
      for (let j = 0; j < numPlanets; j++) {
        planets.push({
          distance: random(20, 100),
          size: random(2, 8),
          color: color(random(100, 255), random(100, 255), random(100, 255)),
          orbitSpeed: random(0.005, 0.02),
          angle: random(TWO_PI)
        });
      }
      
      stars.push({
        x: x,
        y: y,
        size: starSize,
        color: starColor,
        name: starName,
        planets: planets,
        pulseRate: random(0.5, 2),
        frequency: random(200, 800),
        pulse: 0,

        originalX: x,
        originalY: y
      });
    }
  }

  console.log(`Created ${stars.length} stars after ${attempts} attempts`);
  
  
  if (stars.length < numStars * 0.8) {
    console.log("Warning: Could not create enough stars with current spacing");
  }
  
  let audioButton = createButton('Start Audio');
  audioButton.position(20, 120);
  audioButton.mousePressed(startAudio);
  
  let debugButton = createButton('Toggle Debug');
  debugButton.position(120, 120);
  debugButton.mousePressed(() => {
    debugMode = !debugMode;
    console.log("Debug mode: " + (debugMode ? "ON" : "OFF"));
  });
 
  let testSystemButton = createButton('Test System View');
  testSystemButton.position(220, 120);
  testSystemButton.mousePressed(() => {
  
    startTransitionToStar(stars[0]);
  });
 
  let returnButton = createButton('Return to Galaxy');
  returnButton.position(350, 120);
  returnButton.mousePressed(() => {
    if (currentView === "system" && !isTransitioning) {
      currentView = "galaxy";
      console.log("Returned to galaxy view");
    }
  });
}

function startAudio() {
  if (!isAudioStarted) {
    for (let i = 0; i < stars.length; i++) {
      let osc = new p5.Oscillator();
      osc.setType('sine');
      osc.freq(stars[i].frequency);
      osc.amp(0);
      osc.start();
      oscillators.push(osc);
    }
    isAudioStarted = true;
    console.log("Audio started");
  }
}

function draw() {
  background(10, 15, 30);
  
  if (isTransitioning) {
    updateTransition();
  } else {
  
    zoomLevel = lerp(zoomLevel, targetZoomLevel, 0.05);
    cameraX = lerp(cameraX, targetCameraX, 0.05);
    cameraY = lerp(cameraY, targetCameraY, 0.05);
  }
  
  if (currentView === "galaxy") {
    drawGalaxy();
  } else if (currentView === "system") {
    drawStarSystem();
  }
  
  drawUI();
}

function updateTransition() {

  let elapsed = millis() - transitionStartTime;
  let progress = min(elapsed / transitionDuration, 1);
  
  
  let easedProgress = easeInOutCubic(progress);
  
  if (progress < 1) {

    if (transitionStar) {

      let targetX = transitionStar.x;
      let targetY = transitionStar.y;
      
    
      let worldCenterX = width / 2;
      let worldCenterY = height / 2;
      let targetCamX = (targetX - worldCenterX);
      let targetCamY = (targetY - worldCenterY);
      
 
      cameraX = lerp(transitionStartCameraX, targetCamX, easedProgress);
      cameraY = lerp(transitionStartCameraY, targetCamY, easedProgress);
      zoomLevel = lerp(transitionStartZoom, transitionEndZoom, easedProgress);
    }
  } else {

    isTransitioning = false;
    currentView = "system";
    selectedStar = transitionStar;
    zoomLevel = 1;
    cameraX = 0;
    cameraY = 0;
    targetZoomLevel = 1;
    targetCameraX = 0;
    targetCameraY = 0;
    console.log("Transition complete, now in system view");
  }
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startTransitionToStar(star) {
  if (isTransitioning) return;
  
  console.log("Starting transition to star:", star.name);
  isTransitioning = true;
  transitionStar = star;
  transitionStartTime = millis();
  transitionStartCameraX = cameraX;
  transitionStartCameraY = cameraY;
  transitionStartZoom = zoomLevel;
}

function drawGalaxy() {
  push();
  
  translate(width/2, height/2);
  translate(-cameraX, -cameraY);
  scale(zoomLevel);
  translate(-width/2, -height/2);
  
  
  for (let i = 0; i < 200; i++) {
    let x = noise(i * 0.1, frameCount * 0.0001) * width;
    let y = noise(i * 0.1 + 100, frameCount * 0.0001) * height;
    let size = noise(i * 0.1 + 200) * 1.5;
    
    fill(200, 200, 255, 150);
    noStroke();
    ellipse(x, y, size, size);
  }
  
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    star.pulse = (sin(frameCount * 0.02 * star.pulseRate) + 1) * 0.5;
    let glowSize = star.size * (1 + star.pulse);
    let glowColor = color(red(star.color), green(star.color), blue(star.color), 100);
    fill(glowColor);
    noStroke();
    ellipse(star.x, star.y, glowSize * 4, glowSize * 4);
    
  
    fill(star.color);
    ellipse(star.x, star.y, glowSize, glowSize);
    
 
    if (isTransitioning && star === transitionStar) {
      let highlightSize = glowSize * 6;
      let highlightColor = color(255, 255, 255, 50);
      fill(highlightColor);
      ellipse(star.x, star.y, highlightSize, highlightSize);
    }
    
   
    if (isAudioStarted) {
      
      let screenX = (star.x - width/2) * zoomLevel + width/2 - cameraX;
      let screenY = (star.y - height/2) * zoomLevel + height/2 - cameraY;
     
      let d = dist(mouseX, mouseY, screenX, screenY);
      let maxDist = 200;
      let amp = map(d, 0, maxDist, 0.2, 0);
      amp = constrain(amp, 0, 0.2);
      oscillators[i].amp(amp * star.pulse);
    }
    
  
    if (debugMode) {
      let hitRadius = star.size * 5; 
      stroke(255, 0, 0);
      noFill();
      ellipse(star.x, star.y, hitRadius * 2, hitRadius * 2);
   
      fill(255);
      noStroke();
      textSize(8);
      text(star.name, star.x, star.y + hitRadius + 10);
    }
  }
  
  pop();
}

function drawStarSystem() {
  if (!selectedStar) return;
  
 
  let star = selectedStar;
  star.pulse = (sin(frameCount * 0.02 * star.pulseRate) + 1) * 0.5;
  
  let glowSize = star.size * 4 * (1 + star.pulse * 0.5);
  let glowColor = color(red(star.color), green(star.color), blue(star.color), 100);
  fill(glowColor);
  noStroke();
  ellipse(width/2, height/2, glowSize * 2, glowSize * 2);
  

  fill(star.color);
  ellipse(width/2, height/2, glowSize, glowSize);
  
  noFill();
  stroke(100, 100, 100, 100);
  for (let i = 0; i < star.planets.length; i++) {
    let planet = star.planets[i];
    ellipse(width/2, height/2, planet.distance * 2, planet.distance * 2);
  }
  for (let i = 0; i < star.planets.length; i++) {
    let planet = star.planets[i];
    
    // Update planet position
    planet.angle += planet.orbitSpeed;
    
    let planetX = width/2 + cos(planet.angle) * planet.distance;
    let planetY = height/2 + sin(planet.angle) * planet.distance;
    
    // Draw planet
    fill(planet.color);
    noStroke();
    ellipse(planetX, planetY, planet.size, planet.size);
  }
}

function drawUI() {
 
  fill(10, 15, 30, 200);
  stroke(100, 150, 255, 150);
  rect(10, 10, 250, 100, 10);
  
  fill(255);
  noStroke();
  textSize(16);
  
  if (isTransitioning) {
    text("Zooming to " + transitionStar.name + "...", 20, 35);
    let progress = min((millis() - transitionStartTime) / transitionDuration, 1);
    text("Progress: " + floor(progress * 100) + "%", 20, 55);
  } else if (currentView === "galaxy") {
    text("Galaxy View", 20, 35);
    text("Stars: " + stars.length, 20, 55);
    text("Click on a star to explore", 20, 75);
    
    if (debugMode) {
      text("Debug Mode ON", 20, 95);
      text("MouseX: " + mouseX + " MouseY: " + mouseY, 260, 35);
      text("ZoomLevel: " + zoomLevel.toFixed(2), 260, 55);
      text("Camera: " + cameraX.toFixed(0) + ", " + cameraY.toFixed(0), 260, 75);
    }
  } else if (currentView === "system" && selectedStar) {
    text(selectedStar.name + " System", 20, 35);
    text("Planets: " + selectedStar.planets.length, 20, 55);
    text("Click anywhere to return", 20, 75);
  }
  
    fill(10, 15, 30, 200);
  stroke(100, 150, 255, 150);
  rect(width - 150, 10, 140, 100, 10);
  
  fill(255);
  noStroke();
  text("Navigation:", width - 140, 35);
  text("Drag to move", width - 140, 55);
  text("Scroll to zoom", width - 140, 75);
}

function mouseClicked() {
  console.log("Mouse clicked at:", mouseX, mouseY);
  
  if (mouseY < 150) {
  
    return;
  }
  
  if (isTransitioning) {
    
    return;
  }
  
  if (currentView === "galaxy") {
    // Inverse transform mouse coordinates to match star coordinates
    let mouseWorldX = (mouseX - width/2) / zoomLevel + width/2 + cameraX/zoomLevel;
    let mouseWorldY = (mouseY - height/2) / zoomLevel + height/2 + cameraY/zoomLevel;
    
    console.log("Transformed mouse position:", mouseWorldX, mouseWorldY);
    
 
    for (let i = 0; i < stars.length; i++) {
      let star = stars[i];
      let d = dist(mouseWorldX, mouseWorldY, star.x, star.y);
      let hitRadius = star.size * 5;
      
      if (d < hitRadius) {
     
        startTransitionToStar(star);
        return;
      }
    }
    
    console.log("No star found at click position");
  } else if (currentView === "system") {
    
    currentView = "galaxy";
    console.log("Returned to galaxy view");
  }
}

function mouseDragged() {
  if (currentView === "galaxy" && !isTransitioning) {
    targetCameraX -= movedX / zoomLevel;
    targetCameraY -= movedY / zoomLevel;
  }
  return false; 
}

function mouseWheel(event) {
  if (currentView === "galaxy" && !isTransitioning) {

    let zoomChange = event.delta * -0.001;
    targetZoomLevel = constrain(targetZoomLevel + zoomChange, 0.5, 3);
  }
  return false; // Prevent page scrolling
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
