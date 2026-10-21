import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Shuffle } from 'lucide-react'
import { WorkspaceShell, ControlSection, Readout, StatusPill } from './WorkspaceShell'
import { ParamControl } from '@/components/ParamControl'
import { SciChart } from '@/components/SciChart'
import { Button } from '@/components/ui/button'
import {
  MLP, makeDataset, mulberry32, NEURAL_DEFAULTS, ARCHITECTURE_PRESETS, DATASET_INFO,
  type DatasetKind, type DataPoint, type NeuralParams,
} from '@/engine/neural'

const GRID = 56
const CLASS_A = '#38BDF8'
const CLASS_B = '#F87171'

/**
 * Neural Network workspace — a real MLP trained live with backpropagation.
 * Left: decision boundary over the input square. Right: network graph with
 * live weights (thickness/color) and activations (glow).
 */
export function NeuralWorkspace() {
  const boundaryRef = useRef<HTMLCanvasElement>(null)
  const netRef = useRef<HTMLCanvasElement>(null)

  const [params, setParams] = useState<NeuralParams>(NEURAL_DEFAULTS)
  const paramsRef = useRef(params)
  const [dataset, setDataset] = useState<DatasetKind>('xor')
  const [running, setRunning] = useState(true)
  const runningRef = useRef(true)
  const [stats, setStats] = useState({ epoch: 0, loss: 0, accuracy: 0 })
  const [hist, setHist] = useState<{ epoch: number[]; loss: number[]; acc: number[] }>({
    epoch: [],
    loss: [],
    acc: [],
  })
  const histRef = useRef(hist)

  const net = useRef<MLP | null>(null)
  const data = useRef<DataPoint[]>([])
  const epochRef = useRef(0)
  const rng = useRef(mulberry32(1234))
  const probeActs = useRef<number[][] | null>(null)

  const rebuild = useCallback((kind: DatasetKind, p: NeuralParams) => {
    net.current = new MLP([2, ...p.hiddenLayers, 1], 42)
    data.current = makeDataset(kind, 180, 7)
    epochRef.current = 0
    histRef.current = { epoch: [], loss: [], acc: [] }
    setHist(histRef.current)
    rng.current = mulberry32(1234)
    const ev = net.current.evaluate(data.current)
    setStats({ epoch: 0, loss: ev.loss, accuracy: ev.accuracy })
  }, [])

  useEffect(() => {
    rebuild(dataset, params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runningRef.current = running
  }, [running])

  const applyDataset = (kind: DatasetKind) => {
    setDataset(kind)
    rebuild(kind, paramsRef.current)
  }

  const applyArchitecture = (layers: number[]) => {
    const next = { ...paramsRef.current, hiddenLayers: layers }
    setParams(next)
    paramsRef.current = next
    rebuild(dataset, next)
  }

  const setP = (patch: Partial<NeuralParams>) => {
    const next = { ...params, ...patch }
    setParams(next)
    paramsRef.current = next
  }

  /* -------------------- training + drawing loop -------------------- */
  useEffect(() => {
    const bCanvas = boundaryRef.current
    const nCanvas = netRef.current
    if (!bCanvas || !nCanvas) return
    const bctx = bCanvas.getContext('2d')!
    const nctx = nCanvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const field = document.createElement('canvas')
    field.width = GRID
    field.height = GRID
    const fctx = field.getContext('2d')!
    const img = fctx.createImageData(GRID, GRID)

    let raf = 0
    let frame = 0

    const render = () => {
      const net_ = net.current
      if (net_) {
        // ---- train ----
        if (runningRef.current) {
          const d = data.current
          const p = paramsRef.current
          for (let s = 0; s < 2; s++) {
            const batch: DataPoint[] = []
            for (let i = 0; i < p.batchSize; i++) batch.push(d[Math.floor(rng.current() * d.length)])
            net_.trainBatch(batch, p)
            epochRef.current += p.batchSize / d.length
          }
          if (frame % 15 === 0) {
            const ev = net_.evaluate(d)
            const ep = Math.round(epochRef.current)
            setStats({ epoch: ep, loss: ev.loss, accuracy: ev.accuracy })
            const h = histRef.current
            const lastEp = h.epoch[h.epoch.length - 1]
            if (lastEp === undefined || ep > lastEp) {
              histRef.current = {
                epoch: [...h.epoch.slice(-249), ep],
                loss: [...h.loss.slice(-249), Number(ev.loss.toFixed(4))],
                acc: [...h.acc.slice(-249), Number(ev.accuracy.toFixed(4))],
              }
              setHist(histRef.current)
            }
          }
        }

        // ---- decision boundary ----
        const bw = bCanvas.clientWidth
        const bh = bCanvas.clientHeight
        if (bCanvas.width !== Math.round(bw * dpr)) {
          bCanvas.width = Math.round(bw * dpr)
          bCanvas.height = Math.round(bh * dpr)
        }
        const px = img.data
        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const x = (gx / (GRID - 1)) * 2 - 1
            const y = 1 - (gy / (GRID - 1)) * 2
            const out = net_.predict(x, y)
            const i = (gy * GRID + gx) * 4
            px[i] = Math.round((56 * (1 - out) + 248 * out) * 0.5 + 11)
            px[i + 1] = Math.round((140 * (1 - out) + 113 * out) * 0.5 + 16)
            px[i + 2] = Math.round((220 * (1 - out) + 113 * out) * 0.5 + 32)
            px[i + 3] = 255
          }
        }
        fctx.putImageData(img, 0, 0)
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        bctx.imageSmoothingEnabled = true
        bctx.fillStyle = '#0B1020'
        bctx.fillRect(0, 0, bw, bh)
        bctx.drawImage(field, 0, 0, bw, bh)
        for (const pt of data.current) {
          const x = ((pt.x + 1) / 2) * bw
          const y = ((1 - pt.y) / 2) * bh
          bctx.fillStyle = pt.label === 1 ? CLASS_B : CLASS_A
          bctx.beginPath()
          if (pt.label === 1) bctx.arc(x, y, 3, 0, Math.PI * 2)
          else bctx.rect(x - 2.6, y - 2.6, 5.2, 5.2)
          bctx.fill()
        }
        probeActs.current = net_.forward([0.35, -0.25])

        // ---- network graph ----
        const nw = nCanvas.clientWidth
        const nh = nCanvas.clientHeight
        if (nCanvas.width !== Math.round(nw * dpr)) {
          nCanvas.width = Math.round(nw * dpr)
          nCanvas.height = Math.round(nh * dpr)
        }
        nctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        nctx.fillStyle = '#0B1020'
        nctx.fillRect(0, 0, nw, nh)
        const acts = probeActs.current
        const sizes = net_.sizes
        const L = sizes.length
        const pos: { x: number; y: number }[][] = sizes.map((n, l) =>
          Array.from({ length: n }, (_, i) => ({
            x: 24 + ((nw - 48) * l) / (L - 1),
            y: nh / 2 + (i - (n - 1) / 2) * Math.min(34, (nh * 0.8) / n),
          })),
        )
        for (let l = 0; l < L - 1; l++) {
          const wMat = net_.layerWeights(l)
          for (let i = 0; i < sizes[l]; i++) {
            for (let j = 0; j < sizes[l + 1]; j++) {
              const wgt = wMat[i][j]
              const a = Math.min(1, Math.abs(wgt) / 1.5)
              nctx.strokeStyle =
                wgt >= 0
                  ? `rgba(56,189,248,${0.06 + a * 0.6})`
                  : `rgba(248,113,113,${0.06 + a * 0.6})`
              nctx.lineWidth = 0.5 + a * 1.6
              nctx.beginPath()
              nctx.moveTo(pos[l][i].x, pos[l][i].y)
              nctx.lineTo(pos[l + 1][j].x, pos[l + 1][j].y)
              nctx.stroke()
            }
          }
        }
        for (let l = 0; l < L; l++) {
          for (let i = 0; i < sizes[l]; i++) {
            const p0 = pos[l][i]
            const act = acts ? acts[l][i] : 0
            const intensity = l === L - 1 ? act : Math.abs(act)
            const g = nctx.createRadialGradient(p0.x, p0.y, 0, p0.x, p0.y, 9)
            g.addColorStop(0, `rgba(125,211,252,${0.35 + 0.65 * Math.min(1, intensity)})`)
            g.addColorStop(1, 'rgba(56,189,248,0.05)')
            nctx.fillStyle = g
            nctx.beginPath()
            nctx.arc(p0.x, p0.y, 9, 0, Math.PI * 2)
            nctx.fill()
            nctx.strokeStyle = 'rgba(56,189,248,0.5)'
            nctx.lineWidth = 1
            nctx.beginPath()
            nctx.arc(p0.x, p0.y, 5, 0, Math.PI * 2)
            nctx.stroke()
          }
        }
        nctx.fillStyle = 'rgba(168,179,199,0.8)'
        nctx.font = '9px Inter, sans-serif'
        nctx.textAlign = 'center'
        const caps = ['inputs x, y', ...sizes.slice(1, -1).map(() => 'hidden · tanh'), 'ŷ · sigmoid']
        caps.forEach((c, l) => nctx.fillText(c, pos[l][0].x, nh - 6))
      }

      frame++
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visualization = (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <span className="panel-title">Decision boundary — what the network “sees”</span>
          <span className="text-[10px] text-muted-foreground">■ class 0 · ● class 1</span>
        </div>
        <div className="relative aspect-[4/3]">
          <canvas ref={boundaryRef} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5">
          <Button size="sm" onClick={() => setRunning((r) => !r)} className="gap-1.5">
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Pause' : 'Train'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => rebuild(dataset, paramsRef.current)} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyDataset(dataset)} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" /> New data
          </Button>
          <span className="ml-auto">
            <StatusPill running={running} label={running ? 'Training' : 'Paused'} />
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <span className="panel-title">Network graph — live weights & activations</span>
          <span className="readout text-[10px] text-muted-foreground">
            2 → {params.hiddenLayers.join(' · ')} → 1
          </span>
        </div>
        <div className="relative aspect-[16/7]">
          <canvas ref={netRef} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    </>
  )

  const chart = (
    <div className="rounded-lg border border-border bg-card p-4">
      <SciChart
        title="Training curves"
        xLabel="epoch"
        yLabel="value"
        xData={hist.epoch}
        series={[
          { label: 'loss (BCE)', color: '#F87171', data: hist.loss },
          { label: 'accuracy', color: '#34D399', data: hist.acc },
        ]}
        yRange={[0, 1]}
        height={190}
        emptyHint="Press Train — loss should fall and accuracy rise"
      />
    </div>
  )

  const controls = (
    <>
      <ControlSection title="Live readouts">
        <div className="space-y-2">
          <Readout label="Epoch" value={String(stats.epoch)} />
          <Readout label="Loss (binary cross-entropy)" value={stats.loss.toFixed(4)} accent="#F87171" />
          <Readout
            label="Accuracy"
            value={`${(stats.accuracy * 100).toFixed(1)} %`}
            accent={stats.accuracy > 0.9 ? '#34D399' : '#FBBF24'}
          />
          <Readout label="Parameters (weights+biases)" value={String(countParams(params.hiddenLayers))} />
        </div>
      </ControlSection>

      <ControlSection title="Dataset">
        <select
          value={dataset}
          onChange={(e) => applyDataset(e.target.value as DatasetKind)}
          className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs outline-none focus:border-primary"
        >
          {(Object.keys(DATASET_INFO) as DatasetKind[]).map((k) => (
            <option key={k} value={k}>{DATASET_INFO[k].name}</option>
          ))}
        </select>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {DATASET_INFO[dataset].description}
        </p>
      </ControlSection>

      <ControlSection title="Architecture (hidden layers)">
        <div className="grid grid-cols-2 gap-1.5">
          {ARCHITECTURE_PRESETS.map((a) => (
            <button
              key={a.name}
              onClick={() => applyArchitecture(a.layers)}
              title={a.note}
              className={`rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
                params.hiddenLayers.join() === a.layers.join()
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {a.name}
              <span className="readout block text-[9px] opacity-70">{a.layers.join('·')}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Changing architecture re-initializes the network from the same fixed seed.
        </p>
      </ControlSection>

      <ControlSection title="Training hyperparameters">
        <ParamControl
          label="Learning rate η"
          value={params.learningRate}
          min={0.01}
          max={1}
          step={0.01}
          precision={2}
          tooltip="Step size of gradient descent. Too small: slow learning. Too large: oscillation or divergence."
          onChange={(v) => setP({ learningRate: v })}
        />
        <ParamControl
          label="Momentum μ"
          value={params.momentum}
          min={0}
          max={0.95}
          step={0.05}
          precision={2}
          tooltip="Carries the update direction forward, smoothing the descent through flat regions of the loss."
          onChange={(v) => setP({ momentum: v })}
        />
        <ParamControl
          label="L2 regularization"
          value={params.l2}
          min={0}
          max={0.01}
          step={0.0001}
          precision={4}
          tooltip="Penalizes large weights, keeping the decision boundary smooth."
          onChange={(v) => setP({ l2: v })}
        />
        <ParamControl
          label="Batch size"
          value={params.batchSize}
          min={4}
          max={64}
          step={4}
          precision={0}
          tooltip="Samples per gradient step. Small batches are noisy but fast; large batches are stable."
          onChange={(v) => setP({ batchSize: v })}
        />
      </ControlSection>

      <ControlSection title="What to watch">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          The red loss curve should fall while green accuracy climbs. On “Double spiral” a shallow
          network stalls near 50–60% — switch to Deep and feel the capacity difference. Push η to 1.0
          to see training oscillate; add momentum to calm it.
        </p>
      </ControlSection>
    </>
  )

  return <WorkspaceShell visualization={visualization} chart={chart} controls={controls} />
}

function countParams(hidden: number[]): number {
  const sizes = [2, ...hidden, 1]
  let n = 0
  for (let l = 0; l < sizes.length - 1; l++) n += sizes[l] * sizes[l + 1] + sizes[l + 1]
  return n
}
