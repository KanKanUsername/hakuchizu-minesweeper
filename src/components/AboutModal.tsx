import { useEffect } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative z-10 border border-paper-deep overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-deep flex justify-between items-center bg-paper sticky top-0 z-20">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            制作の裏話と安全性について
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-paper-deep text-ink-soft transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-ink">
          
          {/* Intro */}
          <section>
            <p className="leading-relaxed text-sm">
              このゲームを開発するにあたっての裏話や、ちょっとしたこだわりについてのメモです。<br/>
              ブラウザ上で重い地図データをスムーズに動かすための工夫や、マインスイーパー特有の「最後は運任せになる問題」をプログラムでどう解決したかなどをまとめています。
            </p>
          </section>

          {/* Tech Stack & Implementation */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-paper-deep pb-2">
              使用技術と動きをなめらかにする工夫
            </h3>
            <p className="text-sm leading-relaxed mb-2">
              本ゲームは <code>React</code> や <code>Vite</code> といった最新のWeb技術を使って作られており、地図の描画には <code>D3.js</code> というツールを活用しています。
            </p>
            
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
              <li>
                <strong>地図データの極限軽量化：</strong><br/>
                日本の全市区町村の形をそのまま読み込むと、データが大きすぎてスマートフォンなどがフリーズしてしまいます。そこで、形を崩さない範囲で頂点を間引き、データを極限まで軽くする処理を行いました。これにより、全国マップでも一瞬で読み込みが完了し、サクサク動くようになっています。
              </li>
              <li>
                <strong>見えない「つながり」の判定：</strong><br/>
                地雷の数を計算する際、「橋で繋がっている島」や「海を挟んで近い地域」は、単なる図形の接触判定だけでは見落とされてしまいます。そのため、実際の地理的な繋がりを網羅したデータを事前につくりあげ、ゲームに組み込んでいます。
              </li>
              <li>
                <strong>スマートフォンへの対応：</strong><br/>
                スマートフォンでも快適に遊べるよう、地図の拡大・縮小（ピンチイン・ピンチアウト）にしっかり対応しています。また、画面の上部に「開く・フラグ」の切り替えボタンを固定し、片手でもスムーズに操作できるように工夫しました。
              </li>
            </ul>
          </section>

          {/* AI and No-Guess */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-paper-deep pb-2">
              「運ゲー」をなくすための自動計算プログラム
            </h3>
            <p className="text-sm leading-relaxed mb-2">
              マインスイーパー最大の欠点である「最後の2択で勘が外れてゲームオーバー」を防ぐため、内部に専用の解析プログラムを組み込んでいます。
            </p>
            
            <div className="bg-paper p-4 rounded-lg space-y-3 text-sm">
              <h4 className="font-bold">バックグラウンドでの全自動テストプレイ</h4>
              <p className="leading-relaxed">
                プレイヤーが最初のマスを開けた瞬間、裏側では以下の処理が走ります。
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>ランダムに地雷を配置する（最初のタップは安全が保証されています）</li>
                <li>内部のプログラムが「ヒントの数字だけで、運に頼らず最後までクリアできるか」をシミュレーションする</li>
                <li>もし「運任せ」になる要素が見つかった場合、その盤面は破棄し、地雷を並べ直して再テストする</li>
              </ol>
              <p className="leading-relaxed font-bold text-safe mt-2">
                この厳しいテストを通過した「100%理詰めで解ける盤面」だけが、皆さんに提供されます。
              </p>
            </div>

            <div className="bg-paper p-4 rounded-lg space-y-2 text-sm">
              <h4 className="font-bold">孤島の地雷配置ルール</h4>
              <p className="leading-relaxed">
                隣の市区町村が1つもない「完全な孤島」に地雷が置かれると、周りの数字から推測することができず、どうしても運任せになってしまいます。これを防ぐため、「隣り合うマスが1つもない場所には、絶対に地雷を置かない」というルールを設けています。
              </p>
            </div>
          </section>

          {/* Security & Copyright */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-paper-deep pb-2">
              プライバシーと利用データについて
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
              <li><strong>ローカル保存のみ：</strong>クリアタイムや設定は、すべて今お使いのブラウザの中に保存されます。サーバーへスコア等を送信するような仕組みはありません。</li>
              <li><strong>個人情報は不要：</strong>アカウント登録やログインの必要はなく、個人情報は一切収集していません。</li>
              <li><strong>オープンデータの利用：</strong>白地図は、国土交通省が公開している「国土数値情報」などをベースに、規約に従って加工・利用させていただいています。</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-paper-deep text-center text-sm text-ink-soft">
            <p>100%論理で解けるように調整していますので、じっくり考えながらお楽しみください！</p>
          </div>

        </div>
      </div>
    </div>
  );
}
