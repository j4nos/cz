import { ChatService } from "@/src/application/use-cases/chatService";
import { RuleBasedChatGateway } from "@/src/infrastructure/gateways/ruleBasedChatGateway";
import { AmplifyChatRepository } from "@/src/infrastructure/repositories/amplifyChatRepository";

class RuntimeChatIdGenerator {
  next(): string {
    return typeof crypto !== "undefined" ? crypto.randomUUID() : `chat-${Date.now()}`;
  }
}

class RuntimeChatClock {
  now(): string {
    return new Date().toISOString();
  }
}

export function createChatService() {
  return new ChatService(
    new AmplifyChatRepository(),
    new RuleBasedChatGateway(),
    new RuntimeChatIdGenerator(),
    new RuntimeChatClock(),
  );
}
