"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Note: the "@anthropic-ai/claude-code" package has been renamed
// to "@anthropic-ai/claude-agent-sdk"
const claude_agent_sdk_1 = require("@anthropic-ai/claude-agent-sdk");
const prompt = "Add a description to the package.json file";
async function main() {
    for await (const message of (0, claude_agent_sdk_1.query)({
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
