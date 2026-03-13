import type { ChatGateway } from "@/src/application/chatPorts";

export class RuleBasedChatGateway implements ChatGateway {
  async reply(input: { message: string }): Promise<string> {
    const text = input.message.trim().toLowerCase();

    if (text.includes("listing") || text.includes("asset")) {
      return "I can help with listings, pricing, and the investment flow. Open a listing to continue toward checkout.";
    }

    if (text.includes("token") || text.includes("tokenize")) {
      return "Tokenization will run through the asset workflow after listing and pricing are ready.";
    }

    if (text.includes("chat")) {
      return "This chat now runs through a clean route, service, gateway, and repository split in the TDD app.";
    }

    return "I can help you navigate assets, listings, pricing, and investor checkout in the Cityzeen demo.";
  }
}
