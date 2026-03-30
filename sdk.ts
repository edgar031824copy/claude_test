import { query } from "@anthropic-ai/claude-agent-sdk";

const prompt = "Add a description to the package.json file";

async function main() {
  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Edit"],
    },
  })) {
    console.log(JSON.stringify(message, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
