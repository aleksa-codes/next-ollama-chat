'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalModels } from '@/hooks/use-local-models';
import { useSelectedProvider } from '@/hooks/use-selected-provider';
import { LOCAL_AI_PROVIDER_LABELS } from '@/lib/local-ai';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Monitor, MonitorOff, Phone, PhoneOff, StopCircle, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type CallPhase = 'listening' | 'processing' | 'speaking';

interface Turn {
  role: 'user' | 'assistant';
  text: string;
  screenshotDataUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseParamSize(size: string): number {
  const match = size?.match(/^([\d.]+)\s*([KMBT]?)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  return val * (multipliers[unit] ?? 1);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Orb Component ──────────────────────────────────────────────────────────────

function CallOrb({ phase, micMuted }: { phase: CallPhase; micMuted: boolean }) {
  const isListening = phase === 'listening' && !micMuted;
  const isMuted = phase === 'listening' && micMuted;
  const isProcessing = phase === 'processing';
  const isSpeaking = phase === 'speaking';

  return (
    <div className='relative flex h-60 w-60 items-center justify-center'>
      {/* Pulse rings — listening */}
      {isListening && (
        <>
          <div className='absolute h-60 w-60 animate-pulse rounded-full bg-blue-500/15' />
          <div
            className='absolute h-48 w-48 animate-pulse rounded-full bg-blue-500/20'
            style={{ animationDelay: '0.35s' }}
          />
        </>
      )}
      {/* Pulse rings — speaking */}
      {isSpeaking && (
        <>
          <div className='absolute h-60 w-60 animate-pulse rounded-full bg-emerald-500/15' />
          <div
            className='absolute h-48 w-48 animate-pulse rounded-full bg-emerald-500/20'
            style={{ animationDelay: '0.35s' }}
          />
        </>
      )}
      {/* Spinning arc — processing */}
      {isProcessing && (
        <div
          className='absolute h-52 w-52 animate-spin rounded-full border-[3px] border-transparent border-t-purple-500'
          style={{ animationDuration: '1.1s' }}
        />
      )}

      {/* Core orb */}
      <div
        className={cn(
          'flex h-36 w-36 items-center justify-center rounded-full transition-all duration-500',
          isListening && 'bg-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.5)]',
          isMuted && 'bg-zinc-600 shadow-[0_0_40px_rgba(100,100,100,0.3)]',
          isProcessing && 'bg-purple-600 shadow-[0_0_80px_rgba(168,85,247,0.5)]',
          isSpeaking && 'bg-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.5)]',
        )}
      >
        {isListening && <Mic className='h-12 w-12 text-white' />}
        {isMuted && <MicOff className='h-12 w-12 text-white/50' />}
        {isProcessing && (
          <span className='flex items-center gap-1.5'>
            <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]' />
            <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]' />
            <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-white' />
          </span>
        )}
        {isSpeaking && <Volume2 className='h-12 w-12 text-white' />}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const { provider } = useSelectedProvider();
  const { models, loading } = useLocalModels(provider);

  // ── Setup state ──
  const [selectedModel, setSelectedModel] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  // ── Call state ──
  const [isCallActive, setIsCallActive] = useState(false);
  const [phase, setPhase] = useState<CallPhase>('listening');
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [speakingLine, setSpeakingLine] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ── Refs (stable across renders, used inside event callbacks) ──
  const phaseRef = useRef<CallPhase>('listening');
  const isCallActiveRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const selectedModelRef = useRef('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const sentenceBufferRef = useRef('');
  const ttsQueueRef = useRef<string[]>([]);
  const isTTSPlayingRef = useRef(false);
  const streamDoneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Forward-refs to break circular function dependencies
  const startRecognitionFn = useRef<() => void>(() => {});
  const playNextTTSFn = useRef<() => void>(() => {});
  const processUserInputFn = useRef<(text: string) => Promise<void>>(async () => {});
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScreenshotRef = useRef<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // ── Sorted models (small → large) ──
  const sortedModels = useMemo(
    () =>
      [...models].sort((a, b) => parseParamSize(a.details.parameter_size) - parseParamSize(b.details.parameter_size)),
    [models],
  );

  // Pre select first model
  useEffect(() => {
    if (sortedModels.length > 0 && !selectedModel) {
      setSelectedModel(sortedModels[0].name);
      selectedModelRef.current = sortedModels[0].name;
    }
  }, [sortedModels, selectedModel]);

  useEffect(() => {
    if (!selectedModel) {
      return;
    }

    if (!sortedModels.some((model) => model.name === selectedModel)) {
      setSelectedModel('');
    }
  }, [selectedModel, sortedModels]);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // ── Check browser support + load voices ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTTS = 'speechSynthesis' in window;
    const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    if (!hasTTS || !hasSTT) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      setVoices(available);
      if (available.length > 0) {
        const best =
          available.find((v) => /neural|natural|enhanced|premium/i.test(v.name)) ||
          available.find((v) => !v.localService) ||
          available[0];
        setSelectedVoiceURI((prev) => prev || best.voiceURI);
        if (!selectedVoiceRef.current) selectedVoiceRef.current = best;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Sync voice ref when selection changes
  useEffect(() => {
    const v = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (v) selectedVoiceRef.current = v;
  }, [selectedVoiceURI, voices]);

  // Sync call-control refs
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);
  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // ── TTS engine ────────────────────────────────────────────────────────────────

  useEffect(() => {
    // playNextTTS: dequeues and speaks one sentence, then recurses via onend
    playNextTTSFn.current = () => {
      if (ttsQueueRef.current.length === 0) {
        isTTSPlayingRef.current = false;
        setSpeakingLine('');
        if (streamDoneRef.current && isCallActiveRef.current) {
          setPhase('listening');
          phaseRef.current = 'listening';
          startRecognitionFn.current();
        }
        return;
      }

      const sentence = ttsQueueRef.current.shift()!;
      isTTSPlayingRef.current = true;
      setSpeakingLine(sentence);

      if (isSpeakerMutedRef.current) {
        setTimeout(playNextTTSFn.current, 50);
        return;
      }

      const utt = new SpeechSynthesisUtterance(sentence);
      if (selectedVoiceRef.current) utt.voice = selectedVoiceRef.current;
      utt.rate = 1.05;
      utt.onend = () => playNextTTSFn.current();
      utt.onerror = () => playNextTTSFn.current();
      window.speechSynthesis.speak(utt);
    };
  });

  useEffect(() => {
    // processTTSBuffer: splits accumulated text into sentences, queues them
    const processTTSBuffer = (flush: boolean) => {
      const endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
      let buf = sentenceBufferRef.current;

      while (true) {
        let end = -1;
        for (const e of endings) {
          const idx = buf.indexOf(e);
          if (idx !== -1 && (end === -1 || idx < end)) end = idx + e.length;
        }
        if (end === -1) break;
        const sentence = buf.slice(0, end).trim();
        if (sentence.length > 1) ttsQueueRef.current.push(sentence);
        buf = buf.slice(end);
      }

      if (flush && buf.trim().length > 1) {
        ttsQueueRef.current.push(buf.trim());
        buf = '';
      }
      sentenceBufferRef.current = buf;
      if (!isTTSPlayingRef.current && ttsQueueRef.current.length > 0) {
        playNextTTSFn.current();
      }
    };

    // processUserInput: sends text to API, streams response, pipes to TTS
    processUserInputFn.current = async (userText: string) => {
      if (!isCallActiveRef.current || !userText.trim()) return;

      setPhase('processing');
      phaseRef.current = 'processing';
      setInterimText('');
      setSpeakingLine('');

      // Use the screenshot captured at first-word time (not end-of-speech)
      const screenshotDataUrl = pendingScreenshotRef.current;
      pendingScreenshotRef.current = null;

      conversationRef.current.push({ role: 'user', content: userText });
      setTranscript((prev) => [
        ...prev,
        { role: 'user', text: userText, screenshotDataUrl: screenshotDataUrl ?? undefined },
      ]);

      sentenceBufferRef.current = '';
      ttsQueueRef.current = [];
      isTTSPlayingRef.current = false;
      streamDoneRef.current = false;

      let aiText = '';

      try {
        abortRef.current = new AbortController();

        // Keep only last 10 turns to avoid context overflow
        const sliced = conversationRef.current.slice(-10);
        const recentMsgs = sliced.map((m, i) => {
          const isLastMsg = i === sliced.length - 1;
          const parts: ({ type: 'text'; text: string } | { type: 'file'; url: string; mediaType: string })[] = [
            { type: 'text' as const, text: m.content },
          ];
          if (isLastMsg && m.role === 'user' && screenshotDataUrl) {
            parts.push({ type: 'file' as const, url: screenshotDataUrl, mediaType: 'image/jpeg' });
          }
          return { id: crypto.randomUUID(), role: m.role, parts };
        });

        const response = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, model: selectedModelRef.current, messages: recentMsgs }),
          signal: abortRef.current.signal,
        });

        if (!response.ok || !response.body) throw new Error('API error');

        setPhase('speaking');
        phaseRef.current = 'speaking';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;
          sentenceBufferRef.current += chunk;
          processTTSBuffer(false);
        }

        processTTSBuffer(true);
        streamDoneRef.current = true;

        conversationRef.current.push({ role: 'assistant', content: aiText });
        setTranscript((prev) => [...prev, { role: 'assistant', text: aiText }]);

        // If TTS already finished (e.g. speaker muted), go straight to listening
        if (!isTTSPlayingRef.current && ttsQueueRef.current.length === 0) {
          setPhase('listening');
          phaseRef.current = 'listening';
          setSpeakingLine('');
          startRecognitionFn.current();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[Voice] error:', err);
          if (isCallActiveRef.current) {
            setPhase('listening');
            phaseRef.current = 'listening';
            startRecognitionFn.current();
          }
        }
      }
    };
  });

  // ── Speech recognition ────────────────────────────────────────────────────────

  useEffect(() => {
    startRecognitionFn.current = () => {
      if (!isCallActiveRef.current || isMicMutedRef.current) return;
      if (phaseRef.current !== 'listening') return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new SR();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Silence delay in ms — how long to wait after the last word before submitting
      const SILENCE_DELAY = 1500;

      let accumulatedText = '';

      const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      const armSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, SILENCE_DELAY);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const results = Array.from(event.results) as SpeechRecognitionResult[];

        // Capture screenshot on the very first word — this is the moment the user
        // started speaking, so it reflects what they were actually looking at.
        if (pendingScreenshotRef.current === null && screenStreamRef.current && screenVideoRef.current) {
          const vid = screenVideoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = vid.videoWidth || 1280;
          canvas.height = vid.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            pendingScreenshotRef.current = canvas.toDataURL('image/jpeg', 0.8);
          }
        }

        // Build display transcript: finalized segments space-joined + current interim
        const parts = results.map((r) => r[0].transcript.trim()).filter(Boolean);
        setInterimText(parts.join(' '));

        // Accumulate only newly-finalized segments
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const segment = event.results[i][0].transcript.trim();
            if (segment) accumulatedText = accumulatedText ? `${accumulatedText} ${segment}` : segment;
          }
        }

        // Reset the silence timer on every new word
        armSilenceTimer();
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setInterimText('');
        // Use accumulatedText if available, fall back to whatever was interim
        const textToSend = accumulatedText.trim();
        if (textToSend && isCallActiveRef.current && phaseRef.current === 'listening') {
          processUserInputFn.current(textToSend);
        } else {
          // No speech detected — discard any partial screenshot so it doesn't
          // accidentally attach to the next utterance.
          pendingScreenshotRef.current = null;
          if (isCallActiveRef.current && phaseRef.current === 'listening' && !isMicMutedRef.current) {
            setTimeout(() => startRecognitionFn.current(), 200);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        // onend always fires after onerror, so all restarts are handled there.
        // We only log unexpected errors here.
        if (!['no-speech', 'audio-capture'].includes(event.error)) {
          console.warn('[Voice] recognition error:', event.error);
        }
      };

      try {
        recognition.start();
      } catch {
        // ignore "already started"
      }
    };
  });

  // ── Call controls ──────────────────────────────────────────────────────────────

  const startCall = () => {
    if (!selectedModel || !isSupported) return;
    isCallActiveRef.current = true;
    conversationRef.current = [];
    setTranscript([]);
    setCallSeconds(0);
    setPhase('listening');
    phaseRef.current = 'listening';
    setIsMicMuted(false);
    setIsSpeakerMuted(false);
    isMicMutedRef.current = false;
    isSpeakerMutedRef.current = false;
    setIsCallActive(true);

    timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    setTimeout(() => startRecognitionFn.current(), 400);
  };

  const endCall = () => {
    isCallActiveRef.current = false;
    setIsCallActive(false);
    stopScreenShare();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    ttsQueueRef.current = [];
    isTTSPlayingRef.current = false;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setInterimText('');
    setSpeakingLine('');
  };

  const toggleMic = () => {
    const newMuted = !isMicMuted;
    setIsMicMuted(newMuted);
    isMicMutedRef.current = newMuted;
    if (newMuted) {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    } else if (phaseRef.current === 'listening') {
      setTimeout(() => startRecognitionFn.current(), 200);
    }
  };

  const toggleSpeaker = () => {
    const newMuted = !isSpeakerMuted;
    setIsSpeakerMuted(newMuted);
    isSpeakerMutedRef.current = newMuted;
    if (newMuted) window.speechSynthesis.cancel();
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      if (!screenVideoRef.current) {
        screenVideoRef.current = document.createElement('video');
        screenVideoRef.current.muted = true;
        screenVideoRef.current.playsInline = true;
      }
      screenVideoRef.current.srcObject = stream;
      await screenVideoRef.current.play();
      // Auto-stop when user closes the share via browser UI
      stream.getVideoTracks()[0]?.addEventListener('ended', stopScreenShare);
      setIsScreenSharing(true);
    } catch {
      // User cancelled or permission denied — silently ignore
    }
  };

  const interrupt = () => {
    if (phaseRef.current !== 'speaking') return;
    // Set streamDone=false BEFORE cancelling speech so the utterance onend
    // fired by cancel() doesn't auto-restart recognition via playNextTTSFn.
    streamDoneRef.current = false;
    ttsQueueRef.current = [];
    isTTSPlayingRef.current = false;
    window.speechSynthesis.cancel();
    abortRef.current?.abort();
    abortRef.current = null;
    setSpeakingLine('');
    setPhase('listening');
    phaseRef.current = 'listening';
    setTimeout(() => startRecognitionFn.current(), 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCallActiveRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      window.speechSynthesis?.cancel();
      abortRef.current?.abort();
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (!isSupported) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 p-8 text-center'>
        <Phone className='text-muted-foreground h-12 w-12' />
        <div>
          <p className='text-lg font-semibold'>Browser not supported</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Voice chat requires Chrome or Edge for full Web Speech API support.
          </p>
        </div>
        <Link href='/'>
          <Button variant='outline'>← Back to Chat</Button>
        </Link>
      </div>
    );
  }

  // ── Setup Screen ───────────────────────────────────────────────────────────────

  if (!isCallActive) {
    return (
      <div className='flex h-screen flex-col overflow-hidden'>
        {/* Top bar */}
        <div className='flex h-14 shrink-0 items-center justify-center border-b px-4'>
          <div className='flex w-full max-w-md items-center justify-between'>
            <Link
              href='/'
              className='text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors'
            >
              ← Back to Chat
            </Link>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md'>
                <Phone className='text-primary h-3.5 w-3.5' />
              </div>
              <span className='text-sm font-medium'>Voice Chat</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className='flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8'>
          <div className='flex w-full max-w-md flex-col gap-4'>
            <p className='text-muted-foreground text-center text-sm'>Talk to any local model in real time</p>

            {/* Model selection */}
            <div>
              <label className='text-muted-foreground mb-2 block text-xs font-medium tracking-wider uppercase'>
                Model
              </label>
              {loading ? (
                <div className='border-border rounded-xl border p-4 text-center'>
                  <p className='text-muted-foreground text-sm'>Loading models…</p>
                </div>
              ) : sortedModels.length === 0 ? (
                <div className='border-border rounded-xl border p-4 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    No models found. Is {provider ? LOCAL_AI_PROVIDER_LABELS[provider] : '...'} running?
                  </p>
                </div>
              ) : (
                <ScrollArea className='h-52 rounded-xl border'>
                  <div className='p-1'>
                    {sortedModels.map((model) => {
                      const isSelected = model.name === selectedModel;
                      return (
                        <button
                          key={model.name}
                          onClick={() => setSelectedModel(model.name)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                            isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground',
                          )}
                        >
                          <span className='flex min-w-0 items-center gap-1.5 truncate font-medium'>
                            {model.name.split(':')[0]}
                            {model.supportsVision && (
                              <Monitor
                                className={cn(
                                  'h-3 w-3 shrink-0',
                                  isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground',
                                )}
                              />
                            )}
                          </span>
                          <div className='text-muted-foreground ml-2 flex shrink-0 items-center gap-2 text-xs'>
                            {isSelected && (
                              <span className='text-primary-foreground/70'>{model.details.parameter_size}</span>
                            )}
                            {!isSelected && <span>{model.details.parameter_size}</span>}
                            <span
                              className={cn(isSelected ? 'text-primary-foreground/50' : 'text-muted-foreground/50')}
                            >
                              {formatBytes(model.size)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Voice selection */}
            {voices.length > 0 && (
              <div>
                <label className='text-muted-foreground mb-2 block text-xs font-medium tracking-wider uppercase'>
                  Voice
                </label>
                <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a voice' />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.voiceURI} value={v.voiceURI}>
                        <span className='flex items-center gap-2'>
                          <span>{v.name}</span>
                          {!v.localService && (
                            <span className='rounded bg-blue-500/10 px-1 py-0.5 text-[10px] text-blue-500'>
                              enhanced
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Call button */}
            <Button
              onClick={startCall}
              disabled={!selectedModel || loading}
              className='h-12 w-full gap-2 rounded-xl bg-green-500 text-base font-medium text-white hover:bg-green-600'
            >
              <Phone className='h-5 w-5' />
              Start Call
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Call Screen ────────────────────────────────────────────────────────────────

  const selectedModelData = models.find((m) => m.name === selectedModel);
  const supportsVision = selectedModelData?.supportsVision ?? false;

  const statusLabel =
    phase === 'listening' && isMicMuted
      ? 'Microphone muted'
      : phase === 'listening'
        ? 'Listening…'
        : phase === 'processing'
          ? 'Thinking…'
          : 'Speaking…';

  const subtitleText =
    phase === 'listening' && interimText ? interimText : phase === 'speaking' && speakingLine ? speakingLine : null;

  return (
    <div className='flex h-screen flex-col overflow-hidden'>
      {/* Top bar */}
      <div className='flex h-14 shrink-0 items-center justify-center border-b px-4'>
        <div className='flex w-full max-w-md items-center justify-between'>
          <div className='flex items-center gap-3'>
            <button
              onClick={endCall}
              className='text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors'
            >
              ← End & Exit
            </button>
            <span className='text-muted-foreground/40'>·</span>
            <span className='text-muted-foreground font-mono text-sm tabular-nums'>{formatDuration(callSeconds)}</span>
          </div>
          {(() => {
            const model = models.find((m) => m.name === selectedModel);
            return (
              <div className='flex items-center gap-2'>
                <span className='text-foreground text-sm font-medium'>{selectedModel.split(':')[0]}</span>
                {model?.details.parameter_size && (
                  <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium'>
                    {model.details.parameter_size}
                  </span>
                )}
                {model?.details.quantization_level && (
                  <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium'>
                    {model.details.quantization_level}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main content */}
      <div className='flex min-h-0 flex-1 flex-col items-center justify-between py-8'>
        {/* Orb + status */}
        <div className='flex flex-col items-center gap-6'>
          <CallOrb phase={phase} micMuted={isMicMuted} />

          <div className='relative pb-12 text-center'>
            <div className='flex items-center justify-center gap-2'>
              <p className='text-foreground text-lg font-medium'>{statusLabel}</p>
              {isScreenSharing && (
                <span className='flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-500'>
                  <Monitor className='h-3 w-3' />
                  sharing
                </span>
              )}
            </div>
            <p
              className={cn(
                'text-muted-foreground absolute left-1/2 mt-1.5 w-72 -translate-x-1/2 text-sm leading-relaxed italic transition-opacity duration-300',
                subtitleText ? 'opacity-100' : 'pointer-events-none opacity-0 select-none',
              )}
            >
              &ldquo;{subtitleText ?? '\u00A0'}&rdquo;
            </p>
          </div>
        </div>

        {/* Transcript + Interrupt */}
        <div className='flex w-full flex-col items-center gap-3'>
          {/* Transcript */}
          <div className='w-full max-w-md px-4'>
            {transcript.length > 0 ? (
              <ScrollArea className='h-44 rounded-2xl border'>
                <div className='space-y-2 p-3'>
                  {transcript.map((turn, i) => (
                    <div key={i} className={cn('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-relaxed',
                          turn.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm',
                        )}
                      >
                        {turn.screenshotDataUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={turn.screenshotDataUrl}
                            alt='screen share'
                            className='mb-1.5 max-h-32 w-full rounded-lg object-cover'
                          />
                        )}
                        {turn.text}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>
            ) : (
              <div className='flex h-44 items-center justify-center rounded-2xl border border-dashed'>
                <p className='text-muted-foreground text-sm'>Conversation will appear here</p>
              </div>
            )}
          </div>

          {/* Interrupt */}
          <div className='flex h-10 items-center justify-center'>
            <button
              onClick={interrupt}
              className={cn(
                'flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300',
                phase === 'speaking'
                  ? 'border-border text-foreground hover:bg-muted cursor-pointer opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
            >
              <StopCircle className='h-4 w-4 text-red-500' />
              Tap to interrupt
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            className={cn('h-14 w-14 rounded-full', isMicMuted && 'border-destructive text-destructive')}
            onClick={toggleMic}
            title={isMicMuted ? 'Unmute mic' : 'Mute mic'}
          >
            {isMicMuted ? <MicOff className='h-6 w-6' /> : <Mic className='h-6 w-6' />}
          </Button>

          <Button
            className='h-16 w-16 rounded-full bg-red-500 hover:bg-red-600'
            size='icon'
            onClick={endCall}
            title='End call'
          >
            <PhoneOff className='h-7 w-7 text-white' />
          </Button>

          <Button
            variant='outline'
            size='icon'
            className={cn('h-14 w-14 rounded-full', isSpeakerMuted && 'border-destructive text-destructive')}
            onClick={toggleSpeaker}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          >
            {isSpeakerMuted ? <VolumeX className='h-6 w-6' /> : <Volume2 className='h-6 w-6' />}
          </Button>

          {supportsVision && (
            <Button
              variant='outline'
              size='icon'
              className={cn('h-14 w-14 rounded-full', isScreenSharing && 'border-blue-500 text-blue-500')}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff className='h-6 w-6' /> : <Monitor className='h-6 w-6' />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
