import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  RiUploadCloud2Line,
  RiImageLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiShieldCheckLine,
  RiPulseLine,
  RiInfoCardLine,
  RiPriceTag3Line
} from 'react-icons/ri';
import ExplainabilityCard from './ExplainabilityCard';
import { motion, AnimatePresence } from 'motion/react';
import './UploadSection.css';

gsap.registerPlugin(ScrollTrigger);

export default function UploadSection({ token }) {
  const sectionRef = useRef(null);
  const headRef = useRef(null);
  const dropRef = useRef(null);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Upload & Prediction State
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Head children reveal
      if (headRef.current) {
        Array.from(headRef.current.children).forEach((child, i) => {
          gsap.fromTo(child,
            { opacity: 0, y: -20, filter: 'blur(14px)' },
            {
              opacity: 1, y: 0, filter: 'blur(0px)',
              duration: 0.95, ease: 'back.out(2)', delay: i * 0.12,
              scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true }
            }
          );
        });
      }

      // Drop zone reveal
      if (dropRef.current) {
        gsap.fromTo(dropRef.current,
          { opacity: 0, y: -22, filter: 'blur(14px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'back.out(2)', delay: 0.2,
            scrollTrigger: { trigger: dropRef.current, start: 'top 86%', once: true }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFile = useCallback((f) => {
    if (f) {
      setFile(f);
      setPrediction(null);
      setError('');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const fileType = file?.type?.split('/')[0];

  // Camera Actions
  const startCamera = async () => {
    setCameraActive(true);
    setFile(null);
    setPrediction(null);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError('Could not access camera: ' + err.message);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `camera-capture-${Date.now()}.png`, { type: 'image/png' });
        handleFile(capturedFile);
        stopCamera();
      }
    }, 'image/png');
  };

  const abortControllerRef = useRef(null);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [loading, handleCancel]);

  // Prediction Handler
  const handleAnalyze = async () => {
    if (!file || !token) return;
    setLoading(true);
    setError('');
    setPrediction(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/prediction/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Image analysis failed');
      }

      setPrediction(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={sectionRef} className="upload-section" id="upload">
      <div className="section-inner">
        <div ref={headRef} className={`section-head ${loading ? 'section-head--hidden' : ''}`}>
          <span className="section-tag">Analyze Image</span>
          <h2 className="section-title">Is your image <span className="accent">AI-generated?</span></h2>
          <p className="section-sub">Upload an image or capture a photo directly. Our AI will tell you if it's real or generated.</p>
        </div>

        {/* Main Uploader / Result Container */}
        <div className={`uploader-main-container ${loading ? 'is-loading' : ''}`}>

          {/* Zoom-in Focus View & Scanning State (dim/blur overlay + center focus) */}
          <AnimatePresence>
            {loading && (
              <motion.div
                className="scanning-overlay-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(5, 10, 10, 0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                }}
              >
                <motion.div
                  className="scanning-focus-modal"
                  initial={{ scale: 0.65, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.75, opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'relative',
                    maxWidth: '460px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >

                  {previewUrl && (
                    <div className="scanning-preview-container" style={{ width: '220px', height: '220px', marginBottom: '1.5rem' }}>
                      <img src={previewUrl} alt="Scanning preview" className="scanning-preview-img" />
                      <div className="scanner-line"></div>
                      <div className="scanner-corner-tl" />
                      <div className="scanner-corner-tr" />
                      <div className="scanner-corner-bl" />
                      <div className="scanner-corner-br" />
                    </div>
                  )}

                  <h3 className="loading-title">Scanning Facial Landmarks...</h3>
                  <p className="loading-subtitle" style={{ maxWidth: '340px' }}>
                    Analyzing biometric textures, spatial symmetry & synthetic indicators
                  </p>

                  <button
                    onClick={handleCancel}
                    className="btn-ghost"
                    style={{
                      marginTop: '1.5rem',
                      fontSize: '0.85rem',
                      padding: '0.45rem 1.4rem',
                      borderRadius: '99px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Cancel Analysis (Esc)
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && <div className="prediction-error-msg">{error}</div>}

          {/* Prediction Result Display */}
          {prediction ? (
            <motion.div 
              className="prediction-result-card"
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >

              {/* Visual Alert Bar */}
              {prediction.result === 'fake' ? (
                <div className="result-alert-box alert-fake">
                  <div className="alert-left">
                    <RiErrorWarningLine className="alert-icon" />
                    <div>
                      <h4 className="alert-title">AI-Generated Image Detected</h4>
                      <p className="alert-subtext">This image shows strong characteristics of AI generation</p>
                    </div>
                  </div>
                  <div className="alert-badge-wrap">
                    <span className="badge-value">{Number(prediction.confidence).toFixed(1)}%</span>
                    <span className="badge-label label-fake">AI</span>
                  </div>
                </div>
              ) : (
                <div className="result-alert-box alert-real">
                  <div className="alert-left">
                    <RiShieldCheckLine className="alert-icon" />
                    <div>
                      <h4 className="alert-title">This image is likely real</h4>
                      <p className="alert-subtext">No significant indicators of synthetic generation detected</p>
                    </div>
                  </div>
                  <div className="alert-badge-wrap">
                    <span className="badge-value">{(100 - Number(prediction.confidence)).toFixed(1)}%</span>
                    <span className="badge-label label-real">REAL</span>
                  </div>
                </div>
              )}

              {/* Grid Container */}
              <div className="result-layout">
                {/* Left Column: Image Preview */}
                <div className="result-preview-container">
                  <img src={prediction.imageUrl} alt="Prediction Preview" className="result-preview-img" />
                </div>

                {/* Right Column: Metrics & Actions */}
                <div className="result-details">
                  <p className="result-disclaimer">
                    Detection is probabilistic. Heavily rendered digital art, airbrush work, and AI-based editing tools can influence the result.
                  </p>

                  <div className="metric-rings-container">
                    {/* Card 1: AI Likelihood */}
                    {(() => {
                      const aiPercent = prediction.result === 'fake' ? Number(prediction.confidence) : (100 - Number(prediction.confidence));
                      const roundedPercent = aiPercent.toFixed(1);
                      const colorClass = prediction.result === 'fake' ? 'red' : 'green';
                      const radius = 35;
                      const strokeWidth = 6;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (Math.min(Math.max(aiPercent, 0), 100) / 100) * circumference;
                      return (
                        <div className="metric-ring-card">
                          <div className={`metric-aurora-glow glow-${colorClass}`} />
                          <span className="metric-ring-label">AI Likelihood</span>
                          <div className="metric-ring-wrapper">
                            <svg width="90" height="90" viewBox="0 0 90 90" className="metric-ring-svg">
                              <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
                              <circle cx="45" cy="45" r={radius} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`metric-ring-progress stroke-${colorClass}`} transform="rotate(-90 45 45)" />
                            </svg>
                            <div className="metric-ring-center-val">{roundedPercent}%</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card 2: Confidence */}
                    {(() => {
                      const confidenceVal = Number(prediction.confidence);
                      const confidenceLevel = confidenceVal > 80 ? 'High' : confidenceVal > 60 ? 'Medium' : 'Low';
                      const confidencePercent = confidenceLevel === 'High' ? 90 : confidenceLevel === 'Medium' ? 65 : 35;
                      const radius = 35;
                      const strokeWidth = 6;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (confidencePercent / 100) * circumference;
                      return (
                        <div className="metric-ring-card">
                          <div className="metric-aurora-glow glow-gold" />
                          <span className="metric-ring-label">Confidence</span>
                          <div className="metric-ring-wrapper">
                            <svg width="90" height="90" viewBox="0 0 90 90" className="metric-ring-svg">
                              <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
                              <circle cx="45" cy="45" r={radius} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="metric-ring-progress stroke-gold" transform="rotate(-90 45 45)" />
                            </svg>
                            <div className="metric-ring-center-val" style={{ fontSize: '0.85rem' }}>{confidenceLevel}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card 3: Classification */}
                    {(() => {
                      const colorClass = prediction.result === 'fake' ? 'red' : 'green';
                      const radius = 35;
                      const strokeWidth = 6;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = 0; // 100% filled
                      return (
                        <div className="metric-ring-card">
                          <div className={`metric-aurora-glow glow-${colorClass}`} />
                          <span className="metric-ring-label">Classification</span>
                          <div className="metric-ring-wrapper">
                            <svg width="90" height="90" viewBox="0 0 90 90" className="metric-ring-svg">
                              <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
                              <circle cx="45" cy="45" r={radius} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`metric-ring-progress stroke-${colorClass}`} transform="rotate(-90 45 45)" />
                            </svg>
                            <div className="metric-ring-center-val" style={{ fontSize: '0.85rem' }}>
                              {prediction.result === 'fake' ? 'Fake' : 'Real'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="result-actions">
                    <button className="btn-primary" onClick={() => { setPrediction(null); setFile(null); }}>
                      Try Another Image
                    </button>
                  </div>
                </div>
              </div>

              {/* Explainability Section */}
              <ExplainabilityCard data={prediction} loading={false} />

            </motion.div>
          ) : (
            /* Idle Upload Area / Camera Area */
            <>
              <div
                ref={dropRef}
                className={`drop-zone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}${cameraActive ? ' camera-active' : ''}`}
                style={{
                  opacity: loading ? 0 : 1,
                  visibility: loading ? 'hidden' : 'visible',
                  pointerEvents: loading ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease, visibility 0.3s ease'
                }}
                onDrop={cameraActive ? null : onDrop}
                onDragOver={cameraActive ? null : onDragOver}
                onDragLeave={cameraActive ? null : onDragLeave}
                onClick={cameraActive || file ? null : () => document.getElementById('file-input').click()}
              >
                <input id="file-input" type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                {cameraActive ? (
                  <div className="camera-viewport-wrap" onClick={e => e.stopPropagation()}>
                    <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                  </div>
                ) : !file ? (
                  <div className="drop-idle">
                    <div className="drop-icon-wrap"><RiUploadCloud2Line className="drop-icon" /></div>
                    <p className="drop-title">Drag and drop your file here</p>
                    <p className="drop-sub">or click to browse</p>
                    <div className="drop-types">
                      <span><RiImageLine /> JPG</span>
                      <span><RiImageLine /> PNG</span>
                      <span><RiImageLine /> WebP / HEIC</span>
                    </div>
                  </div>
                ) : (
                  <div className="drop-preview-thumbnail-wrap" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto', borderRadius: '20px', overflow: 'hidden', border: '2px solid rgba(201, 168, 76, 0.3)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                    <img src={previewUrl} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      className="preview-remove"
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255, 80, 80, 0.85)',
                        border: '1px solid rgba(255, 80, 80, 0.2)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        zIndex: 10,
                        transition: 'background var(--transition)'
                      }}
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                )}
              </div>

              <div
                className="upload-actions"
                style={{
                  opacity: loading ? 0 : 1,
                  visibility: loading ? 'hidden' : 'visible',
                  pointerEvents: loading ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease, visibility 0.3s ease'
                }}
              >
                {cameraActive ? (
                  <>
                    <button className="btn-primary" onClick={capturePhoto}>
                      Capture Photo
                    </button>
                    <button className="btn-ghost" onClick={stopCamera}>
                      Cancel
                    </button>
                  </>
                ) : file ? (
                  <>
                    <button className="btn-primary" onClick={handleAnalyze}>
                      Run AI Image Analysis
                    </button>
                    <button className="btn-ghost" onClick={() => setFile(null)}>
                      Clear Image
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary" onClick={() => document.getElementById('file-input').click()}>
                      Choose File
                    </button>
                    <button className="btn-ghost" onClick={startCamera}>
                      Use Camera
                    </button>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </section>
  );
}