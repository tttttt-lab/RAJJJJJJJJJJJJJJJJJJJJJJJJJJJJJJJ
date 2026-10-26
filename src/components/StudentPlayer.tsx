import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  VolumeX,
  PictureInPicture2,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  src: string;
  title?: string;
  poster?: string;
}

export function StudentPlayer({ src, title = "Live Class", poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isHls, setIsHls] = useState(false);

  // Check if link is a direct m3u8 / mp4 stream or an embedded page
  const isDirectVideo = src.includes(".m3u8") || src.includes(".mp4") || src.includes(".webm");

  useEffect(() => {
    if (!isDirectVideo || !videoRef.current) return;
    const video = videoRef.current;

    if (src.includes(".m3u8")) {
      setIsHls(true);
      // Native HLS for Safari/iOS
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        // Load lightweight HLS.js for Android/Chrome from CDN
        const scriptId = "hls-player-script";
        const initHls = () => {
          // @ts-expect-error Hls on window
          if (window.Hls && window.Hls.isSupported()) {
            // @ts-expect-error Hls instance
            const hls = new window.Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
          }
        };

        if (!(window as unknown as { Hls?: unknown }).Hls) {
          const s = document.createElement("script");
          s.id = scriptId;
          s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
          s.onload = initHls;
          document.head.appendChild(s);
        } else {
          initHls();
        }
      }
    } else {
      video.src = src;
    }
  }, [src, isDirectVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const skip = (sec: number) => {
    if (videoRef.current) videoRef.current.currentTime += sec;
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length] || 1;
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const seek = (value: number) => {
    if (!videoRef.current || !duration) return;
    videoRef.current.currentTime = value * duration;
    setProgress(value);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "00:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const [cssFullscreen, setCssFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setCssFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      setCssFullscreen(false);
      return;
    }
    if (containerRef.current?.requestFullscreen) {
      containerRef.current
        .requestFullscreen()
        .then(() => setCssFullscreen(false))
        .catch(() => {
          setCssFullscreen((prev) => !prev);
        });
    } else {
      setCssFullscreen((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex select-none flex-col overflow-hidden bg-black transition-all ${
        cssFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full w-full"
      }`}
    >
      {/* Student Study Live Watermark */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded bg-black/70 px-2.5 py-1 font-mono text-xs font-bold text-primary backdrop-blur border border-primary/30">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        STUDENT STUDY
      </div>

      {isDirectVideo ? (
        <>
          <video
            ref={videoRef}
            poster={poster}
            onClick={togglePlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => {
              const nextDuration = event.currentTarget.duration;
              setDuration(nextDuration);
              setProgress(nextDuration ? event.currentTarget.currentTime / nextDuration : 0);
            }}
            onEnded={() => setPlaying(false)}
            muted={muted}
            className="h-full w-full cursor-pointer object-contain"
            playsInline
          />

          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-12 sm:px-5">
            <input
              aria-label="Video progress"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
              className="mb-2 h-1.5 w-full cursor-pointer accent-primary"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary"
                  onClick={togglePlay}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-primary" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={() => skip(-10)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={() => skip(10)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setVolume(next);
                    setMuted(next === 0);
                    if (videoRef.current) videoRef.current.volume = next;
                  }}
                  className="hidden w-16 accent-primary sm:block"
                />
                <span className="hidden max-w-[300px] truncate font-mono text-xs text-muted-foreground sm:block">
                  {title}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatTime(progress * duration)} / {formatTime(duration)}
                </span>
              </div>

              <div className="relative flex items-center gap-1 sm:gap-2">
                {showSettings && (
                  <div className="absolute bottom-10 right-0 rounded-lg border border-primary/30 bg-zinc-950/95 p-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={cycleSpeed}
                      className="whitespace-nowrap px-3 py-1 font-mono text-xs text-white hover:text-primary"
                    >
                      Playback speed: {speed}x
                    </button>
                  </div>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={() => setShowSettings((value) => !value)}
                  aria-label="Player settings"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hidden h-8 w-8 text-muted-foreground hover:text-white sm:inline-flex"
                  onClick={() => void togglePictureInPicture()}
                  aria-label="Picture in picture"
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary"
                  onClick={toggleFullscreen}
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* External classroom pages stay inside a full-size study frame. */}
          <iframe
            src={src}
            title={title}
            className="h-full w-full border-0 bg-background"
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture; screen-wake-lock; orientation; clipboard-write; storage-access-by-user-activation"
            allowFullScreen
          />
        </>
      )}
    </div>
  );
}
