"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

export function AudioRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!navigator.mediaDevices && !!window.MediaRecorder);
  }, []);

  const start = async () => {
    if (!supported) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onRecorded(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  if (!supported) return <div className="text-sm text-muted">Audio recording not supported in this browser.</div>;

  return (
    <div className="inline-flex items-center gap-2">
      {recording ? (
        <Button variant="outline" onClick={stop}>Stop</Button>
      ) : (
        <Button variant="outline" onClick={start}>Record</Button>
      )}
    </div>
  );
}


