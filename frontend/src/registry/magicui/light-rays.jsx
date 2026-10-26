import { useEffect, useState } from "react";
import { motion } from "motion/react";

const createRays = (count, cycle) => {
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const left = 8 + Math.random() * 84;
    const rotate = -28 + Math.random() * 56;
    const width = 160 + Math.random() * 160;
    const swing = 0.8 + Math.random() * 1.8;
    const delay = Math.random() * cycle;
    const duration = cycle * (0.75 + Math.random() * 0.5);
    const intensity = 0.6 + Math.random() * 0.5;

    return {
      id: `${index}-${Math.round(left * 10)}`,
      left,
      rotate,
      width,
      swing,
      delay,
      duration,
      intensity,
    };
  });
};

const Ray = ({
  left,
  rotate,
  width,
  swing,
  delay,
  duration,
  intensity,
}) => {
  return (
    <motion.div
      className="pointer-events-none absolute -top-[12%] left-[var(--ray-left)] h-[var(--light-rays-length)] w-[var(--ray-width)] origin-top -translate-x-1/2 rounded-full bg-linear-to-b from-[color-mix(in_srgb,var(--light-rays-color)_70%,transparent)] to-transparent opacity-0 mix-blend-screen blur-[var(--light-rays-blur)]"
      style={{
        "--ray-left": `${left}%`,
        "--ray-width": `${width}px`,
        position: "absolute",
        top: "-12%",
        height: "var(--light-rays-length)",
        width: "var(--ray-width)",
        transformOrigin: "top",
        transform: "translate3d(-50%, 0, 0)",
        borderRadius: "9999px",
        background: "linear-gradient(to bottom, color-mix(in srgb, var(--light-rays-color) 70%, transparent), transparent)",
        opacity: 0,
        mixBlendMode: "screen",
        filter: "blur(var(--light-rays-blur))",
        willChange: "transform, opacity",
        pointerEvents: "none"
      }}
      initial={{ rotate: rotate }}
      animate={{
        opacity: [0, intensity, 0],
        rotate: [rotate - swing, rotate + swing, rotate - swing],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
        repeatDelay: duration * 0.1,
      }}
    />
  );
};

export function LightRays({
  className,
  style,
  count = 7,
  color = "rgba(160, 210, 255, 0.2)",
  blur = 36,
  speed = 14,
  length = "70vh",
  ref,
  ...props
}) {
  const [rays, setRays] = useState([]);
  const cycleDuration = Math.max(speed, 0.1);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      setRays(createRays(count, cycleDuration));
    }
    return () => {
      mounted = false;
    };
  }, [count, cycleDuration]);

  const posClass = style?.position === "fixed" ? "fixed" : "absolute";
  const combinedClass = `pointer-events-none ${posClass} inset-0 isolate overflow-hidden rounded-[inherit] ` + (className || "");

  return (
    <div
      ref={ref}
      className={combinedClass}
      style={{
        "--light-rays-color": color,
        "--light-rays-blur": `${blur}px`,
        "--light-rays-length": length,
        position: style?.position || "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {/* Top-center origin radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.7,
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, color-mix(in srgb, var(--light-rays-color) 55%, transparent), transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.6,
            background:
              "radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--light-rays-color) 45%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.6,
            background:
              "radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--light-rays-color) 35%, transparent), transparent 75%)",
          }}
        />
        {rays.map((ray) => (
          <Ray key={ray.id} {...ray} />
        ))}
      </div>
    </div>
  );
}
