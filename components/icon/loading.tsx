import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// https://lottiefiles.com/free-animation/loading-animation-j7BG8cPg6H

export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <DotLottieReact src="sue-kang-loading.lottie" loop autoplay />
    </div>
  );
};

export default { LoadingOverlay };
