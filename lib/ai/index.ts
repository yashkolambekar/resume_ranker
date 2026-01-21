import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const gemma3 = google('gemma-3-27b-it');

const gemini25Flash = google('gemini-2.5-flash')

export { gemma3, gemini25Flash };