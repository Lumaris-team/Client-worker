// Generate a long random ID for conversations
function generateConversationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraRandom = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}${extraRandom}`;
}

// Generate conversation title using AI
async function generateConversationTitle(env, prompt) {
  try {
    if (!env.AI) {
      // Fallback to simple heuristic if AI not available
      const words = prompt.split(/\s+/).slice(0, 3);
      const title = words.join(" ");
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Use Llama 3.1 8B for title generation
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, descriptive conversation titles. Generate a title of exactly 3 words maximum that captures the essence of the conversation. Return only the title, nothing else. No punctuation."
        },
        {
          role: "user",
          content: `Create a conversation title of max 3 words for this first prompt: "${prompt.substring(0, 200)}"`
        }
      ],
      max_tokens: 30
    });
    
    const title = response?.response || response?.output || "";
    const cleanedTitle = title.trim().replace(/^["']|["']$/g, '').replace(/[.,!?;:]$/g, '').substring(0, 50);
    return cleanedTitle || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    // Fallback to simple heuristic - max 3 words
    const words = prompt.split(/\s+/).slice(0, 3);
    
    if (words.length === 0) {
      return "New Conversation";
    }
    
    const joined = words.join(" ");
    const title = joined.charAt(0).toUpperCase() + joined.slice(1);
    
    return title || "New Conversation";
  }
}

// Main function to generate gateway metadata
export async function getGatewayMetadata(env, conversationId, conversationName, prompt, role = "user") {
  try {
    const metadata = {
      conversationId: null,
      conversationName: null,
      timestamp: new Date().toISOString(),
      messageRole: role,
      messageContent: prompt
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
  } catch (error) {
    console.error("Error in getGatewayMetadata:", error);
    // Return a safe fallback
    return {
      gateway: {
        id: env.GATEWAY_ID || "default",
        metadata: {
          conversationId: generateConversationId(),
          conversationName: "New Conversation",
          timestamp: new Date().toISOString(),
          messageRole: role,
          messageContent: prompt
        }
      }
    };
  }
}
