// Generative Star Map Explorer
// A procedurally generated universe with interactive star systems

let stars = [];
let numStars = 100;
let currentView = "galaxy"; // "galaxy" or "system"
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

// Audio variables
let oscillators = [];
let isAudioStarted = false;

// Debug variable - set to true to see star click areas
let debugMode = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  
  // Generate stars with Perlin noise for galaxy structure
  let seed = random(1000);
  noiseSeed(seed);
  
  for (let i = 0; i < numStars; i++) {
    // Use Perlin noise to create galaxy arms
    let angle = noise(i * 0.1) * TWO_PI * 4;
    let radius = noise(i * 0.05 + 100) * min(width, height) * 0.45;
    let x = width/2 + cos(angle) * radius;
    let y = height/2 + sin(angle) * radius;
    
    // Ensure stars are within visible area
    x = constrain(x, 50, width-50);
    y = constrain(y, 50, height-50);
    
    // Generate unique star properties
    let starName = random(starNames) + " " + random(starSuffixes);
    let starSize = random(2, 6);
    let starColor = color(
      random(150, 255), 
      random(150, 255), 
      random(150, 255)
    );
    
    // Generate planets for this star system
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
    
    // Create star object
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
      // Store untransformed position for hit detection
      originalX: x,
      originalY: y
    });
  }
  
  // Create audio button
  let audioButton = createButton('Start Audio');
  audioButton.position(20, 120);
  audioButton.mousePressed(startAudio);
  
  // Create debug button
  let debugButton = createButton('Toggle Debug');
  debugButton.position(120, 120);
  debugButton.mousePressed(() => {
    debugMode = !debugMode;
    console.log("Debug mode: " + (debugMode ? "ON" : "OFF"));
  });
  
  // Create system view button for testing
  let testSystemButton = createButton('Test System View');
  testSystemButton.position(220, 120);
  testSystemButton.mousePressed(() => {
    // Force system view with the first star
    selectedStar = stars[0];
    currentView = "system";
    targetZoomLevel = 1;
    targetCameraX = 0;
    targetCameraY = 0;
    console.log("Forced system view with star: " + selectedStar.name);
  });
  
  // Create return button for testing
  let returnButton = createButton('Return to Galaxy');
  returnButton.position(350, 120);
  returnButton.mousePressed(() => {
    currentView = "galaxy";
    console.log("Returned to galaxy view");
  });
}

function startAudio() {
  if (!isAudioStarted) {
    // Set up oscillators for each star
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
  
  // Smooth camera and zoom transitions
  zoomLevel = lerp(zoomLevel, targetZoomLevel, 0.05);
  cameraX = lerp(cameraX, targetCameraX, 0.05);
  cameraY = lerp(cameraY, targetCameraY, 0.05);
  
  if (currentView === "galaxy") {
    drawGalaxy();
  } else if (currentView === "system") {
    drawStarSystem();
  }
  
  // Draw UI overlay
  drawUI();
}

function drawGalaxy() {
  push();
  // Apply camera transformations
  translate(width/2, height/2);
  translate(-cameraX, -cameraY);
  scale(zoomLevel);
  translate(-width/2, -height/2);
  
  // Draw background stars (smaller, non-interactive)
  for (let i = 0; i < 200; i++) {
    let x = noise(i * 0.1, frameCount * 0.0001) * width;
    let y = noise(i * 0.1 + 100, frameCount * 0.0001) * height;
    let size = noise(i * 0.1 + 200) * 1.5;
    
    fill(200, 200, 255, 150);
    noStroke();
    ellipse(x, y, size, size);
  }
  
  // Draw main interactive stars
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    
    // Update pulse
    star.pulse = (sin(frameCount * 0.02 * star.pulseRate) + 1) * 0.5;
    
    // Draw star glow
    let glowSize = star.size * (1 + star.pulse);
    let glowColor = color(red(star.color), green(star.color), blue(star.color), 100);
    fill(glowColor);
    noStroke();
    ellipse(star.x, star.y, glowSize * 4, glowSize * 4);
    
    // Draw star
    fill(star.color);
    ellipse(star.x, star.y, glowSize, glowSize);
    
    // Update audio if it's been started
    if (isAudioStarted) {
      // Calculate screen position for distance check
      let screenX = (star.x - width/2) * zoomLevel + width/2 - cameraX;
      let screenY = (star.y - height/2) * zoomLevel + height/2 - cameraY;
      
      // Scale amplitude based on distance from mouse
      let d = dist(mouseX, mouseY, screenX, screenY);
      let maxDist = 200;
      let amp = map(d, 0, maxDist, 0.2, 0);
      amp = constrain(amp, 0, 0.2);
      oscillators[i].amp(amp * star.pulse);
    }
    
    // Debug: visualize clickable area
    if (debugMode) {
      let hitRadius = star.size * 5; // Larger hit area for easier clicking
      stroke(255, 0, 0);
      noFill();
      ellipse(star.x, star.y, hitRadius * 2, hitRadius * 2);
      
      // Draw star name for debugging
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
  
  // Draw the central star
  let star = selectedStar;
  star.pulse = (sin(frameCount * 0.02 * star.pulseRate) + 1) * 0.5;
  
  // Draw star glow
  let glowSize = star.size * 4 * (1 + star.pulse * 0.5);
  let glowColor = color(red(star.color), green(star.color), blue(star.color), 100);
  fill(glowColor);
  noStroke();
  ellipse(width/2, height/2, glowSize * 2, glowSize * 2);
  
  // Draw star
  fill(star.color);
  ellipse(width/2, height/2, glowSize, glowSize);
  
  // Draw orbits
  noFill();
  stroke(100, 100, 100, 100);
  for (let i = 0; i < star.planets.length; i++) {
    let planet = star.planets[i];
    ellipse(width/2, height/2, planet.distance * 2, planet.distance * 2);
  }
  
  // Draw planets
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
  // Draw info panel
  fill(10, 15, 30, 200);
  stroke(100, 150, 255, 150);
  rect(10, 10, 250, 100, 10);
  
  fill(255);
  noStroke();
  textSize(16);
  
  if (currentView === "galaxy") {
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
  
  // Draw navigation controls
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
    // Avoid triggering when clicking on UI buttons
    return;
  }
  
  if (currentView === "galaxy") {
    // Inverse transform mouse coordinates to match star coordinates
    let mouseWorldX = (mouseX - width/2) / zoomLevel + width/2 + cameraX/zoomLevel;
    let mouseWorldY = (mouseY - height/2) / zoomLevel + height/2 + cameraY/zoomLevel;
    
    console.log("Transformed mouse position:", mouseWorldX, mouseWorldY);
    
    // Check if a star was clicked
    for (let i = 0; i < stars.length; i++) {
      let star = stars[i];
      let d = dist(mouseWorldX, mouseWorldY, star.x, star.y);
      let hitRadius = star.size * 5; // Larger hit area for easier clicking
      
      if (d < hitRadius) {
        // Select this star and switch to system view
        selectedStar = star;
        currentView = "system";
        targetZoomLevel = 1;
        targetCameraX = 0;
        targetCameraY = 0;
        
        console.log("Star selected:", star.name, "at position:", star.x, star.y);
        return;
      }
    }
    
    console.log("No star found at click position");
  } else if (currentView === "system") {
    // Return to galaxy view
    currentView = "galaxy";
    console.log("Returned to galaxy view");
  }
}

function mouseDragged() {
  if (currentView === "galaxy") {
    targetCameraX -= movedX / zoomLevel;
    targetCameraY -= movedY / zoomLevel;
  }
  return false;  // Prevent default behavior
}

function mouseWheel(event) {
  if (currentView === "galaxy") {
    // Adjust zoom level
    let zoomChange = event.delta * -0.001;
    targetZoomLevel = constrain(targetZoomLevel + zoomChange, 0.5, 3);
  }
  return false; // Prevent page scrolling
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}