export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative">
        {/* 外側の円 */}
        <div className="w-16 h-16 border-4 border-white/20 rounded-full animate-[spin_1.5s_linear_infinite]" />

        {/* 内側の円（ローディングインジケーター） */}
        <div className="absolute top-0 left-0 w-16 h-16">
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-[spin_1s_ease-in-out_infinite]" />
        </div>

        {/* パルスエフェクト */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default { LoadingOverlay };
