# Angry Cat — Game Design Document

## Overview

First-person obstacle course game where the player navigates through a house while avoiding an angry cat that jump scares them. Built with Three.js + Vite. Target audience: 10-12 year old, fun-scary not horror-scary.

## Tech Stack

- **Vite** — dev server + bundler
- **Three.js** — 3D rendering, PointerLockControls, positional audio
- **Vanilla JS** — no framework
- **Procedural geometry** — rooms and furniture from primitives
- **GLTF cat model** — source a free cat model if a good one is available

## Project Structure

```
gametest/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── sounds/
├── src/
│   ├── main.js          # Entry point, scene init
│   ├── launcher.js      # Title screen / start menu
│   ├── player.js        # First-person controls, movement, collision
│   ├── cat.js           # Cat AI, patrol, chase, jump scare logic
│   ├── house.js         # Room generation, furniture, obstacles
│   ├── rooms/
│   │   ├── kitchen.js
│   │   ├── livingRoom.js
│   │   ├── hallway.js
│   │   └── bedroom.js
│   ├── jumpScare.js     # Jump scare overlay, camera shake, sound
│   ├── hud.js           # Minimal HUD
│   ├── sounds.js        # Sound manager
│   ├── lighting.js      # Flickering lights, shadows, atmosphere
│   └── styles.css       # Launcher + HUD styling
```

## Launcher Screen

- Dark background with CSS animated fog/mist
- "ANGRY CAT" title in distressed font (Creepster/Nosifer from Google Fonts)
- Subtitle: "Don't wake the cat."
- CSS animated glowing cat eyes that blink
- PLAY button — pulses, engages pointer lock, fades out over 0.5s
- Optional difficulty selector (Easy / Normal / Hard)

## House Layout

Linear room-to-room progression:

```
Back Door (spawn) → Kitchen → Hallway → Living Room → Bedroom → Front Door (exit/win)
```

Each room: ~8m x 6m, distinct floor/wall materials, furniture obstacles, 1-2 cat hiding spots, unique lighting mood.

### Room Details

- **Kitchen:** Table, chairs, counter. Warm overhead light. Tile floor.
- **Hallway:** Narrow, flickering bulb, nowhere to hide. Wood floor.
- **Living Room:** Couch, coffee table, bookshelf. Dim lamp. Carpet.
- **Bedroom:** Bed, dresser, closet. Very dark. Carpet. Cat most aggressive here.

## Player Controls

- **WASD** — move (walk 4 u/s, sprint 6 u/s)
- **Mouse** — look (PointerLockControls)
- **Shift** — sprint (3s stamina, 4s recharge)
- **ESC** — pause / release pointer lock
- No jumping
- Raycast collision against walls and furniture
- Footstep sounds vary by floor material, faster when sprinting
- Subtle head bob while walking
- Eye height: 1.6m

## Cat AI

Three states:

### 1. Lurking (default)
- Hidden in room hiding spot, invisible until player enters trigger zone

### 2. Stalking
- Visible, follows player slowly, stays behind furniture
- Glowing eyes visible in dark
- Growling gets louder with proximity
- Sprinting player increases cat aggression
- Lasts 3-8 seconds

### 3. Pouncing (jump scare)
- Triggers at <2m distance or player turns to find cat behind them
- Cat lunges at camera, scales up to fill screen
- Loud hiss/yowl, red flash, camera shake (0.5s)
- Fade to black, respawn at room entrance
- Cat resets to new hiding spot

### Cat Appearance
- GLTF model if available, otherwise primitives (elongated body, triangle ears, tail, glowing green/yellow sphere eyes)
- Dark grey/black material

### Difficulty Scaling
- Cat speed and aggression increase per room
- Kitchen: slow, lots of warning
- Bedroom: fast, sneaky

## Sound Design

Positional audio via Three.js AudioListener + PositionalAudio.

### Ambient
- House creaking loop
- Per-room variation (fridge hum, clock ticking)

### Player
- Footsteps per floor type (tile, wood, carpet)
- Sprint footsteps faster
- Heavy breathing at low stamina

### Cat
- Growl when stalking (volume scales with distance)
- Hiss on pounce
- Yowl/screech on jump scare
- Random distant cat sounds for tension

### UI
- Door creak on room transition
- Launcher click
- Win jingle

## HUD

Minimal:
- **Stamina bar** — thin, bottom center, only visible when sprinting/recharging
- **Room name** — fades in on entry, fades out after 2 seconds
- No crosshair, health bar, or minimap

## Win Screen

- Front door opens, bright light floods in
- "YOU ESCAPED!" text overlay
- "The cat goes back to sleep... for now."
- Time taken displayed
- PLAY AGAIN button

## Lose Screen

- Cat fills screen, red flash, camera shake
- Black screen: random message ("The cat got you." / "You should have been quieter." / "Cats always win.")
- Auto-restart at current room entrance after ~2 seconds
