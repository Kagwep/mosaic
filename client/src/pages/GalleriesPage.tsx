import React, { useState } from 'react';
import { Timer, Vote, Paintbrush, Trophy, User, ExternalLink } from 'lucide-react';

interface Artwork {
  id: number;
  title: string;
  originalArtHash: string;
  originalArtist: string;
  createdAt: number;
  nftContract: string;
  latestTokenId: number;
  competitionId: number;
  votes: number;
  hasActiveSlot: boolean;
  currentArtist: string | null;
  slotEndTime: number;
  contributionCount: number;
  isWinner: boolean;
}

interface Competition {
  id: number;
  endTime: number;
  completed: boolean;
  winnerId: number;
  artworkIds: number[];
}

const GalleriesPage = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Mock data for development
  const mockArtwork: Artwork = {
    id: 1,
    title: "Sample Artwork",
    originalArtHash: "QmHash123",
    originalArtist: "0x123...abc",
    createdAt: Date.now(),
    nftContract: "0xContract",
    latestTokenId: 1,
    competitionId: 1,
    votes: 10,
    hasActiveSlot: false,
    currentArtist: null,
    slotEndTime: 0,
    contributionCount: 3,
    isWinner: false
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const ArtworkCard: React.FC<{ artwork: Artwork }> = ({ artwork }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        {/* Artwork Image/Preview */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
          <img 
            src={`https://ipfs.io/ipfs/${artwork.originalArtHash}`} 
            alt={artwork.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Artwork Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{artwork.title}</h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{formatAddress(artwork.originalArtist)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Vote className="w-4 h-4" />
              <span>{artwork.votes} votes</span>
            </div>
            <div className="flex items-center gap-1">
              <Paintbrush className="w-4 h-4" />
              <span>{artwork.contributionCount} contributions</span>
            </div>
          </div>

          {/* Active Slot Indicator */}
          {artwork.hasActiveSlot && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Timer className="w-4 h-4" />
              <span>Active Drawing Slot</span>
            </div>
          )}

          {/* Winner Badge */}
          {artwork.isWinner && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <Trophy className="w-4 h-4" />
              <span>Competition Winner</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              View Details
            </button>
            {!artwork.hasActiveSlot && (
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Request Slot
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        
        {/* Filters */}
        <div className="flex gap-4">
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'active' | 'completed')}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            <option value="all">All Artworks</option>
            <option value="active">Active Competitions</option>
            <option value="completed">Completed</option>
          </select>
          
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button 
              onClick={() => setView('grid')}
              className={`px-4 py-2 ${view === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-2 ${view === 'list' ? 'bg-gray-100' : 'bg-white'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={`grid ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
        {/* For development, showing multiple instances of mock artwork */}
        {[1,2,3,4,5,6].map((i) => (
          <ArtworkCard 
            key={i} 
            artwork={{...mockArtwork, id: i, votes: Math.floor(Math.random() * 50)}} 
          />
        ))}
      </div>
    </div>
  );
};

export default GalleriesPage;