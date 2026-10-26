import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  RiUserLine, 
  RiMailLine, 
  RiHistoryLine, 
  RiLogoutBoxRLine, 
  RiShieldCheckLine, 
  RiErrorWarningLine,
  RiArrowRightSLine,
  RiDeleteBinLine
} from 'react-icons/ri';
import SpotlightCard from './SpotlightCard';
import ExplainabilityCard from './ExplainabilityCard';
import './ProfileSection.css';

export default function ProfileSection({ token, user, handleLogout, navigateTo }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  // Sorting and Filtering States
  const [filterClassification, setFilterClassification] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const API_URL = 'http://localhost:5001/api';

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/prediction/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        throw new Error('Failed to load scan history');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan entry?")) return;
    try {
      const res = await fetch(`${API_URL}/prediction/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item._id !== scanId));
        setSelectedScan(null);
      } else {
        alert('Failed to delete the scan entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];

    if (filterClassification !== 'all') {
      result = result.filter(item => item.result === filterClassification);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'confidence-high') {
      result.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'confidence-low') {
      result.sort((a, b) => a.confidence - b.confidence);
    }

    return result;
  }, [history, filterClassification, sortBy]);

  return (
    <section className="profile-section">
      <div className="section-inner">
        
        <div className="profile-grid">
          {/* Left Column: User Card */}
          <div className="profile-card-left-wrapper">
            <SpotlightCard className="profile-card-left spotlight-override" spotlightColor="rgba(201, 168, 76, 0.12)">
              <div className="user-avatar-wrap">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              
              <h2 className="profile-name">{user?.name || 'User Profile'}</h2>
              <p className="profile-role">Registered Member</p>

              <div className="profile-details-list">
                <div className="detail-item">
                  <RiUserLine className="detail-icon" />
                  <div className="detail-info">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{user?.name}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <RiMailLine className="detail-icon" />
                  <div className="detail-info">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="profile-actions-panel">
                <button className="btn-primary" onClick={() => navigateTo('/')} style={{ width: '100%', marginBottom: '0.8rem' }}>
                  Go to Analyzer
                </button>
                <button className="btn-ghost btn-profile-logout" onClick={handleLogout} style={{ width: '100%' }}>
                  <RiLogoutBoxRLine /> Sign Out
                </button>
              </div>
            </SpotlightCard>
          </div>

          {/* Right Column: Scan History */}
          <div className="profile-history-right">
            <div className="history-header-bar">
              <h3 className="history-panel-title">
                <RiHistoryLine className="history-icon" /> Scan History
              </h3>
              <span className="history-count-badge">{filteredAndSortedHistory.length} scans</span>
            </div>

            {/* Filter and Sort Control Bar */}
            {history.length > 0 && (
              <div className="history-controls-bar">
                <div className="control-group">
                  <label htmlFor="filter-class">Filter:</label>
                  <select 
                    id="filter-class"
                    value={filterClassification} 
                    onChange={e => setFilterClassification(e.target.value)}
                  >
                    <option value="all">All Predictions</option>
                    <option value="fake">AI-Generated</option>
                    <option value="real">Likely Real</option>
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="sort-by">Sort:</label>
                  <select 
                    id="sort-by"
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="confidence-high">Confidence: High to Low</option>
                    <option value="confidence-low">Confidence: Low to High</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="history-status-state">
                <div className="spinner"></div>
                <p>Retrieving your forensic database records...</p>
              </div>
            ) : error ? (
              <div className="history-status-state error-state">
                <RiErrorWarningLine className="error-icon" />
                <p>{error}</p>
                <button className="btn-ghost" onClick={fetchHistory}>Try Again</button>
              </div>
            ) : history.length === 0 ? (
              <div className="history-status-state empty-state">
                <RiShieldCheckLine className="empty-icon" />
                <p>No scans recorded yet. Upload an image to analyze it!</p>
                <button className="btn-primary" onClick={() => navigateTo('/')}>Analyze First Image</button>
              </div>
            ) : filteredAndSortedHistory.length === 0 ? (
              <div className="history-status-state empty-state">
                <RiErrorWarningLine className="empty-icon" />
                <p>No matches found for your filter/sort query.</p>
              </div>
            ) : (
              <div className="history-list-wrapper">
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Classification</th>
                        <th>Confidence</th>
                        <th>Scan Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedHistory.map((scan) => (
                        <tr key={scan._id} className="history-table-row" onClick={() => setSelectedScan(scan)}>
                          <td>
                            <div className="history-table-thumb-wrap">
                              <img src={scan.imageUrl} alt="scan preview" className="history-table-thumb" />
                            </div>
                          </td>
                          <td>
                            <span className={`classification-badge ${scan.result === 'fake' ? 'fake' : 'real'}`}>
                              {scan.result.toUpperCase()}
                            </span>
                          </td>
                          <td className="confidence-cell">
                            {scan.result === 'fake' ? scan.confidence : (100 - scan.confidence).toFixed(0)}%
                          </td>
                          <td className="date-cell">
                            {new Date(scan.createdAt).toLocaleDateString()} at {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="action-cell">
                            <RiArrowRightSLine className="row-arrow" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scan Details Modal */}
        {selectedScan && (
          <div className="scan-modal-overlay" onClick={() => setSelectedScan(null)}>
            <div className="scan-modal-card" onClick={e => e.stopPropagation()}>
              <div className="scan-modal-header">
                <h3>Forensic Report Details</h3>
                <button className="btn-close-modal" onClick={() => setSelectedScan(null)}>&times;</button>
              </div>
              <div className="scan-modal-body">
                <div className="scan-modal-img-wrap">
                  <img src={selectedScan.imageUrl} alt="Forensic Target" className="scan-modal-img" />
                </div>
                <div className="scan-modal-details">
                  <div className={`scan-modal-alert ${selectedScan.result === 'fake' ? 'fake' : 'real'}`}>
                    {selectedScan.result === 'fake' ? <RiErrorWarningLine /> : <RiShieldCheckLine />}
                    <span>Likely {selectedScan.result.toUpperCase()}</span>
                  </div>
                  <div className="modal-metric-row">
                    <span className="metric-label">AI Likelihood</span>
                    <span className={`metric-value ${selectedScan.result === 'fake' ? 'red' : 'green'}`}>
                      {selectedScan.result === 'fake' ? selectedScan.confidence : (100 - selectedScan.confidence).toFixed(0)}%
                    </span>
                  </div>
                  <div className="modal-metric-row">
                    <span className="metric-label">Scan Date</span>
                    <span className="metric-value white">
                      {new Date(selectedScan.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="modal-metric-row">
                    <span className="metric-label">Database ID</span>
                    <span className="metric-value mono">{selectedScan._id}</span>
                  </div>
                  
                  <div className="modal-actions-bar" style={{ marginTop: '2rem' }}>
                    <button 
                      className="btn-delete-record"
                      onClick={() => handleDeleteScan(selectedScan._id)}
                    >
                      <RiDeleteBinLine /> Delete From History
                    </button>
                  </div>
                </div>

                {/* Explainability Section if available */}
                <div className="scan-modal-xai-wrap">
                  <ExplainabilityCard data={selectedScan} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
