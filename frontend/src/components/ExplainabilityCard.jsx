import React from 'react';
import { RiBrainLine, RiFocus2Line, RiLightbulbLine, RiInformationLine } from 'react-icons/ri';
import './ExplainabilityCard.css';

export default function ExplainabilityCard({ data, loading = false }) {
  // Loading state
  if (loading) {
    return (
      <div className="xai-card xai-card--loading">
        <div className="xai-spinner" />
        <p className="xai-loading-text">Computing Explainable AI Attribution & Concept Features...</p>
      </div>
    );
  }

  // Graceful fallback: hide silently if no data provided
  if (!data) return null;

  const heatmap = data.heatmapUrl || data.heatmap_base64 || data.heatmapBase64;
  const faceCrop = data.faceCropUrl || data.face_crop_base64 || data.faceCropBase64 || data.imageUrl;
  const explanations = Array.isArray(data.explanations) ? data.explanations : [];

  // Graceful fallback: If both heatmap and explanations are missing (old history records), hide completely
  if (!heatmap && explanations.length === 0) {
    return null;
  }

  const isFake = data.result === 'fake' || data.is_ai === true;
  const themeClass = isFake ? 'theme-red' : 'theme-teal';

  return (
    <div className={`xai-card ${themeClass}`}>
      {/* Card Header */}
      <div className="xai-card-header">
        <div className="xai-title-wrap">
          <div className="xai-header-icon-box">
            <RiBrainLine className="xai-header-icon" />
          </div>
          <div>
            <h3 className="xai-card-title">Explainability & Forensic Attribution</h3>
            <p className="xai-card-subtitle">Spatial Saliency (Captum) & Visual Concept Alignment (CLIP)</p>
          </div>
        </div>
        <span className={`xai-status-pill ${isFake ? 'pill-fake' : 'pill-real'}`}>
          {isFake ? 'Synthetic Focus' : 'Authentic Focus'}
        </span>
      </div>

      <div className="xai-card-content">
        {/* Heatmap & Face Comparison Section */}
        {heatmap && (
          <div className="xai-visual-section">
            <h4 className="xai-section-label">
              <RiFocus2Line className="xai-sub-icon" /> Spatial Heatmap Attribution
            </h4>

            <div className="xai-comparison-grid">
              {/* Cropped / Original Face */}
              <div className="xai-img-frame">
                <div className="xai-frame-header">
                  <span className="xai-frame-title">Target Face Region</span>
                </div>
                <div className="xai-img-wrapper">
                  <img src={faceCrop} alt="Target Face Region" className="xai-preview-img" />
                </div>
              </div>

              {/* Attribution Heatmap Overlay */}
              <div className="xai-img-frame highlight">
                <div className="xai-frame-header">
                  <span className="xai-frame-title highlight-title">Attribution Heatmap</span>
                  <span className="xai-highlight-badge">Captum Saliency</span>
                </div>
                <div className="xai-img-wrapper">
                  <img src={heatmap} alt="Attribution Heatmap" className="xai-preview-img" />
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="xai-legend-bar">
              <div className="xai-legend-gradient" />
              <div className="xai-legend-info">
                <RiInformationLine className="xai-legend-icon" />
                <span>
                  <strong>Red / warm regions</strong> highlight facial pixel clusters that most strongly influenced the neural network's detection decision.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Semantic Insights Section */}
        {explanations.length > 0 && (
          <div className="xai-semantic-section">
            <h4 className="xai-section-label">
              <RiLightbulbLine className="xai-sub-icon" /> Top Semantic Insights
            </h4>
            <p className="xai-semantic-desc">
              Semantic concepts identified in the image via CLIP zero-shot multimodal alignment:
            </p>

            <div className="xai-concepts-list">
              {explanations.map((item, index) => {
                const pct = Math.min(Math.max(Number(item.relevance_pct) || 0, 0), 100);
                return (
                  <div key={index} className="xai-concept-item">
                    <div className="xai-concept-header">
                      <span className="xai-concept-name">
                        <span className="xai-concept-bullet"># {index + 1}</span> {item.concept}
                      </span>
                      <span className={`xai-concept-pct ${isFake ? 'pct-fake' : 'pct-real'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="xai-progress-track">
                      <div
                        className={`xai-progress-fill ${isFake ? 'fill-fake' : 'fill-real'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
