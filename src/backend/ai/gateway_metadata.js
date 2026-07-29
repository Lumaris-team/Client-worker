// Generate a long random ID for conversations
function generateConversationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}${extraRandom}`;
}

// Generate conversation title using simple heuristic (no AI to avoid recursion)
function generateConversationTitle(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return "New Conversation";
  }
  
  // Use first few words of prompt as title
  const words = prompt
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
  
  // Capitalize first letter
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  
  return title || "New Conversation";
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
      metadata.conversationName = generateConversationTitle(prompt);
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
