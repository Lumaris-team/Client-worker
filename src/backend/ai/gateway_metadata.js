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
    // Use provided model or fallback to Llama 3.1 8B
    const titleModel = model || "@cf/meta/llama-3.1-8b-instruct";
    console.log(`Generating title using model: ${titleModel}`);
    
    const response = await env.AI.run(titleModel, {
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
    return cleanedTitle || fallbackTitle();
  } catch (error) {
    console.error("Error generating conversation title, using fallback:", error.message);
    return fallbackTitle();
  }
}

// Main function to generate gateway metadata
export async function getGatewayMetadata(env, conversationId, conversationName, prompt, role = "user", titleModel = null) {
  try {
    const metadata = {
      conversationId: null,
      conversationName: null,
      timestamp: new Date().toISOString(),
      messageRole: role,
      messageContent: prompt
    };
    
    // Use existing conversationId if provided
    if (conversationId) {
      metadata.conversationId = conversationId;
      // Use existing name if provided, otherwise keep current name
      if (conversationName) {
        metadata.conversationName = conversationName;
      }
    } else {
      // Generate new conversation ID
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
