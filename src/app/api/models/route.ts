import { NextRequest, NextResponse } from 'next/server';

import { LocalModel, resolveLocalAIProvider } from '@/lib/local-ai';

interface OllamaModelResponse {
  models?: Array<{
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
  }>;
}

interface OmlxModelStatusEntry {
  id: string;
  estimated_size?: number;
  model_type?: string;
  config_model_type?: string;
  thinking_default?: boolean | null;
}

interface OmlxModelStatusResponse {
  models?: OmlxModelStatusEntry[];
}

function getOmlxBaseUrl() {
  return (process.env.OMLX_BASE_URL ?? 'http://localhost:8000/v1').replace(/\/$/, '');
}

function parseParameterSize(modelName: string): string {
  const match = modelName.match(/(\d+(?:\.\d+)?)\s*(b|m)\b/i);
  if (!match) {
    return 'Unknown';
  }

  return `${match[1]}${match[2].toUpperCase()}`;
}

function parseQuantizationLevel(modelName: string): string {
  const match = modelName.match(/(q\d+|[248]bit|mxfp4)/i);
  return match ? match[1].toUpperCase() : 'Unknown';
}

function inferFamily(modelName: string): string {
  if (!modelName) return 'Unknown';
  return modelName.split('/').at(-1)?.split('-')[0] ?? 'Unknown';
}

function inferOmlxThinking({
  modelName,
  capabilities,
  modalities,
  status,
}: {
  modelName: string;
  capabilities: string[];
  modalities: string[];
  status?: OmlxModelStatusEntry;
}) {
  if (status?.thinking_default === true) {
    return true;
  }

  if (capabilities.some((value) => ['thinking', 'reasoning'].includes(value.toLowerCase()))) {
    return true;
  }

  const normalizedSignals = [modelName, status?.config_model_type ?? '', capabilities.join(' '), modalities.join(' ')]
    .join(' ')
    .toLowerCase();

  return /(qwq|qwopus|qwen3\.?5|deepseek|r1|reason|thinking)/.test(normalizedSignals);
}

function normalizeOmlxModel(
  rawModel: Record<string, unknown>,
  statusById: Map<string, OmlxModelStatusEntry>,
): LocalModel | null {
  const modelName =
    typeof rawModel.id === 'string' ? rawModel.id : typeof rawModel.name === 'string' ? rawModel.name : null;

  if (!modelName) {
    return null;
  }

  const capabilities = Array.isArray(rawModel.capabilities)
    ? rawModel.capabilities.filter((value): value is string => typeof value === 'string')
    : [];

  const modalities = Array.isArray(rawModel.modalities)
    ? rawModel.modalities.filter((value): value is string => typeof value === 'string')
    : [];

  const status = statusById.get(modelName);
  const size =
    typeof rawModel.size === 'number'
      ? rawModel.size
      : typeof status?.estimated_size === 'number'
        ? status.estimated_size
        : 0;
  const familyFromConfigType = status?.config_model_type ? status.config_model_type.replace(/_/g, '.') : null;
  const supportsThinking = inferOmlxThinking({
    modelName,
    capabilities,
    modalities,
    status,
  });
  const supportsVision =
    status?.model_type === 'vlm' ||
    status?.model_type === 'ocr' ||
    /(vision|image|vlm|multimodal|ocr)/.test(
      [modelName, capabilities.join(' '), modalities.join(' ')].join(' ').toLowerCase(),
    );

  return {
    provider: 'omlx',
    name: modelName,
    modified_at:
      typeof rawModel.created === 'number'
        ? new Date(rawModel.created * 1000).toISOString()
        : typeof rawModel.created_at === 'string'
          ? rawModel.created_at
          : new Date(0).toISOString(),
    size,
    digest: typeof rawModel.digest === 'string' ? rawModel.digest : modelName,
    details: {
      format: typeof rawModel.format === 'string' ? rawModel.format : 'mlx',
      family: typeof rawModel.family === 'string' ? rawModel.family : (familyFromConfigType ?? inferFamily(modelName)),
      families: null,
      parameter_size: parseParameterSize(modelName),
      quantization_level: parseQuantizationLevel(modelName),
    },
    capabilities,
    supportsThinking,
    supportsVision,
  };
}

async function getOllamaCapabilities(
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

    const data = (await response.json()) as { capabilities?: unknown };
    const capabilities = Array.isArray(data.capabilities)
      ? data.capabilities.filter((value): value is string => typeof value === 'string')
      : [];

    return {
      supportsThinking: capabilities.includes('thinking'),
      supportsVision: capabilities.includes('vision'),
      capabilities,
    };
  } catch {
    return { supportsThinking: false, supportsVision: false, capabilities: [] };
  }
}

async function listOllamaModels() {
  const response = await fetch('http://localhost:11434/api/tags', {
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch models from Ollama' }, { status: response.status });
  }

  const data = (await response.json()) as OllamaModelResponse;
  const models = data.models ?? [];

  const modelsWithCapabilities: LocalModel[] = await Promise.all(
    models.map(async (model) => {
      const { supportsThinking, supportsVision, capabilities } = await getOllamaCapabilities(model.name);
      return {
        ...model,
        provider: 'ollama',
        capabilities,
        supportsThinking,
        supportsVision,
      };
    }),
  );

  return NextResponse.json({ models: modelsWithCapabilities, provider: 'ollama' });
}

async function listOmlxModels() {
  const headers = process.env.OMLX_API_KEY ? { Authorization: `Bearer ${process.env.OMLX_API_KEY}` } : undefined;

  const [modelsResponse, statusResponse] = await Promise.all([
    fetch(`${getOmlxBaseUrl()}/models`, {
      cache: 'no-store',
      headers,
    }),
    fetch(`${getOmlxBaseUrl()}/models/status`, {
      cache: 'no-store',
      headers,
    }),
  ]);

  if (!modelsResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch models from oMLX' }, { status: modelsResponse.status });
  }

  const payload = (await modelsResponse.json()) as { data?: unknown } | unknown[];
  const rawModels = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
  const statusPayload = statusResponse.ok ? ((await statusResponse.json()) as OmlxModelStatusResponse) : {};
  const statusById = new Map((statusPayload.models ?? []).map((entry) => [entry.id, entry] as const));

  const models = rawModels
    .filter((rawModel): rawModel is Record<string, unknown> => Boolean(rawModel && typeof rawModel === 'object'))
    .map((rawModel) => normalizeOmlxModel(rawModel, statusById))
    .filter((model): model is LocalModel => model !== null);

  return NextResponse.json({ models, provider: 'omlx' });
}

export async function GET(request: NextRequest) {
  const provider = resolveLocalAIProvider(request.nextUrl.searchParams.get('provider'));

  try {
    if (provider === 'omlx') {
      return await listOmlxModels();
    }

    return await listOllamaModels();
  } catch {
    if (provider === 'omlx') {
      return NextResponse.json(
        { error: 'Could not connect to oMLX. Make sure oMLX is running on localhost:8000 or set OMLX_BASE_URL.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Could not connect to Ollama. Make sure Ollama is running on localhost:11434.' },
      { status: 503 },
    );
  }
}
