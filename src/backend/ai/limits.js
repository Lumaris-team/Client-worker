// Using Cloudflare API only for limits

// Fetch AI usage limits from Cloudflare API
export async function fetchCloudflareLimits(env) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  
  if (!accountId || !apiToken) {
    console.log("Cloudflare credentials not configured, returning mock data");
    // Return mock data if credentials not configured
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
    // Use standard Cloudflare analytics endpoints
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const endpoints = [
      // Standard analytics endpoint with AI filter
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql?query=SELECT%20SUM(requests)%20AS%20total_requests%20FROM%20analytics_events%20WHERE%20timestamp%20%3E%20%27${yesterday.toISOString()}%27%20AND%20timestamp%20%3C%20%27${now.toISOString()}%27`,
      // Try GraphQL analytics endpoint
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/graphql`,
      // Workers subrequests analytics
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics/subrequests?since=${yesterday.toISOString()}&until=${now.toISOString()}`,
      // Standard AI usage endpoint (the one that returned 500, try without params)
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics/ai/usage`,
      // Try with different time format
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics/ai/usage?since=${Math.floor(yesterday.getTime() / 1000)}&until=${Math.floor(now.getTime() / 1000)}`
    ];
    
    let data = null;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Cloudflare API endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          data = await response.json();
          console.log("Cloudflare API response:", JSON.stringify(data));
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned status: ${response.status}`);
          const errorText = await response.text();
          console.log(`Error response: ${errorText}`);
          lastError = response.status;
        }
      } catch (e) {
        console.log(`Endpoint ${endpoint} failed:`, e.message);
        lastError = e.message;
      }
    }
    
    if (!data) {
      console.error("All Cloudflare API endpoints failed, last error:", lastError);
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
    
    // Parse the response - Cloudflare Workers AI analytics returns different format
    let dailyUsed = 0;
    let dailyLimit = 10000;
    let modelUsage = [];
    
    console.log("Parsing Cloudflare response data:", JSON.stringify(data));
    
    if (data.success && data.result) {
      // Workers AI analytics format
      if (data.result.data && Array.isArray(data.result.data)) {
        // Sum up all usage from the data array
        dailyUsed = data.result.data.reduce((sum, item) => {
          return sum + (item.requests || item.count || item.usage || 0);
        }, 0);
        
        // Extract model-specific usage
        modelUsage = data.result.data.map(item => ({
          id: item.model || item.model_id || "unknown",
          name: item.model || item.model_name || item.model_id || "Unknown Model",
          brand: extractBrandFromModelId(item.model || item.model_id || ""),
          consumption: item.requests || item.count || item.usage || 0,
          percentage: 0 // Will calculate later
        }));
      } 
      // Alternative format with direct usage fields
      else if (data.result.usage) {
        dailyUsed = data.result.usage.requests || data.result.usage.count || data.result.usage.total || 0;
      } else if (data.result.requests) {
        dailyUsed = data.result.requests;
      } else if (data.result.count) {
        dailyUsed = data.result.count;
      } else if (data.result.total) {
        dailyUsed = data.result.total;
      }
      
      // Try to get limit from different possible structures
      if (data.result.limit) {
        dailyLimit = data.result.limit.requests || data.result.limit.count || data.result.limit.total || 10000;
      } else if (data.result.max) {
        dailyLimit = data.result.max;
      }
      
      // Try to get models from different possible structures
      if (data.result.models && Array.isArray(data.result.models)) {
        modelUsage = data.result.models.map(m => ({
          id: m.id || m.model || "unknown",
          name: m.name || m.model || "Unknown Model",
          brand: m.brand || extractBrandFromModelId(m.id || m.model || ""),
          consumption: m.usage || m.requests || m.count || 0,
          percentage: m.percentage || 0
        }));
      } else if (data.result.model_usage && Array.isArray(data.result.model_usage)) {
        modelUsage = data.result.model_usage.map(m => ({
          id: m.id || m.model || "unknown",
          name: m.name || m.model || "Unknown Model",
          brand: m.brand || extractBrandFromModelId(m.id || m.model || ""),
          consumption: m.usage || m.requests || m.count || 0,
          percentage: m.percentage || 0
        }));
      } else if (data.result.by_model && Array.isArray(data.result.by_model)) {
        modelUsage = data.result.by_model.map(m => ({
          id: m.id || m.model || "unknown",
          name: m.name || m.model || "Unknown Model",
          brand: m.brand || extractBrandFromModelId(m.id || m.model || ""),
          consumption: m.usage || m.requests || m.count || 0,
          percentage: m.percentage || 0
        }));
      }
    } else if (data.result) {
      // Try direct result access
      dailyUsed = data.result.requests || data.result.count || data.result.total || 0;
      dailyLimit = data.result.limit || data.result.max || 10000;
    }
    
    // Calculate percentages for models
    if (dailyUsed > 0) {
      modelUsage = modelUsage.map(m => ({
        ...m,
        percentage: Math.round((m.consumption / dailyUsed) * 100)
      }));
    }
    
    console.log(`Parsed usage: ${dailyUsed}/${dailyLimit}`);
    console.log(`Model usage:`, JSON.stringify(modelUsage));
    
    // Determine the unit - Cloudflare Workers AI uses "neurons" as the unit
    const unit = "neurons";
    
    const percentage = dailyLimit > 0 ? Math.round((dailyUsed / dailyLimit) * 100) : 0;
    
    return {
      daily: {
        used: dailyUsed,
        limit: dailyLimit,
        percentage: percentage,
        unit: unit
      },
      models: modelUsage
    };
  } catch (error) {
    console.error("Failed to fetch Cloudflare limits:", error);
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
