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

  const API_URL = 'http://localhost:5000/api';

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

  // Prediction Handler
  const handleAnalyze = async () => {
    if (!file || !token) return;
    setLoading(true);
    setError('');
    setPrediction(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/prediction/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Image analysis failed');
      }

      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={sectionRef} className="upload-section" id="upload">
      <div className="section-inner">
        <div ref={headRef} className="section-head">
          <span className="section-tag">Analyze Image</span>
          <h2 className="section-title">Is your image <span className="accent">AI-generated?</span></h2>
          <p className="section-sub">Upload an image or capture a photo directly. Our AI will tell you if it's real or generated.</p>
        </div>

        {/* Main Uploader / Result Container */}
        <div className={`uploader-main-container ${loading ? 'is-loading' : ''}`}>

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-overlay" style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 14, 18, 0.88)', borderRadius: 'inherit', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.2rem' }}>
                {file && (
                  <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(201, 168, 76, 0.3)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
                    <img src={URL.createObjectURL(file)} alt="Scanning preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, #41f2ff, #c9a84c, #41f2ff, transparent)', animation: 'scan 2.5s ease-in-out infinite', zIndex: 3 }}></div>
                  </div>
                )}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Analyzing Image Authenticity</h3>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0, maxWidth: '280px' }}>Scanning pixels, metadata, compression artifacts and forensic patterns...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="prediction-error-msg">{error}</div>}

          {/* Prediction Result Display */}
          {prediction ? (
            <div className="prediction-result-card">

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
                    <span className="badge-value">{prediction.confidence}%</span>
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
                    <span className="badge-value">{100 - prediction.confidence}%</span>
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

                  <div className="status-badges-container">
                    <div className="status-badge">
                      <RiPulseLine className="badge-icon" />
                      <span className="badge-title">AI Likelihood</span>
                      <span className={`badge-data ${prediction.result === 'fake' ? 'red' : 'green'}`}>
                        {prediction.result === 'fake' ? prediction.confidence : (100 - prediction.confidence).toFixed(0)}%
                      </span>
                    </div>

                    <div className="status-badge">
                      <RiInfoCardLine className="badge-icon" />
                      <span className="badge-title">Confidence</span>
                      <span className="badge-data white">
                        {prediction.confidence > 80 ? 'High' : prediction.confidence > 60 ? 'Medium' : 'Low'}
                      </span>
                    </div>

                    <div className="status-badge">
                      <RiPriceTag3Line className="badge-icon" />
                      <span className="badge-title">Classification</span>
                      <span className={`badge-data ${prediction.result === 'fake' ? 'red' : 'green'}`}>
                        {prediction.result === 'fake' ? 'Fake' : 'Real'}
                      </span>
                    </div>
                  </div>

                  <div className="result-actions">
                    <button className="btn-primary" onClick={() => { setPrediction(null); setFile(null); }}>
                      Try Another Image
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Idle Upload Area / Camera Area */
            <>
              {!loading && (
                <>
                  <div
                    ref={dropRef}
                    className={`drop-zone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}${cameraActive ? ' camera-active' : ''}`}
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
                      <div className="drop-preview">
                        <div className="preview-icon-wrap">
                          {fileType === 'image' && <RiImageLine className="preview-type-icon" />}
                          {!['image'].includes(fileType) && <RiUploadCloud2Line className="preview-type-icon" />}
                        </div>
                        <div className="preview-info">
                          <p className="preview-name">{file.name}</p>
                          <p className="preview-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button className="preview-remove" onClick={e => { e.stopPropagation(); setFile(null); }}>
                          <RiCloseLine />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="upload-actions">
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
            </>
          )}

        </div>
      </div>
    </section>
  );
}