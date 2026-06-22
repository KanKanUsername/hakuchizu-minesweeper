import { useState } from 'react';
import { PREFECTURES, REGIONS } from '../data/prefList';
import { t, type Language } from '../i18n';

interface RegionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode: (code: string) => void;
  currentCode: string;
  language: Language;
}

export default function RegionSelectModal({ isOpen, onClose, onSelectCode, currentCode, language }: RegionSelectModalProps) {
  const [activeTab, setActiveTab] = useState<'JAPAN' | 'WORLD'>('JAPAN');

  if (!isOpen) return null;

  const handleSelect = (code: string) => {
    if (code !== currentCode) {
      onSelectCode(code);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-paper-deep relative">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center bg-paper sticky top-0 z-20">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <span className="text-base">🗺️</span> {t(language, 'regionSelectTitle')}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-paper-deep text-ink-soft transition-colors border border-line"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-paper-deep bg-paper">
          <button 
            onClick={() => setActiveTab('JAPAN')} 
            className={`flex-1 py-3 font-bold transition-colors ${activeTab === 'JAPAN' ? 'border-b-2 border-amber text-amber' : 'text-ink-soft hover:text-ink hover:bg-surface'}`}
          >
            {t(language, 'japanTab')}
          </button>
          <button 
            onClick={() => setActiveTab('WORLD')} 
            className={`flex-1 py-3 font-bold transition-colors ${activeTab === 'WORLD' ? 'border-b-2 border-amber text-amber' : 'text-ink-soft hover:text-ink hover:bg-surface'}`}
          >
            {t(language, 'worldTab')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-ink">
          
          {activeTab === 'JAPAN' ? (
            <>
              <button
                onClick={() => handleSelect('JAPAN')}
                className={`w-full font-bold py-3 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 border-2 ${currentCode === 'JAPAN' ? 'bg-amber text-surface border-amber cursor-default' : 'bg-surface text-ink hover:bg-amber hover:text-surface border-line hover:border-amber'}`}
              >
                <span className="text-3xl">🇯🇵</span>
                <div className="text-left leading-tight">
                  <div className="text-xs font-normal opacity-90">47都道府県でマインスイーパ！</div>
                  <div className="text-lg">{t(language, 'japanNational')}</div>
                </div>
              </button>

              <div className="bg-surface rounded-xl shadow-sm border border-paper-deep p-4">
                <h2 className="text-base md:text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <span className="text-safe">🔰</span> 初心者おすすめ
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelect('31')}
                    className={`border py-2 px-1 rounded shadow-sm transition-colors text-center font-bold text-xs md:text-sm ${currentCode === '31' ? 'bg-safe text-surface border-safe cursor-default' : 'bg-paper text-ink border-line hover:bg-safe hover:text-surface'}`}
                  >
                    鳥取県 (19マス)
                  </button>
                  <button
                    onClick={() => handleSelect('37')}
                    className={`border py-2 px-1 rounded shadow-sm transition-colors text-center font-bold text-xs md:text-sm ${currentCode === '37' ? 'bg-safe text-surface border-safe cursor-default' : 'bg-paper text-ink border-line hover:bg-safe hover:text-surface'}`}
                  >
                    香川県 (17マス)
                  </button>
                </div>
              </div>

              <div className="bg-surface rounded-xl shadow-sm border border-paper-deep p-4">
                <h2 className="text-base md:text-lg font-bold text-ink mb-1 flex items-center gap-2">{t(language, 'municipalityMode')}</h2>
                <p className="text-xs text-ink-soft mb-3">{t(language, 'municipalityDesc')}</p>
                <div className="space-y-4">
                  {REGIONS.map(region => (
                    <div key={region.code}>
                      <h3 className="text-sm font-bold text-ink-soft mb-2 border-b border-paper-deep pb-1">{language === 'en' ? region.nameEn : region.name}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {region.prefs.map(prefCode => {
                          const pref = PREFECTURES.find(p => p.code === prefCode);
                          if (!pref) return null;
                          return (
                            <button
                              key={pref.code}
                              onClick={() => handleSelect(pref.code)}
                              className={`py-1.5 px-1 rounded text-xs md:text-sm text-center transition-colors border flex flex-col items-center gap-0.5 ${
                                currentCode === pref.code 
                                  ? 'bg-amber text-surface border-amber cursor-default' 
                                  : 'bg-map-unopened text-ink hover:bg-paper-deep border-paper-deep'
                              }`}
                            >
                              <span>{language === 'en' ? pref.nameEn : pref.name}</span>
                              <span className={`text-[10px] ${currentCode === pref.code ? 'opacity-80' : 'text-ink-soft'}`}>({pref.municipalityCount}{t(language, 'cells')})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-xl shadow-sm border border-paper-deep p-4">
                <h2 className="text-base md:text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <span className="text-danger">★</span> {t(language, 'japanRegions')}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {REGIONS.map(region => (
                    <button
                      key={region.code}
                      onClick={() => handleSelect(region.code)}
                      className={`py-2 px-3 rounded shadow-sm transition-colors text-center font-bold text-sm md:text-base border ${currentCode === region.code ? 'bg-amber text-surface border-amber cursor-default' : 'bg-ink text-surface hover:bg-amber border-ink hover:border-amber'}`}
                    >
                      {language === 'en' ? region.nameEn : region.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSelect('WORLD')}
                className={`w-full font-bold py-3 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 border-2 ${currentCode === 'WORLD' ? 'bg-amber text-surface border-amber cursor-default' : 'bg-surface text-ink hover:bg-amber hover:text-surface border-line hover:border-amber'}`}
              >
                <span className="text-3xl">🌍</span>
                <div className="text-left leading-tight">
                  <div className="text-xs font-normal opacity-90">170+ Countries!</div>
                  <div className="text-lg">{t(language, 'worldNational')}</div>
                </div>
              </button>

              <div className="bg-surface rounded-xl shadow-sm border border-paper-deep p-4">
                <h2 className="text-base md:text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <span className="text-danger">★</span> {t(language, 'worldRegions')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelect('USA')}
                    className={`py-3 px-3 rounded shadow-sm transition-colors text-center font-bold text-sm md:text-base border ${currentCode === 'USA' ? 'bg-amber text-surface border-amber cursor-default' : 'bg-ink text-surface hover:bg-amber border-ink hover:border-amber'}`}
                  >
                    🇺🇸 United States (50 States)
                  </button>
                  <button
                    onClick={() => handleSelect('EUROPE')}
                    className={`py-3 px-3 rounded shadow-sm transition-colors text-center font-bold text-sm md:text-base border ${currentCode === 'EUROPE' ? 'bg-amber text-surface border-amber cursor-default' : 'bg-ink text-surface hover:bg-amber border-ink hover:border-amber'}`}
                  >
                    🇪🇺 Europe
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
