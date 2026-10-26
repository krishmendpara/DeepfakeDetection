import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  RiUserLine, 
  RiMailLine, 
  RiHistoryLine, 
  RiLogoutBoxRLine, 
  RiShieldCheckLine, 
  RiErrorWarningLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiFilter3Line,
  RiArrowUpDownLine,
  RiRefreshLine
} from 'react-icons/ri';
import SpotlightCard from './SpotlightCard';
import ExplainabilityCard from './ExplainabilityCard';
import CustomDropdown from './CustomDropdown';
import './ProfileSection.css';

export default function ProfileSection({ token, user, handleLogout, navigateTo }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Sorting and Filtering States
  const [filterClassification, setFilterClassification] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // Helper to reliably resolve image source across Cloudinary CDN, GridFS, and legacy paths
  const getImageSrc = useCallback((url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const baseOrigin = API_URL.replace(/\/api\/?$/, '');
    return `${baseOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  }, [API_URL]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to load scan history');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan entry?")) return;
    try {
      const res = await fetch(`${API_URL}/history/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item._id !== scanId));
        if (selectedScan && selectedScan._id === scanId) {
          setSelectedScan(null);
        }
        setSelectedIds(prev => {
          if (prev.has(scanId)) {
            const next = new Set(prev);
            next.delete(scanId);
            return next;
          }
          return prev;
        });
      } else {
        alert('Failed to delete the scan entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  const handleResetFilters = () => {
    setFilterClassification('all');
    setSortBy('newest');
  };

  const isFilterActive = filterClassification !== 'all' || sortBy !== 'newest';

  // Filter options with live counts calculated from user history
  const filterOptions = useMemo(() => {
    const allCount = history.length;
    const fakeCount = history.filter(item => item.result === 'fake').length;
    const realCount = history.filter(item => item.result === 'real').length;

    return [
      { value: 'all', label: 'All Predictions', count: allCount },
      { value: 'fake', label: 'AI-Generated', count: fakeCount, badgeClass: 'badge-fake' },
      { value: 'real', label: 'Likely Real', count: realCount, badgeClass: 'badge-real' },
    ];
  }, [history]);

  // Sort options
  const sortOptions = useMemo(() => [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'confidence-high', label: 'Confidence: High to Low' },
    { value: 'confidence-low', label: 'Confidence: Low to High' },
  ], []);

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

  // Multi-select & Batch Delete Logic
  const allVisibleIds = useMemo(() => filteredAndSortedHistory.map(s => s._id), [filteredAndSortedHistory]);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const isSomeSelected = allVisibleIds.some(id => selectedIds.has(id)) && !isAllSelected;

  const handleToggleSelect = (id, e) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllSelected) {
        allVisibleIds.forEach(id => next.delete(id));
      } else {
        allVisibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${count} selected ${count > 1 ? 'scans' : 'scan'}? This action cannot be undone.`)) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const res = await fetch(`${API_URL}/history/batch`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToDelete })
      });

      if (res.ok) {
        setHistory(prev => prev.filter(item => !selectedIds.has(item._id)));
        if (selectedScan && selectedIds.has(selectedScan._id)) {
          setSelectedScan(null);
        }
        setSelectedIds(new Set());
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete selected scans.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting selected scans.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

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
                <button className="btn-profile-primary" onClick={() => navigateTo('/app')}>
                  <RiShieldCheckLine className="btn-action-icon" /> Go to Analyzer
                </button>
                <button className="btn-profile-logout" onClick={handleLogout}>
                  <RiLogoutBoxRLine className="btn-action-icon" /> Sign Out
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

            {/* Custom Filter and Sort Control Bar (Step G: Replaces plain native select) */}
            {history.length > 0 && (
              <div className="history-controls-bar">
                <CustomDropdown
                  id="filter-class"
                  label="Filter"
                  icon={RiFilter3Line}
                  value={filterClassification}
                  options={filterOptions}
                  onChange={setFilterClassification}
                  hasActiveFilter={filterClassification !== 'all'}
                />

                <CustomDropdown
                  id="sort-by"
                  label="Sort By"
                  icon={RiArrowUpDownLine}
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                  hasActiveFilter={sortBy !== 'newest'}
                />

                {isFilterActive && (
                  <button
                    type="button"
                    className="btn-clear-filters"
                    onClick={handleResetFilters}
                    title="Reset all filters and sorting"
                  >
                    <RiRefreshLine className="clear-icon" /> Reset
                  </button>
                )}
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
                <p>No analyses found matching your filter criteria.</p>
                <button className="btn-ghost" onClick={handleResetFilters} style={{ marginTop: '1rem' }}>
                  <RiRefreshLine /> Clear filters
                </button>
              </div>
            ) : (
              <div className="history-list-wrapper">
                {selectedIds.size > 0 && (
                  <div className="history-selection-bar">
                    <span className="selection-info">
                      <strong>{selectedIds.size}</strong> selected
                    </span>
                    <button
                      type="button"
                      className="btn-selection-toggle"
                      onClick={handleToggleSelectAll}
                    >
                      {isAllSelected ? 'Deselect all' : `Select all (${filteredAndSortedHistory.length})`}
                    </button>
                    <div className="selection-bar-actions">
                      <button
                        type="button"
                        className="btn-selection-delete"
                        onClick={handleBatchDelete}
                        disabled={isBatchDeleting}
                        title="Delete selected scans"
                      >
                        <RiDeleteBinLine /> {isBatchDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        className="btn-selection-clear"
                        onClick={() => setSelectedIds(new Set())}
                        title="Cancel selection"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th className="checkbox-cell">
                          <input
                            type="checkbox"
                            className="history-select-checkbox"
                            aria-label="Select all visible scans"
                            checked={isAllSelected}
                            ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                            onChange={handleToggleSelectAll}
                          />
                        </th>
                        <th>Image</th>
                        <th>Classification</th>
                        <th>Confidence</th>
                        <th>Scan Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedHistory.map((scan) => {
                        const isSelected = selectedIds.has(scan._id);
                        return (
                          <tr
                            key={scan._id}
                            className={`history-table-row ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setSelectedScan(scan)}
                          >
                            <td className="checkbox-cell" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="history-select-checkbox"
                                aria-label={`Select scan from ${new Date(scan.createdAt).toLocaleDateString()}`}
                                checked={isSelected}
                                onChange={(e) => handleToggleSelect(scan._id, e)}
                              />
                            </td>
                            <td>
                              <div className="history-table-thumb-wrap">
                                <img src={getImageSrc(scan.imageUrl)} alt="scan preview" className="history-table-thumb" />
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
                        );
                      })}
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
                  <img src={getImageSrc(selectedScan.imageUrl)} alt="Forensic Target" className="scan-modal-img" />
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
