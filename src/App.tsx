import { useState, useMemo, useEffect } from 'react';
import Confetti from 'react-confetti';
import MapBoard from './components/MapBoard';
import RegionSelectModal from './components/RegionSelectModal';
import HowToPlayModal from './components/HowToPlayModal';
import AboutModal from './components/AboutModal';
import FeedbackModal from './components/FeedbackModal';
import MenuModal from './components/MenuModal';
import { useGame, type Difficulty } from './hooks/useGame';
import { t, type Language } from './i18n';
import { getMapName } from './data/prefList';

export default function App() {
  const [prefCode, setPrefCode] = useState<string>('JAPAN');
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [adjacency, setAdjacency] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'open' | 'flag'>('open');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isLongPressEnabled, setIsLongPressEnabled] = useState(() => {
    return localStorage.getItem('longPress') !== 'false';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ja';
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    return (localStorage.getItem('difficulty') as Difficulty) || 'normal';
  });
  const [showAdjacency, setShowAdjacency] = useState(false);

  useEffect(() => {
    localStorage.setItem('difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('longPress', isLongPressEnabled.toString());
  }, [isLongPressEnabled]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const toggleLongPress = () => setIsLongPressEnabled(prev => !prev);

  useEffect(() => {
    if (!prefCode) return;
    
    setIsLoading(true);

    if (prefCode === 'JAPAN') {
      Promise.all([
        import('./data/japan'),
        import('./data/japanAdjacency')
      ]).then(([geoModule, adjModule]) => {
        const geojson = (geoModule as any).japanGeoJson;
        setGeoJson(geojson);
        setAdjacency(adjModule.JAPAN_ADJACENCY);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load map data:", err);
        setIsLoading(false);
      });
    } else {
      Promise.all([
        import(`./data/prefectures/${prefCode}.json`),
        import(`./data/adjacency/${prefCode}.json`)
      ]).then(([geoModule, adjModule]) => {
        setGeoJson(geoModule.default || geoModule);
        setAdjacency(adjModule.default || adjModule);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load map data:", err);
        setIsLoading(false);
      });
    }
  }, [prefCode]);

  const featureCodes = useMemo(() => {
    if (!geoJson) return [];
    return geoJson.features.map((f: any) => f.properties.code);
  }, [geoJson]);

  const {
    status,
    cells,
    time,
    bestTime,
    isNewRecord,
    highlightedCode,
    setHighlightedCode,
    openCell,
    chordCell,
    toggleFlag,
    resetGame,
    totalMines,
    flaggedCount,
    isGenerating
  } = useGame(featureCodes, adjacency, prefCode || undefined, difficulty);

  // Compute trivia for result screen
  const dailyTrivia = useMemo(() => {
    if ((status !== 'gameover' && status !== 'cleared') || !geoJson) return null;
    const available = geoJson.features.filter((f: any) => cells[f.properties.code]?.isOpen && f.properties.trivia);
    if (available.length === 0) return null;
    return available[time % available.length].properties;
  }, [status, geoJson, cells, time]);

  // Game Screen
  return (
    <>
      {status === 'cleared' && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
        </div>
      )}
      <div className="min-h-screen flex justify-center py-6 px-4 relative">
        <div className="w-full max-w-4xl bg-surface rounded-xl shadow-lg border border-paper-deep flex flex-col overflow-hidden relative z-10">
        
        {/* Game Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-paper border-b border-paper-deep">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRegionSelect(true)}
              className="text-ink-soft hover:text-ink text-sm underline flex items-center gap-1 font-bold"
            >
              <span className="text-base">🗺️</span> {t(language, 'mapChange')}
            </button>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="text-safe">⚑</span> {getMapName(prefCode, geoJson?.pref_name, language)}
            </h1>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => setShowMenu(true)} 
                className="px-3 md:px-4 py-1.5 flex items-center justify-center bg-surface text-ink rounded-lg shadow-sm border border-line hover:bg-paper transition-colors font-bold text-sm"
              >
                <span className="text-lg mr-1 md:mr-2">≡</span> 
                <span className="hidden sm:inline">{t(language, 'menu').replace('≡ ', '')}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-lg text-ink">
            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-soft uppercase tracking-wider">{t(language, 'time')}</span>
              <span className="font-bold">{time}</span>
            </div>
            <div className="w-px h-8 bg-paper-deep"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-soft uppercase tracking-wider">{t(language, 'best')}</span>
              <span className="font-bold text-amber">{bestTime !== null ? bestTime : '--'}</span>
            </div>
            <div className="w-px h-8 bg-paper-deep"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-ink-soft uppercase tracking-wider">{t(language, 'mines')}</span>
              <span className="font-bold text-danger">{totalMines - flaggedCount}</span>
            </div>
          </div>
        </div>

        {/* Tools / Actions */}
        <div className="px-6 py-3 border-b border-paper-deep flex items-center justify-between bg-map-unopened flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-soft hidden sm:inline">操作:</span>
            <div className="flex items-center gap-2 bg-surface rounded-lg p-1 shadow-sm border border-paper-deep">
              <button
                onClick={() => setMode('open')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  mode === 'open' ? 'bg-ink text-surface shadow' : 'text-ink-soft hover:bg-paper'
                }`}
              >
                {t(language, 'open')}
              </button>
              <button
                onClick={() => setMode('flag')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${
                  mode === 'flag' ? 'bg-danger text-surface shadow' : 'text-ink-soft hover:bg-paper'
                }`}
              >
                <span>⚑</span> {t(language, 'flag').replace('⚑ ', '')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Show Adjacency Toggle */}
            <button
              onClick={() => setShowAdjacency(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border flex items-center gap-1.5 ${
                showAdjacency 
                  ? 'bg-amber text-surface border-amber hover:opacity-90' 
                  : 'bg-surface border-line text-ink hover:bg-paper'
              }`}
              title={language === 'ja' ? '隣接する市区町村を強調表示します' : 'Highlight adjacent regions'}
            >
              <span>{showAdjacency ? '🎯' : '⭕'}</span>
              <span>{t(language, 'adjacencyToggle')}</span>
            </button>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1 bg-surface rounded-lg p-1 shadow-sm border border-paper-deep">
              {(['easy', 'normal', 'hard', 'extreme'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    difficulty === d
                      ? d === 'easy'
                        ? 'bg-safe text-surface shadow'
                        : d === 'hard'
                          ? 'bg-danger text-surface shadow'
                          : d === 'extreme'
                            ? 'bg-extreme text-surface shadow'
                            : 'bg-amber text-surface shadow'
                      : 'text-ink-soft hover:bg-paper'
                  }`}
                >
                  {t(language, d)}
                </button>
              ))}
            </div>
          
            <button 
              onClick={resetGame}
              className="px-4 py-2 bg-surface border border-line text-ink hover:bg-paper-deep rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              {t(language, 'retry')}
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-transparent relative overflow-hidden">
          {isLoading || isGenerating ? (
            <div className="w-full h-full min-h-[350px] md:min-h-[560px] flex flex-col items-center justify-center absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm">
              <div className="animate-spin text-4xl mb-4 text-ink-soft inline-block">⚑</div>
              <div className="text-ink-soft font-bold tracking-widest animate-pulse">
                {isLoading ? t(language, 'loading') : t(language, 'generating')}
              </div>
            </div>
          ) : null}
          <MapBoard 
              geoJson={geoJson}
              adjacency={adjacency}
              cells={cells}
              status={status}
              onOpen={openCell}
              onChord={chordCell}
              onToggleFlag={toggleFlag}
              highlightedCode={highlightedCode}
              setHighlightedCode={setHighlightedCode}
              mode={mode}
              isLongPressEnabled={isLongPressEnabled}
              showAdjacency={showAdjacency}
              setShowAdjacency={setShowAdjacency}
            />

          {/* Game Over / Clear Overlay */}
          {(status === 'gameover' || status === 'cleared') && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
              <div className="bg-surface p-8 rounded-2xl shadow-2xl border-4 border-paper flex flex-col items-center animate-slide-up w-[90%] max-w-md text-center relative overflow-hidden">
                <h2 className={`text-4xl font-black mb-4 tracking-widest ${status === 'cleared' ? 'text-safe' : 'text-danger'}`}>
                  {status === 'cleared' ? t(language, 'clear') : t(language, 'gameover')}
                </h2>
                
                {status === 'cleared' && isNewRecord && (
                  <div className="mb-4 bg-amber text-surface px-4 py-1.5 rounded-full text-sm font-bold animate-bounce shadow-md">
                    {t(language, 'newRecord')}
                  </div>
                )}

                <p className="text-xl text-ink-soft mb-6 font-mono">
                  {t(language, 'time')}: <span className={`text-4xl font-bold ${isNewRecord ? 'text-amber' : 'text-ink'}`}>{time}</span>
                </p>

                {dailyTrivia && (
                  <div className="mb-6 w-full text-left bg-paper p-4 rounded-xl border border-paper-deep shadow-sm">
                    <h3 className="font-bold text-sm text-ink mb-1">{t(language, 'dailyTrivia')}</h3>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      <span className="font-bold text-amber">{dailyTrivia.name}</span>: {dailyTrivia.trivia}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 w-full">
                   {status === 'cleared' && (
                     <a 
                       href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(t(language, 'shareText', { map: getMapName(prefCode, geoJson?.pref_name, language), time: time }))}\n\n#白地図マインスイーパ\n${window.location.href}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-3.5 bg-ink text-surface rounded-xl font-bold hover:bg-ink-soft transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                     >
                       <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.964H5.078z"></path></svg>
                       {t(language, 'shareBtn')}
                     </a>
                   )}
                   <button 
                    onClick={resetGame}
                    className="w-full py-3.5 bg-ink text-surface rounded-xl font-bold hover:bg-ink-soft transition-colors shadow-md"
                   >
                    {t(language, 'playAgain')}
                   </button>
                   <button 
                    onClick={() => setShowRegionSelect(true)}
                    className="w-full py-3.5 bg-surface border-2 border-line text-ink hover:bg-paper rounded-xl font-bold transition-colors shadow-sm"
                   >
                    {t(language, 'chooseOtherMap')}
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="px-6 py-3 bg-surface border-t border-paper-deep flex items-center justify-between text-xs text-ink-soft">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-map-unopened border border-ink"></span>{t(language, 'unopened')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-paper border border-ink-soft"></span>{t(language, 'opened')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-danger"></span>{t(language, 'mine')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-map-adjacent border border-amber"></span>{t(language, 'adjacent')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="text-danger font-bold">⚑</span>{t(language, 'flagged')}</span>
          </div>
        </div>
      </div>
      </div>
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <MenuModal 
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isLongPressEnabled={isLongPressEnabled}
        onToggleLongPress={toggleLongPress}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        language={language}
        setLanguage={setLanguage}
      />
      <RegionSelectModal 
        isOpen={showRegionSelect} 
        onClose={() => setShowRegionSelect(false)} 
        onSelectCode={setPrefCode} 
        currentCode={prefCode}
        language={language}
      />
    </>
  );
}
