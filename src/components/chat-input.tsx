'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowUp, Image as ImageIcon, Mic, Square, X } from 'lucide-react';
import { useRef, useState } from 'react';

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
                  className='text-foreground hover:text-foreground h-10 w-10 shrink-0 rounded-full'
                  disabled={disabled}
                >
                  <Mic className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='top' className='text-xs'>
                Voice input
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
