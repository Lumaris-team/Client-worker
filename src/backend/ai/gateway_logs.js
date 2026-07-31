// Functions to fetch and parse Cloudflare Gateway AI logs

// Get list of deleted conversation IDs from KV
export async function getDeletedConversations(env) {
  try {
    const deleted = await env.DELETED_CONVERSATIONS.get("deleted_list");
    return deleted ? JSON.parse(deleted) : [];
  } catch (error) {
    console.error("Failed to get deleted conversations:", error);
    return [];
  }
}

// Add conversation ID to deleted list in KV
export async function addDeletedConversation(env, conversationId) {
  try {
    const deleted = await getDeletedConversations(env);
    if (!deleted.includes(conversationId)) {
      deleted.push(conversationId);
      await env.DELETED_CONVERSATIONS.put("deleted_list", JSON.stringify(deleted));
      console.log(`Added conversation ${conversationId} to deleted list`);
    }
  } catch (error) {
    console.error("Failed to add deleted conversation:", error);
  }
}

// Fetch Gateway AI logs from Cloudflare API
export async function fetchGatewayLogs(env, options = {}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken || !gatewayId) {
    console.log("Cloudflare credentials or Gateway ID not configured");
    return { logs: [], error: "missing_credentials" };
  }
  
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const conversationId = options.conversationId || null;
  
  try {
    // Use Cloudflare AI Gateway logs API to fetch Gateway AI logs
    // This endpoint provides access to AI Gateway request logs
    let endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs`;
    
    // Add query parameters
    const params = new URLSearchParams();
    
    // Add pagination - API limits per_page to 50
    const perPage = Math.min(limit, 50);
    params.append('page', '1');
    params.append('per_page', perPage.toString());
    
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
      // Return empty logs instead of error to allow UI to function
      return { logs: [], error: null };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      console.error("Invalid response from Cloudflare Gateway API");
      return { logs: [], error: null };
    }
    
    // The analytics endpoint returns different structure, adapt it
    const logs = Array.isArray(data.result) ? data.result : (data.result.data || []);
    
    return { logs, error: null };
    
  } catch (error) {
    console.error("Failed to fetch Gateway logs:", error);
    // Return empty logs instead of error to allow UI to function
    return { logs: [], error: null };
  }
}

// Parse Gateway logs to extract conversations
export async function parseConversationsFromLogs(logs, env = null) {
  const conversations = new Map();
  
  // Get list of deleted conversations to filter them out
  const deletedConversationIds = env ? await getDeletedConversations(env) : [];
  
  for (const log of logs) {
    try {
      const metadata = log?.gateway?.metadata || log?.metadata || {};
      const conversationId = metadata.conversationId;
      const conversationName = metadata.conversationName;
      const timestamp = log.timestamp || new Date().toISOString();
      
      if (!conversationId) continue;
      
      // Skip deleted conversations
      if (deletedConversationIds.includes(conversationId)) {
        continue;
      }
      
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
  console.log(`Fetching conversations list with limit=${limit}, offset=${offset}`);
  
  const { logs, error } = await fetchGatewayLogs(env, { limit, offset });
  
  if (error) {
    console.error("Error fetching conversations list:", error);
    return { conversations: [], error, hasMore: false };
  }
  
  console.log(`Fetched ${logs.length} logs for conversations list`);
  
  const conversations = await parseConversationsFromLogs(logs, env);
  
  console.log(`Parsed ${conversations.length} conversations from logs`);
  
  // Determine if there are more conversations
  const hasMore = conversations.length >= limit;
  
  console.log(`Returning ${conversations.length} conversations, hasMore=${hasMore}`);
  
  return { conversations, error: null, hasMore };
}

// Get specific conversation with messages
export async function getConversationMessages(env, conversationId, limit = 100, offset = 0) {
  console.log(`Loading conversation messages for conversation ID: ${conversationId}`);
  
  // Check if conversation is deleted
  const deletedConversationIds = await getDeletedConversations(env);
  if (deletedConversationIds.includes(conversationId)) {
    console.log(`Conversation ${conversationId} is deleted`);
    return { messages: [], error: "conversation_deleted", hasMore: false };
  }
  
  // Fetch all logs (API doesn't support filtering by conversationId)
  // We'll filter on the server side
  const { logs, error } = await fetchGatewayLogs(env, { 
    limit: 1000, // Fetch more logs to find the conversation
    offset: 0
  });
  
  if (error) {
    console.error("Error fetching conversation messages:", error);
    return { messages: [], error, hasMore: false };
  }
  
  console.log(`Fetched ${logs.length} total logs, filtering for conversation ${conversationId}`);
  
  // Filter logs for this specific conversation
  const conversationLogs = logs.filter(log => {
    const metadata = log?.gateway?.metadata || log?.metadata || {};
    return metadata.conversationId === conversationId;
  });
  
  console.log(`Found ${conversationLogs.length} logs for conversation ${conversationId}`);
  
  // Parse only the logs for this conversation
  const conversations = await parseConversationsFromLogs(conversationLogs, env);
  console.log(`Parsed ${conversations.length} conversations from filtered logs`);
  
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    console.error(`Conversation ${conversationId} not found in parsed conversations`);
    console.log("Available conversation IDs:", conversations.map(c => c.id));
    return { messages: [], error: "conversation_not_found", hasMore: false };
  }
  
  console.log(`Found conversation with ${conversation.messages.length} messages`);
  
  // Sort messages by timestamp
  const sortedMessages = conversation.messages.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // Apply pagination
  const paginatedMessages = sortedMessages.slice(offset, offset + limit);
  const hasMore = sortedMessages.length > offset + limit;
  
  console.log(`Returning ${paginatedMessages.length} messages (offset=${offset}, limit=${limit}), hasMore=${hasMore}`);
  
  return { messages: paginatedMessages, error: null, hasMore };
}
