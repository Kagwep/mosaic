import React, { useState } from 'react';
import { Trophy, Users, Timer, Paintbrush, Calendar, Award, ArrowRight, Eye, Vote as VoteIcon } from 'lucide-react';

interface Competition {
  id: number;
  title: string;
  description: string;
  communityId: number;
  communityName: string;
  startTime: number;
  endTime: number;
  participantCount: number;
  artworkCount: number;
  totalVotes: number;
  status: 'upcoming' | 'active' | 'completed';
  winnerId?: number;
  bannerImage: string;
  artworks: ArtworkEntry[];
  prizePool?: string;
}

interface ArtworkEntry {
  id: number;
  title: string;
  imageHash: string;
  artist: string;
  votes: number;
  contributionCount: number;
  isWinner: boolean;
  hasActiveSlot: boolean;
  slotEndTime?: number;
}

const CompetitionsPage = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);

  // Mock data for development
  const mockCompetition: Competition = {
    id: 1,
    title: "Digital Art Challenge 2024",
    description: "Create collaborative digital artworks that represent the future of art",
    communityId: 1,
    communityName: "Digital Artists Collective",
    startTime: Date.now() - 86400000, // 1 day ago
    endTime: Date.now() + 86400000 * 5, // 5 days from now
    participantCount: 24,
    artworkCount: 12,
    totalVotes: 156,
    status: 'active',
    bannerImage: "/api/placeholder/800/200",
    prizePool: "1.5 ETH",
    artworks: [
      {
        id: 1,
        title: "Digital Dreams",
        imageHash: "hash1",
        artist: "0x123...",
        votes: 45,
        contributionCount: 3,
        isWinner: false,
        hasActiveSlot: true,
        slotEndTime: Date.now() + 3600000 // 1 hour from now
      },
      // Add more mock artworks...
    ]
  };

  const CompetitionCard: React.FC<{ competition: Competition }> = ({ competition }) => {
    const timeRemaining = competition.endTime - Date.now();
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Banner */}
        <div className="relative h-48">
          <img 
            src={competition.bannerImage}
            alt={competition.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${competition.status === 'active' ? 'bg-green-100 text-green-800' : 
                competition.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                'bg-blue-100 text-blue-800'}
            `}>
              {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
            </span>
          </div>
          {competition.prizePool && (
            <div className="absolute bottom-4 right-4">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Trophy className="w-4 h-4 mr-1" />
                {competition.prizePool}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{competition.title}</h3>
              <p className="text-sm text-gray-600">{competition.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{competition.participantCount}</p>
              <p className="text-xs text-gray-600">Participants</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{competition.artworkCount}</p>
              <p className="text-xs text-gray-600">Artworks</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{competition.totalVotes}</p>
              <p className="text-xs text-gray-600">Total Votes</p>
            </div>
            <div className="text-center">
              {competition.status === 'active' ? (
                <>
                  <p className="text-lg font-bold text-gray-900">{`${days}d ${hours}h`}</p>
                  <p className="text-xs text-gray-600">Remaining</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-900">-</p>
                  <p className="text-xs text-gray-600">{competition.status}</p>
                </>
              )}
            </div>
          </div>

          {/* Featured Artworks Preview */}
          {competition.artworks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Latest Entries</h4>
              <div className="grid grid-cols-3 gap-2">
                {competition.artworks.slice(0, 3).map(artwork => (
                  <div key={artwork.id} className="relative group rounded-lg overflow-hidden">
                    <img 
                      src={`https://ipfs.io/ipfs/${artwork.imageHash}`}
                      alt={artwork.title}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                      <span className="text-white text-xs text-center">{artwork.title}</span>
                      <div className="flex items-center mt-1">
                        <VoteIcon className="w-3 h-3 text-white mr-1" />
                        <span className="text-white text-xs">{artwork.votes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              by {competition.communityName}
            </span>
            <button 
              onClick={() => setSelectedCompetition(competition.id)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <span className="text-sm">View Details</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CompetitionDetailModal = () => {
    // Implementation for competition detail view
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Art Competitions</h1>
          <p className="text-gray-600">Participate in community competitions and win prizes</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            <option value="all">All Competitions</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
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

      {/* Competition Grid */}
      <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {[1,2,3,4,5,6].map((i) => (
          <CompetitionCard 
            key={i} 
            competition={{
              ...mockCompetition,
              id: i,
              title: `Competition ${i}`,
              status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'active' : 'upcoming',
              participantCount: Math.floor(Math.random() * 50) + 10,
              totalVotes: Math.floor(Math.random() * 200)
            }}
          />
        ))}
      </div>

      {/* Competition Detail Modal */}
      {selectedCompetition && <CompetitionDetailModal />}
    </div>
  );
};

export default CompetitionsPage;