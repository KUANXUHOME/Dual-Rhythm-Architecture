// lib/ai-provider.ts
// Multi-model AI provider registry — DeepSeek + NVIDIA NIM via OpenAI-compatible SDK
// Supports runtime model selection via UI dropdown.

import { createOpenAI } from '@ai-sdk/openai';

// ── Provider instances ──────────────────────────────────────

export const deepseekProvider = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  name: 'deepseek',
});

export const nvidiaProvider = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY ?? '',
  name: 'nvidia',
});

// ── Model registry ──────────────────────────────────────────

export interface ModelOption {
  id: string;           // unique model identifier for the API
  label: string;        // display name
  provider: 'deepseek' | 'nvidia';
  providerLabel: string;
  description: string;
  contextWindow: string;
  tier: 'free' | 'paid'; // 'paid' = requires ceo_diagnostic or above
}

export const MODEL_REGISTRY: ModelOption[] = [
  // DeepSeek models
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'General-purpose, fast, cost-efficient. Default for free diagnostics.',
    contextWindow: '64K',
    tier: 'free',
  },
  {
    id: 'deepseek-reasoner',
    label: 'DeepSeek Reasoner (R1)',
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    description: 'Deep reasoning model for complex structural analysis. Slower but more thorough.',
    contextWindow: '64K',
    tier: 'paid',
  },
  // NVIDIA NIM models
  {
    id: 'meta/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'Meta Llama 3.3 70B — balanced quality and speed via NVIDIA NIM.',
    contextWindow: '128K',
    tier: 'free',
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    label: 'Llama 3.1 405B',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'Meta Llama 3.1 405B — largest open model, highest quality reasoning.',
    contextWindow: '128K',
    tier: 'paid',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    label: 'Nemotron 70B',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'NVIDIA fine-tuned Llama for instruction following.',
    contextWindow: '128K',
    tier: 'free',
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    label: 'Llama 3.1 70B',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'Meta Llama 3.1 70B — solid all-around model.',
    contextWindow: '128K',
    tier: 'free',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    label: 'Mistral Large 2',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'Mistral Large 2 — strong European model for multi-language orgs.',
    contextWindow: '128K',
    tier: 'paid',
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    label: 'Qwen 2.5 72B',
    provider: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    description: 'Alibaba Qwen 2.5 — excellent for APAC organizations.',
    contextWindow: '128K',
    tier: 'free',
  },
];

// ── Model resolution ────────────────────────────────────────

const DEFAULT_MODEL_ID = 'deepseek-chat';
const FALLBACK_MODEL_ID = 'meta/llama-3.3-70b-instruct';

export function getModelById(modelId: string | undefined): { provider: ReturnType<typeof deepseekProvider.chat | typeof nvidiaProvider.chat>; modelOption: ModelOption } {
  const id = modelId ?? DEFAULT_MODEL_ID;
  const option = MODEL_REGISTRY.find(m => m.id === id) ?? MODEL_REGISTRY[0];

  const providerInstance = option.provider === 'deepseek' ? deepseekProvider : nvidiaProvider;
  return {
    provider: providerInstance.chat(option.id),
    modelOption: option,
  };
}

// Backward-compatible: used by chat route when no model is selected
export function getModel(useNvidia = false) {
  const id = useNvidia ? FALLBACK_MODEL_ID : DEFAULT_MODEL_ID;
  return getModelById(id).provider;
}

// Filter models available to a user based on their tier
export function getAvailableModels(isPaid: boolean): ModelOption[] {
  return MODEL_REGISTRY.filter(m => isPaid ? true : m.tier === 'free');
}
