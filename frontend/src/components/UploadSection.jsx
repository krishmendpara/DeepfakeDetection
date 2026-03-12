import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RiUploadCloud2Line, RiImageLine, RiCloseLine } from 'react-icons/ri';
import './UploadSection.css';

gsap.registerPlugin(ScrollTrigger);

export default function UploadSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const dropRef    = useRef(null);
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Head children blur reveal
      Array.from(headRef.current.children).forEach((child, i) => {
        gsap.fromTo(child,
          { opacity: 0, y: -20, filter: 'blur(14px)' },
          { opacity: 1, y: 0,   filter: 'blur(0px)',
            duration: 0.95, ease: 'back.out(2)', delay: i * 0.12,
            scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true } }
        );
      });

      // Drop zone blur reveal
      gsap.fromTo(dropRef.current,
        { opacity: 0, y: -22, filter: 'blur(14px)' },
        { opacity: 1, y: 0,   filter: 'blur(0px)',
          duration: 1.0, ease: 'back.out(2)', delay: 0.2,
          scrollTrigger: { trigger: dropRef.current, start: 'top 86%', once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleFile = useCallback((f) => { if (f) setFile(f); }, []);
  const onDrop     = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const fileType = file?.type?.split('/')[0];

  return (
    <section ref={sectionRef} className="upload-section" id="upload">
      <div className="section-inner">
        <div ref={headRef} className="section-head">
          <span className="section-tag">Analyze Image</span>
          <h2 className="section-title">Upload &amp; <span className="accent">Detect</span></h2>
          <p className="section-sub">Upload any JPG, PNG, WebP, or HEIC image. Our AI will tell you if it's real or generated.</p>
        </div>

        <div
          ref={dropRef}
          className={`drop-zone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => !file && document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {!file ? (
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
          <button className="btn-primary" disabled={!file}
            style={{ opacity: file ? 1 : 0.4, cursor: file ? 'pointer' : 'not-allowed' }}>
            Run AI Image Analysis
          </button>
          <button className="btn-ghost" onClick={() => document.getElementById('file-input').click()}>
            Choose File
          </button>
        </div>
      </div>
    </section>
  );
}
