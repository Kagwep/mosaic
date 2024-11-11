import { useAccount, useConnect, useDisconnect } from 'wagmi'
import CollaborativeCanvas from './components/Draw'
import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GalleriesPage from './pages/GalleriesPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CompetitionsPage from './pages/CompetitionsPage';

// Create placeholder components for now
const Gallery = () => <div className="p-8">Gallery View (Coming Soon)</div>;
const Community = () => <div className="p-8">Community View (Coming Soon)</div>;

// Layout wrapper to include Navbar
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
};

function App() {
  // const account = useAccount()
  // const { connectors, connect, status, error } = useConnect()
  // const { disconnect } = useDisconnect()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Navigate to="/gallery" replace /></Layout>} />
        <Route path="/gallery" element={<Layout><GalleriesPage /></Layout>} />
        <Route path="/competition" element={<Layout><CompetitionsPage /></Layout>} />
        <Route path="/create" element={<Layout><CollaborativeCanvas /></Layout>} />
        <Route path="/community" element={<Layout><CommunitiesPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
