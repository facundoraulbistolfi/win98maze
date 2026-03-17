<div align="center">

<img src="logo.svg" width="96" alt="Windows 98 Logo" />

# 🪟 Win98 Maze

**A faithful web recreation of the iconic Windows 98 Maze screensaver**

[![GitHub Pages](https://img.shields.io/badge/Play%20Online-GitHub%20Pages-0072C6?style=for-the-badge&logo=github)](https://facundoraulbistolfi.github.io/win98maze)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

---

## 🕹️ About

Remember staring at your monitor in the late 90s, watching a tiny ball navigate an endless 3D maze while your computer sat idle?

**Win98 Maze** brings that nostalgia back to the browser — reimagined as a playable game with the full Windows 98 aesthetic: classic beveled buttons, the iconic teal desktop, draggable windows, and even a taskbar with a live clock.

> *"It's not a screensaver anymore. Now you're the one navigating the maze."*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎨 **Win98 UI** | Pixel-perfect Windows 98 interface — title bar, beveled buttons, status bar, taskbar |
| 🌀 **Procedural Mazes** | Every maze is uniquely generated using the **Recursive Backtracker** algorithm |
| 📈 **Level Progression** | Mazes grow larger and more complex with each level |
| ⌨️ **Keyboard Controls** | Arrow keys or WASD to move |
| 📱 **Touch Support** | Swipe gestures on mobile and tablet |
| 🪟 **Draggable Window** | Drag the window around the desktop, just like the real thing |
| ⏱️ **Stats Tracking** | Steps taken and time elapsed per level |

---

## 🎮 How to Play

1. **Open** the game in your browser
2. **Navigate** the maze using the arrow keys or `W A S D`
3. **Reach** the green **`E`** (exit) to complete the level
4. **Progress** through increasingly larger mazes

On mobile, **swipe** in the direction you want to move.

---

## 🕹️ Controls

```
  ↑ / W  — Move North
  ↓ / S  — Move South
  → / D  — Move East
  ← / A  — Move West
```

---

## 🛠️ Tech Stack

- **Vanilla HTML5, CSS3, JavaScript** — zero dependencies, zero frameworks
- **Canvas API** for maze rendering
- **Recursive Backtracker** for perfect maze generation (every cell reachable, exactly one solution path)

---

## 🚀 Running Locally

Just open `index.html` in any modern browser — no build step, no server required.

```bash
git clone https://github.com/facundoraulbistolfi/win98maze.git
cd win98maze
open index.html   # macOS
# or
xdg-open index.html  # Linux
```

---

## 📸 Screenshot

> *The classic teal desktop, a draggable window, and a freshly generated maze — just like 1998.*

---

## 🙏 Inspiration

The original **3D Maze screensaver** (`maze.scr`) shipped with Windows 95 and Windows 98. It was powered by OpenGL and became one of the most iconic idle animations of the era. This project is a love letter to that little program — and to everyone who sat watching it instead of doing their homework.

---

<div align="center">

Made with ❤️ and a healthy dose of nostalgia

*© 1998–2026 — Not affiliated with Microsoft Corporation*

</div>
