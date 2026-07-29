// Functions to fetch and parse Cloudflare Gateway AI logs

// Fetch Gateway AI logs from Cloudflare API
export async function fetchGatewayLogs(env, options = {}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken || !gatewayId) {
    console.log("Cloudflare credentials or Gateway ID not configured");
    return { logs: [], error: "missing_credentials" };
  }
  
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  const conversationId = options.conversationId || null;
  
  try {
    // Try to fetch logs from Cloudflare Gateway AI API
    // Note: The exact endpoint may vary based on Cloudflare's API structure
    let endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/gateway/${gatewayId}/logs`;
    
    // Add query parameters
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (offset > 0) {
      params.append('offset', offset);
    }
    
    // If filtering by conversation, add the filter
    if (conversationId) {
      params.append('filter', `conversation_id:${conversationId}`);
    }
    
    endpoint += `?${params.toString()}`;
    
    console.log(`Fetching Gateway logs from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare Gateway API error:", response.status, errorText);
      return { logs: [], error: `api_error_${response.status}` };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      console.error("Invalid response from Cloudflare Gateway API");
      return { logs: [], error: "invalid_response" };
    }
    
    return { logs: data.result, error: null };
    
  } catch (error) {
    console.error("Failed to fetch Gateway logs:", error);
    return { logs: [], error: error.message };
  }
}

// Parse Gateway logs to extract conversations
export async function parseConversationsFromLogs(logs) {
  const conversations = new Map();
  
  for (const log of logs) {
    try {
      const metadata = log?.gateway?.metadata || log?.metadata || {};
      const conversationId = metadata.conversationId;
      const conversationName = metadata.conversationName;
      const timestamp = log.timestamp || new Date().toISOString();
      
      if (!conversationId) continue;
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          name: conversationName || "Untitled Conversation",
          lastPromptDate: timestamp,
          messageCount: 0,
          messages: []
        });
      }
      
      const conversation = conversations.get(conversationId);
      
      // Update last prompt date if this log is more recent
      if (new Date(timestamp) > new Date(conversation.lastPromptDate)) {
        conversation.lastPromptDate = timestamp;
      }
      
      conversation.messageCount++;
      
      // Extract message content if available
      const request = log?.request || {};
      const response = log?.response || {};
      
      if (request?.prompt || request?.messages) {
        conversation.messages.push({
          role: "user",
          content: request.prompt || (request.messages?.[0]?.content || ""),
          timestamp: timestamp
        });
      }
      
      if (response?.response || response?.output) {
        conversation.messages.push({
          role: "assistant",
          content: response.response || response.output || "",
          timestamp: timestamp
        });
      }
      
    } catch (error) {
      console.error("Error parsing log entry:", error);
    }
  }
  
  // Convert to array and sort by last prompt date
  const sortedConversations = Array.from(conversations.values()).sort((a, b) => {
    return new Date(b.lastPromptDate) - new Date(a.lastPromptDate);
  });
  
  return sortedConversations;
}

// Get conversations list with pagination
export async function getConversations(env, limit = 100, offset = 0) {
  const { logs, error } = await fetchGatewayLogs(env, { limit, offset });
  
  if (error) {
    console.error("Error fetching conversations:", error);
    return { conversations: [], error, hasMore: false };
  }
  
  const conversations = await parseConversationsFromLogs(logs);
  
  // Determine if there are more conversations
  const hasMore = conversations.length >= limit;
  
  return { conversations, error: null, hasMore };
}

// Get specific conversation with messages
export async function getConversationMessages(env, conversationId, limit = 100, offset = 0) {
  const { logs, error } = await fetchGatewayLogs(env, { 
    limit, 
    offset, 
    conversationId 
  });
  
  if (error) {
    console.error("Error fetching conversation messages:", error);
    return { messages: [], error, hasMore: false };
  }
  
  const conversations = await parseConversationsFromLogs(logs);
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return { messages: [], error: "conversation_not_found", hasMore: false };
  }
  
  // Sort messages by timestamp
  const sortedMessages = conversation.messages.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  const hasMore = sortedMessages.length >= limit;
  
  return { messages: sortedMessages, error: null, hasMore };
}
