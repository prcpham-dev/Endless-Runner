# Gravity Flip Runner

A simple endless runner game built with **HTML5 Canvas** and vanilla **JavaScript**, where the player flips gravity to dodge pillars. Inspired by "Flappy Bird" mechanics but with an upside-down twist.

![screenshot](assets/hud.jpeg)

---

## 🎮 Gameplay

- The player is a small square that can flip between the floor and ceiling.
- Avoid crashing into the **pillars** that spawn with random gaps.
- The game gets faster the longer you survive.
- Your **score** increases with time and obstacles cleared.
- Your **high score** is saved locally (via `localStorage`).

---

## 🕹 Controls

| Action              | Keyboard        | Mouse / Touch  |
|---------------------|-----------------|----------------|
| **Flip gravity**    | `Space`         | Click / Tap    |
| **Pause / Resume**  | `P`             | Pause button   |
| **Restart**         | `R`             | Restart button |

- Press **Space** after crashing to restart quickly.  
- You can also use the **Start / Pause / Restart** buttons in the HUD.

---

## ⚙️ How It Works

- **Canvas Rendering**: Game visuals are drawn on an HTML `<canvas>`.
- **Game Loop**: Uses `requestAnimationFrame` for smooth updates.
- **Physics**:
  - Gravity pulls the player toward the floor or ceiling.
  - Flipping reverses gravity and gives a little bounce.
- **Obstacles**:
  - Pillars spawn with a random gap between them.
  - Speed increases over time for added difficulty.
- **HUD**:
  - Score and high score displayed in the top-left corner.
  - Game state messages (`Paused`, `Game Over`, etc.) shown at the center.
