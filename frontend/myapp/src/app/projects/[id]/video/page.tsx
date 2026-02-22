"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Hardcoded demo video (replace with your actual video URL) ───────────────
const DEMO_VIDEO_URL = "/video.mp4";
const DEMO_VIDEO_POSTER = ""; // optional thumbnail URL

// ─── Loading animation frames ────────────────────────────────────────────────
const LOADING_STEPS = [
    { icon: "📖", label: "Reading your story...", detail: "Parsing narrative structure" },
    { icon: "🎭", label: "Identifying scenes...", detail: "Extracting key story moments" },
    { icon: "🎨", label: "Generating visuals...", detail: "Creating cinematic frames" },
    { icon: "🎵", label: "Composing soundtrack...", detail: "Matching tone to narrative" },
    { icon: "🎬", label: "Rendering final video...", detail: "Stitching everything together" },
];

export default function VideoGeneratorPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const playerRef = useRef<HTMLDivElement>(null);

    // ─── Generate Video ──────────────────────────────────────────────────────────
    const handleGenerate = () => {
        setPhase("loading");
        setStepIndex(0);
        setProgress(0);

        const totalDuration = 5000;
        const stepDuration = totalDuration / LOADING_STEPS.length;

        // Step through loading states
        LOADING_STEPS.forEach((_, i) => {
            setTimeout(() => setStepIndex(i), i * stepDuration);
        });

        // Smooth progress bar
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, (elapsed / totalDuration) * 100);
            setProgress(pct);
            if (pct >= 100) clearInterval(progressInterval);
        }, 30);

        // Done
        setTimeout(() => {
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setPhase("done"), 300);
        }, totalDuration);
    };

    // ─── Video Controls ──────────────────────────────────────────────────────────
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = parseFloat(e.target.value);
        if (videoRef.current) videoRef.current.currentTime = t;
        setCurrentTime(t);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (videoRef.current) videoRef.current.volume = v;
        setMuted(v === 0);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        const next = !muted;
        setMuted(next);
        videoRef.current.muted = next;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimerRef.current);
        if (isPlaying) {
            controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
        }
    };

    const toggleFullscreen = () => {
        if (!playerRef.current) return;
        if (!document.fullscreenElement) {
            playerRef.current.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        return () => clearTimeout(controlsTimerRef.current);
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fdf5ee; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn   { from{opacity:0;}to{opacity:1;} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes shimmer  { 0%{background-position:200% 0;}100%{background-position:-200% 0;} }
        @keyframes floatUp  { 0%{opacity:0;transform:translateY(8px);}20%{opacity:1;}80%{opacity:1;}100%{opacity:0;transform:translateY(-16px);} }
        @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(20px,-15px) scale(1.1);} }
        @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-15px,20px) scale(0.95);} }
        @keyframes scanline { 0%{top:-10%;}100%{top:110%;} }
        @keyframes stepIn   { from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:translateX(0);} }
        @keyframes videoReveal { from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);} }

        input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.3); margin-top:-5px; }
        input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:2px; }
        input[type=range].seek-bar::-webkit-slider-runnable-track { background: linear-gradient(to right, #1a7a5e var(--pct,0%), rgba(255,255,255,0.25) var(--pct,0%)); }
        input[type=range].volume-bar::-webkit-slider-runnable-track { background: linear-gradient(to right, rgba(255,255,255,0.8) var(--pct,0%), rgba(255,255,255,0.2) var(--pct,0%)); }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
      `}</style>

            {/* ── Ambient background ── */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                background: `radial-gradient(ellipse 50% 40% at 10% 10%, rgba(26,122,94,0.05) 0%, transparent 60%),
                     radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,140,80,0.06) 0%, transparent 60%)` }} />

            {/* ── Navbar ── */}
            <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 1.75rem", height: "56px", background: "rgba(253,245,238,0.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8e2d9" }}>
                <button onClick={() => router.push(`/projects/${projectId}`)}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", padding: "0.35rem 0.65rem", borderRadius: "8px", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#1a1510"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9589"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                    Editor
                </button>

                <div style={{ width: "1px", height: "18px", background: "#e8e2d9" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>🎬</span>
                    <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>Video Generator</span>
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "20px", background: "rgba(26,122,94,0.1)", color: "#1a7a5e", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Beta</span>
                </div>

                <div style={{ flex: 1 }} />

                <button onClick={() => router.push(`/projects/${projectId}/insight`)}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", color: "#4a4540", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#c98c50"; e.currentTarget.style.color = "#c98c50"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; }}>
                    🕸️ Insight
                </button>
            </nav>

            {/* ── Body ── */}
            <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

                {/* ── IDLE: Hero CTA ── */}
                {phase === "idle" && (
                    <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
                        {/* Decorative film strip */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "2.5rem", opacity: 0.15 }}>
                            {Array.from({ length: 7 }, (_, i) => (
                                <div key={i} style={{ width: "48px", height: "36px", borderRadius: "4px", background: "#1a120a", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: "3px", left: "3px", right: "3px", bottom: "3px", borderRadius: "2px", background: "#c98c50", opacity: 0.6 }} />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,122,94,0.08)", border: "1px solid rgba(26,122,94,0.15)", borderRadius: "20px", padding: "0.3rem 0.9rem", marginBottom: "1.25rem" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a7a5e", animation: "pulse 2s ease infinite" }} />
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a7a5e" }}>AI-Powered</span>
                        </div>

                        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#1a120a", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem" }}>
                            Bring your story<br />to the screen
                        </h1>
                        <p style={{ fontSize: "1rem", color: "#6b5a4e", maxWidth: "480px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
                            KalamAI reads your narrative, extracts key scenes, and renders a cinematic video — for your reference as a writer.
                        </p>

                        {/* Generate button */}
                        <button
                            onClick={handleGenerate}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem", padding: "1rem 2.25rem", background: "#1a7a5e", color: "#fff", border: "none", borderRadius: "14px", fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em", transition: "all 0.25s", boxShadow: "0 4px 20px rgba(26,122,94,0.3)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#156650"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,122,94,0.38)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#1a7a5e"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,122,94,0.3)"; }}
                        >
                            {/* Clapperboard icon */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.2 6L3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" /><path d="M6.2 5.3l3.1 3.9" /><path d="M12.4 3.4l3.1 3.9" /><path d="M3 11l11 3c1.1.3 2.2-.3 2.5-1.3l.3-1L3 11z" /><rect x="2" y="14" width="20" height="8" rx="2" />
                            </svg>
                            Generate Video
                        </button>

                        {/* Feature pills */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
                            {["Scene detection", "Cinematic frames", "AI narration", "~5s to render"].map((f) => (
                                <span key={f} style={{ fontSize: "0.75rem", color: "#9e9589", background: "#fff", border: "1px solid #e8e2d9", borderRadius: "20px", padding: "0.3rem 0.85rem", fontFamily: "'DM Sans',sans-serif" }}>{f}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── LOADING ── */}
                {phase === "loading" && (
                    <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease both" }}>

                        {/* Big cinematic loader orb */}
                        <div style={{ position: "relative", width: "180px", height: "180px", margin: "0 auto 2.5rem" }}>
                            {/* Outer ring */}
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #e8e2d9" }} />
                            {/* Spinning arc */}
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#1a7a5e", borderRightColor: "rgba(26,122,94,0.3)", animation: "spin 1.2s linear infinite" }} />
                            {/* Inner spinning arc (opposite) */}
                            <div style={{ position: "absolute", inset: "12px", borderRadius: "50%", border: "2px solid transparent", borderBottomColor: "#c98c50", borderLeftColor: "rgba(201,140,80,0.3)", animation: "spin 1.8s linear infinite reverse" }} />
                            {/* Center orb */}
                            <div style={{ position: "absolute", inset: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #1a7a5e, #c98c50)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s ease infinite" }}>
                                <span style={{ fontSize: "2.2rem" }}>{LOADING_STEPS[stepIndex]?.icon}</span>
                            </div>
                            {/* Floating particles */}
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} style={{ position: "absolute", width: "6px", height: "6px", borderRadius: "50%", background: i % 2 === 0 ? "#1a7a5e" : "#c98c50", top: `${20 + i * 20}%`, left: i % 2 === 0 ? "-8px" : "calc(100% + 2px)", animation: `floatUp ${1.5 + i * 0.3}s ease infinite`, animationDelay: `${i * 0.4}s`, opacity: 0 }} />
                            ))}
                        </div>

                        {/* Step label */}
                        <div style={{ minHeight: "60px", marginBottom: "2rem" }}>
                            <p key={stepIndex} style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem", color: "#1a120a", marginBottom: "0.35rem", animation: "stepIn 0.35s ease both" }}>
                                {LOADING_STEPS[stepIndex]?.label}
                            </p>
                            <p key={`d-${stepIndex}`} style={{ fontSize: "0.83rem", color: "#9e9589", animation: "stepIn 0.35s ease 0.05s both" }}>
                                {LOADING_STEPS[stepIndex]?.detail}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div style={{ maxWidth: "420px", margin: "0 auto 1.5rem" }}>
                            <div style={{ height: "6px", borderRadius: "3px", background: "#e8e2d9", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, #1a7a5e, #c98c50)", width: `${progress}%`, transition: "width 0.1s linear", position: "relative" }}>
                                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "#fff", border: "2px solid #1a7a5e", boxShadow: "0 0 6px rgba(26,122,94,0.5)" }} />
                                </div>
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "#9e9589", marginTop: "0.5rem", textAlign: "right" }}>{Math.round(progress)}%</p>
                        </div>

                        {/* Step dots */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                            {LOADING_STEPS.map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", opacity: i <= stepIndex ? 1 : 0.3, transition: "opacity 0.3s" }}>
                                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: i < stepIndex ? "#1a7a5e" : i === stepIndex ? "#c98c50" : "#e8e2d9", transition: "background 0.3s" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── DONE: Video Player ── */}
                {phase === "done" && (
                    <div style={{ animation: "videoReveal 0.6s cubic-bezier(0.2,0,0,1) both" }}>
                        {/* Header */}
                        <div style={{ marginBottom: "1.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a7a5e", animation: "pulse 2s ease infinite" }} />
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a7a5e" }}>Ready</span>
                            </div>
                            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.9rem", color: "#1a120a", letterSpacing: "-0.03em" }}>Your story, visualised</h2>
                            <p style={{ fontSize: "0.85rem", color: "#9e9589", marginTop: "0.25rem" }}>Generated in 5s · For writer's reference only</p>
                        </div>

                        {/* ── Video Player ── */}
                        <div
                            ref={playerRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => isPlaying && setShowControls(false)}
                            style={{ position: "relative", borderRadius: "18px", overflow: "hidden", background: "#0a0a0a", boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)", aspectRatio: "16/9", cursor: showControls ? "default" : "none" }}
                        >
                            {/* Video element */}
                            <video
                                ref={videoRef}
                                src={DEMO_VIDEO_URL}
                                poster={DEMO_VIDEO_POSTER || undefined}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                onClick={togglePlay}
                                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                            />

                            {/* Gradient overlays */}
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.3) 100%)", pointerEvents: "none", opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }} />

                            {/* Center play button (big) */}
                            {!isPlaying && (
                                <button onClick={togglePlay}
                                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "72px", height: "72px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", animation: "fadeIn 0.3s ease both" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,122,94,0.7)"; e.currentTarget.style.borderColor = "#1a7a5e"; e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.08)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"; }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                                </button>
                            )}

                            {/* ── Controls bar ── */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.25rem 1.25rem 1rem", opacity: showControls ? 1 : 0, transition: "opacity 0.3s", pointerEvents: showControls ? "auto" : "none" }}>

                                {/* Seek bar */}
                                <div style={{ marginBottom: "0.75rem", position: "relative" }}>
                                    <input
                                        type="range"
                                        className="seek-bar"
                                        min={0}
                                        max={duration || 100}
                                        step={0.1}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        style={{ width: "100%", height: "4px", "--pct": `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
                                    />
                                </div>

                                {/* Controls row */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    {/* Play/Pause */}
                                    <button onClick={togglePlay} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: "0.2rem", transition: "transform 0.15s" }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.12)")}
                                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                                        {isPlaying
                                            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                                        }
                                    </button>

                                    {/* Volume */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}>
                                            {muted || volume === 0
                                                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                                                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
                                            }
                                        </button>
                                        <input type="range" className="volume-bar" min={0} max={1} step={0.02} value={muted ? 0 : volume} onChange={handleVolume}
                                            style={{ width: "72px", height: "4px", "--pct": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties} />
                                    </div>

                                    {/* Time */}
                                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.02em" }}>
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>

                                    <div style={{ flex: 1 }} />

                                    {/* Fullscreen */}
                                    <button onClick={toggleFullscreen} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: "0.2rem" }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                            {fullscreen
                                                ? <><path d="M8 3v3a2 2 0 01-2 2H3" /><path d="M21 8h-3a2 2 0 01-2-2V3" /><path d="M3 16h3a2 2 0 012 2v3" /><path d="M16 21v-3a2 2 0 012-2h3" /></>
                                                : <><path d="M8 3H5a2 2 0 00-2 2v3" /><path d="M21 8V5a2 2 0 00-2-2h-3" /><path d="M3 16v3a2 2 0 002 2h3" /><path d="M16 21h3a2 2 0 002-2v-3" /></>
                                            }
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Below player: actions + info ── */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
                            <div>
                                <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e9589", marginBottom: "0.35rem" }}>Generated from</p>
                                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.1rem", color: "#1a120a" }}>Your current story draft</p>
                                <p style={{ fontSize: "0.78rem", color: "#9e9589", marginTop: "0.15rem" }}>5 scenes detected · 9:10 runtime · HD</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.65rem" }}>
                                <button
                                    onClick={handleGenerate}
                                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", borderRadius: "10px", border: "1.5px solid #e8e2d9", background: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", color: "#4a4540", cursor: "pointer", transition: "all 0.2s", fontWeight: 500 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a7a5e"; e.currentTarget.style.color = "#1a7a5e"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
                                    Regenerate
                                </button>
                                <a
                                    href={DEMO_VIDEO_URL}
                                    download="story-video.mp4"
                                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", borderRadius: "10px", border: "none", background: "#1a7a5e", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", color: "#fff", cursor: "pointer", transition: "all 0.2s", fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 8px rgba(26,122,94,0.25)" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#156650"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1a7a5e"; }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}


