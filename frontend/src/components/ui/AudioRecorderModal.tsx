"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  title?: string;
};

export default function AudioRecorderModal({ open, onClose, onSave, title }: Props) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const mimeRef = useRef<string>('audio/webm');

  // waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmBuffersRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function cleanup() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    try { analyserRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { (scriptNodeRef.current as any)?.disconnect?.(); } catch {}
    if (audioCtxRef.current) {
      try {
        if ((audioCtxRef.current as any).state !== 'closed') {
          (audioCtxRef.current as any).close?.();
        }
      } catch {}
      audioCtxRef.current = null;
    }
    try { mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); } catch {}
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setPaused(false);
    startTimeRef.current = null;
    setElapsed(0);
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary') || '#4B5563';
      ctx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  };

  const start = async () => {
    const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // pick supported mime type
    const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    const supported = preferred.find((t) => (window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported && MediaRecorder.isTypeSupported(t));
    mimeRef.current = supported || 'audio/webm';
    // setup waveform
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(userStream);
    sourceRef.current = source;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;
    drawWaveform();

    // route to destination for recording (avoids some Chromium bugs recording silence)
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);

    // tap raw PCM for WAV fallback
    const proc = audioCtx.createScriptProcessor(4096, 1, 1);
    scriptNodeRef.current = proc as any;
    pcmBuffersRef.current = [];
    source.connect(proc);
    proc.connect(audioCtx.destination);
    proc.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      pcmBuffersRef.current.push(new Float32Array(input));
    };

    const mr = new MediaRecorder(destination.stream, { mimeType: mimeRef.current } as any);
    chunksRef.current = [];
    mr.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    });
    mr.addEventListener('stop', () => {
      try {
        // give the last dataavailable a tick to arrive
        setTimeout(() => {
          try {
            let blob: Blob | null = null;
            if (chunksRef.current.length > 0) {
              blob = new Blob(chunksRef.current, { type: mimeRef.current });
            }
            if (!blob || blob.size < 1000) {
              // Fallback: encode WAV from PCM buffers
              const wavBlob = encodeWavFromPcm(pcmBuffersRef.current, audioCtxRef.current!.sampleRate);
              blob = wavBlob;
            }
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } catch (err) {
            console.error('Failed to finalize audio blob', err);
          }
        }, 50);
      } catch (err) {
        console.error('Failed to create audio blob', err);
      }
    });
    // request frequent dataavailable events to ensure chunks exist before stop
    mr.start(200);
    mediaRecorderRef.current = mr;
    setRecording(true);
    startTimeRef.current = Date.now();
    const tick = () => setElapsed(Math.floor(((startTimeRef.current || Date.now()) && Date.now() - (startTimeRef.current as number)) / 1000));
    const timer = setInterval(tick, 250);

    // cleanup timer when stopped
    mr.addEventListener('stop', () => { clearInterval(timer); });
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const pause = () => {
    if (!mediaRecorderRef.current) return;
    (mediaRecorderRef.current as any).pause?.();
    setPaused(true);
  };

  const resume = () => {
    if (!mediaRecorderRef.current) return;
    (mediaRecorderRef.current as any).resume?.();
    setPaused(false);
  };

  const save = () => {
    if (!previewUrl) return;
    fetch(previewUrl).then((r) => r.blob()).then((blob) => {
      onSave(blob);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      cleanup();
      onClose();
    });
  };

  const reset = () => {
    setPreviewUrl(null);
    cleanup();
  };

  // ---- WAV fallback encoder ----
  function encodeWavFromPcm(chunks: Float32Array[], sampleRate: number): Blob {
    // flatten
    let totalLength = 0;
    chunks.forEach((c) => (totalLength += c.length));
    const pcm = new Float32Array(totalLength);
    let offset = 0;
    chunks.forEach((c) => {
      pcm.set(c, offset);
      offset += c.length;
    });
    // convert to 16-bit PCM
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeString(view, 8, 'WAVE');
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcm.length * 2, true);
    // PCM samples
    let idx = 44;
    for (let i = 0; i < pcm.length; i++, idx += 2) {
      let s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([view], { type: 'audio/wav' });
  }

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={title || "Record Audio"}>
      <div className="space-y-3">
        <canvas ref={canvasRef} width={600} height={120} className="w-full rounded border border-token bg-[var(--color-surface)]" />
        <div className="text-sm text-[var(--color-muted)]">{recording ? (paused ? 'Paused' : `Recording… ${elapsed}s`) : previewUrl ? 'Preview' : 'Ready to record'}</div>
        <div className="flex flex-wrap gap-2">
          {!recording && !previewUrl && <Button variant="outline" onClick={start}>Start</Button>}
          {recording && !paused && <Button variant="outline" onClick={pause}>Pause</Button>}
          {recording && paused && <Button variant="outline" onClick={resume}>Resume</Button>}
          {recording && <Button onClick={stop}>Stop</Button>}
          {previewUrl && <Button variant="outline" onClick={reset}>Record Again</Button>}
          {previewUrl && <Button onClick={save}>Use Recording</Button>}
        </div>
        {previewUrl && (
          <audio className="w-full" controls src={previewUrl} />
        )}
      </div>
    </Modal>
  );
}


