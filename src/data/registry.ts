import type { SimulationMeta } from '@/types/simulation'

/**
 * Central simulation registry. Cards, filters, documentation sections and
 * workspace headers are generated from this single source of truth.
 */
export const SIMULATIONS: SimulationMeta[] = [
  {
    id: 'neural-network',
    slug: 'neural-network',
    title: 'Neural Network Laboratory',
    tagline: 'Watch an artificial neural network learn, live',
    description:
      'A real multilayer perceptron trained in your browser with backpropagation. Pick a dataset, shape the architecture, tune the learning rate — and watch the decision boundary, loss curve and activations evolve epoch by epoch.',
    domain: 'Artificial Intelligence',
    difficulty: 'Intermediate',
    interactive: true,
    status: 'available',
    estimatedMinutes: 20,
    prerequisites: ['Basic algebra', 'Curiosity about how AI learns'],
    learningObjectives: [
      'See gradient descent reduce the loss in real time',
      'Understand why hidden layers are needed for nonlinear problems',
      'Feel the effect of learning rate, momentum and regularization on training',
    ],
    tags: ['ai', 'neural network', 'backpropagation', 'machine learning', 'classification'],
    capabilities: [
      'Live backpropagation training',
      'Configurable hidden-layer architecture',
      'Decision-boundary visualization',
      'Network graph with live activations',
      'Loss & accuracy charts',
      'Four datasets: XOR, circle, spiral, clusters',
      'Learning-rate, momentum and L2 controls',
    ],
    model: {
      equations: [
        'a^{(l)} = \\tanh\\!\\big(W^{(l)} a^{(l-1)} + b^{(l)}\\big), \\qquad \\hat{y} = \\sigma\\!\\big(W^{(L)} a^{(L-1)} + b^{(L)}\\big)',
        '\\mathcal{L} = -\\frac{1}{N} \\sum_i \\big[ y_i \\ln \\hat{y}_i + (1 - y_i) \\ln (1 - \\hat{y}_i) \\big]',
        'W \\leftarrow W - \\eta \\, \\nabla_W \\mathcal{L} \\;+\\; \\mu \\, \\Delta W_{\\text{prev}}',
      ],
      numericalMethod:
        'Mini-batch stochastic gradient descent with momentum and optional L2 weight decay. Gradients are exact — computed by backpropagation (reverse-mode autodiff) through the tanh/sigmoid network.',
      units:
        'Dimensionless. Inputs are normalized to the unit square [−1, 1]², the output is a probability in (0, 1).',
      assumptions: [
        'Fully-connected feedforward architecture',
        'tanh hidden activations, sigmoid output, binary cross-entropy loss',
        'Deterministic weight initialization (fixed seed) for reproducibility',
      ],
      limitations: [
        'Tiny networks (≤ 3 hidden layers) — real AI models have billions of parameters',
        '2D toy datasets; real-world data is high-dimensional and noisy',
        'No validation split — watch accuracy on the training set only',
      ],
      references: [
        { label: 'Rumelhart, Hinton & Williams (1986), Learning representations by back-propagating errors' },
        { label: 'Goodfellow, Bengio & Courville, Deep Learning, Ch. 6', url: 'https://www.deeplearningbook.org/' },
      ],
    },
    version: '1.0.0',
  },
  {
    id: 'orbital-mechanics',
    slug: 'orbital-mechanics',
    title: 'Orbital Mechanics Laboratory',
    tagline: 'N-body gravitational dynamics in two dimensions',
    description:
      'Place celestial bodies, set their masses and initial velocities, and integrate Newtonian gravity live. Monitor energy and angular momentum to judge the numerical integration itself.',
    domain: 'Classical Mechanics',
    difficulty: 'Intermediate',
    interactive: true,
    status: 'available',
    estimatedMinutes: 20,
    prerequisites: ['Newton\u2019s law of gravitation', 'Basic kinematics'],
    learningObjectives: [
      'Relate initial velocity to orbit shape (circular, elliptical, parabolic escape)',
      'Observe conservation of energy and angular momentum in a symplectic integrator',
      'See how integration step size controls numerical error',
    ],
    tags: ['gravity', 'n-body', 'orbits', 'conservation laws'],
    capabilities: [
      'Add / remove bodies',
      'Live energy & angular momentum readouts',
      'Trajectory trails and velocity vectors',
      'Center-of-mass tracking',
      'Time-series energy chart',
      'CSV data export',
      'Documented presets',
    ],
    model: {
      equations: [
        '\\vec{F}_{ij} = \\frac{G\\, m_i m_j}{\\lVert \\vec{r}_j - \\vec{r}_i \\rVert^2}\\, \\hat{r}_{ij}',
        '\\vec{a}_i = \\sum_{j \\neq i} \\frac{G\\, m_j\\,(\\vec{r}_j - \\vec{r}_i)}{\\left( \\lVert \\vec{r}_j - \\vec{r}_i \\rVert^2 + \\varepsilon^2 \\right)^{3/2}}',
        'E = \\tfrac{1}{2}\\sum_i m_i v_i^2 \\;-\\; \\sum_{i<j} \\frac{G\\, m_i m_j}{\\lVert \\vec{r}_j - \\vec{r}_i \\rVert}',
      ],
      numericalMethod:
        'Velocity Verlet (kick\u2013drift\u2013kick), a 2nd-order symplectic integrator. Symplectic methods bound long-term energy drift, which is why total energy stays nearly constant over thousands of orbits.',
      units:
        'Simulation units: G = 1, distance in arbitrary length units (LU), mass in arbitrary mass units (MU), time in arbitrary time units (TU). To map to SI, set G = 6.674\u00d710\u207b\u00b9\u00b9 m\u00b3 kg\u207b\u00b9 s\u207b\u00b2 and choose length and mass scales.',
      assumptions: [
        'Newtonian (non-relativistic) gravity',
        'Point masses in a 2D plane; no collisions or tidal effects',
        'Softening length \u03b5 avoids singular accelerations at near-zero separation',
      ],
      limitations: [
        'Not an ephemeris: initial conditions are illustrative, not fitted to real solar-system data',
        'Close encounters below the softening length are not physically resolved',
        'Double-precision arithmetic limits accuracy over extremely long integrations',
      ],
      references: [
        { label: 'Newton, Philosophi\u00e6 Naturalis Principia Mathematica (1687)' },
        { label: 'Hairer, Lubich & Wanner, Geometric Numerical Integration \u2014 symplectic methods' },
        { label: 'OpenStax University Physics Vol. 1, Ch. 13 Gravitation', url: 'https://openstax.org/details/books/university-physics-volume-1' },
      ],
    },
    version: '1.0.0',
  },
  {
    id: 'wave-interference',
    slug: 'wave-interference',
    title: 'Wave Interference Laboratory',
    tagline: 'Superposition of coherent point sources',
    description:
      'Drive up to three coherent wave sources, tune frequency, amplitude and phase, and watch the 2D interference field form. Cross-sections and probe readouts tie the picture back to the equations.',
    domain: 'Optics & Waves',
    difficulty: 'Introductory',
    interactive: true,
    status: 'available',
    estimatedMinutes: 15,
    prerequisites: ['Trigonometric functions'],
    learningObjectives: [
      'Connect path difference to constructive and destructive interference',
      'See how wavelength sets the spacing of interference fringes',
      'Observe beats and standing structure from phase control',
    ],
    tags: ['waves', 'superposition', 'interference', 'phase'],
    capabilities: [
      'Up to 3 coherent sources',
      'Frequency, amplitude, phase controls',
      'Draggable source positions',
      '2D field visualization',
      'Cross-section waveform graph',
      'Amplitude probe readout',
    ],
    model: {
      equations: [
        'y_i(\\vec{r}, t) = A_i \\cos\\!\\big( k \\lVert \\vec{r} - \\vec{r}_i \\rVert - \\omega t + \\phi_i \\big)',
        'y_{\\text{total}}(\\vec{r}, t) = \\sum_i y_i(\\vec{r}, t)',
        'k = \\frac{2\\pi}{\\lambda}, \\qquad \\omega = 2\\pi f, \\qquad v = f\\lambda',
      ],
      numericalMethod:
        'Direct analytic evaluation of the superposed wave field on a 2D grid each frame. No time-stepping error is accumulated; the only approximation is the spatial sampling resolution of the grid.',
      units:
        'Arbitrary units: distance in LU, frequency in cycles/TU, amplitude in arbitrary displacement units. Wave speed v = f\u03bb is fixed at 12 LU/TU so frequency and wavelength remain consistent.',
      assumptions: [
        'Linear medium: waves superpose without interacting',
        'Monochromatic point sources, no damping or dispersion',
        '2D scalar field (e.g. water-surface height analog)',
      ],
      limitations: [
        'No reflection, refraction, or boundaries',
        'Amplitude does not decay with distance (no 1/r spreading)',
        'Finite grid resolution aliases very short wavelengths',
      ],
      references: [
        { label: 'OpenStax University Physics Vol. 1, Ch. 16\u201317 Waves & Interference', url: 'https://openstax.org/details/books/university-physics-volume-1' },
        { label: 'Young\u2019s double-slit experiment (1801)' },
      ],
    },
    version: '1.0.0',
  },
  {
    id: 'lorenz-attractor',
    slug: 'lorenz-attractor',
    title: 'Chaotic Systems Laboratory',
    tagline: 'The Lorenz attractor and sensitive dependence',
    description:
      'Integrate the Lorenz system with RK4, fly around the attractor in 3D, and run twin trajectories separated by 10\u207b\u2075 to watch deterministic chaos unfold in real time.',
    domain: 'Dynamical Systems',
    difficulty: 'Intermediate',
    interactive: true,
    status: 'available',
    estimatedMinutes: 20,
    prerequisites: ['Differential equations (helpful, not required)'],
    learningObjectives: [
      'Recognize strange-attractor geometry and its two-lobed structure',
      'Experience sensitive dependence on initial conditions quantitatively',
      'See how \u03c1 moves the system between fixed points, periodic orbits and chaos',
    ],
    tags: ['chaos', 'lorenz', 'dynamical systems', 'rk4'],
    capabilities: [
      'Full \u03c3 / \u03c1 / \u03b2 parameter control',
      'Twin-trajectory divergence experiment',
      'Interactive 3D orbit (rotate & zoom)',
      'State-variable time series',
      'Divergence (separation) chart',
      'Adjustable integration step with stability bounds',
    ],
    model: {
      equations: [
        '\\dot{x} = \\sigma\\,(y - x)',
        '\\dot{y} = x\\,(\\rho - z) - y',
        '\\dot{z} = x y - \\beta z',
      ],
      numericalMethod:
        'Classic 4th-order Runge\u2013Kutta (RK4) with fixed step h. Default h = 0.008 keeps local truncation error ~O(h\u2075) far below the visible trajectory scale. Steps above ~0.02 destabilize the integration \u2014 the workspace enforces documented bounds.',
      units:
        'Dimensionless. The Lorenz equations are a truncated model of Rayleigh\u2013B\u00e9nard convection; \u03c3 is the Prandtl number, \u03c1 the normalized Rayleigh number, \u03b2 a geometric factor.',
      assumptions: [
        'Deterministic ODE system, three state variables',
        'Classic parameter set \u03c3=10, \u03c1=28, \u03b2=8/3 unless changed',
      ],
      limitations: [
        'Finite trajectories illustrate but cannot prove attractor properties',
        'RK4 error grows exponentially along with the dynamics (Lyapunov \u03bb \u2248 0.9)',
        'Long-time numerical shadows diverge from any exact solution',
      ],
      references: [
        { label: 'Lorenz, E. N. (1963). Deterministic Nonperiodic Flow. J. Atmos. Sci. 20(2)' },
        { label: 'Strogatz, Nonlinear Dynamics and Chaos, Ch. 9' },
      ],
    },
    version: '1.0.0',
  },
  {
    id: 'double-pendulum',
    slug: 'double-pendulum',
    title: 'Double Pendulum',
    tagline: 'Classical chaos from two rigid rods',
    description:
      'A deceptively simple mechanical system whose motion is chaotic. Planned: Lagrangian equations of motion, energy monitoring and phase-space portraits.',
    domain: 'Classical Mechanics',
    difficulty: 'Advanced',
    interactive: false,
    status: 'in-development',
    estimatedMinutes: 15,
    prerequisites: ['Lagrangian mechanics'],
    learningObjectives: ['See chaos emerge in a low-dimensional mechanical system'],
    tags: ['pendulum', 'chaos', 'mechanics'],
    capabilities: [],
    model: {
      equations: ['\\mathcal{L} = T - V \\;\\Rightarrow\\; \\frac{d}{dt}\\frac{\\partial \\mathcal{L}}{\\partial \\dot\\theta_i} = \\frac{\\partial \\mathcal{L}}{\\partial \\theta_i}'],
      numericalMethod: 'Planned: RK4 with energy-drift monitoring.',
      units: 'SI',
      assumptions: ['Rigid massless rods', 'Point masses', 'No friction'],
      limitations: ['Not yet implemented'],
      references: [{ label: 'Taylor, Classical Mechanics, Ch. 7' }],
    },
    version: '0.1.0',
  },
  {
    id: 'ising-model',
    slug: 'ising-model',
    title: 'Ising Model & Phase Transitions',
    tagline: 'Emergent magnetism from local spin interactions',
    description:
      'A 2D lattice of spins flipping under Metropolis Monte Carlo. Planned: sweep temperature through the critical point and watch magnetization and susceptibility respond.',
    domain: 'Thermodynamics',
    difficulty: 'Intermediate',
    interactive: false,
    status: 'in-development',
    estimatedMinutes: 20,
    prerequisites: ['Statistical mechanics basics'],
    learningObjectives: ['Connect microscopic rules to a macroscopic phase transition'],
    tags: ['statistical mechanics', 'monte carlo', 'phase transition'],
    capabilities: [],
    model: {
      equations: ['H = -J \\sum_{\\langle i j \\rangle} s_i s_j, \\quad s_i \\in \\{-1, +1\\}', 'P_{\\text{flip}} = \\min\\!\\big(1,\\; e^{-\\Delta E / k_B T}\\big)'],
      numericalMethod: 'Planned: Metropolis\u2013Hastings with configurable random seed.',
      units: 'k_B = 1, J = 1',
      assumptions: ['Square lattice, nearest-neighbor coupling', 'Periodic boundaries'],
      limitations: ['Not yet implemented'],
      references: [{ label: 'Onsager (1944), exact 2D solution' }],
    },
    version: '0.1.0',
  },
  {
    id: 'logistic-map',
    slug: 'logistic-map',
    title: 'Logistic Map & Bifurcations',
    tagline: 'Period doubling on the road to chaos',
    description:
      'Iterate x\u2099\u208a\u2081 = r x\u2099(1 \u2212 x\u2099) and sweep r to reveal the bifurcation diagram and the Feigenbaum constant. Planned: cobweb plots and Lyapunov exponent estimation.',
    domain: 'Dynamical Systems',
    difficulty: 'Introductory',
    interactive: false,
    status: 'in-development',
    estimatedMinutes: 12,
    prerequisites: ['None'],
    learningObjectives: ['See period-doubling cascade to chaos'],
    tags: ['chaos', 'bifurcation', 'iteration'],
    capabilities: [],
    model: {
      equations: ['x_{n+1} = r\\, x_n\\,(1 - x_n)'],
      numericalMethod: 'Exact floating-point iteration.',
      units: 'Dimensionless',
      assumptions: ['x \u2208 [0, 1], r \u2208 [0, 4]'],
      limitations: ['Not yet implemented'],
      references: [{ label: 'Feigenbaum (1978), quantitative universality' }],
    },
    version: '0.1.0',
  },
  {
    id: 'three-body',
    slug: 'three-body',
    title: 'Restricted Three-Body Problem',
    tagline: 'Lagrange points and chaotic transfer orbits',
    description:
      'A massless particle in the field of two orbiting primaries. Planned: rotating-frame visualization, Lagrange-point stability probes and Poincar\u00e9 sections.',
    domain: 'Astronomy',
    difficulty: 'Advanced',
    interactive: false,
    status: 'in-development',
    estimatedMinutes: 25,
    prerequisites: ['Orbital mechanics'],
    learningObjectives: ['Understand why L4/L5 are stable and L1\u2013L3 are not'],
    tags: ['astronomy', 'three-body', 'lagrange points'],
    capabilities: [],
    model: {
      equations: ['\\ddot{\\vec{r}} = -\\nabla U_{\\text{eff}}(\\vec{r}) \\;\\text{(rotating frame)}'],
      numericalMethod: 'Planned: adaptive Runge\u2013Kutta\u2013Fehlberg.',
      units: 'Normalized: total mass = 1, separation = 1, \u03c9 = 1',
      assumptions: ['Circular restricted problem', 'Massless test particle'],
      limitations: ['Not yet implemented'],
      references: [{ label: 'Szebehely, Theory of Orbits (1967)' }],
    },
    version: '0.1.0',
  },
]

export const DOMAINS = Array.from(new Set(SIMULATIONS.map((s) => s.domain)))

export function getSimulation(slug: string): SimulationMeta | undefined {
  return SIMULATIONS.find((s) => s.slug === slug)
}
