// Generate a long random ID for conversations
function generateConversationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}${extraRandom}`;
}

// Generate conversation title using AI
async function generateConversationTitle(env, prompt, model = null) {
  // Fallback to simple heuristic if AI not available or fails
  const fallbackTitle = () => {
    const words = prompt.split(/\s+/).slice(0, 3);
    if (words.length === 0) return "New Conversation";
    const joined = words.join(" ");
    return joined.charAt(0).toUpperCase() + joined.slice(1);
  };
  
  if (!env.AI) {
    return fallbackTitle();
  }
  
  try {
    // Use provided model or fallback to Llama 3.2 3B (lighter and currently supported)
    const titleModel = model || "@cf/meta/llama-3.2-3b-instruct";
    
    const response = await env.AI.run(titleModel, {
      messages: [
        {
          role: "user",
          content: `Create a 2-3 word title. Be concise. Text: "${prompt.substring(0, 80)}"`
        }
      ],
      max_tokens: 12
    });
    
    const title = response?.response || response?.output || "";
    let cleanedTitle = title.trim().replace(/^["']|["']$/g, '').replace(/[.,!?;:]$/g, '').substring(0, 50);
    
    // Remove common prefixes and filler words
    cleanedTitle = cleanedTitle.replace(/^(title:|title|summary:|summary|here is|the title is|a title for this is)\s*/i, '');
    cleanedTitle = cleanedTitle.trim();
    
    // Only use fallback if title is empty or too short
    if (!cleanedTitle || cleanedTitle.length < 2) {
      return fallbackTitle();
    }
    
    return cleanedTitle;
  } catch (error) {
    console.error("Error generating conversation title, using fallback:", error.message);
    return fallbackTitle();
  }
}

// Main function to generate gateway metadata
export async function getGatewayMetadata(env, conversationId, conversationName, prompt, role = "user", titleModel = null, userTimestamp = null, assistantResponse = null) {
  try {
    const metadata = {
      conversationId: conversationId || null,
      conversationName: conversationName || null,
      timestamp: userTimestamp || new Date().toISOString(),
      messageRole: role,
      messageContent: prompt
    };
    
    // Only generate new conversation ID when none is provided
    if (!metadata.conversationId) {
      metadata.conversationId = generateConversationId();
      
      // Generate conversation name if not provided
      if (conversationName) {
        metadata.conversationName = conversationName;
      } else if (prompt) {
        metadata.conversationName = await generateConversationTitle(env, prompt, titleModel);
      } else {
        metadata.conversationName = "New Conversation";
      }
    }
    
    // Return gateway options in correct format for env.AI.run
    return {
      gateway: {
        id: env.GATEWAY_ID || "default",
        metadata: metadata
      }
    };
  } catch (error) {
    // Return a safe fallback - use provided conversationId if available
    return {
      gateway: {
        id: env.GATEWAY_ID || "default",
        metadata: {
          conversationId: conversationId || generateConversationId(),
          conversationName: conversationName || "New Conversation",
          timestamp: new Date().toISOString(),
          messageRole: role,
          messageContent: prompt
        }
      }
    };
  }
}
