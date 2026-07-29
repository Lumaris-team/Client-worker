// Generate a long random ID for conversations
function generateConversationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}${extraRandom}`;
}

// Generate conversation title using simple heuristic (no AI to avoid recursion)
function generateConversationTitle(prompt) {
  try {
    // Handle null/undefined
    if (prompt === null || prompt === undefined) {
      return "New Conversation";
    }
    
    // Convert to string if needed
    const strPrompt = String(prompt);
    
    // Check if empty after conversion
    if (!strPrompt || strPrompt.trim() === "") {
      return "New Conversation";
    }
    
    // Use first few words of prompt as title
    const trimmed = strPrompt.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0).slice(0, 3);
    
    if (words.length === 0) {
      return "New Conversation";
    }
    
    const joined = words.join(" ");
    
    // Capitalize first letter
    const title = joined.charAt(0).toUpperCase() + joined.slice(1);
    
    return title || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Conversation";
  }
}

// Main function to generate gateway metadata
export async function getGatewayMetadata(env, conversationId, conversationName, prompt) {
  try {
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
  } catch (error) {
    console.error("Error in getGatewayMetadata:", error);
    // Return a safe fallback
    return {
      gateway: {
        id: env.GATEWAY_ID || "default",
        metadata: {
          conversationId: generateConversationId(),
          conversationName: "New Conversation",
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}
