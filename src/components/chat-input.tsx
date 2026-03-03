'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowUp, Image as ImageIcon, Mic, MicOff, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ImageFile {
  dataUrl: string;
  name: string;
}

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (images?: ImageFile[]) => void;
  isStreaming: boolean;
  stop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  supportsVision?: boolean;
}

async function convertFileToDataUrl(file: File): Promise<ImageFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isStreaming,
  stop,
  disabled,
  placeholder,
  supportsVision = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const SILENCE_DELAY = 1500;
    let accumulated = '';

    const armSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), SILENCE_DELAY);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Accumulate final segments, show full interim in textarea
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const seg = event.results[i][0].transcript.trim();
          if (seg) accumulated = accumulated ? `${accumulated} ${seg}` : seg;
        }
      }
      // Live preview: show accumulated finals + current interim
      const allParts = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript.trim())
        .filter(Boolean);
      onInputChange(allParts.join(' '));
      armSilenceTimer();
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (accumulated) onInputChange(accumulated);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      /* onend handles cleanup */
    };

    try {
      recognition.start();
    } catch {
      /* ignore */
    }
    setIsRecording(true);
  };

  // Stop recognition when the component unmounts
  useEffect(() => () => stopRecording(), []);

  const handleSubmit = () => {
    if (isStreaming && stop) {
      stop();
      return;
    }
    onSubmit(images.length > 0 ? images : undefined);
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const imageFile = await convertFileToDataUrl(file);
        newImages.push(imageFile);
      }
    }
    setImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (input.trim().length > 0 || images.length > 0) && !disabled;

  return (
    <div className='mx-auto w-full max-w-3xl'>
      {/* Changed to rounded-3xl and bg-muted for standard shadcn theme adapting */}
      <div className='bg-muted flex flex-col rounded-3xl p-2'>
        {images.length > 0 && (
          <div className='border-border/30 mb-2 flex flex-wrap gap-2 px-2 pt-2'>
            {images.map((image, index) => (
              <div key={index} className='relative shrink-0'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt={image.name}
                  className='border-border/30 h-24 w-24 rounded-lg border object-cover'
                />
                <button
                  onClick={() => removeImage(index)}
                  className='absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90'
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className='flex items-end gap-1.5 pl-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='relative'>
                <Button
                  variant='ghost'
                  size='icon'
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-full',
                    supportsVision
                      ? 'text-foreground hover:text-foreground'
                      : 'text-muted-foreground cursor-not-allowed',
                  )}
                  disabled={disabled || !supportsVision}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className='h-5 w-5' />
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  multiple
                  className='hidden'
                  onChange={handleFileChange}
                  disabled={disabled || !supportsVision}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side='top' className='text-xs'>
              {supportsVision ? 'Add images' : 'Vision not supported'}
            </TooltipContent>
          </Tooltip>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Message...'}
            rows={1}
            // Added py-2.5 to vertically center text with the buttons on a single line
            className='placeholder:text-muted-foreground bg-muted! max-h-[200px] min-h-[40px] flex-1 resize-none border-0 py-2.5 text-base shadow-none focus-visible:ring-0'
            disabled={disabled}
          />

          <div className='flex items-center gap-1'>
            {/* Added Mic Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-full transition-colors',
                    isRecording ? 'text-red-500 hover:text-red-600' : 'text-foreground hover:text-foreground',
                  )}
                  disabled={disabled}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className='h-5 w-5' /> : <Mic className='h-5 w-5' />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side='top' className='text-xs'>
                {isRecording ? 'Stop recording' : 'Voice input'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-full transition-all',
                    isStreaming
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : canSend
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed',
                  )}
                  onClick={handleSubmit}
                  disabled={!canSend && !isStreaming}
                >
                  {isStreaming ? (
                    <Square className='h-4 w-4 fill-current' />
                  ) : (
                    <ArrowUp className='h-5 w-5 stroke-[2.5]' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side='top' className='text-xs'>
                {isStreaming ? 'Stop' : 'Send'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
