/**
 * Critically-damped spring toward a target.
 * Returns the new value after one timestep.
 */
export function spring(
  current: number,
  target: number,
  velocity: number,
  stiffness: number,
  damping: number,
  dt: number,
): { value: number; velocity: number } {
  const force = stiffness * (target - current);
  const dampForce = damping * velocity;
  const accel = force - dampForce;
  const newVelocity = velocity + accel * dt;
  const newValue = current + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

/**
 * Exponential smoothing (1-pole low-pass).
 * `halfLife` is the time in seconds for the signal to reach ~50% of a step change.
 */
export function expSmooth(
  current: number,
  target: number,
  halfLife: number,
  dt: number,
): number {
  if (halfLife <= 0) return target;
  const alpha = 1 - Math.pow(0.5, dt / halfLife);
  return current + alpha * (target - current);
}
