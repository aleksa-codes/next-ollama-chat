import { NextResponse } from 'next/server';

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  capabilities?: string[];
  supportsThinking?: boolean;
  supportsVision?: boolean;
}

async function getModelCapabilities(
  modelName: string,
): Promise<{ supportsThinking: boolean; supportsVision: boolean; capabilities: string[] }> {
  try {
    const response = await fetch('http://localhost:11434/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName }),
    });

    if (!response.ok) {
      return { supportsThinking: false, supportsVision: false, capabilities: [] };
    }

    const data = await response.json();
    const capabilities = data.capabilities || [];

    return {
      supportsThinking: capabilities.includes('thinking'),
      supportsVision: capabilities.includes('vision'),
      capabilities,
    };
  } catch {
    return { supportsThinking: false, supportsVision: false, capabilities: [] };
  }
}

export async function GET() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch models from Ollama' }, { status: response.status });
    }

    const data = await response.json();
    const models: OllamaModel[] = data.models || [];

    const modelsWithCapabilities = await Promise.all(
      models.map(async (model) => {
        const { supportsThinking, supportsVision, capabilities } = await getModelCapabilities(model.name);
        return {
          ...model,
          capabilities,
          supportsThinking,
          supportsVision,
        };
      }),
    );

    return NextResponse.json({ models: modelsWithCapabilities });
  } catch {
    return NextResponse.json(
      { error: 'Could not connect to Ollama. Make sure Ollama is running on localhost:11434' },
      { status: 503 },
    );
  }
}
