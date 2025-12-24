import { useState, useEffect, useCallback, useRef } from 'react';
import type { Chengyu, StrictnessLevel, DictionaryMaps } from './types';
import { loadDictionary, findChengyu, getNextChengyus } from './dictionary';
import './App.css';

function App() {
  const [dictionary, setDictionary] = useState<DictionaryMaps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [trail, setTrail] = useState<Chengyu[]>([]);
  const [strictness, setStrictness] = useState<StrictnessLevel>(1);
  const [nextChengyus, setNextChengyus] = useState<Chengyu[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [hoveredStrictness, setHoveredStrictness] = useState<StrictnessLevel | null>(null);
  const hasLoadedFromURL = useRef(false);

  const currentChengyu = trail.length > 0 ? trail[trail.length - 1] : null;

  // Load dictionary on mount and handle URL routing
  useEffect(() => {
    loadDictionary()
      .then((dict) => {
        setDictionary(dict);

        // Function to load chengyu from URL
        const loadFromURL = () => {
          const path = window.location.pathname;
          let urlChengyu = path.substring(1); // Remove leading slash

          // Decode URI component if needed
          if (urlChengyu.includes('%')) {
            try {
              urlChengyu = decodeURIComponent(urlChengyu);
            } catch (e) {
              console.error('Failed to decode URL:', e);
            }
          }

          // Check if we have a valid 4-character chengyu
          if (urlChengyu && urlChengyu.length === 4) {
            const chengyu = findChengyu(dict, urlChengyu);
            if (chengyu) {
              setTrail([chengyu]);
              setLoading(false);
              return true;
            }
          }
          return false;
        };

        // Try to load from URL
        const loaded = loadFromURL();
        hasLoadedFromURL.current = true;

        // Only set loading to false if we didn't load from URL
        // (if we loaded from URL, we already set it to false in loadFromURL)
        if (!loaded) {
          setLoading(false);
        }

        // Handle browser back/forward buttons
        const handlePopState = () => {
          loadFromURL();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Update URL and title when current chengyu changes
  useEffect(() => {
    // Don't update URL until after we've attempted to load from URL on mount
    if (!hasLoadedFromURL.current) {
      return;
    }

    if (currentChengyu) {
      window.history.pushState({}, '', `/${encodeURIComponent(currentChengyu.text)}`);
      document.title = `${currentChengyu.text} - 成语接龙`;
    } else {
      window.history.pushState({}, '', '/');
      document.title = '成语接龙 · Chinese Idiom Chain';
    }
  }, [currentChengyu]);

  // Update next chengyus when trail or strictness changes
  useEffect(() => {
    if (!dictionary || trail.length === 0) {
      setNextChengyus([]);
      return;
    }

    const current = trail[trail.length - 1];
    const next = getNextChengyus(dictionary, current, strictness);

    // Filter out chengyus already in trail
    const filtered = next.filter(chengyu => !trail.some(t => t.text === chengyu.text));
    setNextChengyus(filtered);
  }, [dictionary, trail, strictness]);


  const handleInputSubmit = () => {
    if (!dictionary || !inputText.trim()) {
      setHasAttemptedSubmit(true);
      return;
    }

    const chengyu = findChengyu(dictionary, inputText.trim());
    if (!chengyu) {
      setError(`"${inputText}" not found in dictionary`);
      setHasAttemptedSubmit(true);
      return;
    }

    setError(null);
    setHasAttemptedSubmit(false);
    setTrail([chengyu]); // Start new trail (resets the chain)
    setInputText('');
  };

  const handleReset = () => {
    setTrail([]);
    setInputText('');
    setError(null);
    setHasAttemptedSubmit(false);
  };

  // Auto-submit when 4 characters are entered (but not during IME composition)
  useEffect(() => {
    if (inputText.length === 4 && !currentChengyu && dictionary && !isComposing) {
      const chengyu = findChengyu(dictionary, inputText.trim());
      if (chengyu) {
        setError(null);
        setHasAttemptedSubmit(false);
        setTrail([chengyu]);
        setInputText('');
      } else {
        setError(`"${inputText}" not found in dictionary`);
        setHasAttemptedSubmit(true);
      }
    }
  }, [inputText, currentChengyu, dictionary, isComposing]);

  const handleChengyuClick = useCallback((chengyu: Chengyu) => {
    setTrail(prev => [...prev, chengyu]);
    setError(null);
  }, []);

  const handleTrailClick = useCallback((index: number) => {
    setTrail(prev => prev.slice(0, index + 1));
    setError(null);
  }, []);

  const handleBack = () => {
    if (trail.length > 1) {
      setTrail(prev => prev.slice(0, -1)); // Remove last chengyu
      setError(null);
    }
  };

  const handleStrictnessChange = (level: StrictnessLevel) => {
    setStrictness(level);
  };

  if (loading) {
    return (
      <>
        <div className="ambient-circle ambient-1"></div>
        <div className="ambient-circle ambient-2"></div>
        <div className="ambient-circle ambient-3"></div>
        <div className="relative max-w-7xl mx-auto p-8 min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-3xl p-12 text-center shadow-2xl animate-pulse">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-white text-xl font-medium">加载字典中...</div>
            <div className="text-white/60 text-sm mt-2">Loading dictionary...</div>
          </div>
        </div>
      </>
    );
  }

  if (error && !dictionary) {
    return (
      <>
        <div className="ambient-circle ambient-1"></div>
        <div className="ambient-circle ambient-2"></div>
        <div className="ambient-circle ambient-3"></div>
        <div className="relative max-w-7xl mx-auto p-8 min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-3xl p-12 text-center shadow-2xl border-2 border-red-400">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-white text-xl font-medium mb-2">错误</div>
            <div className="text-white/80 text-sm">{error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Ambient background effects */}
      <div className="ambient-circle ambient-1"></div>
      <div className="ambient-circle ambient-2"></div>
      <div className="ambient-circle ambient-3"></div>

      <div className="relative max-w-7xl mx-auto p-8 h-screen overflow-hidden z-10">
        <header className="text-center text-white mb-8 floating">
          <h1 className="text-6xl font-bold mb-2 drop-shadow-2xl tracking-wide" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            成语接龙
          </h1>
          <p className="text-white/80 text-sm mt-2 font-light tracking-widest">CHINESE IDIOM CHAIN</p>
        </header>

        {/* Strictness radio in top left */}
        <div className="absolute top-8 left-8 z-20">
          <div className="flex gap-3">
            <label
              className="cursor-pointer"
              onMouseEnter={() => setHoveredStrictness(1)}
              onMouseLeave={() => setHoveredStrictness(null)}
            >
              <input
                type="radio"
                name="strictness"
                value="1"
                checked={strictness === 1}
                onChange={() => handleStrictnessChange(1)}
                className="hidden"
              />
              <span className={`glass-button flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-base shadow-lg ${
                strictness === 1 ? 'active' : 'text-white'
              }`}>
                zi
              </span>
            </label>
            <label
              className="cursor-pointer"
              onMouseEnter={() => setHoveredStrictness(2)}
              onMouseLeave={() => setHoveredStrictness(null)}
            >
              <input
                type="radio"
                name="strictness"
                value="2"
                checked={strictness === 2}
                onChange={() => handleStrictnessChange(2)}
                className="hidden"
              />
              <span className={`glass-button flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-base shadow-lg ${
                strictness === 2 ? 'active' : 'text-white'
              }`}>
                zì
              </span>
            </label>
            <label
              className="cursor-pointer"
              onMouseEnter={() => setHoveredStrictness(3)}
              onMouseLeave={() => setHoveredStrictness(null)}
            >
              <input
                type="radio"
                name="strictness"
                value="3"
                checked={strictness === 3}
                onChange={() => handleStrictnessChange(3)}
                className="hidden"
              />
              <span className={`glass-button flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-base shadow-lg ${
                strictness === 3 ? 'active' : 'text-white'
              }`} style={{ fontFamily: "'Noto Serif SC', serif" }}>
                字
              </span>
            </label>
          </div>

          {/* Custom tooltip */}
          {hoveredStrictness && (
            <div className="glass-card mt-3 p-4 rounded-xl shadow-2xl max-w-xs animate-fade-in">
              <div className="text-white text-sm leading-relaxed">
                {hoveredStrictness === 1 && (
                  <>
                    <div className="font-semibold mb-1">Toneless Pinyin Match</div>
                    <div className="text-white/80">Matches without tones (e.g., 'tu' matches 'tu')</div>
                    <div className="text-white/60 text-xs mt-2">Most flexible • Most options</div>
                  </>
                )}
                {hoveredStrictness === 2 && (
                  <>
                    <div className="font-semibold mb-1">Pinyin with Tone Match</div>
                    <div className="text-white/80">Matches with exact tones (e.g., 'tú' matches 'tú')</div>
                    <div className="text-white/60 text-xs mt-2">Medium difficulty • Moderate options</div>
                  </>
                )}
                {hoveredStrictness === 3 && (
                  <>
                    <div className="font-semibold mb-1">Same Character Match</div>
                    <div className="text-white/80">Exact character match (e.g., '图' matches '图')</div>
                    <div className="text-white/60 text-xs mt-2">Most strict • Fewest options</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {error && !currentChengyu && (
          <div className="glass-card p-4 rounded-2xl mb-4 max-w-2xl mx-auto text-center text-lg font-medium text-white animate-pulse">
            ⚠️ 成语不存在
          </div>
        )}


        {/* Main content */}
        {currentChengyu ? (
          <div className="relative w-full mt-4">
            {/* Trail breadcrumbs */}
            {trail.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                {trail.slice(0, -1).map((chengyu, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrailClick(index)}
                      className="glass-card px-4 py-2 rounded-xl text-white font-bold hover:bg-white/30 transition-all shadow-lg"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {chengyu.text}
                    </button>
                    {index < trail.length - 2 && <span className="text-white/60 text-xl">→</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Current chengyu (center) */}
            <div className="flex items-center justify-center mb-12">
              <div className="glass-card px-16 py-10 rounded-3xl shadow-2xl border-2 border-white/40 relative">
                <button
                  onClick={handleReset}
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-gray-700 hover:text-gray-900 hover:scale-110"
                  title="Reset"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
                <div
                  className="text-8xl font-bold text-center bg-gradient-to-br from-white via-white to-white/90 text-transparent bg-clip-text drop-shadow-lg"
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    WebkitTextStroke: '2px transparent',
                    paintOrder: 'stroke fill'
                  }}
                >
                  {currentChengyu.text}
                </div>
              </div>
            </div>

            {/* Options count */}
            <div className="glass-card inline-block px-6 py-3 rounded-full mx-auto mb-6 text-white text-sm font-medium shadow-lg" style={{ marginLeft: '50%', transform: 'translateX(-50%)' }}>
              <span className="opacity-80">接龙选项</span>
              <span className="mx-2">•</span>
              <span className="font-bold text-lg">{nextChengyus.length}</span>
            </div>

            {/* Next chengyus grid */}
            <div className="max-w-7xl mx-auto px-4 mt-12">
              {nextChengyus.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[45vh] overflow-y-auto scrollbar-hide">
                  {nextChengyus.map((chengyu) => (
                    <button
                      key={chengyu.text}
                      onClick={() => handleChengyuClick(chengyu)}
                      className="glass-card px-4 py-2 rounded-xl text-white font-bold hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl group relative hover:z-50 hover:-translate-y-0.5"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      <div className="whitespace-nowrap">
                        {chengyu.text}
                      </div>

                      {/* Hover tooltip - positioned below instead of above */}
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {chengyu.pinyin.join(' ')}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/95 rotate-45"></div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-10 rounded-3xl text-center text-white shadow-2xl">
                  <div className="text-5xl mb-3">🎉</div>
                  <div className="text-2xl font-bold mb-1">没有更多成语了</div>
                  <div className="text-sm opacity-80 mt-2">No more chengyus available</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="glass-card input-card rounded-3xl p-12 shadow-2xl">
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm">Enter a 4-character idiom to begin</p>
              </div>

              <div className="flex gap-3 mb-6">
                {[0, 1, 2, 3].map((index) => {
                  const hasChar = inputText[index];
                  const shouldShowRed = !hasChar && hasAttemptedSubmit;

                  return (
                    <div
                      key={index}
                      className={`w-20 h-24 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                        shouldShowRed ? 'bg-red-100 border-2 border-red-400' : 'bg-white border-2 border-white/40'
                      }`}
                    >
                      <span
                        className="text-5xl font-bold text-gray-700"
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {hasChar || ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (!isComposing && newValue.length > 4) {
                    return;
                  }
                  setInputText(newValue);
                  setError(null);
                  setHasAttemptedSubmit(false);
                }}
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(e) => {
                  setIsComposing(false);
                  const value = (e.target as HTMLInputElement).value;
                  if (value.length > 4) {
                    setInputText(value.slice(0, 4));
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    handleInputSubmit();
                  }
                }}
                placeholder="输入成语..."
                className="chengyu-input w-full px-6 py-4 text-xl text-center border-2 border-white/40 rounded-2xl focus:outline-none focus:border-white/80 focus:ring-2 focus:ring-white/30 bg-white/90 text-gray-700 font-medium shadow-lg"
                style={{ fontFamily: "'Noto Serif SC'" }}
                maxLength={4}
                autoFocus
              />

              {error && (
                <div className="mt-4 text-red-300 text-center text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default App;
