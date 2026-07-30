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
    // Use Cloudflare Radar AI inference summary endpoint
    const endpoints = [
      // Radar AI inference summary by model (global, no account ID needed)
      `https://api.cloudflare.com/client/v4/radar/ai/inference/summary/MODEL?dateRange=1d`,
      // Try with 7d range
      `https://api.cloudflare.com/client/v4/radar/ai/inference/summary/MODEL?dateRange=7d`,
      // Try with specific dates
      `https://api.cloudflare.com/client/v4/radar/ai/inference/summary/MODEL?dateStart=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&dateEnd=${new Date().toISOString().split('T')[0]}`
    ];
    
    let data = null;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Cloudflare Radar API endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          data = await response.json();
          console.log("Cloudflare Radar API response:", JSON.stringify(data));
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
    
    // Parse the response - Cloudflare Radar AI inference format
    let dailyUsed = 0;
    let dailyLimit = 10000;
    let modelUsage = [];
    
    console.log("Parsing Cloudflare Radar response data:", JSON.stringify(data));
    
    if (data.success && data.result) {
      // Radar format: data.result contains the summary data
      const result = data.result;
      
      // Try to extract total usage from different possible structures
      if (result.data && Array.isArray(result.data)) {
        // Sum up all usage from the data array
        dailyUsed = result.data.reduce((sum, item) => {
          return sum + (item.count || item.value || item.usage || 0);
        }, 0);
        
        // Extract model-specific usage
        modelUsage = result.data.map(item => ({
          id: item.id || item.dimensionValue || item.name || "unknown",
          name: item.name || item.dimensionValue || item.id || "Unknown Model",
          brand: extractBrandFromModelId(item.name || item.dimensionValue || item.id || ""),
          consumption: item.count || item.value || item.usage || 0,
          percentage: 0 // Will calculate later
        }));
      } else if (result.summary) {
        dailyUsed = result.summary.total || result.summary.count || 0;
        if (result.summary.byModel && Array.isArray(result.summary.byModel)) {
          modelUsage = result.summary.byModel.map(m => ({
            id: m.id || m.name || "unknown",
            name: m.name || m.id || "Unknown Model",
            brand: extractBrandFromModelId(m.name || m.id || ""),
            consumption: m.count || m.value || 0,
            percentage: 0
          }));
        }
      } else if (result.count || result.total) {
        dailyUsed = result.count || result.total || 0;
      }
      
      // Radar doesn't provide account-specific limits, use default
      dailyLimit = 10000;
    } else if (data.result) {
      // Try direct result access
      dailyUsed = data.result.count || data.result.total || data.result.usage || 0;
      dailyLimit = 10000;
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
