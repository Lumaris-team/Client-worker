import { authedFetch } from "/lib/auth.js";

const AI_BASE = "/api/ai";

const state = {
  models: [],
  categorizedModels: {},
  currentSection: "ai",
  loading: false,
  selectedCategory: "basic",
  selectedCompany: null,
  selectedModel: null,
  conversationId: null,
  conversationName: null,
  isNewConversation: true,
  selectorVisible: true,
  conversationsOffset: 0,
  messagesOffset: 0,
  currentConversationModel: null,
};

// Mapping from frontend category names to backend category names
const CATEGORY_ALIASES = {
  "ai": "basic",
  "search-web": "search_web",
  "reasoning": "reasonning",
  "pictures": "pictures",
};

/* ===================== API ===================== */
async function aiGet(sub, customName = null) {
  const requestName = customName || `AI GET ${sub}`;
  const res = await authedFetch(`${AI_BASE}/${sub}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Request-Name": requestName,
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid API response");
  }
  if (json && json.error) {
    throw new Error(json.error);
  }
  const data = json && Object.prototype.hasOwnProperty.call(json, "resp")
    ? json.resp
    : json;
  if (data && data.ok === false && data.error) {
    throw new Error(data.error);
  }
  console.log("API Response for", sub, ":", data);
  return data;
}

async function aiPost(sub, body, customName = null) {
  const requestName = customName || `AI POST ${sub}`;
  const res = await authedFetch(`${AI_BASE}/${sub}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Request-Name": requestName,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return Object.prototype.hasOwnProperty.call(json, "resp") ? json.resp : json;
  } catch {
    return null;
  }
}

/* ===================== MODELS ===================== */
async function loadModels() {
  try {
    const data = await aiGet("categories");
    console.log("Loaded models data:", data);
    if (data && data.availableModels) {
      state.models = data.availableModels;
      state.categorizedModels = data.categorizedModels || {};
      console.log("Categorized models:", state.categorizedModels);
      populateModelSelects();
    }
  } catch (error) {
    console.error("Failed to load models:", error);
    showError("Failed to load available models");
  }
}

function populateModelSelects() {
  const categorySelect = document.getElementById("category-select");
  const companySelect = document.getElementById("company-select");
  const modelSelect = document.getElementById("model-select");
  
  if (!categorySelect || !companySelect || !modelSelect) return;
  
  // Setup category dropdown
  setupCategoryDropdown(categorySelect);
  
  // Setup company dropdown
  setupCompanyDropdown(companySelect);
  
  // Setup model dropdown
  setupModelDropdown(modelSelect);
  
  // Initial population
  populateCompanies();
}

function setupCategoryDropdown(select) {
  const trigger = select.querySelector(".custom-select-trigger");
  const optionsContainer = select.querySelector(".custom-options");
  
  select.addEventListener("click", (e) => {
    if (e.target.closest(".custom-option")) return;
    
    // Close all other dropdowns
    document.querySelectorAll(".custom-select.open").forEach(openSelect => {
      if (openSelect !== select) {
        openSelect.classList.remove("open");
      }
    });
    
    select.classList.toggle("open");
  });
  
  optionsContainer.querySelectorAll(".custom-option").forEach(option => {
    option.addEventListener("click", () => {
      optionsContainer.querySelectorAll(".custom-option").forEach(opt => opt.classList.remove("selected"));
      option.classList.add("selected");
      trigger.textContent = option.textContent;
      state.selectedCategory = option.dataset.value;
      state.selectedModel = null; // Reset selected model when category changes
      select.classList.remove("open");
      populateCompanies();
    });
  });
  
  // Set default
  const defaultOption = optionsContainer.querySelector('[data-value="basic"]');
  if (defaultOption) {
    defaultOption.classList.add("selected");
  }
}

function setupCompanyDropdown(select) {
  const trigger = select.querySelector(".custom-select-trigger");
  const optionsContainer = select.querySelector(".custom-options");
  
  select.addEventListener("click", (e) => {
    if (e.target.closest(".custom-option")) return;
    
    // Close all other dropdowns
    document.querySelectorAll(".custom-select.open").forEach(openSelect => {
      if (openSelect !== select) {
        openSelect.classList.remove("open");
      }
    });
    
    select.classList.toggle("open");
  });
  
  document.addEventListener("click", (e) => {
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });
}

function setupModelDropdown(select) {
  const trigger = select.querySelector(".custom-select-trigger");
  const optionsContainer = select.querySelector(".custom-options");
  
  select.addEventListener("click", (e) => {
    if (e.target.closest(".custom-option")) return;
    
    // Close all other dropdowns
    document.querySelectorAll(".custom-select.open").forEach(openSelect => {
      if (openSelect !== select) {
        openSelect.classList.remove("open");
      }
    });
    
    select.classList.toggle("open");
  });
  
  document.addEventListener("click", (e) => {
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });
}

function populateCompanies() {
  const companySelect = document.getElementById("company-select");
  if (!companySelect) return;
  
  const trigger = companySelect.querySelector(".custom-select-trigger");
  const optionsContainer = companySelect.querySelector(".custom-options");
  
  optionsContainer.innerHTML = "";
  
  console.log("Populating companies for category:", state.selectedCategory);
  const categoryModels = state.categorizedModels[state.selectedCategory] || [];
  console.log("Category models:", categoryModels);
  
  if (categoryModels.length === 0) {
    trigger.textContent = "No models available";
    return;
  }
  
  const companies = [...new Set(categoryModels.map(model => model.brand || "Unknown"))].sort();
  console.log("Available companies:", companies);
  
  companies.forEach(company => {
    const option = document.createElement("div");
    option.className = "custom-option";
    option.textContent = company;
    option.dataset.company = company;
    optionsContainer.appendChild(option);
    
    option.addEventListener("click", () => {
      optionsContainer.querySelectorAll(".custom-option").forEach(opt => opt.classList.remove("selected"));
      option.classList.add("selected");
      trigger.textContent = company;
      state.selectedCompany = company;
      state.selectedModel = null; // Reset selected model when company changes
      companySelect.classList.remove("open");
      populateModels();
    });
  });
  
  // Select first company by default
  if (companies.length > 0) {
    const firstOption = optionsContainer.querySelector(".custom-option");
    if (firstOption) {
      firstOption.classList.add("selected");
      trigger.textContent = companies[0];
      state.selectedCompany = companies[0];
      state.selectedModel = null; // Reset selected model when category changes
      populateModels();
    }
  }
}

function populateModels() {
  const modelSelect = document.getElementById("model-select");
  if (!modelSelect) return;
  
  const trigger = modelSelect.querySelector(".custom-select-trigger");
  const optionsContainer = modelSelect.querySelector(".custom-options");
  
  optionsContainer.innerHTML = "";
  
  console.log("Populating models for category:", state.selectedCategory, "company:", state.selectedCompany);
  const categoryModels = state.categorizedModels[state.selectedCategory] || [];
  console.log("Category models:", categoryModels);
  const companyModels = categoryModels.filter(model => (model.brand || "Unknown") === state.selectedCompany);
  console.log("Company models:", companyModels);
  
  if (companyModels.length === 0) {
    trigger.textContent = "No models for this company";
    return;
  }
  
  companyModels.forEach(model => {
    const option = document.createElement("div");
    option.className = "custom-option";
    option.textContent = model.name;
    option.dataset.model = model.name;
    optionsContainer.appendChild(option);
    
    option.addEventListener("click", () => {
      optionsContainer.querySelectorAll(".custom-option").forEach(opt => opt.classList.remove("selected"));
      option.classList.add("selected");
      trigger.textContent = model.name;
      state.selectedModel = model.name;
      modelSelect.classList.remove("open");
      updateConsumptionDisplay();
    });
  });
  
  // Select first model by default
  if (companyModels.length > 0) {
    const firstOption = optionsContainer.querySelector(".custom-option");
    if (firstOption) {
      firstOption.classList.add("selected");
      trigger.textContent = companyModels[0].name;
      state.selectedModel = companyModels[0].name;
      updateConsumptionDisplay();
    }
  }
}

function updateConsumptionDisplay() {
  const consumptionDisplay = document.getElementById("consumption-display");
  if (!consumptionDisplay) return;
  
  const categoryModels = state.categorizedModels[state.selectedCategory] || [];
  const model = categoryModels.find(m => m.name === state.selectedModel);
  
  if (model) {
    const percentage = model.consumptionPercentage || 0;
    const barColor = percentage > 80 ? '#ff6b6b' : percentage > 50 ? '#ffd93d' : '#52d6a8';
    
    consumptionDisplay.innerHTML = `
      <div class="consumption-bar-container">
        <div class="consumption-bar-fill" style="width: ${percentage}%; background: ${barColor};"></div>
      </div>
    `;
  }
}

/* ===================== CONVERSATIONS ===================== */
async function loadConversations(offset = 0, limit = 100) {
  try {
    const url = `conversations?offset=${offset}&limit=${limit}`;
    const data = await aiGet(url);
    console.log("Loaded conversations:", data);
    return {
      conversations: data.conversations || [],
      hasMore: data.hasMore || false,
      error: data.error
    };
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return { conversations: [], hasMore: false, error: error.message };
  }
}

async function loadLimits() {
  try {
    const data = await aiGet("limits", "Load Limits");
    console.log("Loaded limits:", data);
    return data;
  } catch (error) {
    console.error("Failed to load limits:", error);
    return null;
  }
}

function setupPromptBar() {
  const promptInput = document.getElementById("prompt-input");
  const submitButton = document.getElementById("prompt-submit");

  if (!promptInput || !submitButton) return;

  // Auto-resize textarea
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + "px";
  });

  // Submit on Enter (but Shift+Enter for new line)
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitButton.click();
    }
  });

  submitButton.addEventListener("click", () => {
    const message = promptInput.value.trim();
    if (!message) return;

    promptInput.value = "";
    promptInput.style.height = "auto";

    sendMessage(message);
  });
}

async function sendMessage(message) {
  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  // Add user message
  const userMessageHtml = `
    <div class="chat-message user">
      <div class="chat-bubble">${escapeHtml(message)}</div>
    </div>
  `;
  chatContainer.insertAdjacentHTML("beforeend", userMessageHtml);

  // Add loading message
  const loadingHtml = `
    <div class="chat-message ai loading">
      <div class="chat-bubble">
        <div class="loading-dot"></div>
        <div class="loading-dot" style="animation-delay: 0.2s;"></div>
        <div class="loading-dot" style="animation-delay: 0.4s;"></div>
      </div>
    </div>
  `;
  chatContainer.insertAdjacentHTML("beforeend", loadingHtml);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const category = CATEGORY_ALIASES[state.selectedCategory] || state.selectedCategory;
    
    // Find the full model ID from the categorized models
    const categoryModels = state.categorizedModels[state.selectedCategory] || [];
    const selectedModelData = categoryModels.find(m => m.name === state.selectedModel);
    const modelId = selectedModelData?.id || state.selectedModel;
    
    // Find the lowest consumption model for title generation
    const allModels = state.categorizedModels[state.selectedCategory] || [];
    const lowestConsumptionModel = allModels.reduce((min, m) => 
      (m.consumptionPercentage < min.consumptionPercentage ? m : min), allModels[0]);
    const titleGenerationModel = lowestConsumptionModel?.id || modelId;

    const response = await aiPost("chat", {
      prompt: message,
      model: modelId,
      category,
      conversationId: state.conversationId,
      conversationName: state.conversationName,
      titleGenerationModel: !state.conversationId ? titleGenerationModel : null,
    });
    console.log("Sent to backend: conversationId =", state.conversationId, "conversationName =", state.conversationName);

    // Remove loading message
    const loadingMessage = chatContainer.querySelector(".chat-message.loading");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    // Extract the actual result from the response structure
    // aiPost already unwraps .resp if present
    const result = response?.result || response;
    
    // Always send conversation ID and name in subsequent requests
    // These might be at the top level or inside result
    const conversationId = response?.conversationId || result?.conversationId;
    const conversationName = response?.conversationName || result?.conversationName;
    
    console.log("Received from backend: conversationId =", conversationId, "conversationName =", conversationName);
    
    if (conversationId) {
      state.conversationId = conversationId;
    }
    if (conversationName) {
      state.conversationName = conversationName;
    }
    
    console.log("State after update: conversationId =", state.conversationId, "conversationName =", state.conversationName);

    if (result && result.response) {
      displayAIMessage(result.response);
      
      // If this was a new conversation, hide selector after first message
      if (result.isNewConversation) {
        state.selectorVisible = false;
        updateSelectorVisibility();
      }
    } else {
      console.error("Invalid response structure:", response);
      const errorMsg = response?.error || "This model is not capable of handling this request";
      showError(errorMsg);
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    
    // Remove loading message
    const loadingMessage = chatContainer.querySelector(".chat-message.loading");
    if (loadingMessage) {
      loadingMessage.remove();
    }
    
    // Determine error type and show appropriate message
    let errorMsg = "Network problem - please try again";
    if (error.message && error.message.includes("fetch")) {
      errorMsg = "Network problem - please check your connection";
    } else if (error.message && error.message.includes("timeout")) {
      errorMsg = "Request timed out - please try again";
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    showError(errorMsg);
  }
}

function displayAIMessage(content) {
  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  const aiMessageHtml = `
    <div class="chat-message ai">
      <div class="chat-bubble">${formatMessage(content)}</div>
    </div>
  `;
  chatContainer.insertAdjacentHTML("beforeend", aiMessageHtml);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatMessage(content) {
  // Basic formatting - you can extend this
  return escapeHtml(content)
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  const errorHtml = `
    <div class="chat-message ai">
      <div class="chat-bubble" style="color: #ff6b6b;">${escapeHtml(message)}</div>
    </div>
  `;
  chatContainer.insertAdjacentHTML("beforeend", errorHtml);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/* ===================== SIDEBAR BUTTONS ===================== */
function setupSidebarButtons() {
  const newConversationBtn = document.getElementById("new-conversation-btn");
  const conversationsBtn = document.getElementById("conversations-btn");
  const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
  const limitsBtn = document.getElementById("limits-btn");

  const allButtons = document.querySelectorAll(".ai-nav");

  function setActiveButton(activeBtn) {
    // Don't deactivate other buttons when toggle-selector is clicked (it's independent)
    if (activeBtn === toggleSelectorBtn) {
      if (activeBtn) activeBtn.classList.toggle("active");
      return;
    }

    allButtons.forEach(btn => {
      if (btn !== activeBtn && btn !== toggleSelectorBtn) {
        btn.classList.remove("active");
      }
    });

    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  if (newConversationBtn) {
    newConversationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setActiveButton(newConversationBtn);
      startNewConversation();
    });
  }

  if (conversationsBtn) {
    conversationsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setActiveButton(conversationsBtn);
      showConversations();
    });
  }

  if (toggleSelectorBtn) {
    toggleSelectorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setActiveButton(toggleSelectorBtn);
      toggleSelector();
    });
  }

  if (limitsBtn) {
    limitsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setActiveButton(limitsBtn);
      showLimits();
    });
  }
}

function toggleSelector() {
  state.selectorVisible = !state.selectorVisible;

  // Show toggle-selector button and sync active state
  const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
  if (toggleSelectorBtn) {
    toggleSelectorBtn.style.display = "flex";
    // Sync active state with visibility (active when visible)
    if (state.selectorVisible) {
      toggleSelectorBtn.classList.add("active");
      toggleSelectorBtn.style.opacity = "1";
    } else {
      toggleSelectorBtn.classList.remove("active");
      toggleSelectorBtn.style.opacity = "0.5";
    }
  }

  updateSelectorVisibility();
}

function updateSelectorVisibility() {
  const selectorBar = document.getElementById("selector-bar");
  if (!selectorBar) return;

  if (state.selectorVisible) {
    selectorBar.style.display = "flex";
  } else {
    selectorBar.style.display = "none";
  }
}

function startNewConversation() {
  state.conversationId = null;
  state.conversationName = null;
  state.isNewConversation = true;
  state.currentConversationModel = null;
  state.messagesOffset = 0;

  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  chatContainer.innerHTML = "";

  // Show selector when starting new conversation
  state.selectorVisible = true;
  updateSelectorVisibility();

  // Show and activate toggle-selector button (since selector is visible)
  const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
  if (toggleSelectorBtn) {
    toggleSelectorBtn.style.display = "flex";
    toggleSelectorBtn.classList.add("active");
    toggleSelectorBtn.style.opacity = "1";
  }

  // Show prompt bar
  const promptBar = document.querySelector(".ai-prompt-bar");
  if (promptBar) {
    promptBar.style.display = "flex";
  }
}

async function showConversations(offset = 0) {
  // Hide selector when showing conversations
  state.selectorVisible = false;
  updateSelectorVisibility();

  // Hide toggle-selector button when showing conversations
  const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
  if (toggleSelectorBtn) {
    toggleSelectorBtn.style.display = "none";
  }

  // Hide prompt bar when showing conversations
  const promptBar = document.querySelector(".ai-prompt-bar");
  if (promptBar) {
    promptBar.style.display = "none";
  }

  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  // If this is the first load, clear and show loading
  if (offset === 0) {
    state.conversationsOffset = 0;
    chatContainer.innerHTML = `
      <div class="chat-message ai">
        <div class="chat-bubble">Loading conversations...</div>
      </div>
    `;
  }

  // Load conversations in background with custom request name
  const url = `conversations?offset=${offset}&limit=100`;
  const data = await aiGet(url, "List Conversations");
  const conversations = data.conversations || [];
  const hasMore = data.hasMore || false;
  const error = data.error;

  // Clear loading message if first load
  if (offset === 0) {
    chatContainer.innerHTML = "";
  }

  if (error) {
    chatContainer.innerHTML = `
      <div class="chat-message ai">
        <div class="chat-bubble" style="color: #ff6b6b;">Error loading conversations: ${escapeHtml(error)}</div>
      </div>
    `;
    return;
  }

  if (!conversations || conversations.length === 0) {
    if (offset === 0) {
      chatContainer.innerHTML = `
        <p class="state-msg">No conversations found.</p>
      `;
    }
    return;
  }

  // Display conversations as rows
  const conversationsHtml = conversations.map(conv => `
    <div class="conversation-row">
      <div class="conversation-info">
        <strong class="conversation-title">${escapeHtml(conv.name || "Untitled")}</strong>
        <span class="conversation-date">${new Date(conv.lastPromptDate).toLocaleDateString()}</span>
      </div>
      <div class="conversation-actions">
        <button 
          class="conversation-btn load-btn"
          data-load-conv="${conv.id}"
        >
          Load
        </button>
        <button 
          class="conversation-btn delete-btn"
          data-delete-conv="${conv.id}"
        >
          Delete
        </button>
      </div>
    </div>
  `).join("");

  chatContainer.insertAdjacentHTML("beforeend", conversationsHtml);

  // Add event listeners to load buttons
  chatContainer.querySelectorAll('[data-load-conv]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const convId = btn.dataset.loadConv;
      console.log("Load button clicked for conversation:", convId);
      loadConversation(convId);
    });
  });

  // Add event listeners to delete buttons
  chatContainer.querySelectorAll('[data-delete-conv]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const convId = btn.dataset.deleteConv;
      console.log("Delete button clicked for conversation:", convId);
      deleteConversation(convId);
    });
  });

  // Add "Load more" button if there are more conversations
  if (hasMore) {
    const loadMoreBtn = document.getElementById("load-more-conversations");
    if (!loadMoreBtn) {
      const loadMoreHtml = `
        <button id="load-more-conversations" style="margin: 8px auto; display: block; padding: 8px 16px; background: var(--accent); border: none; border-radius: 6px; color: #1a1a1a; cursor: pointer; font-size: 0.85rem;">
          Load more conversations
        </button>
      `;
      chatContainer.insertAdjacentHTML("beforeend", loadMoreHtml);
      document.getElementById("load-more-conversations").addEventListener("click", () => {
        showConversations(offset + 100);
      });
    }
  } else {
    const loadMoreBtn = document.getElementById("load-more-conversations");
    if (loadMoreBtn) loadMoreBtn.remove();
  }
}

async function loadConversation(conversationId, offset = 0, limit = 100) {
  try {
    const url = `conversations/${conversationId}?offset=${offset}&limit=${limit}`;
    const data = await aiGet(url, "Load Conversation");
    console.log("Loaded conversation:", data);
    console.log("Messages in response:", data?.messages);
    console.log("Number of messages:", data?.messages?.length);

    if (data && data.messages) {
      state.conversationId = conversationId;
      state.conversationName = data.conversationName || "Untitled";
      state.isNewConversation = false;
      state.messagesOffset = offset;

      const chatContainer = document.getElementById("chat-container");
      if (!chatContainer) return;

      // If this is the first load, clear the container
      if (offset === 0) {
        chatContainer.innerHTML = "";
      }

      // Display messages (insert at beginning if offset > 0 for pagination)
      const messages = data.messages || [];
      console.log("Displaying messages:", messages);
      messages.forEach((msg, index) => {
        console.log(`Message ${index}: role=${msg.role}, content=${msg.content?.substring(0, 50)}...`);
        if (msg.role === "user") {
          const userHtml = `
            <div class="chat-message user">
              <div class="chat-bubble">${escapeHtml(msg.content)}</div>
            </div>
          `;
          if (offset === 0) {
            chatContainer.insertAdjacentHTML("beforeend", userHtml);
          } else {
            chatContainer.insertAdjacentHTML("afterbegin", userHtml);
          }
        } else if (msg.role === "assistant") {
          const aiHtml = `
            <div class="chat-message ai">
              <div class="chat-bubble">${formatMessage(msg.content)}</div>
            </div>
          `;
          if (offset === 0) {
            chatContainer.insertAdjacentHTML("beforeend", aiHtml);
          } else {
            chatContainer.insertAdjacentHTML("afterbegin", aiHtml);
          }
        }
      });

      // Hide selector when loading existing conversation
      state.selectorVisible = false;
      updateSelectorVisibility();

      // Set model to the conversation's previous model if available
      if (offset === 0 && messages.length > 0) {
        // Find the last user message to get the model used
        const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
        if (lastUserMessage && lastUserMessage.model) {
          state.currentConversationModel = lastUserMessage.model;
          const categoryModels = state.categorizedModels[state.selectedCategory] || [];
          const modelData = categoryModels.find(m => m.id === lastUserMessage.model);
          if (modelData) {
            state.selectedModel = modelData.name;
            // Update model dropdown
            const modelSelect = document.getElementById("model-select");
            if (modelSelect) {
              const trigger = modelSelect.querySelector(".custom-select-trigger");
              if (trigger) {
                trigger.textContent = modelData.name;
              }
              const options = modelSelect.querySelectorAll(".custom-option");
              options.forEach(opt => {
                opt.classList.remove("selected");
                if (opt.dataset.model === modelData.name) {
                  opt.classList.add("selected");
                }
              });
            }
          }
        }
      }

      // Add "Load more" button if there are more messages
      if (data.hasMore) {
        const loadMoreBtn = document.getElementById("load-more-messages");
        if (!loadMoreBtn) {
          const loadMoreHtml = `
            <button id="load-more-messages" style="margin: 8px auto; display: block; padding: 8px 16px; background: var(--accent); border: none; border-radius: 6px; color: #1a1a1a; cursor: pointer; font-size: 0.85rem;">
              Load more messages
            </button>
          `;
          chatContainer.insertAdjacentHTML("afterbegin", loadMoreHtml);
          document.getElementById("load-more-messages").addEventListener("click", () => {
            loadConversation(conversationId, offset + limit, limit);
          });
        }
      } else {
        const loadMoreBtn = document.getElementById("load-more-messages");
        if (loadMoreBtn) loadMoreBtn.remove();
      }

      // Show toggle-selector button (inactive since selector is hidden) when in a conversation
      const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
      if (toggleSelectorBtn) {
        toggleSelectorBtn.style.display = "flex";
        toggleSelectorBtn.classList.remove("active");
        toggleSelectorBtn.style.opacity = "0.5";
      }

      // Show prompt bar when in a conversation
      const promptBar = document.querySelector(".ai-prompt-bar");
      if (promptBar) {
        promptBar.style.display = "flex";
      }
    }
  } catch (error) {
    console.error("Failed to load conversation:", error);
    showError("Failed to load conversation");
  }
}

async function deleteConversation(conversationId) {
  if (!confirm("Are you sure you want to delete this conversation?")) {
    return;
  }

  try {
    const requestName = `AI DELETE conversations/${conversationId}`;
    const res = await authedFetch(`${AI_BASE}/conversations/${conversationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Name": requestName,
      },
    });

    if (res.ok) {
      // Refresh the conversations list
      showConversations(0);
    } else {
      showError("Failed to delete conversation");
    }
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    showError("Failed to delete conversation");
  }
}

async function showLimits() {
  // Hide selector when showing limits
  state.selectorVisible = false;
  updateSelectorVisibility();

  // Hide toggle-selector button
  const toggleSelectorBtn = document.getElementById("toggle-selector-btn");
  if (toggleSelectorBtn) {
    toggleSelectorBtn.style.display = "none";
  }

  // Hide prompt bar
  const promptBar = document.querySelector(".ai-prompt-bar");
  if (promptBar) {
    promptBar.style.display = "none";
  }

  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) return;

  // Clear current chat and show loading
  chatContainer.innerHTML = `
    <div class="chat-message ai">
      <div class="chat-bubble">Loading limits...</div>
    </div>
  `;

  // Load limits in background
  const limits = await loadLimits();

  // Clear current chat
  chatContainer.innerHTML = "";

  if (!limits) {
    chatContainer.innerHTML = `
      <div class="chat-message ai">
        <div class="chat-bubble">Failed to load limits information.</div>
      </div>
    `;
    return;
  }

  // Display limits
  const unit = limits.daily?.unit || "neurons";
  const limitsHtml = `
    <div class="bento-grid">
      <article class="bento-block limit-item" style="grid-column: span 4;">
        <p class="block-eyebrow">Daily Usage</p>
        <strong class="card-value">${limits.daily?.used || 0}</strong>
        <p class="card-desc">${unit} used today</p>
      </article>
      <article class="bento-block limit-item" style="grid-column: span 4;">
        <p class="block-eyebrow">Limit</p>
        <strong class="card-value">${limits.daily?.limit || 10000}</strong>
        <p class="card-desc">Daily ${unit} limit</p>
      </article>
      <article class="bento-block limit-item" style="grid-column: span 4;">
        <p class="block-eyebrow">Percentage</p>
        <strong class="card-value" data-tone="accent">${limits.daily?.percentage || 0}%</strong>
        <p class="card-desc">Usage percentage</p>
      </article>
    </div>
    <p class="block-eyebrow" style="margin-top: 16px;">Model Consumption</p>
    <div class="models-info">
      ${(limits.models || []).filter(m => m.consumption > 0).map(model => `
        <article class="bento-block model-item" style="grid-column: span 12; display: flex; justify-content: space-between; align-items: center; padding: 16px;">
          <span class="model-name" style="font-weight: 500;">${escapeHtml(model.name)}</span>
          <span class="model-consumption" style="font-weight: 600;">${model.consumption.toLocaleString()} ${unit}</span>
        </article>
      `).join("")}
      ${(limits.models || []).filter(m => m.consumption > 0).length === 0 ? '<p style="color: var(--muted);">No models used today.</p>' : ''}
    </div>
  `;

  chatContainer.innerHTML = limitsHtml;
}

/* ===================== INITIALIZATION ===================== */
async function init() {
  await loadModels();
  setupSidebarButtons();
  setupPromptBar();
  setupNavbarRefreshListener();

  // Automatically start new conversation when page opens
  startNewConversation();
}

function setupNavbarRefreshListener() {
  const handleRefresh = (event) => {
    const detail = event.detail || {};
    const current = detail.current || "home";

    // Only refresh if we're on the AI page
    if (current !== "AI") return;

    // Refresh models, conversations, and limits
    const modelsPromise = loadModels();
    const conversationsPromise = loadConversations();
    const limitsPromise = loadLimits();

    // Wait for all to complete
    detail.waitUntil(Promise.all([modelsPromise, conversationsPromise, limitsPromise]));
  };

  window.addEventListener("site-navbar:refresh", handleRefresh);
  document.addEventListener("site-navbar:refresh", handleRefresh);
}

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
