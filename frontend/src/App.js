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
    use_case: [],
    budget: 0,
    company_size: '',
    data_types: [],
    integration_needs: '',
    perfect_solution: ''
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
      // Convert questionnaire format for backend
      const submissionData = {
        ...questionnaire,
        use_case: questionnaire.use_case.join(', '),
        budget: `$${questionnaire.budget}/month`,
        team_size: questionnaire.perfect_solution // Using perfect_solution as team_size for backend compatibility
      };

      const response = await fetch(`${API_BASE_URL}/api/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
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

  const handleUseCaseChange = (useCase, checked) => {
    if (checked) {
      if (questionnaire.use_case.length < 3) {
        setQuestionnaire({
          ...questionnaire,
          use_case: [...questionnaire.use_case, useCase]
        });
      }
    } else {
      setQuestionnaire({
        ...questionnaire,
        use_case: questionnaire.use_case.filter(item => item !== useCase)
      });
    }
  };

  const handleCompanySizeSelect = (size) => {
    setQuestionnaire({...questionnaire, company_size: size});
  };

  const handleDataTypeChange = (dataType, checked) => {
    if (checked) {
      setQuestionnaire({
        ...questionnaire,
        data_types: [...questionnaire.data_types, dataType]
      });
    } else {
      setQuestionnaire({
        ...questionnaire,
        data_types: questionnaire.data_types.filter(item => item !== dataType)
      });
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

  const isStepValid = (step) => {
    switch (step) {
      case 1: return questionnaire.position !== '';
      case 2: return questionnaire.use_case.length >= 1;
      case 3: return questionnaire.budget > 0;
      case 4: return questionnaire.company_size !== '';
      case 5: return questionnaire.data_types.length > 0;
      case 6: return questionnaire.integration_needs !== '';
      case 7: return questionnaire.perfect_solution.trim() !== '';
      case 8: return true; // Summary step is always valid
      default: return false;
    }
  };

  return (
    <div className="app">
      {loading && <LoadingSpinner />}
      
      <div className="app-layout">
        {/* Left Panel */}
        <div className={`left-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <div className="app-logo">
              {sidebarCollapsed ? (
                <img 
                  src="https://images.unsplash.com/photo-1639327380081-bf86fc57a7a5" 
                  alt="FinAI" 
                  className="logo-image-collapsed"
                />
              ) : (
                <div className="logo-expanded">
                  <img 
                    src="https://images.unsplash.com/photo-1639327380081-bf86fc57a7a5" 
                    alt="FinAI" 
                    className="logo-image"
                  />
                  <span className="logo-text">FinAI</span>
                </div>
              )}
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
                      style={{ width: `${(currentStep / 8) * 100}%` }}
                    ></div>
                  </div>
                  <p className="step-indicator">Step {currentStep} of 8</p>
                </div>

                <div className="questionnaire-content">
                  {/* Step 1: Position (Dropdown) */}
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

                  {/* Step 2: Use Case (Checkbox with 3 max, 1 min) */}
                  <QuestionnaireStep step={2}>
                    <h2>What is your primary use case?</h2>
                    <p className="instruction-text">Select 1-3 options that best describe your needs</p>
                    <div className="input-group checkbox-group">
                      {[
                        'Financial Reporting',
                        'Data Visualization', 
                        'Predictive Analytics',
                        'Risk Analysis',
                        'Budget Planning',
                        'Investment Analysis',
                        'Compliance Reporting',
                        'Performance Tracking'
                      ].map((useCase) => (
                        <label key={useCase} className={`checkbox-label ${questionnaire.use_case.includes(useCase) ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={questionnaire.use_case.includes(useCase)}
                            onChange={(e) => handleUseCaseChange(useCase, e.target.checked)}
                            disabled={!questionnaire.use_case.includes(useCase) && questionnaire.use_case.length >= 3}
                          />
                          {useCase}
                        </label>
                      ))}
                    </div>
                    <p className="selection-count">Selected: {questionnaire.use_case.length}/3</p>
                  </QuestionnaireStep>

                  {/* Step 3: Budget (Slider 0-1000 in $50 jumps) */}
                  <QuestionnaireStep step={3}>
                    <h2>What is your budget range?</h2>
                    <div className="input-group slider-group">
                      <div className="budget-display">
                        <span className="budget-value">${questionnaire.budget}/month</span>
                      </div>
                      <div className="slider-container">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="50"
                          value={questionnaire.budget}
                          onChange={(e) => setQuestionnaire({...questionnaire, budget: parseInt(e.target.value)})}
                          className="budget-slider"
                        />
                        <div className="slider-labels">
                          <span>$0</span>
                          <span>$500</span>
                          <span>$1000+</span>
                        </div>
                      </div>
                    </div>
                  </QuestionnaireStep>

                  {/* Step 4: Company Size (Button choices) */}
                  <QuestionnaireStep step={4}>
                    <h2>What is your company size?</h2>
                    <div className="input-group button-group">
                      {[
                        'Solo/Freelancer',
                        'Small (2-10 employees)',
                        'Medium (11-50 employees)', 
                        'Large (51-200 employees)',
                        'Enterprise (200+ employees)'
                      ].map((size) => (
                        <button
                          key={size}
                          className={`choice-button ${questionnaire.company_size === size ? 'selected' : ''}`}
                          onClick={() => handleCompanySizeSelect(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </QuestionnaireStep>

                  {/* Step 5: Data Types (Keep existing) */}
                  <QuestionnaireStep step={5}>
                    <h2>What types of data do you work with?</h2>
                    <div className="input-group checkbox-group">
                      {['Financial statements', 'Market data', 'Customer data', 'Sales data', 'Operational data', 'External APIs', 'Spreadsheets', 'Databases'].map((type) => (
                        <label key={type} className={`checkbox-label ${questionnaire.data_types.includes(type) ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={questionnaire.data_types.includes(type)}
                            onChange={(e) => handleDataTypeChange(type, e.target.checked)}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </QuestionnaireStep>

                  {/* Step 6: Integration (Keep as is) */}
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

                  {/* Step 7: Perfect Solution (Long text box) */}
                  <QuestionnaireStep step={7}>
                    <h2>If it was perfect, what would it do?</h2>
                    <p className="instruction-text">Describe your ideal solution in detail</p>
                    <div className="input-group">
                      <textarea
                        value={questionnaire.perfect_solution}
                        onChange={(e) => setQuestionnaire({...questionnaire, perfect_solution: e.target.value})}
                        placeholder="Describe what your perfect financial AI tool would do for your business..."
                        rows="6"
                        className="perfect-solution-textarea"
                      />
                    </div>
                  </QuestionnaireStep>

                  {/* Step 8: Summary */}
                  <QuestionnaireStep step={8}>
                    <h2>Summary of Your Requirements</h2>
                    <div className="summary-container">
                      <div className="summary-item">
                        <strong>Position:</strong> {questionnaire.position}
                      </div>
                      <div className="summary-item">
                        <strong>Use Cases:</strong> {questionnaire.use_case.join(', ')}
                      </div>
                      <div className="summary-item">
                        <strong>Budget:</strong> ${questionnaire.budget}/month
                      </div>
                      <div className="summary-item">
                        <strong>Company Size:</strong> {questionnaire.company_size}
                      </div>
                      <div className="summary-item">
                        <strong>Data Types:</strong> {questionnaire.data_types.join(', ')}
                      </div>
                      <div className="summary-item">
                        <strong>Integration Needs:</strong> {questionnaire.integration_needs}
                      </div>
                      <div className="summary-item">
                        <strong>Perfect Solution:</strong>
                        <p className="summary-description">{questionnaire.perfect_solution}</p>
                      </div>
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
                    
                    {currentStep < 8 ? (
                      <button 
                        className="btn-primary"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!isStepValid(currentStep)}
                      >
                        Next
                      </button>
                    ) : (
                      <button 
                        className="btn-primary btn-get-recommendations"
                        onClick={handleQuestionnaireSubmit}
                      >
                        🚀 Get AI Recommendations
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