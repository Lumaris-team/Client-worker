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

// Add a conversation to the deleted list
export async function addDeletedConversation(env, conversationId) {
  try {
    const deleted = await getDeletedConversations(env);
    if (!deleted.includes(conversationId)) {
      deleted.push(conversationId);
      await env.DELETED_CONVERSATIONS.put("deleted_list", JSON.stringify(deleted));
    }
  } catch (error) {
    console.error("Failed to add deleted conversation:", error);
  }
}

// Mark a specific message as deleted (for error handling)
export async function markMessageAsDeleted(env, conversationId, messageContent, role) {
  try {
    const deletedMessages = await getDeletedMessages(env);
    const messageKey = `${conversationId}:${role}:${messageContent.substring(0, 100)}`;
    
    if (!deletedMessages.includes(messageKey)) {
      deletedMessages.push(messageKey);
      await env.DELETED_MESSAGES.put("deleted_list", JSON.stringify(deletedMessages));
    }
  } catch (error) {
    console.error("Failed to mark message as deleted:", error);
  }
}

// Get list of deleted messages
export async function getDeletedMessages(env) {
  try {
    const deleted = await env.DELETED_MESSAGES.get("deleted_list");
    return deleted ? JSON.parse(deleted) : [];
  } catch (error) {
    return [];
  }
}

// Fetch Gateway AI logs from Cloudflare API
export async function fetchGatewayLogs(env, options = {}) {
  const { limit = 50, page = 1, metadataFilters = [] } = options;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken || !gatewayId) {
    return { logs: [], error: "missing_credentials", hasMore: false };
  }
  
  try {
    const perPage = Math.min(limit, 50);
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    
    // Add metadata filters if provided (according to Cloudflare API docs)
    if (metadataFilters.length > 0) {
      url.searchParams.append('filters', JSON.stringify(metadataFilters));
    }
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { logs: [], error: errorText, hasMore: false };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      return { logs: [], error: "Invalid response", hasMore: false };
    }
    
    // Cloudflare API returns logs in reverse chronological order (newest first)
    // Reverse them to get chronological order (oldest first)
    const chronologicalLogs = data.result.reverse();
    
    const hasMore = data.result.length >= perPage;
    
    return { logs: chronologicalLogs, error: null, hasMore };
  } catch (error) {
    return { logs: [], error: error.message, hasMore: false };
  }
}

// Parse Gateway logs to extract conversations
export async function parseConversationsFromLogs(logs, env = null) {
  const conversations = new Map();
  
  // Get list of deleted conversations to filter them out
  const deletedConversationIds = env ? await getDeletedConversations(env) : [];
  
  // Get list of deleted messages to filter them out
  const deletedMessageKeys = env ? await getDeletedMessages(env) : [];
  
  for (const log of logs) {
    try {
      if (!log) {
        continue;
      }
      
      // IMPORTANT: Cloudflare API returns metadata as a STRING, not an object
      // We need to parse it as JSON
      let metadata = {};
      try {
        const metadataString = log?.gateway?.metadata || log?.metadata || "{}";
        if (typeof metadataString === 'string') {
          metadata = JSON.parse(metadataString);
        } else {
          metadata = metadataString;
        }
      } catch (parseError) {
        // If parsing fails, use empty object
        metadata = {};
      }
      
      const conversationId = metadata.conversationId;
      const conversationName = metadata.conversationName;
      const timestamp = metadata.timestamp || log.timestamp || log.created_at || new Date().toISOString();
      const messageRole = metadata.messageRole;
      const messageContent = metadata.messageContent;
      const previousAssistantResponse = metadata.previousAssistantResponse;
      const previousAssistantTimestamp = metadata.previousAssistantTimestamp;
      
      if (!conversationId) {
        continue;
      }
      
      // Skip deleted conversations
      if (deletedConversationIds.includes(conversationId)) {
        continue;
      }
      
      // Skip deleted messages
      const messageKey = `${conversationId}:${messageRole}:${messageContent?.substring(0, 100) || ''}`;
      if (deletedMessageKeys.includes(messageKey)) {
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
      
      conversation.messageCount++;
      
      // Extract message from metadata if available (new format)
      if (messageRole && messageContent) {
        conversation.messages.push({
          role: messageRole,
          content: messageContent,
          timestamp: timestamp
        });
      }
      
      // Extract previous assistant response from metadata if available
      // This is how we save assistant responses without making extra AI calls
      if (previousAssistantResponse && previousAssistantTimestamp) {
        conversation.messages.push({
          role: "assistant",
          content: previousAssistantResponse,
          timestamp: previousAssistantTimestamp
        });
      }
      
    } catch (error) {
      // Skip malformed logs silently
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
  const page = Math.floor(offset / 50) + 1;
  
  const { logs, error, hasMore } = await fetchGatewayLogs(env, { limit, page });
  
  if (error) {
    return { conversations: [], error, hasMore: false };
  }
  
  const conversations = await parseConversationsFromLogs(logs, env);
  
  return { conversations, error: null, hasMore };
}

// Get specific conversation with messages
export async function getConversationMessages(env, conversationId, limit = 100, offset = 0) {
  if (!conversationId) {
    return { messages: [], error: "invalid_conversation_id", hasMore: false };
  }
  
  const deletedConversationIds = await getDeletedConversations(env);
  if (deletedConversationIds.includes(conversationId)) {
    return { messages: [], error: "conversation_deleted", hasMore: false };
  }
  
  // Fetch all logs without pagination limit to get everything
  const allLogs = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;
  
  while (hasMore) {
    const { logs: pageLogs, hasMore: pageHasMore } = await fetchGatewayLogs(env, { limit: perPage, page });
    allLogs.push(...pageLogs);
    
    if (!pageHasMore || pageLogs.length === 0) {
      break;
    }
    
    if (page >= 500) break; // Safety limit
    page++;
  }
  
  // Filter and parse all logs
  const messages = allLogs.map(log => {
    let metadata = {};
    try {
      const metadataString = log?.metadata || log?.gateway?.metadata || "{}";
      if (typeof metadataString === 'string') {
        metadata = JSON.parse(metadataString);
      } else {
        metadata = metadataString;
      }
    } catch (e) {
      metadata = {};
    }
    
    // Only include logs matching the conversationId with valid role/content
    if (metadata.conversationId !== conversationId) {
      return null;
    }
    
    if (!metadata.messageRole || !metadata.messageContent) {
      return null;
    }
    
    return {
      role: metadata.messageRole,
      content: metadata.messageContent,
      timestamp: metadata.timestamp || log.created_at || log.timestamp
    };
  }).filter(m => m !== null);
  
  // Sort chronologically
  messages.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeA - timeB;
  });
  
  const paginatedMessages = messages.slice(offset, offset + limit);
  const hasMoreMessages = messages.length > offset + limit;
  
  return { messages: paginatedMessages, error: null, hasMore: hasMoreMessages };
}
