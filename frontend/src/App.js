import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [questionnaire, setQuestionnaire] = useState({
    position: '',
    use_case: '',
    budget: '',
    company_size: '',
    data_types: [],
    integration_needs: '',
    team_size: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [savedTools, setSavedTools] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [showToolDetails, setShowToolDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userId] = useState('demo-user-123');

  // Load initial data
  useEffect(() => {
    loadTools();
    loadSavedTools();
    loadRecentSearches();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools`);
      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const loadSavedTools = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-tools/${userId}`);
      const data = await response.json();
      setSavedTools(data.saved_tools || []);
    } catch (error) {
      console.error('Error loading saved tools:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recent-searches/${userId}`);
      const data = await response.json();
      setRecentSearches(data.recent_searches || []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleQuestionnaireSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionnaire),
      });
      
      const data = await response.json();
      setRecommendations(data.recommended_tools || []);
      setCurrentView('results');
      loadRecentSearches(); // Refresh recent searches
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolDetails = async (toolId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools/${toolId}`);
      const data = await response.json();
      setSelectedTool(data.tool);
      setShowToolDetails(true);
    } catch (error) {
      console.error('Error loading tool details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTool = async (toolId) => {
    try {
      await fetch(`${API_BASE_URL}/api/saved-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          tool_id: toolId
        }),
      });
      
      loadSavedTools();
      alert('Tool saved successfully!');
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Error saving tool');
    }
  };

  const QuestionnaireStep = ({ step, children }) => (
    <div className={`questionnaire-step ${currentStep === step ? 'active' : 'hidden'}`}>
      {children}
    </div>
  );

  const LoadingSpinner = () => (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">AI is analyzing your requirements...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );

  const ToolCard = ({ tool, showSaveButton = true }) => (
    <div className="tool-card">
      <div className="tool-header">
        <div className="tool-icon">
          {tool.name.charAt(0).toUpperCase()}
        </div>
        <div className="tool-info">
          <h3 className="tool-name">{tool.name}</h3>
          <p className="tool-description">{tool.description}</p>
        </div>
      </div>
      
      <div className="tool-meta">
        <div className="tool-rating">
          <span className="stars">★★★★★</span>
          <span className="rating-value">(4.5)</span>
        </div>
        <div className="tool-complexity">
          <span className="complexity-label">Complexity:</span>
          <div className="complexity-dots">
            <span className="dot active"></span>
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
      
      <div className="tool-pricing">
        <span className="pricing-value">{tool.pricing}</span>
      </div>
      
      <div className="tool-actions">
        <button 
          className="btn-learn-more"
          onClick={() => handleToolDetails(tool.id)}
        >
          Learn More
        </button>
        {showSaveButton && (
          <button 
            className="btn-save-tool"
            onClick={() => handleSaveTool(tool.id)}
          >
            ♥
          </button>
        )}
      </div>
    </div>
  );

  const ToolDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setShowToolDetails(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tool-header">
            <div className="modal-tool-icon">
              {selectedTool?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{selectedTool?.name}</h2>
              <p className="modal-tool-category">{selectedTool?.category}</p>
            </div>
          </div>
          <button className="modal-close" onClick={() => setShowToolDetails(false)}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-pricing">
            <h3>Starting at</h3>
            <p className="modal-price">{selectedTool?.pricing}</p>
          </div>
          
          <div className="modal-rating">
            <h3>User Rating:</h3>
            <div className="rating-display">
              <span className="stars">★★★★★</span>
              <span className="rating-value">(4.5)</span>
            </div>
            <div className="complexity-display">
              <span className="complexity-label">Complexity:</span>
              <div className="complexity-dots">
                <span className="dot active"></span>
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
          
          <div className="modal-section">
            <h3>About {selectedTool?.name}</h3>
            <p className="ai-summary">{selectedTool?.ai_summary || 'Generating AI analysis...'}</p>
          </div>
          
          <div className="modal-section">
            <h3>Key Features</h3>
            <ul className="features-list">
              {selectedTool?.features?.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="modal-section">
            <h3>Integrations</h3>
            <div className="integrations-list">
              <span className="integration-tag">Slack</span>
              <span className="integration-tag">Microsoft Teams</span>
              <span className="integration-tag">Zapier</span>
              <span className="integration-tag">API</span>
            </div>
          </div>
          
          <div className="modal-section">
            <h3>AI Analysis for Your Business</h3>
            <div className="ai-analysis">
              <div className="analysis-item">
                <span className="analysis-icon">✓</span>
                <span className="analysis-text">Perfect Match for Your Profile</span>
              </div>
              <div className="analysis-detail">
                <p>Based on your questionnaire responses, this AI tool aligns well with your business goals and technical requirements.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-website"
            onClick={() => window.open(selectedTool?.website, '_blank')}
          >
            🌐 Visit Website
          </button>
          <button 
            className="btn-save-modal"
            onClick={() => handleSaveTool(selectedTool?.id)}
          >
            ♥ Saved
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsModal = () => (
    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <h3>User Preferences</h3>
            <div className="settings-item">
              <label>Email Notifications</label>
              <input type="checkbox" />
            </div>
            <div className="settings-item">
              <label>Dark Mode</label>
              <input type="checkbox" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      {loading && <LoadingSpinner />}
      
      <div className="app-layout">
        {/* Left Panel */}
        <div className={`left-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <div className="app-logo">
              <span className="logo-text">FinAI</span>
            </div>
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          <nav className="panel-nav">
            <button 
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
              title="Dashboard"
            >
              <span className="nav-icon">🏠</span>
              {!sidebarCollapsed && <span className="nav-text">Dashboard</span>}
            </button>
            
            <button 
              className={`nav-item ${currentView === 'questionnaire' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('questionnaire');
                setCurrentStep(1);
              }}
              title="Find AI Tools"
            >
              <span className="nav-icon">🔍</span>
              {!sidebarCollapsed && <span className="nav-text">Find AI Tools</span>}
            </button>
            
            <button 
              className={`nav-item ${currentView === 'saved' ? 'active' : ''}`}
              onClick={() => setCurrentView('saved')}
              title="Saved Tools"
            >
              <span className="nav-icon">⭐</span>
              {!sidebarCollapsed && <span className="nav-text">Saved Tools</span>}
              {savedTools.length > 0 && <span className="badge">{savedTools.length}</span>}
            </button>
            
            <button 
              className={`nav-item ${currentView === 'recent' ? 'active' : ''}`}
              onClick={() => setCurrentView('recent')}
              title="Recent Searches"
            >
              <span className="nav-icon">📋</span>
              {!sidebarCollapsed && <span className="nav-text">Recent Searches</span>}
            </button>
          </nav>
          
          <div className="panel-footer">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <span className="nav-icon">⚙️</span>
              {!sidebarCollapsed && <span className="nav-text">Settings</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="dashboard">
              <div className="dashboard-header">
                <h1>Discover AI Tools for Your Business</h1>
                <p>Get personalized AI tool recommendations based on your specific needs and requirements</p>
              </div>
              
              <div className="cta-section">
                <button 
                  className="cta-button"
                  onClick={() => {
                    setCurrentView('questionnaire');
                    setCurrentStep(1);
                  }}
                >
                  🔍 Find Perfect Tool
                </button>
              </div>
              
              <div className="recent-activity">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🔍</span>
                    <div className="activity-content">
                      <p>Started AI tool questionnaire</p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">♥</span>
                    <div className="activity-content">
                      <p>Saved ChatGPT to favorites</p>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">👤</span>
                    <div className="activity-content">
                      <p>Joined FinAI</p>
                      <span className="activity-time">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="popular-tools">
                <h2>Popular AI Tools</h2>
                <p>Top-rated tools across all categories</p>
                <div className="popular-tools-grid">
                  {tools.slice(0, 3).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Questionnaire View */}
          {currentView === 'questionnaire' && (
            <div className="questionnaire-page">
              <div className="questionnaire-container">
                <div className="questionnaire-header">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(currentStep / 7) * 100}%` }}
                    ></div>
                  </div>
                  <p className="step-indicator">Step {currentStep} of 7</p>
                </div>

                <div className="questionnaire-content">
                  <QuestionnaireStep step={1}>
                    <h2>What is your professional position?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.position}
                        onChange={(e) => setQuestionnaire({...questionnaire, position: e.target.value})}
                      >
                        <option value="">Select your position</option>
                        <option value="Data Analyst">Data Analyst</option>
                        <option value="Financial Analyst">Financial Analyst</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="CFO/Executive">CFO/Executive</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={2}>
                    <h2>What is your primary use case?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.use_case}
                        onChange={(e) => setQuestionnaire({...questionnaire, use_case: e.target.value})}
                      >
                        <option value="">Select your use case</option>
                        <option value="Financial Reporting">Financial Reporting</option>
                        <option value="Data Visualization">Data Visualization</option>
                        <option value="Predictive Analytics">Predictive Analytics</option>
                        <option value="Risk Analysis">Risk Analysis</option>
                        <option value="Budget Planning">Budget Planning</option>
                        <option value="Investment Analysis">Investment Analysis</option>
                        <option value="Compliance Reporting">Compliance Reporting</option>
                        <option value="Performance Tracking">Performance Tracking</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={3}>
                    <h2>What is your budget range?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.budget}
                        onChange={(e) => setQuestionnaire({...questionnaire, budget: e.target.value})}
                      >
                        <option value="">Select your budget</option>
                        <option value="Free">Free</option>
                        <option value="Under $50/month">Under $50/month</option>
                        <option value="$50-$200/month">$50-$200/month</option>
                        <option value="$200-$500/month">$200-$500/month</option>
                        <option value="$500-$1000/month">$500-$1000/month</option>
                        <option value="Above $1000/month">Above $1000/month</option>
                        <option value="Enterprise pricing">Enterprise pricing</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={4}>
                    <h2>What is your company size?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.company_size}
                        onChange={(e) => setQuestionnaire({...questionnaire, company_size: e.target.value})}
                      >
                        <option value="">Select company size</option>
                        <option value="Solo/Freelancer">Solo/Freelancer</option>
                        <option value="Small (2-10 employees)">Small (2-10 employees)</option>
                        <option value="Medium (11-50 employees)">Medium (11-50 employees)</option>
                        <option value="Large (51-200 employees)">Large (51-200 employees)</option>
                        <option value="Enterprise (200+ employees)">Enterprise (200+ employees)</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={5}>
                    <h2>What types of data do you work with?</h2>
                    <div className="input-group checkbox-group">
                      {['Financial statements', 'Market data', 'Customer data', 'Sales data', 'Operational data', 'External APIs', 'Spreadsheets', 'Databases'].map((type) => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={questionnaire.data_types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuestionnaire({
                                  ...questionnaire,
                                  data_types: [...questionnaire.data_types, type]
                                });
                              } else {
                                setQuestionnaire({
                                  ...questionnaire,
                                  data_types: questionnaire.data_types.filter(t => t !== type)
                                });
                              }
                            }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={6}>
                    <h2>What are your integration requirements?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.integration_needs}
                        onChange={(e) => setQuestionnaire({...questionnaire, integration_needs: e.target.value})}
                      >
                        <option value="">Select integration needs</option>
                        <option value="Excel/Google Sheets">Excel/Google Sheets</option>
                        <option value="Cloud databases">Cloud databases</option>
                        <option value="API integrations">API integrations</option>
                        <option value="ERP systems">ERP systems</option>
                        <option value="CRM systems">CRM systems</option>
                        <option value="No integrations needed">No integrations needed</option>
                        <option value="Custom integrations">Custom integrations</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <QuestionnaireStep step={7}>
                    <h2>What is your team size?</h2>
                    <div className="input-group">
                      <select 
                        value={questionnaire.team_size}
                        onChange={(e) => setQuestionnaire({...questionnaire, team_size: e.target.value})}
                      >
                        <option value="">Select team size</option>
                        <option value="Just me">Just me</option>
                        <option value="2-5 people">2-5 people</option>
                        <option value="6-10 people">6-10 people</option>
                        <option value="11-25 people">11-25 people</option>
                        <option value="25+ people">25+ people</option>
                      </select>
                    </div>
                  </QuestionnaireStep>

                  <div className="questionnaire-actions">
                    {currentStep > 1 && (
                      <button 
                        className="btn-secondary"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        Previous
                      </button>
                    )}
                    
                    {currentStep < 7 ? (
                      <button 
                        className="btn-primary"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!Object.values(questionnaire)[currentStep - 1]}
                      >
                        Next
                      </button>
                    ) : (
                      <button 
                        className="btn-primary"
                        onClick={handleQuestionnaireSubmit}
                        disabled={!questionnaire.team_size}
                      >
                        Get Recommendations
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results View */}
          {currentView === 'results' && (
            <div className="results-page">
              <div className="results-header">
                <h1>AI Tool Recommendations</h1>
                <p>Found {recommendations.length} tools matching your criteria</p>
              </div>
              
              <div className="filters-section">
                <div className="filters-container">
                  <h3>🔍 Filters</h3>
                  <div className="filter-group">
                    <label>Category</label>
                    <select>
                      <option>All Categories</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Max Complexity</label>
                    <div className="complexity-slider">
                      <span>Any</span>
                      <div className="slider-track">
                        <div className="slider-thumb"></div>
                      </div>
                      <span>Expert</span>
                    </div>
                  </div>
                  <div className="filter-group">
                    <label>Min Rating</label>
                    <div className="rating-filter">
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                      <span className="star">★</span>
                    </div>
                  </div>
                  <button className="clear-filters">Clear Filters</button>
                </div>
              </div>
              
              <div className="results-grid">
                {recommendations.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Saved Tools View */}
          {currentView === 'saved' && (
            <div className="saved-page">
              <div className="saved-header">
                <h1>Saved AI Tools</h1>
                <p>You have {savedTools.length} saved tool{savedTools.length !== 1 ? 's' : ''}</p>
              </div>
              
              <div className="saved-grid">
                {savedTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} showSaveButton={false} />
                ))}
              </div>
              
              {savedTools.length === 0 && (
                <div className="empty-state">
                  <p>No saved tools yet. Start by finding tools that match your needs!</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setCurrentView('questionnaire')}
                  >
                    Find Tools
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recent Searches View */}
          {currentView === 'recent' && (
            <div className="recent-page">
              <div className="recent-header">
                <h1>Recent Searches</h1>
                <p>Your search history and past recommendations</p>
              </div>
              
              <div className="recent-searches-list">
                {recentSearches.map((search, index) => (
                  <div key={index} className="search-result-card">
                    <div className="search-header">
                      <span className="search-date">
                        {new Date(search.created_at).toLocaleDateString()}
                      </span>
                      <span className="search-results-count">
                        {search.recommended_tools?.length || 0} tools found
                      </span>
                    </div>
                    <div className="search-criteria">
                      <div className="criteria-item">
                        <strong>Position:</strong> {search.responses?.position}
                      </div>
                      <div className="criteria-item">
                        <strong>Use Case:</strong> {search.responses?.use_case}
                      </div>
                      <div className="criteria-item">
                        <strong>Budget:</strong> {search.responses?.budget}
                      </div>
                      <div className="criteria-item">
                        <strong>Company Size:</strong> {search.responses?.company_size}
                      </div>
                    </div>
                    <button 
                      className="view-results-btn"
                      onClick={() => {
                        // Load the tools for this search
                        const searchRecommendations = tools.filter(tool => 
                          search.recommended_tools?.includes(tool.id)
                        );
                        setRecommendations(searchRecommendations);
                        setCurrentView('results');
                      }}
                    >
                      View Results
                    </button>
                  </div>
                ))}
              </div>
              
              {recentSearches.length === 0 && (
                <div className="empty-state">
                  <p>No recent searches. Start by completing the questionnaire!</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setCurrentView('questionnaire')}
                  >
                    Find Tools
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showToolDetails && selectedTool && <ToolDetailsModal />}
      {showSettings && <SettingsModal />}
    </div>
  );
}

export default App;