/**
 * Neural Network engine — a small multilayer perceptron trained live with
 * backpropagation on 2D classification datasets.
 *
 * Architecture: 2 inputs → N hidden layers (tanh) → 1 output (sigmoid).
 * Loss: binary cross-entropy. Optimizer: SGD with optional momentum.
 * All math is plain Float64Array-free TypeScript — networks are tiny by design
 * so training can run interactively inside requestAnimationFrame.
 */

export interface NeuralParams {
  hiddenLayers: number[] // e.g. [6, 4]
  learningRate: number
  momentum: number
  l2: number // L2 regularization strength
  batchSize: number
}

export interface DataPoint {
  x: number // in [-1, 1]
  y: number
  label: 0 | 1
}

export type DatasetKind = 'xor' | 'circle' | 'spiral' | 'moons'

export interface TrainStats {
  epoch: number
  loss: number
  accuracy: number
}

/* ------------------------------------------------------------------ */
/* Network                                                             */
/* ------------------------------------------------------------------ */

export class MLP {
  /** sizes[0] must be 2, last must be 1 */
  sizes: number[]
  /** weights[layer][from][to], biases[layer][to] — layers are between sizes */
  weights: number[][][]
  biases: number[][]
  /** momentum velocity buffers */
  private vw: number[][][]
  private vb: number[][]

  constructor(sizes: number[], seed = 42) {
    this.sizes = sizes
    const rand = mulberry32(seed)
    this.weights = []
    this.biases = []
    this.vw = []
    this.vb = []
    for (let l = 0; l < sizes.length - 1; l++) {
      const fanIn = sizes[l]
      const fanOut = sizes[l + 1]
      const scale = Math.sqrt(2 / fanIn) // He-ish init
      const w: number[][] = []
      for (let i = 0; i < fanIn; i++) {
        const row: number[] = []
        for (let j = 0; j < fanOut; j++) row.push((rand() * 2 - 1) * scale)
        w.push(row)
      }
      this.weights.push(w)
      this.biases.push(new Array(fanOut).fill(0))
      this.vw.push(w.map((r) => r.map(() => 0)))
      this.vb.push(new Array(fanOut).fill(0))
    }
  }

  /** Forward pass; returns activations per layer (including input layer). */
  forward(input: number[]): number[][] {
    const acts: number[][] = [input]
    for (let l = 0; l < this.weights.length; l++) {
      const prev = acts[l]
      const out = new Array(this.sizes[l + 1])
      const isOutput = l === this.weights.length - 1
      for (let j = 0; j < out.length; j++) {
        let z = this.biases[l][j]
        for (let i = 0; i < prev.length; i++) z += prev[i] * this.weights[l][i][j]
        out[j] = isOutput ? sigmoid(z) : Math.tanh(z)
      }
      acts.push(out)
    }
    return acts
  }

  predict(x: number, y: number): number {
    const acts = this.forward([x, y])
    return acts[acts.length - 1][0]
  }

  /** One SGD (mini-batch) step with momentum + L2. Returns batch loss. */
  trainBatch(batch: DataPoint[], p: NeuralParams): number {
    const L = this.weights.length
    const gw: number[][][] = this.weights.map((wl) => wl.map((r) => r.map(() => 0)))
    const gb: number[][] = this.biases.map((b) => b.map(() => 0))
    let loss = 0

    for (const pt of batch) {
      const acts = this.forward([pt.x, pt.y])
      const out = acts[L][0]
      const target = pt.label
      loss += binaryCrossEntropy(out, target)

      // output layer delta: for BCE + sigmoid, dL/dz = out - target
      let delta = [out - target]
      // walk layers backward
      for (let l = L - 1; l >= 0; l--) {
        const prev = acts[l]
        // accumulate gradients
        for (let i = 0; i < prev.length; i++) {
          for (let j = 0; j < delta.length; j++) {
            gw[l][i][j] += prev[i] * delta[j]
          }
        }
        for (let j = 0; j < delta.length; j++) gb[l][j] += delta[j]
        // propagate to previous layer (tanh activation for l-1 >= 1)
        if (l > 0) {
          const next = new Array(this.sizes[l]).fill(0)
          for (let i = 0; i < next.length; i++) {
            let s = 0
            for (let j = 0; j < delta.length; j++) s += this.weights[l][i][j] * delta[j]
            const a = acts[l][i]
            next[i] = s * (1 - a * a) // tanh'
          }
          delta = next
        }
      }
    }

    const n = batch.length
    const lr = p.learningRate
    for (let l = 0; l < L; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          const g = gw[l][i][j] / n + p.l2 * this.weights[l][i][j]
          this.vw[l][i][j] = p.momentum * this.vw[l][i][j] - lr * g
          this.weights[l][i][j] += this.vw[l][i][j]
        }
      }
      for (let j = 0; j < this.biases[l].length; j++) {
        const g = gb[l][j] / n
        this.vb[l][j] = p.momentum * this.vb[l][j] - lr * g
        this.biases[l][j] += this.vb[l][j]
      }
    }
    return loss / n
  }

  evaluate(data: DataPoint[]): { loss: number; accuracy: number } {
    let loss = 0
    let correct = 0
    for (const pt of data) {
      const out = this.predict(pt.x, pt.y)
      loss += binaryCrossEntropy(out, pt.label)
      if ((out >= 0.5 ? 1 : 0) === pt.label) correct++
    }
    return { loss: loss / data.length, accuracy: correct / data.length }
  }

  /** Mean absolute weight of a layer, for link-thickness visualization. */
  layerWeights(l: number): number[][] {
    return this.weights[l]
  }
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

function binaryCrossEntropy(out: number, target: number): number {
  const eps = 1e-9
  const o = Math.min(1 - eps, Math.max(eps, out))
  return -(target * Math.log(o) + (1 - target) * Math.log(1 - o))
}

/** Deterministic PRNG so "Reset" reproduces the same initial network. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* Datasets                                                            */
/* ------------------------------------------------------------------ */

export const DATASET_INFO: Record<DatasetKind, { name: string; description: string }> = {
  xor: {
    name: 'XOR quadrants',
    description: 'Diagonal quadrants — not linearly separable; needs at least one hidden layer.',
  },
  circle: {
    name: 'Circle',
    description: 'One class inside a ring — a classic test of nonlinear decision boundaries.',
  },
  spiral: {
    name: 'Double spiral',
    description: 'Two interleaved spirals — the hardest set here; deep nets win.',
  },
  moons: {
    name: 'Two clusters',
    description: 'Two Gaussian blobs with overlap — shows probabilistic boundaries.',
  },
}

export function makeDataset(kind: DatasetKind, n = 160, seed = 7): DataPoint[] {
  const rand = mulberry32(seed)
  const pts: DataPoint[] = []
  const gauss = () => {
    // Box–Muller
    const u = Math.max(rand(), 1e-9)
    const v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  for (let i = 0; i < n; i++) {
    if (kind === 'xor') {
      const x = rand() * 2 - 1
      const y = rand() * 2 - 1
      const label = x * y > 0 ? 1 : 0
      pts.push({ x, y, label: label as 0 | 1 })
    } else if (kind === 'circle') {
      const r = Math.sqrt(rand())
      const th = rand() * 2 * Math.PI
      const x = r * Math.cos(th)
      const y = r * Math.sin(th)
      const label = r < 0.55 ? 1 : 0
      pts.push({ x, y, label: label as 0 | 1 })
    } else if (kind === 'spiral') {
      const half = Math.floor(n / 2)
      const k = i % half
      const label = i < half ? 0 : 1
      const t = (k / half) * Math.PI * 1.75 + 0.3
      const r = 0.15 + 0.8 * (k / half)
      const dir = label === 0 ? 1 : -1
      const x = dir * r * Math.sin(t) + gauss() * 0.04
      const y = dir * r * Math.cos(t) + gauss() * 0.04
      pts.push({ x: clamp(x), y: clamp(y), label: label as 0 | 1 })
    } else {
      // moons: two overlapping gaussian blobs
      const label = i % 2
      const cx = label === 0 ? -0.45 : 0.45
      const cy = label === 0 ? -0.35 : 0.35
      pts.push({
        x: clamp(cx + gauss() * 0.38),
        y: clamp(cy + gauss() * 0.38),
        label: label as 0 | 1,
      })
    }
  }
  return pts
}

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v))
}

export const NEURAL_DEFAULTS: NeuralParams = {
  hiddenLayers: [6, 4],
  learningRate: 0.3,
  momentum: 0.6,
  l2: 0.0001,
  batchSize: 16,
}

export const ARCHITECTURE_PRESETS: { name: string; layers: number[]; note: string }[] = [
  { name: 'Shallow', layers: [4], note: 'One small hidden layer — fast, but underfits spirals.' },
  { name: 'Classic', layers: [6, 4], note: 'Two hidden layers — the default all-rounder.' },
  { name: 'Deep', layers: [8, 6, 4], note: 'Three layers — more capacity, slower to converge.' },
  { name: 'Wide', layers: [12], note: 'One wide layer — memorize-friendly, watch overfitting.' },
]
