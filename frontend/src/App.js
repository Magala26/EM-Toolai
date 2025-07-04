import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [userId] = useState('demo-user-123'); // Demo user ID

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
      
      loadSavedTools(); // Refresh saved tools
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
  );

  const ToolCard = ({ tool, showSaveButton = true }) => (
    <div className="tool-card">
      <div className="tool-header">
        <h3 className="tool-name">{tool.name}</h3>
        <span className="tool-category">{tool.category}</span>
      </div>
      <p className="tool-description">{tool.description}</p>
      <div className="tool-pricing">
        <span className="pricing-label">Pricing:</span>
        <span className="pricing-value">{tool.pricing}</span>
      </div>
      <div className="tool-features">
        {tool.features?.slice(0, 3).map((feature, index) => (
          <span key={index} className="feature-tag">{feature}</span>
        ))}
      </div>
      <div className="tool-actions">
        <button 
          className="btn-details"
          onClick={() => handleToolDetails(tool.id)}
        >
          View Details
        </button>
        {showSaveButton && (
          <button 
            className="btn-save"
            onClick={() => handleSaveTool(tool.id)}
          >
            Save Tool
          </button>
        )}
      </div>
    </div>
  );

  const ToolDetailsModal = () => (
    <div className="modal-overlay" onClick={() => setShowToolDetails(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedTool?.name}</h2>
          <button className="modal-close" onClick={() => setShowToolDetails(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="tool-detail-section">
            <h3>AI Summary</h3>
            <p className="ai-summary">{selectedTool?.ai_summary || 'Generating AI summary...'}</p>
          </div>
          <div className="tool-detail-section">
            <h3>Features</h3>
            <ul className="features-list">
              {selectedTool?.features?.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <div className="tool-detail-section">
            <h3>Pricing</h3>
            <p className="pricing-info">{selectedTool?.pricing}</p>
          </div>
          <div className="tool-detail-section">
            <h3>Target Audience</h3>
            <p>{selectedTool?.target_audience?.join(', ')}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-website"
            onClick={() => window.open(selectedTool?.website, '_blank')}
          >
            Visit Website
          </button>
          <button 
            className="btn-save"
            onClick={() => handleSaveTool(selectedTool?.id)}
          >
            Save Tool
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
            <p>Customize your experience and preferences here.</p>
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
        <div className="left-panel">
          <div className="panel-header">
            <h1 className="app-title">FinAI Tools</h1>
            <p className="app-subtitle">Find Your Perfect Financial AI Tool</p>
          </div>
          
          <nav className="panel-nav">
            <button 
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <span className="nav-icon">🏠</span>
              Dashboard
            </button>
            
            <button 
              className={`nav-item ${currentView === 'questionnaire' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('questionnaire');
                setCurrentStep(1);
              }}
            >
              <span className="nav-icon">🔍</span>
              Find Tools
            </button>
            
            <button 
              className={`nav-item ${currentView === 'saved' ? 'active' : ''}`}
              onClick={() => setCurrentView('saved')}
            >
              <span className="nav-icon">⭐</span>
              Saved Tools
              {savedTools.length > 0 && <span className="badge">{savedTools.length}</span>}
            </button>
            
            <button 
              className={`nav-item ${currentView === 'recent' ? 'active' : ''}`}
              onClick={() => setCurrentView('recent')}
            >
              <span className="nav-icon">📋</span>
              Recent Searches
            </button>
          </nav>
          
          <div className="panel-footer">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(true)}
            >
              <span className="nav-icon">⚙️</span>
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="dashboard">
              <div className="dashboard-header">
                <h2>Welcome to FinAI Tools Directory</h2>
                <p>Discover the perfect financial AI tools for your needs</p>
              </div>
              
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-number">{tools.length}</div>
                  <div className="stat-label">Available Tools</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{savedTools.length}</div>
                  <div className="stat-label">Saved Tools</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{recentSearches.length}</div>
                  <div className="stat-label">Recent Searches</div>
                </div>
              </div>
              
              <div className="dashboard-actions">
                <button 
                  className="btn-primary btn-large"
                  onClick={() => {
                    setCurrentView('questionnaire');
                    setCurrentStep(1);
                  }}
                >
                  Start Tool Discovery
                </button>
              </div>
            </div>
          )}

          {/* Questionnaire View */}
          {currentView === 'questionnaire' && (
            <div className="questionnaire">
              <div className="questionnaire-header">
                <h2>Find Your Perfect Financial AI Tool</h2>
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
                  <h3>What is your professional position?</h3>
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
                  <h3>What is your primary use case?</h3>
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
                  <h3>What is your budget range?</h3>
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
                  <h3>What is your company size?</h3>
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
                  <h3>What types of data do you work with?</h3>
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
                  <h3>What are your integration requirements?</h3>
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
                  <h3>What is your team size?</h3>
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
          )}

          {/* Results View */}
          {currentView === 'results' && (
            <div className="results">
              <div className="results-header">
                <h2>Your Personalized Tool Recommendations</h2>
                <p>Based on your responses, here are the best financial AI tools for you:</p>
              </div>
              
              <div className="tools-grid">
                {recommendations.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Saved Tools View */}
          {currentView === 'saved' && (
            <div className="saved-tools">
              <div className="saved-header">
                <h2>Your Saved Tools</h2>
                <p>Tools you've saved for future reference</p>
              </div>
              
              <div className="tools-grid">
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
            <div className="recent-searches">
              <div className="recent-header">
                <h2>Recent Searches</h2>
                <p>Your search history and past recommendations</p>
              </div>
              
              <div className="search-history">
                {recentSearches.map((search, index) => (
                  <div key={index} className="search-item">
                    <div className="search-date">
                      {new Date(search.created_at).toLocaleDateString()}
                    </div>
                    <div className="search-details">
                      <p><strong>Position:</strong> {search.responses.position}</p>
                      <p><strong>Use Case:</strong> {search.responses.use_case}</p>
                      <p><strong>Budget:</strong> {search.responses.budget}</p>
                    </div>
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