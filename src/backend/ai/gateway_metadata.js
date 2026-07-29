import { callModel } from "./core.js";

// Generate a long random ID for conversations
function generateConversationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}${extraRandom}`;
}

// Get the cheapest model for title generation
async function getCheapestModel(env) {
  // Use a known cheap model for title generation
  // Llama 3.1 8B is one of the most cost-effective models
  return "@cf/meta/llama-3.1-8b-instruct";
}

// Generate conversation title using AI
async function generateConversationTitle(env, prompt) {
  try {
    const cheapModel = await getCheapestModel(env);
    
    const titlePrompt = `Generate a very short title (maximum 3 words) for this conversation: "${prompt.substring(0, 200)}". Return only the title, no punctuation.`;
    
    const result = await callModel(env, cheapModel, titlePrompt, { maxTokens: 20 });
    
    let title = result?.response || result?.output || "";
    
    // Clean up the title
    title = title.trim()
      .replace(/["'.]/g, "")
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title || "New Conversation";
  } catch (error) {
    console.error("Failed to generate conversation title:", error);
    // Fallback: use first few words of prompt
    return prompt
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ")
      .charAt(0)
      .toUpperCase() + prompt.slice(1) || "New Conversation";
  }
}

// Main function to generate gateway metadata
export async function getGatewayMetadata(env, conversationId, conversationName, prompt) {
  const metadata = {
    conversationId: null,
    conversationName: null,
    timestamp: new Date().toISOString()
  };
  
  // Check if both conversationId and conversationName are present
  if (conversationId && conversationName) {
    metadata.conversationId = conversationId;
    metadata.conversationName = conversationName;
  } else {
    // Generate new conversation ID
    metadata.conversationId = generateConversationId();
    
    // Generate conversation name if not provided
    if (conversationName) {
      metadata.conversationName = conversationName;
    } else if (prompt) {
      metadata.conversationName = await generateConversationTitle(env, prompt);
    } else {
      metadata.conversationName = "New Conversation";
    }
  }
  
  return {
    gateway: {
      id: env.GATEWAY_ID || "default",
      metadata: metadata
    }
  };
}
