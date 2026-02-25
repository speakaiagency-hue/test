import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showControls, setShowControls] = useState(false); // novo estado

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [isOpen]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 0;
    setProgress(total ? (current / total) * 100 : 0);
    setCurrentTime(formatTime(current));
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const total = videoRef.current.duration || 0;
    setDuration(formatTime(total));
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
    );
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.1)] border border-white/5 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white/90 font-bold text-lg tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto max-h-[70vh] object-contain video-orientation"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onClick={() => setShowControls((prev) => !prev)} // alterna controles
            playsInline
          />
        </div>

        {/* Controls só aparecem se showControls for true */}
        {showControls && (
          <div className="w-full p-4 flex flex-col gap-4 z-50 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
            {/* Progress */}
            <div
              className="w-full h-1 bg-white/10 rounded-full cursor-pointer relative group flex items-center"
              onClick={handleProgressClick}
            >
              <div
                className="absolute h-full bg-[#FF0000] rounded-full z-10"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute w-3.5 h-3.5 bg-[#FF0000] rounded-full z-20 shadow-lg border-2 border-white/10 transform -translate-x-1/2"
                style={{ left: `${progress}%` }}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 text-white px-2">
              <button onClick={togglePlay} className="hover:text-[#FF0000] transition-colors p-1">
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </button>

              <button onClick={() => skip(-10)} className="hover:text-[#FF0000] transition-colors p-1">
                <SkipBack className="w-7 h-7" />
              </button>

              <button onClick={() => skip(10)} className="hover:text-[#FF0000] transition-colors p-1">
                <SkipForward className="w-7 h-7" />
              </button>

              {/* Volume */}
              <div
                className="flex items-center gap-2 group/volume relative ml-2"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className={`transition-colors p-1 ${isMuted ? "text-white/40" : "hover:text-[#FF0000]"}`}
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                <div
                  className={`transition-all duration-300 origin-left flex items-center ${
                    showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF0000] hover:accent-[#FF3333]"
                  />
                </div>
              </div>

              <span className="text-sm font-medium tracking-tight text-white/90 ml-auto select-none">
                {currentTime} / {duration}
              </span>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/10 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Play className="w-10 h-10 text-white opacity-80" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
