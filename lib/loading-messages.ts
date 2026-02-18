// Loading messages for different stages
export const LOADING_MESSAGES = {
  upload: [
    "📤 Uploading your file...",
    "📊 Parsing Excel data...",
    "🔍 Analyzing columns...",
    "✨ Almost ready!"
  ],
  analyzing: [
    "🤔 Understanding your question...",
    "🧠 Thinking...",
    "📊 Processing data..."
  ],
  generating: [
    "✍️ Generating response...",
    "📈 Creating visualization...",
    "🎨 Finalizing answer..."
  ]
} as const;

export type LoadingStage = keyof typeof LOADING_MESSAGES;

export function getRandomLoadingMessage(stage: LoadingStage): string {
  const messages = LOADING_MESSAGES[stage];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function* cycleLoadingMessages(stage: LoadingStage) {
  const messages = LOADING_MESSAGES[stage];
  let index = 0;

  while (true) {
    yield messages[index];
    index = (index + 1) % messages.length;
  }
}
