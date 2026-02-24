import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import { SOUND_EFFECTS } from '../utils/constants';
import LuckyStar3D from './3d/LuckyStar3D';

// 将 2D 交互映射到 3D 场景的组件
const SceneContent = ({ stage, color, isPuffed, onComplete }) => {
  const [scale, setScale] = useState(1.5);
  const [position, setPosition] = useState([0, 0, 0]);
  const [rotation, setRotation] = useState([Math.PI / 2, 0, 0]); // 初始躺平

  useEffect(() => {
    if (stage === 'collecting') {
      // 掉落动画逻辑 (Parabolic Drop + Spin)
      const dropDuration = 800;
      const startTime = Date.now();
      
      const animateDrop = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / dropDuration, 1);
        
        // 抛物线: x 线性移动, y 加速下落
        // y = -5 * t^2 (gravity)
        const gravity = -8; 
        const newY = gravity * progress * progress; 
        
        // Horizontal drift (wind)
        // 使用一个正弦波模拟飘落的摆动
        const drift = Math.sin(progress * Math.PI * 4) * 0.5;
        const newX = (Math.random() - 0.5) * 2 + drift; 
        
        setPosition([newX, newY, 0]);

        // High speed random rotation (Tumbling)
        // 旋转速度随着时间稍微减慢，或者保持高速直到消失
        const spinSpeed = 10;
        setRotation([
            rotation[0] + spinSpeed * 0.05, 
            rotation[1] + spinSpeed * 0.08, 
            rotation[2] + spinSpeed * 0.03
        ]);
        
        setScale(1.5 * (1 - progress * 0.3)); // 稍微变小远去

        if (progress < 1) {
          requestAnimationFrame(animateDrop);
        } else {
            // 动画结束
            onComplete({
                timestamp: Date.now(),
                rotation: Math.random() * 360,
                xPercent: 10 + Math.random() * 80
            });
        }
      };
      animateDrop();
    }
  }, [stage, onComplete]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      <LuckyStar3D 
        color={color.color} 
        isPuffed={isPuffed} 
        position={position}
        rotation={rotation}
        scale={scale}
      />
      <ContactShadows 
        position={[0, -1.5, 0]} 
        opacity={0.6} 
        scale={10} 
        blur={2} 
        far={4} 
      />
    </>
  );
};

const OrigamiArea = ({ message, color, onComplete }) => {
  const [stage, setStage] = useState('knotting'); 
  const [wrapCount, setWrapCount] = useState(0);
  const [isPuffed, setIsPuffed] = useState(false);
  
  // Audio feedback
  const playFeedback = (type) => {
    console.log(`[Feedback] ${type}`);
    if ('vibrate' in navigator) {
      if (type === SOUND_EFFECTS.FOLD) navigator.vibrate(50);
      if (type === SOUND_EFFECTS.WRAP) navigator.vibrate(30);
      if (type === SOUND_EFFECTS.INFLATE) navigator.vibrate([100, 50, 100]);
      if (type === SOUND_EFFECTS.COLLECT) navigator.vibrate(20);
    }
  };

  // Step 1: Upward swipe to knot (Hybrid approach: HTML for knotting, then switch to 3D)
  // 为了简化，我们只在膨胀阶段展示 3D 星星，或者全程使用 3D
  // 考虑到用户要求“极致 3D 折纸质感”，我们尽量在 wrap 阶段就切入 3D，或者整个过程都在 Canvas
  // 但文字输入在纸带上，用 DOM 渲染纸带更方便。
  // 策略：
  // Knotting: HTML DOM (带文字)
  // Wrapping: HTML DOM (五边形)
  // Inflating -> Collecting: 3D Canvas
  
  const handleWrapClick = () => {
    if (stage === 'wrapping' && wrapCount < 3) {
      const nextCount = wrapCount + 1;
      setWrapCount(nextCount);
      playFeedback(SOUND_EFFECTS.WRAP);
      
      if (nextCount === 3) {
        setStage('inflating');
      }
    }
  };

  const handleInflateStart = () => {
    if (stage === 'inflating') {
      setIsPuffed(true);
      playFeedback(SOUND_EFFECTS.INFLATE);
      // 延迟一点进入收集阶段，让用户看到膨胀动画
      setTimeout(() => {
        setStage('collecting');
      }, 1500);
    }
  };

  const handleInflateEnd = () => {
    if (stage === 'inflating' && !isPuffed) {
      // 如果没长按够时间，可能回弹，这里简化逻辑，暂不处理回弹
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Interaction Hints */}
      <div className="absolute top-0 text-center w-full animate-bounce text-gray-400 text-xs tracking-widest pointer-events-none z-10">
        {stage === 'knotting' && '↑ 向上滑动打结'}
        {stage === 'wrapping' && '连续点击缠绕 (3次)'}
        {stage === 'inflating' && '长按让星星变立体'}
      </div>

      {/* HTML Layer for Knotting & Wrapping (Pre-3D) */}
      {(stage === 'knotting' || stage === 'wrapping') && (
        <motion.div
          drag={stage === 'knotting' ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          onPanEnd={(e, info) => {
            if (stage === 'knotting' && info.offset.y < -50) {
              playFeedback(SOUND_EFFECTS.FOLD);
              setStage('wrapping');
            }
          }}
          onClick={handleWrapClick}
          className="relative cursor-pointer flex items-center justify-center shadow-sm"
          style={{
            width: stage === 'knotting' ? 256 : 100,
            height: stage === 'knotting' ? 48 : 100,
            backgroundColor: color.color,
            borderRadius: stage === 'knotting' ? '4px' : '50%',
            clipPath: stage === 'knotting' ? 'none' : 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
          }}
        >
            {/* Wrap layers overlay */}
            {stage === 'wrapping' && (
                <div 
                    className="absolute inset-0 bg-black/10 mix-blend-multiply transition-opacity duration-300"
                    style={{ opacity: wrapCount * 0.2 }}
                />
            )}
            
            {stage === 'knotting' && (
                <span className="text-gray-700 text-sm font-medium px-4 truncate">
                    {message}
                </span>
            )}
        </motion.div>
      )}

      {/* 3D Layer for Inflating & Collecting */}
      {(stage === 'inflating' || stage === 'collecting') && (
        <div 
            className="absolute inset-0 z-0"
            onMouseDown={handleInflateStart}
            onMouseUp={handleInflateEnd}
            onTouchStart={handleInflateStart}
            onTouchEnd={handleInflateEnd}
        >
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
            <SceneContent 
                stage={stage} 
                color={color} 
                isPuffed={isPuffed} 
                onComplete={onComplete}
            />
          </Canvas>
        </div>
      )}
    </div>
  );
};

export default OrigamiArea;
