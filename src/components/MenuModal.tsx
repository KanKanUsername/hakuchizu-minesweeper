import { t, type Language } from '../i18n';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isLongPressEnabled: boolean;
  onToggleLongPress: () => void;
  onOpenHowToPlay: () => void;
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function MenuModal({
  isOpen, onClose, isDarkMode, onToggleTheme, isLongPressEnabled, onToggleLongPress,
  onOpenHowToPlay, onOpenAbout, onOpenFeedback, language, setLanguage
}: MenuModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-paper-deep" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-deep flex justify-between items-center bg-paper">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            {t(language, 'menu')}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink w-8 h-8 rounded-full hover:bg-paper-deep transition-colors flex items-center justify-center border border-line">✕</button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Settings Section */}
          <section>
            <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 px-2">{t(language, 'settings')}</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-paper cursor-pointer transition-colors border border-transparent hover:border-line">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌐</span>
                  <span className="font-bold text-ink">{t(language, 'language')}</span>
                </div>
                <div className="flex bg-paper-deep rounded-lg p-1">
                  <button 
                    onClick={() => setLanguage('ja')} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'ja' ? 'bg-ink text-surface' : 'text-ink-soft hover:text-ink'}`}
                  >
                    日本語
                  </button>
                  <button 
                    onClick={() => setLanguage('en')} 
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'en' ? 'bg-ink text-surface' : 'text-ink-soft hover:text-ink'}`}
                  >
                    EN
                  </button>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-paper cursor-pointer transition-colors border border-transparent hover:border-line">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌙</span>
                  <span className="font-bold text-ink">{t(language, 'darkMode')}</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative shadow-inner border border-line ${isDarkMode ? 'bg-amber' : 'bg-paper-deep'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} style={{ width: '1.125rem', height: '1.125rem' }}></div>
                </div>
                <input type="checkbox" className="hidden" checked={isDarkMode} onChange={onToggleTheme} />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-paper cursor-pointer transition-colors border border-transparent hover:border-line">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👆</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{t(language, 'longPressFlag')}</span>
                    <span className="text-[10px] text-ink-soft">{t(language, 'longPressDesc')}</span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative shadow-inner border border-line ${isLongPressEnabled ? 'bg-amber' : 'bg-paper-deep'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${isLongPressEnabled ? 'translate-x-6' : 'translate-x-0'}`} style={{ width: '1.125rem', height: '1.125rem' }}></div>
                </div>
                <input type="checkbox" className="hidden" checked={isLongPressEnabled} onChange={onToggleLongPress} />
              </label>
            </div>
          </section>

          {/* Links Section */}
          <section>
            <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 px-2">{t(language, 'links')}</h3>
            <div className="space-y-2">
              <button onClick={() => { onOpenHowToPlay(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-paper transition-colors text-left border border-transparent hover:border-line text-ink">
                <span className="text-xl">📖</span>
                <span className="font-bold text-ink">{t(language, 'howToPlay')}</span>
              </button>
              <button onClick={() => { onOpenAbout(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-paper transition-colors text-left border border-transparent hover:border-line text-ink">
                <span className="text-xl">ℹ️</span>
                <span className="font-bold text-ink">{t(language, 'about')}</span>
              </button>
              <button onClick={() => { onOpenFeedback(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-paper transition-colors text-left border border-transparent hover:border-line text-ink">
                <span className="text-xl">💬</span>
                <span className="font-bold text-ink">{t(language, 'feedback')}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
