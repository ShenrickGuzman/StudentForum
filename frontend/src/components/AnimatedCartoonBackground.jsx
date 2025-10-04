import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

export default function AnimatedCartoonBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="cartoon-bg"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        particles: {
          number: { value: 30, density: { enable: true, area: 800 } },
          color: { value: ['#7fbcff', '#b388ff', '#ff7eb3', '#ffe066', '#7fffd4'] },
          shape: {
            type: ['circle', 'star', 'polygon'],
            polygon: { nb_sides: 5 },
            stroke: { width: 0, color: '#fff' },
          },
          opacity: { value: 0.5, random: true },
          size: { value: 32, random: { enable: true, minimumValue: 12 } },
          move: {
            enable: true,
            speed: 1.5,
            direction: 'none',
            random: true,
            straight: false,
            outModes: { default: 'out' },
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            onClick: { enable: true, mode: 'push' },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { quantity: 2 },
          },
        },
        detectRetina: true,
      }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
}
