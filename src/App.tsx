import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Copy, MousePointer, Check, FileText, ChevronUp, Delete, CornerDownLeft, Smile, Moon, Sun, Download, Trash2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Speed = 'Slow' | 'Normal' | 'Fast';

const SPEED_MS = {
  Slow: 200,
  Normal: 100,
  Fast: 50,
};

export default function App() {
  const [text, setText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasMistake, setHasMistake] = useState(false);
  const [speed, setSpeed] = useState<Speed>('Normal');
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [fontFamily, setFontFamily] = useState<'sans' | 'mono' | 'serif'>('mono');
  const [showMenu, setShowMenu] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const notepadRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortTypingRef = useRef(false);


  const handleSelectAll = () => {
    const selection = window.getSelection();
    const range = document.createRange();
    if (notepadRef.current) {
      range.selectNodeContents(notepadRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const calculateReadTime = () => {
    const words = text.trim().split(/\s+/).length;
    const minutes = words / 200; // Average 200 words per minute
    if (minutes < 1) return 'Short read';
    return `${Math.ceil(minutes)} min read`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Clear all text?')) {
      stopTyping();
      setText('');
      setInputText('');
    }
  };

  const stopTyping = () => {
    abortTypingRef.current = true;
    setIsTyping(false);
    setActiveKey(null);
  };

  const handleKeyClick = (key: string) => {
    playClickSound();
    
    if (key === 'Back') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'Enter') {
      setText(prev => prev + '\n');
    } else if (key === 'Space') {
      setText(prev => prev + ' ');
    } else if (!['Shift', '?123', 'Emoji'].includes(key)) {
      setText(prev => prev + key.toLowerCase());
    }
    
    // Visual feedback for manual click
    setActiveKey(key);
    setTimeout(() => {
      if (!isTyping) setActiveKey(null);
    }, 150);
  };

  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  const getRandomMistake = (char: string) => {
    const nearbyKeys: Record<string, string> = {
      'a': 's', 's': 'd', 'd': 'f', 'f': 'g', 'g': 'h',
      'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y',
      'z': 'x', 'x': 'c', 'c': 'v', 'v': 'b', 'b': 'n'
    };
    return nearbyKeys[char.toLowerCase()] || 'x';
  };

  const startTyping = () => {
    setShowMenu(false);
    setText('');
    setIsTyping(true);
    abortTypingRef.current = false;
    
    setTimeout(() => {
      if (abortTypingRef.current) return;
      setShowKeyboard(true);
      let currentIndex = 0;
      const baseDelay = SPEED_MS[speed];

      const typeSequence = async () => {
        if (currentIndex >= inputText.length || abortTypingRef.current) {
          setIsTyping(false);
          setActiveKey(null);
          return;
        }

        const char = inputText[currentIndex];

        // 10% chance of making a mistake
        const shouldMakeMistake = Math.random() < 0.1 && char !== ' ' && char !== '\n';

        if (shouldMakeMistake) {
          const mistakeChar = getRandomMistake(char);
          setHasMistake(true);
          setActiveKey(mistakeChar.toUpperCase());
          playClickSound();
          setText(prev => prev + mistakeChar);
          await new Promise(r => setTimeout(r, baseDelay * (0.8 + Math.random() * 0.4)));
          
          if (abortTypingRef.current) return;
          setActiveKey(null);
          await new Promise(r => setTimeout(r, baseDelay * 2.5));
          
          if (abortTypingRef.current) return;
          setActiveKey('Back');
          playClickSound();
          setText(prev => prev.slice(0, -1));
          await new Promise(r => setTimeout(r, baseDelay * 1.5));
          setHasMistake(false);
          setActiveKey(null);
          await new Promise(r => setTimeout(r, baseDelay));
        }

        if (abortTypingRef.current) return;

        const keyToHighlight = char === ' ' ? 'Space' : 
                             char === '\n' ? 'Enter' : char.toUpperCase();
        
        setActiveKey(keyToHighlight);
        playClickSound();
        setText(prev => prev + char);

        currentIndex++;

        let nextDelay = baseDelay * (0.9 + Math.random() * 0.2);
        if (char === ' ') nextDelay *= 1.3;
        if (char === '.' || char === ',' || char === '!') nextDelay *= 2.5;

        setTimeout(() => {
          if (abortTypingRef.current) return;
          setActiveKey(null);
          setTimeout(typeSequence, nextDelay * 0.2);
        }, nextDelay * 0.8);
      };

      typeSequence();
    }, 1000);
  };

  const rows = [
    { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], padding: 'px-2' },
    { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], padding: 'px-8' },
    { keys: ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Back'], padding: 'px-2' },
    { keys: ['?123', 'Emoji', 'Space', '.', 'Enter'], padding: 'px-2' },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (notepadRef.current) {
      notepadRef.current.scrollTop = notepadRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className={`flex flex-col h-screen font-sans select-none overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header */}
      <header className={`h-[50px] border-b flex items-center px-4 justify-between shrink-0 shadow-sm z-50 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <h1 className="text-lg font-semibold">NoteType Pro</h1>
          </div>
          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600"></div>
          <div className="flex gap-2">
            <button 
              onClick={handleSelectAll}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              <MousePointer size={12} /> <span className="hidden sm:inline">Select All</span>
            </button>
            <button 
              onClick={handleCopy}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              {copySuccess ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} 
              <span className="hidden sm:inline">{copySuccess ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              onClick={handleClear}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
              <Trash2 size={12} /> <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1, 
                    filter: 'blur(0px)',
                    transition: { type: 'spring', damping: 25, stiffness: 400 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: -8, 
                    scale: 0.96, 
                    filter: 'blur(4px)',
                    transition: { duration: 0.15, ease: 'easeIn' }
                  }}
                  className={`absolute top-full right-0 mt-2 w-72 border shadow-2xl rounded-xl p-4 z-[100] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Typography</label>
                      <div className={`flex p-1 rounded-md ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {(['sans', 'mono', 'serif'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFontFamily(f)}
                            className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center transition-all capitalize ${fontFamily === f ? (isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-white shadow-sm text-blue-600') : (isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700')}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Line Spacing</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="2.5" 
                        step="0.25"
                        value={lineSpacing}
                        onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Typing Speed</label>
                      <div className={`flex p-1 rounded-md ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {(['Slow', 'Normal', 'Fast'] as Speed[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`flex-1 py-1 text-[10px] font-bold rounded flex items-center justify-center transition-all ${speed === s ? (isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-white shadow-sm text-blue-600') : (isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-500 hover:text-slate-700')}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={handleDownload}
                        className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                      >
                        <Download size={14} /> Save .txt
                      </button>
                      <button 
                        onClick={handleClear}
                        className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        <Trash2 size={14} /> Clear All
                      </button>
                    </div>

                    <div>
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text to auto-type here..."
                        className={`w-full border rounded p-2 text-xs h-24 outline-none focus:border-blue-500 resize-none transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200'}`}
                      />
                    </div>

                    <button 
                      onClick={startTyping}
                      disabled={isTyping || !inputText.trim()}
                      className={`w-full text-white font-bold py-2 rounded text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isTyping ? 'Typing in progress...' : 'Start Auto-Type'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notepad Area */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col items-center overflow-hidden">
        <div 
          ref={notepadRef}
          className={`w-full max-w-4xl h-[440px] border rounded-[15px] p-6 sm:p-8 shadow-sm overflow-y-auto transition-colors relative ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black'}`}
          style={{ 
            lineHeight: lineSpacing,
            fontFamily: fontFamily === 'sans' ? 'Inter, sans-serif' : fontFamily === 'serif' ? 'serif' : '"JetBrains Mono", monospace'
          }}
        >
          <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
            {text}
            <span className={`inline-block w-2 ml-1 align-middle h-[1.2em] transform translate-y-[2px] transition-colors duration-200 ${hasMistake ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-600'} ${isTyping ? 'animate-cursor-blink' : 'opacity-30'}`} />
          </div>

        </div>

      </main>

      {/* Virtual Keyboard */}
      <AnimatePresence>
        {showKeyboard && (
          <motion.footer 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="h-[25vh] bg-[#D32F2F] p-2 flex flex-col gap-1 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] shrink-0 z-40 touch-none"
          >
            {rows.map((row, i) => (
              <div key={i} className={`flex justify-center gap-[4px] h-full ${row.padding}`}>
                {row.keys.map((key) => {
                  const isSpecial = ['Shift', 'Back', '?123', 'Emoji', '.', 'Enter'].includes(key);
                  const isEnter = key === 'Enter';
                  const isActive = activeKey === key;
                  
                  return (
                    <motion.div 
                      key={key}
                      animate={{
                        scale: isActive ? 0.92 : 1,
                        backgroundColor: isActive
                          ? (isEnter ? '#1d4ed8' : (isSpecial ? '#cbd5e1' : '#f1f5f9'))
                          : (isEnter ? '#3b82f6' : (isSpecial ? '#e2e8f0' : '#ffffff')),
                        y: isActive ? 2 : 0
                      }}
                      whileTap={{ 
                        scale: 0.92,
                        backgroundColor: isEnter ? '#2563eb' : (isSpecial ? '#cbd5e1' : '#f8fafc'),
                        y: 2
                      }}
                      onClick={() => handleKeyClick(key)}
                      className={`
                        flex items-center justify-center font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.2)] rounded-[6px] h-[45px] transition-colors cursor-default select-none
                        ${key === 'Space' ? 'w-[45%] bg-white' : 'flex-1'}
                        ${isSpecial ? 'bg-slate-200 text-slate-700 text-[10px]' : 'bg-white text-slate-800 text-sm'}
                        ${isEnter ? 'bg-blue-500 text-white' : ''}
                      `}
                    >
                      {key === 'Shift' && <ChevronUp size={18} />}
                      {key === 'Back' && <Delete size={18} />}
                      {key === 'Emoji' && <Smile size={18} />}
                      {key === 'Enter' && <CornerDownLeft size={18} />}
                      {key === 'Space' ? '' : (!['Shift', 'Back', 'Emoji', 'Enter'].includes(key) && key)}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

