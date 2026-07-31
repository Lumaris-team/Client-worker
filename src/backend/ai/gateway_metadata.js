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

    // Use a simple model to generate a short title
    if (env.AI) {
      try {
        const titlePrompt = `Generate a very short (3-5 words) title for this conversation. User said: "${strPrompt.substring(0, 200)}". Return ONLY the title, nothing else.`;
        
        const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [{ role: "user", content: titlePrompt }],
          max_tokens: 20,
        }, null); // No gateway metadata to avoid recursion
        
        const title = response?.response || response?.output || "";
        const cleanedTitle = title.trim().replace(/^["']|["']$/g, '').substring(0, 50);
        
        if (cleanedTitle && cleanedTitle.length > 2) {
          // Capitalize first letter
          return cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
        }
      } catch (aiError) {
        console.error("AI title generation failed, falling back to heuristic:", aiError);
      }
    }
    
    // Fallback to heuristic if AI fails
    const trimmed = strPrompt.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0).slice(0, 3);
    
    if (words.length === 0) {
      return "New Conversation";
    }
    
    const joined = words.join(" ");
    const title = joined.charAt(0).toUpperCase() + joined.slice(1);
    
    return title || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Conversation";
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
