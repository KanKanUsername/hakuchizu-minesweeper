import { useEffect } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-surface text-ink max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>📖</span> 遊び方
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-paper hover:bg-paper-deep text-ink transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 border-b border-paper-deep pb-2">
              <span className="text-safe">🔰</span> 基本ルール
            </h3>
            <p className="leading-relaxed">
              「白地図マインスイーパ」は、日本地図を舞台にしたマインスイーパーです。<br/>
              盤面に隠された<strong className="text-danger">「地雷（爆弾）」を避けながら</strong>、すべての安全なマス（市区町村または都道府県）を開くとゲームクリアです。<br/>
              もし地雷のあるマスを開けてしまうと即ゲームオーバーになります。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 border-b border-paper-deep pb-2">
              <span className="text-[var(--theme-num-1)]">🔢</span> 数字のヒント
            </h3>
            <p className="leading-relaxed">
              マスを開くと、数字が表示されることがあります。<br/>
              この数字は、<strong>「そのマスに隣接しているマスに、合計いくつ地雷が隠されているか」</strong>を示しています。<br/>
              表示された数字をヒントに、「ここは地雷だ」「ここは安全だ」と論理的に推理して進めましょう。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 border-b border-paper-deep pb-2">
              <span className="text-amber">🎮</span> 基本操作
            </h3>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li>
                <strong>マスを開く:</strong> 左クリック または タップ
              </li>
              <li>
                <strong>旗（フラグ）を立てる:</strong> 地雷がある！と確信したマスには、<strong>右クリック または 長押し</strong>で旗（🚩）を立てて目印をつけることができます。<br/>
                <span className="text-sm text-ink-soft">※スマホの場合は、画面下の「🚩 フラグモード」に切り替えてからタップすることでも旗を立てられます。</span><br/>
                <span className="text-sm text-ink-soft">※キーボードの「Shift」キーを押しながらクリックでも旗を立てられます。</span>
              </li>
              <li>
                <strong>ズームと移動:</strong> スマホならピンチアウト（2本指で広げる）でズーム、スワイプで移動。PCならマウスホイールでズーム、ドラッグで移動ができます。
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 border-b border-paper-deep pb-2">
              <span className="text-safe">💡</span> お助け機能
            </h3>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li>
                <strong>隣接ハイライト:</strong> 画面下の「🎯 隣接ハイライト」ボタンをONにするか、キーボードの『H』キーを押すと、マウスカーソルを合わせたマスの<strong>「隣接しているマス」</strong>が赤色でハイライトされます。<br/>
                複雑な地形や、海を隔てた隣接ルート（本州と北海道・四国など）を確認するのに非常に便利です。
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={onClose}
            className="bg-safe hover:bg-opacity-90 text-surface font-bold py-3 px-8 rounded-xl shadow-md transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
