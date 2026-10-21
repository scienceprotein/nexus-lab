import { Routes, Route, Navigate, Outlet, useParams } from 'react-router'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import Home from './pages/Home'
import Explorer from './pages/Explorer'
import Workspace from './pages/Workspace'
import Docs from './pages/Docs'
import About from './pages/About'

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explorer />} />
        <Route path="/simulations" element={<Navigate to="/explore" replace />} />
        <Route path="/sim/:slug" element={<Workspace />} />
        <Route path="/simulations/:slug" element={<NavigateToSim />} />
        <Route path="/docs" element={<Navigate to="/docs/neural-network" replace />} />
        <Route path="/docs/:slug" element={<Docs />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function NavigateToSim() {
  const { slug } = useParams()
  return <Navigate to={`/sim/${slug}`} replace />
}
