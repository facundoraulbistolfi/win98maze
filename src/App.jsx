import { Suspense, lazy, useState } from "react";

const LazyMazeGame = lazy(() => import("./game/MazeGame"));

function BootSplash() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(18,44,102,0.65), rgba(0,0,0,0.96) 55%), #000",
        color: "#fff",
        fontFamily: "MS Sans Serif, Arial",
      }}
    >
      <div
        style={{
          width: 360,
          border: "3px outset #ffffff",
          boxShadow: "0 10px 32px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            background: "#000080",
            color: "#fff",
            padding: "4px 8px",
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          Win98 Maze
        </div>
        <div style={{ background: "#d4d0c8", color: "#111", padding: 16 }}>
          <div style={{ fontSize: 20, marginBottom: 8, letterSpacing: 0.3 }}>
            Inicializando sistema
          </div>
          <div
            style={{
              border: "2px inset #ffffff",
              background: "#c8c4bc",
              padding: 10,
              marginBottom: 10,
              lineHeight: 1.5,
              fontSize: 11,
            }}
          >
            Preparando runtime 3D, texturas y biomes cercanos.
          </div>
          <div
            style={{
              height: 18,
              border: "2px inset #ffffff",
              background:
                "linear-gradient(90deg, #000080 0%, #000080 28%, #3f8efc 28%, #3f8efc 52%, #7bb2ff 52%, #7bb2ff 72%, #c8c4bc 72%)",
              marginBottom: 10,
            }}
          />
          <div style={{ fontSize: 10, color: "#444", lineHeight: 1.5 }}>
            Cargando el chunk inicial sin pop-in y restaurando la memoria del minimapa.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Maze98App() {
  const [gameReady, setGameReady] = useState(false);

  return (
    <>
      <Suspense fallback={null}>
        <LazyMazeGame onReady={() => setGameReady(true)} />
      </Suspense>
      {!gameReady && <BootSplash />}
    </>
  );
}
