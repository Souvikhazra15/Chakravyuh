import fs from "fs";
import readlineSync from "readline-sync";
import { answerDecisionQuery, buildAssistantRules } from "./chatbot.js";

function loadContextFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      analysisData: parsed.analysisData || parsed.data || [],
      summary: parsed.summary || null,
      workOrders: parsed.workOrders || [],
    };
  } catch (_err) {
    return null;
  }
}

async function main() {
  const rules = buildAssistantRules();
  let context = { analysisData: [], summary: null, workOrders: [] };

  console.log("\nAI Predictive Maintenance Decision Assistant\n");
  console.log(`Role: ${rules.role}`);
  console.log("Commands:");
  console.log("  /load <json-file-path>   Load context data");
  console.log("  /rules                   Show assistant rules");
  console.log("  /exit                    Quit\n");

  while (true) {
    const question = readlineSync.question("You: ");

    const lower = question.toLowerCase().trim();

    if (lower === "/exit" || lower === "exit" || lower === "quit") {
      console.log("\nGoodbye!");
      break;
    }

    if (lower === "/rules") {
      console.log("\nRules:");
      for (const rule of rules.rules) {
        console.log(`- ${rule}`);
      }
      console.log("");
      continue;
    }

    if (lower.startsWith("/load ")) {
      const filePath = question.slice(6).trim();
      const loaded = loadContextFromFile(filePath);
      if (!loaded) {
        console.log("Data not available\n");
        continue;
      }
      context = loaded;
      console.log(
        `Loaded context: analysis=${context.analysisData.length}, workOrders=${context.workOrders.length}, summary=${context.summary ? "yes" : "no"}\n`
      );
      continue;
    }

    if (!question.trim()) {
      console.log("Please enter a question.\n");
      continue;
    }

    try {
      const response = answerDecisionQuery({
        query: question,
        analysisData: context.analysisData,
        summary: context.summary,
        workOrders: context.workOrders,
      });
      console.log(`Bot: ${response}\n`);
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
}

await main(); 