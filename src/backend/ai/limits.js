// Using Cloudflare AI Gateway logs API for token usage analytics

// Fetch AI usage limits from Cloudflare AI Gateway logs API
export async function fetchCloudflareLimits(env) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken) {
    console.log("Cloudflare credentials not configured, returning mock data");
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
  
  if (!gatewayId) {
    console.log("Gateway ID not configured, returning mock data");
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
  
  try {
    console.log("Fetching AI Gateway logs for token usage");
    
    // Fetch logs with pagination to get all data
    let allLogs = [];
    let page = 1;
    const perPage = 50;
    
    while (true) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs?page=${page}&per_page=${perPage}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway logs API error:", response.status, errorText);
        break;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.result || data.result.length === 0) {
        break;
      }
      
      allLogs = allLogs.concat(data.result);
      console.log(`Page ${page}: fetched ${data.result.length} logs, total so far: ${allLogs.length}`);
      
      // Check if there are more pages
      if (data.result.length < perPage) {
        break;
      }
      
      page++;
      
      // Safety limit to avoid infinite loops
      if (page > 100) {
        console.log("Reached safety limit of 100 pages");
        break;
      }
    }
    
    console.log(`Fetched ${allLogs.length} log entries`);
    
    // Filter logs for today and group by model
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDayISO = startOfDay.toISOString();
    
    console.log(`Filtering logs from ${startOfDayISO} onwards`);
    
    const modelMap = new Map();
    let totalTokens = 0;
    let filteredCount = 0;
    
    for (const log of allLogs) {
      const logDate = new Date(log.created_at);
      
      // Only count logs from today
      if (logDate >= startOfDay) {
        filteredCount++;
        const modelName = log.model || "unknown";
        const tokensIn = log.tokens_in || 0;
        const tokensOut = log.tokens_out || 0;
        const totalTokensForRequest = tokensIn + tokensOut;
        
        totalTokens += totalTokensForRequest;
        
        if (modelMap.has(modelName)) {
          modelMap.set(modelName, modelMap.get(modelName) + totalTokensForRequest);
        } else {
          modelMap.set(modelName, totalTokensForRequest);
        }
      }
    }
    
    console.log(`Filtered ${filteredCount} logs from today`);
    
    // Convert to array
    let modelUsage = Array.from(modelMap.entries()).map(([name, consumption]) => ({
      id: name,
      name: name,
      brand: extractBrandFromModelId(name),
      consumption: consumption,
      percentage: 0
    }));
    
    // Calculate percentages
    if (totalTokens > 0) {
      modelUsage = modelUsage.map(m => ({
        ...m,
        percentage: Math.round((m.consumption / totalTokens) * 100)
      }));
    }
    
    // Default limit (you can adjust this based on your Cloudflare plan)
    const dailyLimit = 10000;
    const percentage = dailyLimit > 0 ? Math.round((totalTokens / dailyLimit) * 100) : 0;
    
    console.log(`Daily token usage: ${totalTokens}/${dailyLimit} tokens`);
    console.log(`Model usage:`, JSON.stringify(modelUsage));
    
    return {
      daily: {
        used: totalTokens,
        limit: dailyLimit,
        percentage: percentage,
        unit: "neurons"
      },
      models: modelUsage
    };
  } catch (error) {
    console.error("Failed to fetch AI usage from logs API:", error);
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
}

// Helper function to extract brand from model ID
function extractBrandFromModelId(modelId) {
  if (!modelId) return "Unknown";
  const withoutPrefix = modelId.replace(/^@cf\//, "");
  const parts = withoutPrefix.split("/");
  
  if (parts.length >= 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  
  return "Unknown";
}
