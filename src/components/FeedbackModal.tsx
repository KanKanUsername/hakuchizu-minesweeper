interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  if (!isOpen) return null;

  // 💡 ここに作成したGoogleフォームのURL（「送信」➔「リンク」からコピーしたもの）を貼り付けてください！
  const GOOGLE_FORM_URL = "https://forms.gle/eXDSExu3CWi7b8Us5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-paper-deep relative">
        
        {/* ヘッダー（上部のタイトル） */}
        <div className="px-6 py-4 border-b border-paper-deep flex justify-between items-center bg-paper">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            💬 かんたん感想を送る
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-paper-deep text-ink-soft transition-colors border border-line"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ（説明とボタン） */}
        <div className="p-6 space-y-6 text-ink">
          
          <div className="space-y-3 leading-relaxed text-base">
            <p className="font-bold">
              「白地図マインスイーパ」を遊んでいただき、ありがとうございます！
            </p>
            <p className="text-ink-soft text-sm">
              これからのゲーム作りの参考にさせていただきますので、<br/>
              ・遊んでみた感想や応援メッセージ<br/>
              ・「うまく動かないよ」「ボタンが押しにくい」といったご報告<br/>
              など、どんなことでもお気軽に教えてもらえると嬉しいです。
            </p>
          </div>

          {/* フォームを開くボタン */}
          <div className="flex flex-col items-center gap-4 pt-2">
            <a 
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-safe text-surface font-bold text-lg py-4 px-10 rounded-xl shadow-md hover:bg-safe/90 hover:scale-105 transition-all flex items-center gap-2"
            >
              📝 アンケート画面を開く
            </a>
            <p className="text-xs text-ink-soft">※別タブでGoogleフォームが開きます</p>
          </div>

          

        </div>
      </div>
    </div>
  );
}