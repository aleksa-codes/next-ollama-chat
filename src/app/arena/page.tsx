'use client';

import { ArenaModelCard } from '@/components/arena-model-card';
import { ArenaSidebar } from '@/components/arena-sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { useOllamaModels } from '@/hooks/use-ollama-models';
import { ARENA_MODES, ArenaCompetitor } from '@/lib/arena';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

export default function ArenaPage() {
  const [selectedModeId, setSelectedModeId] = useState(ARENA_MODES[0].id);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(ARENA_MODES[0].presets[0].prompt);
  const [competitors, setCompetitors] = useState<ArenaCompetitor[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { models } = useOllamaModels();

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const skippedModelsRef = useRef<Set<string>>(new Set());

  // Derive mode from ID
  const currentMode = ARENA_MODES.find((m) => m.id === selectedModeId) || ARENA_MODES[0];

  const handleModelToggle = (model: string) => {
    setSelectedModels((prev) => (prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]));
  };

  const handleSkipModel = (modelId: string) => {
    const controller = abortControllersRef.current.get(modelId);
    if (controller) {
      controller.abort();
    }
    skippedModelsRef.current.add(modelId);
    setCompetitors((prev) =>
      prev.map((c) =>
        c.id === modelId
          ? { ...c, status: 'skipped', duration: c.startTime ? Date.now() - c.startTime : undefined }
          : c,
      ),
    );
  };

  const generateSequential = async () => {
    if (selectedModels.length < 2 || !prompt) return;

    setIsGenerating(true);
    skippedModelsRef.current.clear();

    // Initialize competitors state
    const currentCompetitors: ArenaCompetitor[] = selectedModels.map((model) => ({
      id: model,
      status: 'idle',
      code: '',
      reasoning: '',
    }));
    setCompetitors(currentCompetitors);

    // Run sequentially
    for (const model of selectedModels) {
      // Check if this model was skipped
      if (skippedModelsRef.current.has(model)) {
        continue;
      }

      // Create abort controller for this model
      const abortController = new AbortController();
      abortControllersRef.current.set(model, abortController);

      // Set current to running
      const runStartTime = Date.now();
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === model
            ? { ...c, status: 'running', code: '', reasoning: '', startTime: runStartTime, duration: undefined }
            : c,
        ),
      );

      try {
        const modelData = models.find((m) => m.name === model);
        const supportsThinking = modelData?.supportsThinking ?? false;

        const response = await fetch('/api/ollama/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            mode: selectedModeId,
            supportsThinking,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to generate');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        let currentText = '';
        let currentReasoning = '';

        if (reader) {
          let done = false;
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;

                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'text-delta') {
                    currentText += data.delta;
                    setCompetitors((prev) => prev.map((c) => (c.id === model ? { ...c, code: currentText } : c)));
                  } else if (data.type === 'reasoning-delta') {
                    currentReasoning += data.delta;
                    setCompetitors((prev) =>
                      prev.map((c) => (c.id === model ? { ...c, reasoning: currentReasoning } : c)),
                    );
                  }
                } catch {
                  // Ignore parsing errors for non-JSON lines
                }
              }
            }
          }
        }

        // Mark as done
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === model ? { ...c, status: 'done', duration: c.startTime ? Date.now() - c.startTime : undefined } : c,
          ),
        );
      } catch (error) {
        // Check if it was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[Arena] Generation aborted for ${model}`);
          continue;
        }
        console.error(`[Arena] Error generating for ${model}:`, error);
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === model
              ? { ...c, status: 'error', error: 'Failed', duration: c.startTime ? Date.now() - c.startTime : undefined }
              : c,
          ),
        );
      } finally {
        abortControllersRef.current.delete(model);
      }
    }

    setIsGenerating(false);
  };

  // Determine grid columns based on number of competitors
  const gridCols = 'grid-cols-1 lg:grid-cols-2';

  return (
    <div className='bg-background flex h-screen w-full overflow-hidden'>
      {/* Sidebar with configuration */}
      <ArenaSidebar
        modes={ARENA_MODES}
        selectedModeId={selectedModeId}
        onModeSelect={setSelectedModeId}
        selectedModels={selectedModels}
        onModelToggle={handleModelToggle}
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={generateSequential}
        isGenerating={isGenerating}
      />

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='icon' asChild className='-ml-1.5 h-8 w-8'>
              <Link href='/'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div className='flex flex-col'>
              <h1 className='flex items-center gap-2 text-sm font-semibold'>
                <span className='text-muted-foreground'>Battle in progress</span>
              </h1>
              {isGenerating || competitors.length > 0 ? (
                <span className='text-muted-foreground text-xs'>
                  &quot;{prompt}&quot; • {currentMode.name} mode
                </span>
              ) : (
                <span className='text-muted-foreground text-xs'>Configure and start a battle</span>
              )}
            </div>
          </div>
          <ModeToggle />
        </header>

        {/* Competitors Grid */}
        <div className='bg-muted/10 flex-1 overflow-auto p-4 pb-24 lg:p-6'>
          {competitors.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
              <div className='bg-muted/50 flex h-20 w-20 items-center justify-center rounded-full'>
                <currentMode.icon className='text-muted-foreground h-8 w-8 opacity-50' />
              </div>
              <h2 className='text-xl font-medium tracking-tight'>Ready for battle</h2>
              <p className='text-muted-foreground max-w-[400px] text-sm'>
                Select at least 2 models from the sidebar, choose a mode, enter a prompt, and click Generate Arena.
              </p>
            </div>
          ) : (
            <div className={`grid w-full gap-4 ${gridCols}`}>
              {competitors.map((c) => {
                const model = models.find((m) => m.name === c.id);
                return (
                  <div key={c.id} className='h-[500px]'>
                    <ArenaModelCard
                      competitor={c}
                      mode={currentMode.id}
                      model={model}
                      onSkip={isGenerating && c.status === 'running' ? () => handleSkipModel(c.id) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
