import "dotenv/config";
import { getLLMProvider } from "../src/llm";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set. Add it to .env and try again.");
    process.exit(1);
  }

  const provider = getLLMProvider(apiKey);
  console.log(`Testing ${provider.name} (model: ${process.env.GROQ_MODEL ?? "default"})...`);

  const result = await provider.complete({
    messages: [
      {
        role: "system",
        content:
          "You are Monty, a friendly Indian gym-buddy fitness coach. Reply in one short sentence.",
      },
      { role: "user", content: "I just finished my last set of squats." },
    ],
  });

  console.log(`\nModel: ${result.model}`);
  console.log(`Latency: ${result.latencyMs}ms`);
  console.log(`Reply: ${result.content}`);
}

main().catch((err) => {
  console.error("Groq verification failed:", err.message ?? err);
  process.exit(1);
});
