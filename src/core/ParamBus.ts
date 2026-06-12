import { spring } from './springs';

/** All continuous parameters live in [0, 1] unless noted. */
export interface ParamBusState {
  // Structure hand
  growthRate: number;
  branchSpread: number;
  lean: number;
  frozen: number; // 0 = growing, 1 = fist-freeze

  // Bloom hand
  bloomAperture: number;
  glow: number;
  spiral: number;

  // Combined
  wind: number;
  dolly: number;

  // Background
  bgDim: number;

  // Species (0 = lily, 1 = iris, 2 = rose) — not smoothed
  species: number;
}

export interface ParamBusTargets extends ParamBusState {}

type SpringChannel = {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;
};

const SPRING_DEFAULTS = { stiffness: 120, damping: 18 };

const CHANNEL_CONFIG: Record<
  keyof Omit<ParamBusState, 'species'>,
  { stiffness: number; damping: number }
> = {
  growthRate: { stiffness: 80, damping: 14 },
  branchSpread: { stiffness: 100, damping: 16 },
  lean: { stiffness: 60, damping: 12 },
  frozen: { stiffness: 200, damping: 22 },
  bloomAperture: { stiffness: 140, damping: 18 },
  glow: { stiffness: 90, damping: 14 },
  spiral: { stiffness: 70, damping: 12 },
  wind: { stiffness: 50, damping: 10 },
  dolly: { stiffness: 40, damping: 10 },
  bgDim: { stiffness: 60, damping: 12 },
};

export class ParamBus {
  readonly state: ParamBusState;
  private channels: Map<keyof ParamBusState, SpringChannel> = new Map();

  constructor(initial?: Partial<ParamBusState>) {
    const defaults: ParamBusState = {
      growthRate: 0.3,
      branchSpread: 0.3,
      lean: 0.5,
      frozen: 0,
      bloomAperture: 0,
      glow: 0.3,
      spiral: 0.5,
      wind: 0,
      dolly: 0.5,
      bgDim: 0.55,
      species: 0,
    };

    this.state = { ...defaults, ...initial };

    for (const key of Object.keys(CHANNEL_CONFIG) as Array<
      keyof Omit<ParamBusState, 'species'>
    >) {
      const cfg = CHANNEL_CONFIG[key] ?? SPRING_DEFAULTS;
      this.channels.set(key, {
        value: this.state[key],
        target: this.state[key],
        velocity: 0,
        ...cfg,
      });
    }
  }

  /** Set raw target(s). Tracking and UI write here. */
  setTarget(partial: Partial<ParamBusTargets>): void {
    for (const [key, val] of Object.entries(partial)) {
      if (key === 'species') {
        this.state.species = val as number;
        continue;
      }
      const ch = this.channels.get(key as keyof ParamBusState);
      if (ch) ch.target = val as number;
    }
  }

  /** Read smoothed values. Rendering reads here. */
  get<K extends keyof ParamBusState>(key: K): ParamBusState[K] {
    return this.state[key];
  }

  /** Advance all springs by dt seconds. Call once per frame. */
  tick(dt: number): void {
    for (const [key, ch] of this.channels) {
      const result = spring(
        ch.value,
        ch.target,
        ch.velocity,
        ch.stiffness,
        ch.damping,
        dt,
      );
      ch.value = result.value;
      ch.velocity = result.velocity;
      this.state[key as keyof Omit<ParamBusState, 'species'>] = ch.value;
    }
  }

  /** lil-gui proxy — writes set targets only so springs visibly ease. */
  getGuiProxy(): ParamBusState {
    return new Proxy(this.state, {
      set: (_target, prop: string, value: number) => {
        if (prop === 'species') {
          this.state.species = value;
          return true;
        }
        const ch = this.channels.get(prop as keyof ParamBusState);
        if (ch) {
          ch.target = value;
        }
        return true;
      },
    });
  }
}
