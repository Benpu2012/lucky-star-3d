import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import StarStrip from './components/StarStrip';
import OrigamiArea from './components/OrigamiArea';
import StarJar from './components/StarJar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STAR_COLORS } from './utils/constants';

const STEPS = {
  WRITE: 'write',
  COLLECT: 'collect',
};

const getBackgroundGradient = () => {
  return 'bg-gradient-to-b from-[#3f7fd8] via-[#050b29] to-[#020108]';
};

const BottomStarField = React.memo(() => {
  const stars = React.useMemo(
    () =>
      Array.from({ length: 80 }).map((_, index) => ({
        id: index,
        left: Math.random() * 100,
        bottom: Math.random() * 100,
        size: 1 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.6,
      })),
    []
  );

  return (
    <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.left}%`,
            bottom: `${star.bottom}%`,
            opacity: star.opacity,
            boxShadow: `0 0 6px rgba(255,255,255,${star.opacity})`,
          }}
        />
      ))}
    </div>
  );
});

const Loading = () => (
  <div className="flex flex-col items-center justify-center w-full h-full text-white/80">
    <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
    <p className="text-sm tracking-widest animate-pulse">正在点亮星空...</p>
  </div>
);

function App() {
  const [step, setStep] = useState(STEPS.WRITE);
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState(STAR_COLORS[0]);
  const [stars, setStars] = useLocalStorage('lucky-stars', []);
  const [bgGradient, setBgGradient] = useState(getBackgroundGradient());
  const [showWishList, setShowWishList] = useState(false);
  const dailyLimit = 8;

  const todayStarCount = stars.filter((star) => {
    const created = new Date(star.timestamp);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }).length;

  // Update background every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBgGradient(getBackgroundGradient());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMessageSubmit = (text, color) => {
    const newStar = {
      id: Date.now(),
      message: text,
      color: color.color,
      timestamp: Date.now(),
      rotation: Math.random() * 60 - 30,
      x: 10 + Math.random() * 80,
      y: 5 + (stars.length / Math.max(stars.length + 1, 10)) * 20, 
    };
    
    setStars(prev => [...prev, newStar]);
    setMessage('');
    // No step change needed as we stay in WRITE mode or similar
  };

  const handleDeleteStar = (id) => {
    setStars(prev => prev.filter(star => star.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有星星吗？此操作不可撤销。')) {
      setStars([]);
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-[2000ms] ${bgGradient}`}>
      {/* Full Screen 3D Background */}
      <div className="absolute inset-0 z-0">
        <BottomStarField />
        <Suspense fallback={<Loading />}>
          <StarJar stars={stars} onDelete={handleDeleteStar} />
        </Suspense>
      </div>

      {/* Foreground UI Layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-4 pointer-events-none">
        {/* Header/Title */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center pointer-events-auto relative w-full"
        >
          <h1
            className="text-2xl font-light tracking-widest text-white"
            style={{
              textShadow:
                '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(173,216,255,0.9)',
            }}
          >
            星语瓶
          </h1>
          <p className="text-xs text-gray-300 mt-1 italic">把愿望折进星星里</p>
          
          {/* Clear All Button */}
          {stars.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="absolute right-4 top-0 text-xs text-white/50 hover:text-white/80 transition-colors border border-white/20 rounded-full px-3 py-1"
            >
              清空
            </button>
          )}
        </motion.header>

        {/* Main Interaction Area */}
        <main className="flex-1 w-full max-w-md flex flex-col items-center justify-start pt-20 relative pointer-events-auto">
          <AnimatePresence mode="wait">
            {step === STEPS.WRITE && (
              <StarStrip 
                key="write"
                onSubmit={handleMessageSubmit} 
                colors={STAR_COLORS}
                onShowWishList={() => setShowWishList(true)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* 折纸愿望清单弹窗 */}
        <AnimatePresence>
          {showWishList && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/30 pointer-events-auto"
              onClick={() => setShowWishList(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 40, opacity: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 shadow-2xl max-w-md w-full border border-[#f4e4c4] bg-[#fbf3e0]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0)), linear-gradient(315deg, rgba(255,255,255,0.5), rgba(255,255,255,0))', mixBlendMode: 'soft-light' }} />
                  <div className="absolute inset-x-6 top-10 h-px bg-white/60 opacity-70" />
                  <div className="absolute inset-y-6 left-10 w-px bg-white/60 opacity-60" />
                </div>

                <button
                  onClick={() => setShowWishList(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
                >
                  <X size={18} className="text-gray-500" />
                </button>

                <div className="mb-4">
                  <p className="text-xs tracking-[0.3em] text-[#b49a6b] uppercase mb-1">
                    折纸 · 愿望清单
                  </p>
                  <h2 className="text-lg font-medium text-[#7a5b33]">
                    这些都是你折进星星里的话
                  </h2>
                </div>

                <div className="mb-3 text-[11px] text-[#7a5b33]">
                  <div>每日最多可以折 8 颗星星</div>
                  <div className="mt-1 text-[#a3733a]">
                    今天已折星星：{todayStarCount}/{dailyLimit}
                  </div>
                  <div className="mt-1 text-[#b49a6b]">
                    至今一共折了 {stars.length} 颗许愿星星
                  </div>
                </div>

                {stars.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#b49a6b]">
                    还没有任何愿望，先写一条试试吧。
                  </div>
                ) : (
                  <div className="mt-2 max-h-80 overflow-y-auto pr-2 space-y-3">
                    {stars
                      .slice()
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((star) => (
                        <div
                          key={star.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 border border-[#f2e3c4] bg-[#fdf4e2]/80 shadow-sm"
                        >
                          <div
                            className="w-5 h-5 flex-shrink-0"
                            style={{
                              backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), ${star.color}, ${star.color})`,
                              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                              boxShadow: '0 0 0 2px rgba(60,60,60,1), 0 2px 3px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.7)',
                              transform: 'translateZ(0)',
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-[10px] text-[#b49a6b] mb-1">
                              {new Date(star.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-[#3b2a18] leading-relaxed">
                              {star.message}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
