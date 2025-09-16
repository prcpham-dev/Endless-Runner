# Gravity Flip Runner

A simple endless runner game built with **HTML5 Canvas** and vanilla **JavaScript**, where the player flips gravity to dodge pillars. Inspired by "Flappy Bird".

![screenshot](assets/hud.jpg)

## 🎮 Gameplay

<table border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td><img src="assets/LittleGhost.gif" width="120"></td>
    <td>

  - Play as a small ghost that can **flip** between the floor and ceiling  
  - Dodge the **pillars** that spawn with random gaps  
  - The game **speeds up** the longer you survive  
  - Score increases with **time survived** and **obstacles cleared**  
  - Your **high score** is saved automatically using `localStorage`  

    </td>
  </tr>
</table>

## 🕹 Controls

| Action              | Keyboard        | Mouse / Touch  |
|---------------------|-----------------|----------------|
| **Flip gravity**    | `Space`         | Click / Tap    |
| **Pause / Resume**  | `P`             | Pause button   |
| **Restart**         | `R`             | Restart button |

- Press **Space** after crashing to restart quickly.  
- You can also use the **Start / Pause / Restart** buttons in the HUD.

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
