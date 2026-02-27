import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { STAR_COLORS, MAX_MESSAGE_LENGTH } from '../utils/constants';
import { Send } from 'lucide-react';

const StarStrip = ({ onSubmit, colors, onShowWishList }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text, selectedColor);
      setText(''); // Reset text after submit
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-8 w-full"
    >
      {/* Paper Strip Area */}
      <div className="flex flex-col gap-2 items-center">
        <motion.div
          layoutId="paper-strip"
          className="relative w-64 h-12 shadow-sm flex items-center justify-center overflow-hidden rounded-sm"
          style={{ backgroundColor: selectedColor.color }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder={t('placeholder')}
            className="w-full h-full bg-transparent border-none outline-none text-center text-white placeholder-white/50 px-4 text-sm font-bold drop-shadow-md tracking-wide"
            autoFocus
          />
          {/* Strip Texture/Shadows */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/5 via-transparent to-black/5"></div>
        </motion.div>
        
        {/* Counter moved below input */}
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          {text.length} / {MAX_MESSAGE_LENGTH}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Color Picker */}
        <div className="flex gap-4">
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedColor(c)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                selectedColor.id === c.id ? 'ring-2 ring-gray-400 ring-offset-2 scale-110' : ''
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-colors ${
              text.trim() 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="text-sm font-medium">{t('submit')}</span>
            <Send size={14} />
          </motion.button>

          <button
            type="button"
            onClick={onShowWishList}
            disabled={!onShowWishList}
            className={`px-4 py-2 rounded-full text-xs border transition-colors ${
              onShowWishList
                ? 'border-white/60 bg-white/20 text-white hover:bg-white/30'
                : 'border-white/30 bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {t('expand')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StarStrip;
