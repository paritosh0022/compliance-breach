// 'use server';
/**
 * @fileOverview AI agent that suggests components based on a description of the desired functionality.
 *
 * - suggestComponent - A function that suggests components based on a description.
 * - SuggestComponentInput - The input type for the suggestComponent function.
 * - SuggestComponentOutput - The return type for the suggestComponent function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestComponentInputSchema = z.object({
  description: z.string().describe('The description of the desired component functionality.'),
});
export type SuggestComponentInput = z.infer<typeof SuggestComponentInputSchema>;

const SuggestComponentOutputSchema = z.object({
  componentSuggestion: z.string().describe('The suggested component name.'),
  reason: z.string().describe('The reasoning behind the component suggestion.'),
});
export type SuggestComponentOutput = z.infer<typeof SuggestComponentOutputSchema>;

export async function suggestComponent(input: SuggestComponentInput): Promise<SuggestComponentOutput> {
  return suggestComponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestComponentPrompt',
  input: {schema: SuggestComponentInputSchema},
  output: {schema: SuggestComponentOutputSchema},
  prompt: `You are an AI assistant that suggests UI components based on a description of the desired functionality.

  Description: {{{description}}}

  Suggest a component that would be suitable for this functionality and explain your reasoning.`,
});

const suggestComponentFlow = ai.defineFlow(
  {
    name: 'suggestComponentFlow',
    inputSchema: SuggestComponentInputSchema,
    outputSchema: SuggestComponentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
