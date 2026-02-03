'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  Html,
  OrbitControls
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { motion } from 'framer-motion';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useLocale } from '@/lib/i18n/locale-provider';

// Available icon types for dive centers
type CenterIconType = 'diver' | 'mask' | 'fins' | 'tank' | 'anchor' | 'wave';

interface CenterMarker {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rating: number;
  verified: boolean;
  icon?: CenterIconType;
}

// SVG paths for each icon type (simple flat icons)
const iconPaths: Record<CenterIconType, string> = {
  diver: 'M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15V22H13V16H11V22H9V9H3V7H21V9Z',
  mask: 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19S21.27 15.89 23 11.5C21.27 7.11 17 4 12 4M12 16.5C9.24 16.5 7 14.26 7 11.5S9.24 6.5 12 6.5 17 8.74 17 11.5 14.76 16.5 12 16.5M12 8.5C10.34 8.5 9 9.84 9 11.5S10.34 14.5 12 14.5 15 13.16 15 11.5 13.66 8.5 12 8.5Z',
  fins: 'M20.5 11H19V7C19 5.9 18.1 5 17 5H13V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V5H6C4.9 5 4 5.9 4 7V11H2.5C1.67 11 1 11.67 1 12.5S1.67 14 2.5 14H4V18C4 19.1 4.9 20 6 20H10V21.5C10 22.33 10.67 23 11.5 23S13 22.33 13 21.5V20H17C18.1 20 19 19.1 19 18V14H20.5C21.33 14 22 13.33 22 12.5S21.33 11 20.5 11Z',
  tank: 'M17 4H15V2H9V4H7C5.9 4 5 4.9 5 6V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6C19 4.9 18.1 4 17 4M12 18C10.34 18 9 16.66 9 15V9C9 7.34 10.34 6 12 6S15 7.34 15 9V15C15 16.66 13.66 18 12 18Z',
  anchor: 'M17 15L19 17L17 19L15 17L17 15M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M12 8C14.21 8 16 9.79 16 12H14C14 10.9 13.1 10 12 10S10 10.9 10 12H8C8 9.79 9.79 8 12 8M12 14V22H10V14H7L12 9L17 14H14V22H12Z',
  wave: 'M2 12C2 12 5 8 9 8S16 12 16 12 19 16 23 16V18C19 18 16 14 16 14S13 10 9 10 2 14 2 14V12M2 18C2 18 5 14 9 14S16 18 16 18 19 22 23 22V20C19 20 16 16 16 16S13 12 9 12 2 16 2 16V18Z',
};

interface UnderwaterGlobeProps {
  centers: CenterMarker[];
  onCenterSelect: (id: string | null) => void;
  selectedCenter: string | null;
}

// Convert lat/lng to 3D sphere coordinates
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

// Earth Globe with real texture
function EarthGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);
  
  // Load Earth texture from local file
  const earthMap = useLoader(TextureLoader, '/earth-texture.jpg');
  
  useFrame(() => {
    // No auto-rotation - let user control
  });
  
  return (
    <group>
      {/* Earth - rotated to show Europe */}
      <mesh ref={globeRef} rotation={[0, -0.5, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthMap}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.08, 64, 64]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          uniforms={{
            glowColor: { value: new THREE.Color(0x00aaff) },
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            uniform vec3 glowColor;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(glowColor, intensity * 0.3);
            }
          `}
        />
      </mesh>
    </group>
  );
}

// Center Marker Pin with Icon
function CenterMarkerPin({ 
  center, 
  isSelected, 
  isHovered,
  onHover,
  onClick 
}: { 
  center: CenterMarker; 
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const position = useMemo(() => latLngToVector3(center.lat, center.lng, 2.05), [center.lat, center.lng]);
  
  // Calculate rotation to face outward from globe center
  const rotation = useMemo(() => {
    const dir = position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return euler;
  }, [position]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle pulsing animation
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    const baseScale = isSelected ? 1.4 : isHovered ? 1.2 : 1;
    groupRef.current.scale.setScalar(baseScale * pulse);
  });
  
  const color = center.verified ? '#00ff88' : '#00ccff';
  const iconType = center.icon || 'diver';
  
  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* Clickable invisible sphere for interaction */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
          onPointerOut={() => onHover(false)}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        {/* Small circular background */}
        <mesh>
          <circleGeometry args={[0.06, 32]} />
          <meshBasicMaterial 
            color={isSelected ? '#ffffff' : color}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Outer ring glow */}
        <mesh>
          <ringGeometry args={[0.06, 0.08, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 1 : 0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Pulse ring animation */}
        {(isSelected || isHovered) && (
          <mesh>
            <ringGeometry args={[0.09, 0.11, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
      
      {/* Icon and label overlay */}
      <Html position={[0, 0.12, 0]} center distanceFactor={4}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: isHovered || isSelected ? 1.1 : 1 
          }}
          className="flex flex-col items-center cursor-pointer"
          onClick={onClick}
        >
          {/* Icon badge */}
          <div 
            className={`
              w-8 h-8 rounded-full flex items-center justify-center shadow-lg
              transition-all duration-200
              ${isSelected 
                ? 'bg-cyan-400 scale-110' 
                : isHovered 
                  ? 'bg-cyan-500' 
                  : center.verified 
                    ? 'bg-emerald-500' 
                    : 'bg-blue-500'}
            `}
            style={{
              boxShadow: `0 0 ${isSelected ? '15px' : '8px'} ${center.verified ? '#00ff88' : '#00ccff'}`,
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 fill-white"
            >
              <path d={iconPaths[iconType]} />
            </svg>
          </div>
          
          {/* Name label */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ 
              opacity: isHovered || isSelected ? 1 : 0.9,
              y: 0
            }}
            className={`
              mt-1 px-2 py-1 rounded-md whitespace-nowrap text-center
              ${isSelected 
                ? 'bg-cyan-400 text-black font-bold' 
                : 'bg-gray-900/90 text-white backdrop-blur-sm border border-cyan-400/30'}
            `}
            style={{ fontSize: '10px' }}
          >
            <p className="font-semibold">{center.name}</p>
            {(isHovered || isSelected) && (
              <>
                <p className="text-cyan-300 text-[9px]">{center.city}</p>
                {center.rating > 0 && (
                  <p className="text-yellow-400 text-[9px]">⭐ {center.rating.toFixed(1)}</p>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </Html>
    </group>
  );
}

// Real-time Sun Light with time offset
function SunLight({ timeOffset = 0 }: { timeOffset?: number }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const sunMeshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame(() => {
    if (!sunRef.current || !sunMeshRef.current) return;
    
    // Calculate sun position based on real time (UTC) + offset
    const now = new Date();
    const hours = now.getUTCHours() + now.getUTCMinutes() / 60 + timeOffset;
    
    // Sun angle: 0h = -180°, 12h = 0°, 24h = 180°
    const sunAngle = ((hours - 12) / 24) * Math.PI * 2;
    
    // Sun position in 3D space (radius 10 from Earth center)
    const sunRadius = 10;
    const sunX = Math.sin(sunAngle) * sunRadius;
    const sunZ = Math.cos(sunAngle) * sunRadius;
    const sunY = 0; // Keep sun on equatorial plane
    
    sunRef.current.position.set(sunX, sunY, sunZ);
    sunRef.current.target.position.set(0, 0, 0);
    sunMeshRef.current.position.set(sunX, sunY, sunZ);
    
    if (glowRef.current) {
      glowRef.current.position.set(sunX, sunY, sunZ);
    }
  });
  
  return (
    <group>
      {/* Main sun directional light */}
      <directionalLight
        ref={sunRef}
        intensity={3}
        color="#fffaed"
      />
      
      {/* Sun visual group */}
      <group ref={sunMeshRef}>
        {/* Sun core */}
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial color="#ffee88" />
        </mesh>
        
        {/* Sun outer glow */}
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0.3} />
        </mesh>
      </group>
      
      {/* Sun point light for glow effect */}
      <pointLight ref={glowRef} intensity={2} color="#ffdd00" distance={25} decay={2} />
    </group>
  );
}

// Scene
function Scene({ centers, onCenterSelect, selectedCenter, timeOffset }: UnderwaterGlobeProps & { timeOffset: number }) {
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);
  
  return (
    <>
      {/* Ambient light (simulates scattered light from atmosphere) */}
      <ambientLight intensity={0.12} color="#334466" />
      
      {/* Real-time sun lighting with time offset */}
      <SunLight timeOffset={timeOffset} />
      
      {/* Subtle fill light from opposite side (moon/ambient) */}
      <directionalLight position={[-5, -2, -5]} intensity={0.15} color="#223355" />
      
      {/* Earth Globe */}
      <EarthGlobe />
      
      {/* Center Markers */}
      {centers.map((center) => (
        <CenterMarkerPin
          key={center.id}
          center={center}
          isSelected={selectedCenter === center.id}
          isHovered={hoveredCenter === center.id}
          onHover={(hover) => setHoveredCenter(hover ? center.id : null)}
          onClick={() => onCenterSelect(selectedCenter === center.id ? null : center.id)}
        />
      ))}
      
      {/* Camera Controls */}
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        minDistance={3.5}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
      
      {/* Post Processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          intensity={1}
        />
        <Vignette
          offset={0.3}
          darkness={0.5}
        />
      </EffectComposer>
    </>
  );
}

// Time display helper
function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { 
    weekday: 'short',
    day: 'numeric', 
    month: 'short',
    timeZone: 'UTC'
  });
}

// Main Export Component
export function UnderwaterGlobe({ centers, onCenterSelect, selectedCenter }: UnderwaterGlobeProps) {
  const t = useTranslations('globe');
  const { locale } = useLocale();
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const [timeOffset, setTimeOffset] = useState(0); // Hours offset from now
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate displayed time with offset
  const displayedTime = useMemo(() => {
    const time = new Date(currentTime);
    time.setHours(time.getUTCHours() + timeOffset);
    return time;
  }, [currentTime, timeOffset]);
  
  return (
    <div className="w-full h-full relative bg-black">
      <Canvas
        camera={{ 
          // Position camera to see Europe (France lat ~45, lng ~5)
          position: [2, 2.5, 4],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        {/* Deep space gradient background */}
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#0a0820', 10, 40]} />
        <Scene 
          centers={centers} 
          onCenterSelect={onCenterSelect}
          selectedCenter={selectedCenter}
          timeOffset={timeOffset}
        />
      </Canvas>
      
      {/* Time Control Panel */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-bold text-lg tabular-nums">
              {formatTime(displayedTime, intlLocale)} {t('utc')}
            </p>
            <p className="text-cyan-400 text-xs">
              {formatDate(displayedTime, intlLocale)}
              {timeOffset !== 0 && (
                <span className="text-yellow-400 ml-2">
                  {timeOffset > 0 ? `+${timeOffset}h` : `${timeOffset}h`}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Time slider */}
        <div className="mt-3">
          <input
            type="range"
            min="-12"
            max="24"
            value={timeOffset}
            onChange={(e) => setTimeOffset(Number(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>-12h</span>
            <button 
              onClick={() => setTimeOffset(0)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {t('now')}
            </button>
            <span>+24h</span>
          </div>
        </div>
      </div>
      
      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-white/50 font-mono">
        <p>{t('centerCount', { count: centers.length })}</p>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 text-xs text-white/50">
        <p>{t('instructions')}</p>
      </div>
    </div>
  );
}
