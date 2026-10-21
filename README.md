# NEXUS LAB

**Interactive scientific simulation platform — explore the laws of nature through live, documented models running entirely in your browser.**

Follow the project on X: [@nexusailab](https://x.com/nexusailab)

## Live laboratories

| Lab | Domain | What it does |
|---|---|---|
| **Neural Network Laboratory** | Artificial Intelligence | A real multilayer perceptron trained live with backpropagation — watch the decision boundary, loss curve and activations evolve. Datasets: XOR, circle, double spiral, clusters. |
| **Orbital Mechanics Laboratory** | Classical Mechanics | Newtonian N-body integration (velocity Verlet, symplectic) with live energy & angular-momentum conservation monitoring. |
| **Wave Interference Laboratory** | Optics & Waves | Coherent point sources, superposition fields, cross-sections, per-source frequency/amplitude/phase control. |
| **Chaotic Systems Laboratory** | Dynamical Systems | The Lorenz attractor integrated with RK4 — rotate it in 3D and watch twin trajectories diverge exponentially. |

Every experiment ships with its governing equations (KaTeX), numerical method, units, assumptions and known limitations.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Canvas 2D simulation engines (no server — everything runs client-side)
- KaTeX for equations

## Develop

```bash
npm install
npm run dev      # http://localhost:7300
npm run build    # production build → dist/
```

## Principles

- Real mathematics, computed live — no canned animations
- Numerical methods and their bounds are exposed, not hidden
- Conservation laws are plotted so error is visible
- Simplified educational models are labeled as such

---

NEXUS LAB is an open educational project.
