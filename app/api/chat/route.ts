// app/api/chat/route.ts — AI streaming endpoint (multi-model: DeepSeek / NVIDIA NIM)
// v4: supports runtime model selection via body.modelId + entitlement-gated access

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getModelById, getAvailableModels, MODEL_REGISTRY } from '@/lib/ai-provider';
import { DRA_SYSTEM_PROMPT, USAGE_LIMIT_MESSAGE } from '@/lib/dra-system-prompt';
import { getUsageStatus, incrementUsage } from '@/lib/usage-limits';
import { getWorkflow } from '@/lib/workflows';
import { createServerClient } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // NVIDIA fallback: if ?fallback=1, use NVIDIA NIM instead of DeepSeek
    const useNvidiaFallback = new URL(req.url).searchParams.get('fallback') === '1';

    const body = await req.json() as {
      messages: ChatMessage[];
      conversationId?: string;
      orgName?: string;
      modelId?: string;
      workflowId?: string;
    };
    const { messages, conversationId, orgName, modelId, workflowId } = body;

    // Enforce daily limit
    const usage = await getUsageStatus(userId);
    if (usage.exceeded) {
      return NextResponse.json(
        { error: 'daily_limit_exceeded', message: USAGE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }

    // Resolve model: user-selected > fallback flag > default
    let resolvedModelId = modelId;
    if (useNvidiaFallback && !resolvedModelId) {
      resolvedModelId = 'meta/llama-3.3-70b-instruct';
    }

    // Validate tier access: paid models require ceo_diagnostic or above
    const modelOption = MODEL_REGISTRY.find(m => m.id === resolvedModelId);
    if (modelOption?.tier === 'paid' && !usage.isPaid) {
      return NextResponse.json(
        { error: 'model_requires_upgrade', message: `The ${modelOption.label} model requires a paid plan. Upgrade to unlock it.` },
        { status: 403 }
      );
    }

    const { provider: model } = getModelById(resolvedModelId);

    // Resolve workflow: validate tier access + build system prompt
    const workflow = workflowId ? getWorkflow(workflowId) : null;
    if (workflow?.tier === 'paid' && !usage.isPaid) {
      return NextResponse.json(
        { error: 'workflow_requires_upgrade', message: `The ${workflow.name} workflow requires a paid plan. Upgrade to unlock it.` },
        { status: 403 }
      );
    }
    const systemPrompt = workflow
      ? DRA_SYSTEM_PROMPT + workflow.systemPromptSuffix
      : DRA_SYSTEM_PROMPT;

    const db = createServerClient();

    // Create or reuse conversation record
    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await db
        .from('dra_conversations')
        .insert({ user_id: userId, messages: [], org_name: orgName ?? null })
        .select('id')
        .single();
      convId = conv?.id ?? null;
    }

    // Stream from selected model
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      maxOutputTokens: 2000,
      temperature: 0.7,
    });

    // Post-stream processing (async, doesn't block response)
    void (async () => {
      try {
        const fullText = await result.text;
        await incrementUsage(userId);

        if (convId) {
          const updatedMessages: ChatMessage[] = [
            ...messages,
            { role: 'assistant', content: fullText, timestamp: new Date().toISOString() },
          ];
          await db.from('dra_conversations')
            .update({ messages: updatedMessages })
            .eq('id', convId)
            .eq('user_id', userId);
        }
      } catch (e) {
        console.error('[chat post-stream]', e);
      }
    })();

    return result.toTextStreamResponse({
      headers: { 'X-Conversation-Id': convId ?? '' },
    });

  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/models — list available models for the current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const usage = await getUsageStatus(userId);
  const availableModels = getAvailableModels(usage.isPaid);

  return NextResponse.json({
    models: availableModels,
    currentTier: usage.tier,
    isPaid: usage.isPaid,
  });
}
