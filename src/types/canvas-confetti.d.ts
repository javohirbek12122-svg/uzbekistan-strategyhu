declare module 'canvas-confetti' {
  type Options = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    colors?: string[];
    gravity?: number;
    [key: string]: unknown;
  };

  function confetti(options?: Options): void;
  export default confetti;
}
