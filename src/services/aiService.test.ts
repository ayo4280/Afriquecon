import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('../lib/supabase', () => ({
  supabase: { functions: { invoke } },
}));

import { AIService } from './aiService';

describe('AIService', () => {
  beforeEach(() => invoke.mockReset());

  it('returns the secure Edge Function response', async () => {
    invoke.mockResolvedValue({ data: { text: 'Welcome', provider: 'Gemini' }, error: null });

    await expect(new AIService().generateText('How do I ship cargo?')).resolves.toEqual({
      text: 'Welcome',
      provider: 'Gemini',
    });
    expect(invoke).toHaveBeenCalledWith('generate-ai-text', {
      body: { prompt: 'How do I ship cargo?' },
    });
  });

  it('converts Edge Function failures into a safe user-facing error', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('rate limited') });

    await expect(new AIService().generateText('hello')).rejects.toThrow(
      'All AI providers failed to respond or secure connection failed. Please try again later.',
    );
  });

  it('rejects malformed successful responses', async () => {
    invoke.mockResolvedValue({ data: { provider: 'Gemini' }, error: null });

    await expect(new AIService().generateText('hello')).rejects.toThrow(
      'All AI providers failed to respond or secure connection failed. Please try again later.',
    );
  });
});
