import React, { useState } from 'react';
import { Users, Star, TrendingUp, Calendar, ArrowRight, MessageCircle, Paintbrush } from 'lucide-react';

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  artworkCount: number;
  competitionCount: number;
  bannerImage: string;
  avatarImage: string;
  isJoined: boolean;
  activeCompetitions: number;
  featuredArtworks: ArtworkPreview[];
  recentActivities: Activity[];
}

interface ArtworkPreview {
  id: number;
  title: string;
  imageHash: string;
  artist: string;
  votes: number;
}

interface Activity {
  id: number;
  type: 'new_artwork' | 'competition_started' | 'competition_ended' | 'new_member';
  timestamp: number;
  description: string;
  relatedId: number;
}

const CommunitiesPage = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'joined' | 'trending'>('all');

  // Mock data for development
  const mockCommunity: Community = {
    id: 1,
    name: "Digital Artists Collective",
    description: "A community of digital artists pushing the boundaries of collaborative art creation",
    memberCount: 150,
    artworkCount: 45,
    competitionCount: 12,
    bannerImage: "/api/placeholder/800/200",
    avatarImage: "/api/placeholder/100/100",
    isJoined: false,
    activeCompetitions: 2,
    featuredArtworks: [
      { id: 1, title: "Digital Dreams", imageHash: "hash1", artist: "0x123...", votes: 25 },
      { id: 2, title: "Future Vision", imageHash: "hash2", artist: "0x456...", votes: 18 }
    ],
    recentActivities: [
      { id: 1, type: 'new_artwork', timestamp: Date.now(), description: "New artwork added", relatedId: 1 },
      { id: 2, type: 'competition_started', timestamp: Date.now() - 86400000, description: "New competition started", relatedId: 1 }
    ]
  };

  const CommunityCard: React.FC<{ community: Community }> = ({ community }) => {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Banner Image */}
        <div className="relative h-48 w-full">
          <img 
            src={community.bannerImage} 
            alt={`${community.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute -bottom-10 left-6">
            <img 
              src={community.avatarImage}
              alt={`${community.name} avatar`}
              className="w-20 h-20 rounded-xl border-4 border-white shadow-md"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{community.name}</h3>
              <p className="text-gray-600 text-sm">{community.description}</p>
            </div>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                community.isJoined 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {community.isJoined ? 'Joined' : 'Join'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{community.memberCount}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{community.artworkCount}</p>
              <p className="text-sm text-gray-600">Artworks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{community.competitionCount}</p>
              <p className="text-sm text-gray-600">Competitions</p>
            </div>
          </div>

          {/* Featured Artworks */}
          {community.featuredArtworks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Featured Artworks</h4>
              <div className="grid grid-cols-2 gap-2">
                {community.featuredArtworks.map(artwork => (
                  <div key={artwork.id} className="relative group rounded-lg overflow-hidden">
                    <img 
                      src={`https://ipfs.io/ipfs/${artwork.imageHash}`}
                      alt={artwork.title}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">{artwork.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {community.recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center gap-2 text-sm text-gray-600">
                  {activity.type === 'new_artwork' && <Paintbrush className="w-4 h-4" />}
                  {activity.type === 'competition_started' && <Calendar className="w-4 h-4" />}
                  <span>{activity.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* View Details Link */}
          <div className="mt-6 text-right">
            <a href={`/communities/${community.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <span className="text-sm">View Details</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Communities</h1>
          <p className="text-gray-600">Join communities of artists and participate in collaborative art creation</p>
        </div>
        
        {/* Controls */}
        <div className="flex gap-4">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'joined' | 'trending')}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            <option value="all">All Communities</option>
            <option value="joined">Joined</option>
            <option value="trending">Trending</option>
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

      {/* Community Grid */}
      <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {[1,2,3,4,5,6].map((i) => (
          <CommunityCard 
            key={i} 
            community={{
              ...mockCommunity, 
              id: i,
              memberCount: 100 + Math.floor(Math.random() * 500),
              isJoined: i % 3 === 0
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default CommunitiesPage;