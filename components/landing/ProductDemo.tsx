"use client";

import { useRef } from "react";
import { Play, X } from "lucide-react";
import styles from "./ProductDemo.module.css";

const videoSource = "/demo/aiassist-walkthrough.mp4";

export default function ProductDemo() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function openDemo() {
    dialogRef.current?.showModal();
    // If playback is blocked, the player still offers a Play control.
    void videoRef.current?.play().catch(() => {});
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary text-base py-3.5 px-8"
        aria-haspopup="dialog"
        onClick={openDemo}
      >
        <Play className="w-4 h-4" aria-hidden="true" />
        Watch Demo
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="product-demo-title"
        onClose={() => videoRef.current?.pause()}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)] overflow-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-0 text-left text-[var(--text-primary)] shadow-2xl backdrop:bg-black/80"
      >
        <div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <h2 id="product-demo-title" className="text-sm font-semibold sm:text-base">
              AIAssist product walkthrough
            </h2>
            <button
              type="button"
              aria-label="Close demo"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] focus-visible:outline-2 focus-visible:outline-[var(--brand-purple)]"
              onClick={() => dialogRef.current?.close()}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <video
            ref={videoRef}
            aria-label="AIAssist product walkthrough"
            controls
            playsInline
            preload="none"
            poster="/demo/aiassist-walkthrough.webp"
            className={`block aspect-video w-full bg-black ${styles.video}`}
          >
            <source src={videoSource} type="video/mp4" />
            <track
              kind="captions"
              src="/demo/aiassist-walkthrough.en.vtt"
              srcLang="en"
              label="English"
              default
            />
            <a href={videoSource}>Download the AIAssist walkthrough</a>
          </video>
        </div>
      </dialog>
    </>
  );
}
