
"use server";

import {
  suggestComponent
} from '@/ai/flows/suggest-component';

export async function suggestComponentAction(
  input
) {
  try {
    const result = await suggestComponent(input);
    return result;
  } catch (error) {
    console.error("Error in suggestComponentAction:", error);
    // Optionally, you could re-throw a more specific error or return a structured error object
    return null;
  }
}
