import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ULTIMATE FINAL — full mini game loop with menu, upgrades, boss, particles, save, mobile
export default function UltimateFinalGame() {
  const [screen, setScreen] = useState("menu"); // menu | game | shop | gameover
  const [player, setPlayer] = useState({ x: 180, y: 300, speed: 1 });
  const [enemies, setEnemies] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [boss, setBoss] = useState(null);
  const [particles, setParticles] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [damage, setDamage] = useState(5);
  const [fireRate, setFireRate] = useState(1);

  // Load save
  useEffect(() => {
    const save = JSON.parse(localStorage.getItem("ultimate_save") || "{}");
    if (save.highScore) setHighScore(save.highScore);
    if (save.coins) setCoins(save.coins);
    if (save.damage) setDamage(save.damage);
    if (save.fireRate) setFireRate(save.fireRate);
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(
      "ultimate_save",
      JSON.stringify({ highScore, coins, damage, fireRate })
    );
  }, [highScore, coins, damage, fireRate]);

  // Game loop
  useEffect(() => {
    if (screen !== "game" || paused) return;
    const loop = setInterval(() => {
      setEnemies((prev) => prev.map(e => ({ ...e, y: e.y + e.speed })).filter(e => e.y < 380));
      setBullets((prev) => prev.map(b => ({ ...b, y: b.y - 10 })).filter(b => b.y > 0));
      setParticles((prev) => prev.map(p => ({ ...p, life: p.life - 1 })).filter(p => p.life > 0));
      setScore(s => s + 1);
    }, 30);
    return () => clearInterval(loop);
  }, [screen, paused]);

  // Spawn enemies
  useEffect(() => {
    if (screen !== "game" || paused) return;
    const spawn = setInterval(() => {
      setEnemies(prev => [...prev, { x: Math.random() * 340, y: 0, speed: 2 + Math.random() * level }]);
    }, 500);
    return () => clearInterval(spawn);
  }, [screen, level, paused]);

  // Boss spawn
  useEffect(() => {
    if (screen === "game" && level % 5 === 0 && !boss) {
      setBoss({ x: 150, y: 20, hp: 100 + level * 20 });
    }
  }, [level, screen]);

  // Shooting
  useEffect(() => {
    const shoot = (e) => {
      if (e.code === "Space" && screen === "game") {
        for (let i = 0; i < fireRate; i++) {
          setBullets(prev => [...prev, { x: player.x + i * 4, y: player.y }]);
        }
      }
      if (e.code === "KeyP") setPaused(p => !p);
    };
    window.addEventListener("keydown", shoot);
    return () => window.removeEventListener("keydown", shoot);
  }, [player, screen, fireRate]);

  // Collisions
  useEffect(() => {
    bullets.forEach((b, bi) => {
      enemies.forEach((e, ei) => {
        if (Math.abs(b.x - e.x) < 10 && Math.abs(b.y - e.y) < 10) {
          explode(e.x, e.y);
          setEnemies(prev => prev.filter((_, i) => i !== ei));
          setBullets(prev => prev.filter((_, i) => i !== bi));
          setScore(s => s + 50);
          setCoins(c => c + 1);
        }
      });
      if (boss && Math.abs(b.x - boss.x) < 20 && Math.abs(b.y - boss.y) < 20) {
        explode(boss.x, boss.y);
        setBoss(prev => ({ ...prev, hp: prev.hp - damage }));
        setBullets(prev => prev.filter((_, i) => i !== bi));
      }
    });

    enemies.forEach((e, i) => {
      if (Math.abs(player.x - e.x) < 12 && Math.abs(player.y - e.y) < 12) {
        setEnemies(prev => prev.filter((_, idx) => idx !== i));
        setLives(l => l - 1);
      }
    });
  }, [bullets, enemies, player, boss, damage]);

  // Boss defeat
  useEffect(() => {
    if (boss && boss.hp <= 0) {
      explode(boss.x, boss.y);
      setBoss(null);
      setScore(s => s + 1000);
      setLevel(l => l + 1);
    }
  }, [boss]);

  // Game over
  useEffect(() => {
    if (lives <= 0) {
      if (score > highScore) setHighScore(score);
      setScreen("gameover");
    }
  }, [lives]);

  useEffect(() => {
    setLevel(1 + Math.floor(score / 500));
  }, [score]);

  const explode = (x, y) => {
    const parts = Array.from({ length: 12 }).map(() => ({
      x, y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 20
    }));
    setParticles(prev => [...prev, ...parts]);
  };

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayer({ ...player, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const touch = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = e.touches[0];
    setPlayer({ ...player, x: t.clientX - rect.left, y: t.clientY - rect.top });
  };

  const start = () => {
    setEnemies([]);
    setBullets([]);
    setParticles([]);
    setBoss(null);
    setScore(0);
    setLives(3);
    setLevel(1);
    setScreen("game");
  };

  const upgrade = (type) => {
    if (coins < 10) return;
    setCoins(c => c - 10);
    if (type === "damage") setDamage(d => d + 2);
    if (type === "firerate") setFireRate(f => f + 1);
  };

  // UI screens
  if (screen === "menu") {
    return (
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold">🚀 ULTIMATE FINAL 🚀</h1>
        <button onClick={start} className="px-6 py-2 bg-green-600 text-white rounded">Play</button>
        <button onClick={() => setScreen("shop")} className="px-6 py-2 bg-purple-600 text-white rounded">Upgrades</button>
        <p>High Score: {highScore}</p>
      </div>
    );
  }

  if (screen === "shop") {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl">🛒 Shop</h2>
        <p>Coins: {coins}</p>
        <button onClick={() => upgrade("damage")} className="bg-red-500 px-4 py-2">+Damage</button>
        <button onClick={() => upgrade("firerate")} className="bg-blue-500 px-4 py-2">+Fire Rate</button>
        <button onClick={() => setScreen("menu")} className="px-4 py-2 bg-gray-500">Back</button>
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-3xl">💀 Game Over</h2>
        <p>Score: {score}</p>
        <button onClick={start} className="px-6 py-2 bg-green-600 text-white">Restart</button>
        <button onClick={() => setScreen("menu")} className="px-6 py-2 bg-gray-500 text-white">Menu</button>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3 text-xs">
        <span>Score {score}</span>
        <span>Lvl {level}</span>
        <span>❤️ {lives}</span>
        <span>💰 {coins}</span>
        {paused && <span>⏸️</span>}
      </div>

      <div
        className="relative w-[360px] h-[380px] bg-black border overflow-hidden"
        onMouseMove={move}
        onTouchMove={touch}
      >
        <motion.div className="absolute w-4 h-4 bg-blue-400 rounded-full" animate={{ x: player.x, y: player.y }} />

        {enemies.map((e, i) => (
          <motion.div key={i} className="absolute w-3 h-3 bg-red-500 rounded-full" animate={{ x: e.x, y: e.y }} />
        ))}

        {boss && (
          <motion.div className="absolute w-10 h-10 bg-purple-600" animate={{ x: boss.x, y: boss.y }} />
        )}

        {bullets.map((b, i) => (
          <motion.div key={i} className="absolute w-1 h-3 bg-yellow-300" animate={{ x: b.x, y: b.y }} />
        ))}

        {particles.map((p, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-orange-400" animate={{ x: (p.x += p.dx), y: (p.y += p.dy) }} />
        ))}
      </div>

      <p className="text-xs text-gray-400">Mouse/Touch move • SPACE shoot • P pause • Earn coins → upgrades</p>
    </div>
  );
}
