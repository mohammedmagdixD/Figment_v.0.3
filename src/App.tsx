/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Component, ErrorInfo, ReactNode, useEffect, Suspense, lazy } from 'react';
import { mutate } from 'swr';
import { Header } from './components/Header';
import { MediaScroller } from './components/MediaScroller';
// Lazy load heavy overlays/modals to reduce initial main thread blocking
const RecommendationModal = lazy(() => import('./components/RecommendationModal').then(module => ({ default: module.RecommendationModal })));
const AuthScreen = lazy(() => import('./components/AuthScreen').then(module => ({ default: module.AuthScreen })));
import { DiaryEntry } from './components/DiaryView';
import { Reorder, useDragControls, AnimatePresence } from 'motion/react';
import { SearchResult, MediaType, Album } from './services/api';
import { AlertTriangle, Loader2, ListPlus } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { getUserProfile, logMediaItem, addSectionItem, syncMediaToShelf, getUserByHandle, sendRecommendation } from './services/supabaseData';
import { useDiary } from './hooks/useDiary';
import { useShelves } from './hooks/useShelves';

import { BottomTabBar, TabType } from './components/BottomTabBar';
import { ToastProvider } from './components/Toast';

const FeedView = lazy(() => import('./views/FeedView').then(module => ({ default: module.FeedView })));
const RecommendationsView = lazy(() => import('./views/RecommendationsView').then(module => ({ default: module.RecommendationsView })));
const AddView = lazy(() => import('./views/AddView').then(module => ({ default: module.AddView })));
const DiaryView = lazy(() => import('./components/DiaryView').then(module => ({ default: module.DiaryView })));
const SectionSeeAllModal = lazy(() => import('./components/SectionSeeAllModal').then(module => ({ default: module.SectionSeeAllModal })));

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-system-background sm:bg-secondary-system-background text-label font-sans sm:pb-12 selection:bg-ios-blue/30">
          <div className="max-w-[428px] mx-auto bg-system-background h-[100dvh] sm:h-[850px] sm:rounded-[40px] sm:my-8 sm:overflow-hidden sm:border-[8px] sm:border-secondary-system-background relative flex flex-col">
            <div className="w-16 h-16 bg-ios-red/10 text-ios-red rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-label mb-3">Something went wrong</h2>
            <p className="text-secondary-label text-sm mb-8">
              We're sorry, but there was an error loading this content. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-label text-system-background rounded-xl py-3.5 font-medium hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DraggableSection = React.memo(({ section, isFirstSection, onAddClick, onSeeAllClick, onLogEpisode, albums, onAddToAlbum, onCreateAlbum, viewingUserId }: { section: any, isFirstSection?: boolean, onAddClick?: (section: any) => void, onSeeAllClick?: (section: any) => void, onLogEpisode?: any, albums?: Album[], onAddToAlbum?: any, onCreateAlbum?: any, viewingUserId?: string }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item 
      value={section} 
      dragListener={false} 
      dragControls={controls}
      className="relative bg-system-background z-0"
    >
      <MediaScroller 
        section={section} 
        dragControls={controls} 
        isFirstSection={isFirstSection}
        onAddClick={() => onAddClick?.(section)} 
        onSeeAllClick={() => onSeeAllClick?.(section)}
        onLogEpisode={onLogEpisode}
        albums={albums}
        onAddToAlbum={onAddToAlbum}
        onCreateAlbum={onCreateAlbum}
        viewingUserId={viewingUserId}
      />
    </Reorder.Item>
  );
});

export default function App() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>({
    name: 'Welcome',
    handle: '@guest',
    bio: 'Please sign in to view your profile.',
    avatar: '',
    socials: []
  });
  
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(user?.id);
  const { diary, isLoading: isDiaryLoading, refetch: refetchDiary } = useDiary(viewingUserId);
  const { shelves: sections, setShelves: setSections, isLoading: isShelvesLoading, refetch: refetchShelves } = useShelves(viewingUserId);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<{ id: string, type: MediaType, title: string } | null>(null);
  const [seeAllSection, setSeeAllSection] = useState<any | null>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = React.useTransition();
  const [renderedTab, setRenderedTab] = useState<TabType>('profile');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(true);
  const [sharedMediaItem, setSharedMediaItem] = useState<{ id: string, type: string } | null>(null);

  const profileRef = React.useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const viewingUserIdRef = React.useRef(viewingUserId);
  useEffect(() => {
    viewingUserIdRef.current = viewingUserId;
  }, [viewingUserId]);

  useEffect(() => {
    async function loadData(path: string) {
      try {
        let targetUserId = user?.id;
        
        const handleMatch = path.match(/^\/@([\w.-]+)/);
        const mediaMatch = path.match(/^\/m\/(.+)\/(.+)/);
        
        if (path === '/' || path === '') {
          setActiveTab('profile');
          setRenderedTab('profile');
        } else if (mediaMatch) {
          setSharedMediaItem({ type: mediaMatch[1], id: mediaMatch[2] });
          setActiveTab('profile');
          setRenderedTab('profile');
        } else if (handleMatch) {
          const handle = handleMatch[1];
          const foundUser = await getUserByHandle(handle);
          if (foundUser) {
            targetUserId = foundUser.id;
            setActiveTab('profile');
            setRenderedTab('profile');
          } else {
            console.error('User not found for handle:', handle);
          }
        } else {
          const tabMatch = path.match(/^\/(feed|diary|add)/);
          if (tabMatch) {
            const tab = tabMatch[1] as TabType;
            setActiveTab(tab);
            setRenderedTab(tab);
          }
        }

        const viewingOwn = !targetUserId || user?.id === targetUserId;
        setIsOwnProfile(viewingOwn);

        if (targetUserId === viewingUserIdRef.current && profileRef.current.handle !== '@guest') {
          setViewingUserId(targetUserId);
          return;
        }

        // Block UI rendering until initial user load completes
        if (profileRef.current.handle === '@guest' || !profileRef.current.handle) {
          setIsDataLoading(true);
        }

        setViewingUserId(targetUserId);

        if (!targetUserId) {
          setIsDataLoading(false);
          return;
        }

        // Fetch user profile
        const userProfile = await getUserProfile(targetUserId).catch(err => {
          console.error("Offline or error fetching profile:", err);
          return null; // Handle offline gracefully
        });

        if (userProfile) {
          const getFallbackAvatar = (name: string) => {
            const initial = (name || 'A').charAt(0).toUpperCase();
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3a3a3c"/><stop offset="100%" stop-color="#1c1c1e"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="50" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="40" font-weight="500" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
            return `data:image/svg+xml;base64,${btoa(svg)}`;
          };

          const profileName = userProfile.name || userProfile.full_name || 'Anonymous';

          setProfile({
            name: profileName,
            handle: userProfile.handle || userProfile.username ? `@${userProfile.username || userProfile.handle}` : '',
            bio: userProfile.bio || '',
            avatar: userProfile.avatar_url || userProfile.avatar || getFallbackAvatar(profileName),
            socials: userProfile.socials?.map((s: any) => ({
              id: s.id,
              user_id: s.user_id,
              platform: s.platform,
              url: s.url,
              position: s.position
            })) || []
          });
        }


      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData(window.location.pathname);

    const handlePopState = () => {
      loadData(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleCreateAlbum = React.useCallback((title: string, description: string, coverImage: string, firstItem: any) => {
    const newAlbum: Album = {
      id: `album_${Date.now()}`,
      title,
      description,
      coverImage,
      tracks: [firstItem]
    };
    setAlbums(prev => [newAlbum, ...prev]);
  }, []);

  const handleAddToAlbum = React.useCallback((albumId: string, item: any) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        if (album.tracks.some(t => t.id === item.id)) return album;
        return { ...album, tracks: [...album.tracks, item] };
      }
      return album;
    }));
  }, []);

  const handleAddClick = React.useCallback((section: any) => {
    setActiveSection({ id: section.id, type: section.type as MediaType, title: section.title });
    setActiveTab('add');
    window.history.pushState({}, '', '/add');
  }, []);

  const handleAddItem = React.useCallback(async (item: SearchResult, details: { rating: number, date: string, liked: boolean, rewatched: boolean, reviewText?: string, hasSpoilers?: boolean }) => {
    if (!user) return;
    try {
      const mediaItemToLog = { ...item, type: item.type || activeSection?.type || 'movie' };
      
      // Perform backend writes concurrently
      const networkPromises: Promise<any>[] = [];
      if (activeSection) {
        networkPromises.push(addSectionItem(activeSection.id, mediaItemToLog, user.id).catch(e => console.error(e)));
      } else {
        networkPromises.push(syncMediaToShelf(user.id, mediaItemToLog).catch(e => console.error(e)));
      }
      
      networkPromises.push(logMediaItem(user.id, mediaItemToLog, details));
      
      // Wait for Supabase to finish so the modal spinner stays active until completed
      await Promise.all(networkPromises);
      
      // Now that backend is updated, trigger cache revalidation for views
      await Promise.all([
        refetchDiary(),
        refetchShelves(),
        mutate(['stats', user.id])
      ]);
    } catch (error) {
      console.error('Failed to log media:', error);
      throw error;
    }
  }, [user, activeSection, refetchDiary, refetchShelves]);

  const handleLogEpisode = React.useCallback(async (episode: any, rating: number, date: string, liked: boolean, rewatched: boolean, podcast: any, reviewText?: string, hasSpoilers?: boolean) => {
    if (!user) return;
    try {
      const mediaItemToLog = {
        id: episode.id,
        title: episode.title,
        subtitle: podcast.title || podcast.header?.title,
        image: episode.image || podcast.images?.posterUrl || podcast.image_url || podcast.image,
        type: 'podcast-episode',
        description: episode.description
      };
      
      // Wait for backend uploads so the modal spinner stays active
      await Promise.all([
        syncMediaToShelf(user.id, mediaItemToLog).catch(e => console.error('Failed to sync episode to shelf:', e)),
        logMediaItem(user.id, mediaItemToLog, { rating, date, liked, rewatched, reviewText, hasSpoilers })
      ]);
      
      // Update local views immediately
      await Promise.all([
        refetchDiary(),
        refetchShelves(),
        mutate(['stats', user.id])
      ]);
    } catch (error) {
      console.error('Failed to log episode:', error);
      throw error;
    }
  }, [user, refetchDiary, refetchShelves]);

  const handleRecommendSubmit = React.useCallback(async (recommendation: any) => {
    if (!viewingUserId) return;
    try {
      await sendRecommendation(
        viewingUserId,
        recommendation.item,
        recommendation.message,
        recommendation.isAnonymous,
        user?.id
      );
      // Optional: Add a toast notification here
      console.log('Recommendation submitted successfully');
    } catch (error) {
      console.error('Failed to send recommendation:', error);
    }
  }, [viewingUserId, user]);

  const handleRecommendClick = React.useCallback(() => setIsRecommendModalOpen(true), []);
  const handleAuthClick = React.useCallback(() => setIsAuthModalOpen(true), []);
  const handleSocialsChange = React.useCallback((newSocials: any) => setProfile(prev => prev ? { ...prev, socials: newSocials } : null), []);

  const handleTabChange = React.useCallback((tab: 'profile' | 'diary' | 'feed' | 'recommendations' | 'add') => {
    if (tab === 'add' && !isOwnProfile) {
      // If viewing someone else's profile, switch to own profile before adding
      if (user) {
        setViewingUserId(user.id);
        setActiveTab('add');
        startTransition(() => setRenderedTab('add'));
        window.history.pushState({}, '', '/add');
      } else {
        setIsAuthModalOpen(true);
      }
      return;
    }

    if (tab === 'add' && activeTab !== 'add') {
      setActiveSection(null);
    }
    setActiveTab(tab);
    startTransition(() => setRenderedTab(tab));
    
    let newPath = `/${tab}`;
    if (tab === 'profile') {
      newPath = profile.handle ? `/@${profile.handle.replace('@', '')}` : '/profile';
    }
    window.history.pushState({}, '', newPath);
  }, [isOwnProfile, user, viewingUserId, activeTab, profile.handle]);

  // Memoize active sections to preserve Framer Motion layout references across SWR rerenders
  const activeSections = React.useMemo(() => {
    return sections.filter(s => s.items && s.items.length > 0);
  }, [sections]);

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-[100dvh] bg-system-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-secondary-label animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-[100dvh] bg-secondary-system-background text-label font-sans sm:pb-12 selection:bg-ios-blue/30">
        <div className="max-w-[428px] mx-auto bg-system-background h-[100dvh] sm:h-[850px] shadow-sm sm:rounded-[40px] sm:my-8 sm:overflow-hidden sm:border-[8px] sm:border-secondary-system-background relative flex flex-col">
          {/* iOS Status Bar Spacer (simulated for desktop view) */}
          <div className="hidden sm:block h-6 w-full bg-system-background shrink-0" />
          
          <div className="flex-1 overflow-hidden relative pt-safe-top bg-system-background">
            <main className={`absolute inset-0 overflow-y-auto hide-scrollbar scroll-container pb-28 space-y-2 transition-opacity duration-200 ${renderedTab === 'profile' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <Header 
                profile={profile} 
                isOwnProfile={isOwnProfile} 
                onRecommendClick={handleRecommendClick} 
                onAuthClick={handleAuthClick} 
                onSocialsChange={handleSocialsChange}
              />
            <div className="w-full h-[0.5px] bg-separator my-4" />
              
              {activeSections.length > 0 ? (
                isOwnProfile ? (
                  <Reorder.Group 
                    axis="y" 
                    values={activeSections} 
                    onReorder={(newVisibleSections) => {
                      const hiddenSections = sections.filter(s => !(s.items && s.items.length > 0));
                      setSections([...newVisibleSections, ...hiddenSections]);
                    }} 
                    className="space-y-2"
                  >
                    {activeSections.map((section) => (
                      <DraggableSection 
                        key={section.id} 
                        section={section} 
                        onAddClick={handleAddClick}
                        onSeeAllClick={(section) => setSeeAllSection(section)}
                        onLogEpisode={handleLogEpisode}
                        albums={albums}
                        onAddToAlbum={handleAddToAlbum}
                        onCreateAlbum={handleCreateAlbum}
                        viewingUserId={viewingUserId}
                      />
                    ))}
                  </Reorder.Group>
                ) : (
                  <div className="space-y-2">
                    {activeSections.map((section) => (
                      <div key={section.id} className="relative bg-system-background z-0">
                        <MediaScroller 
                          section={section} 
                          dragControls={undefined}
                          onAddClick={undefined}
                          onSeeAllClick={() => setSeeAllSection(section)}
                          onLogEpisode={undefined}
                          albums={albums}
                          onAddToAlbum={undefined}
                          onCreateAlbum={undefined}
                          viewingUserId={viewingUserId}
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-secondary-system-background flex items-center justify-center">
                    <ListPlus className="w-8 h-8 text-secondary-label" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-label mb-2">No shelves curated yet</h3>
                  {isOwnProfile && (
                    <p className="font-sans text-sm text-secondary-label max-w-[250px]">
                      Start adding media to your shelves to build your profile.
                    </p>
                  )}
                </div>
              )}

              <section className="py-2 bg-system-background">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h2 className="font-serif text-lg font-semibold leading-relaxed text-label">
                    Albums
                  </h2>
                </div>
                {albums.length > 0 ? (
                  <div className="horizontal-scroll-container hide-scrollbar snap-x snap-mandatory">
                    {albums.map((album) => (
                      <div key={album.id} className="snap-start card-container flex flex-col gap-2 cursor-pointer card-square">
                        <div className="relative overflow-hidden rounded-xl bg-secondary-system-background shadow-sm border border-separator card-image">
                          {album.coverImage ? (
                            <img src={album.coverImage || undefined} alt={album.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-tertiary-system-background">
                              <span className="font-serif text-2xl text-secondary-label">{album.title.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-full">
                          <h3 className="font-sans text-base font-semibold leading-tight text-label card-text-truncate">
                            {album.title}
                          </h3>
                          <p className="font-sans text-sm font-medium leading-relaxed text-secondary-label card-text-truncate mt-0.5">
                            {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-secondary-label text-sm font-sans">
                    No albums created yet.
                  </div>
                )}
              </section>
              
              <div className="h-4" /> {/* Spacer */}
            </main>

            <main className={`absolute inset-0 overflow-y-auto hide-scrollbar scroll-container flex flex-col transition-opacity duration-200 ${renderedTab === 'diary' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="px-4 pt-4 pb-2 shrink-0">
                <h2 className="font-serif text-2xl font-semibold text-label">Diary</h2>
              </div>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-secondary-label animate-spin" /></div>}>
                <DiaryView entries={diary} />
              </Suspense>
            </main>

            <main className={`absolute inset-0 overflow-y-auto hide-scrollbar scroll-container flex flex-col transition-opacity duration-200 ${renderedTab === 'feed' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-secondary-label animate-spin" /></div>}>
                <FeedView />
              </Suspense>
            </main>

            <main className={`absolute inset-0 overflow-y-auto hide-scrollbar scroll-container flex flex-col transition-opacity duration-200 ${renderedTab === 'recommendations' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-secondary-label animate-spin" /></div>}>
                <RecommendationsView viewingUserId={viewingUserId} />
              </Suspense>
            </main>

            <main className={`absolute inset-0 overflow-y-auto hide-scrollbar scroll-container flex flex-col transition-opacity duration-200 ${renderedTab === 'add' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-secondary-label animate-spin" /></div>}>
                <AddView onAddItem={handleAddItem} initialType={activeSection?.type} />
              </Suspense>
            </main>
          </div>
          
          <BottomTabBar 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />
          
          {/* iOS Home Indicator (simulated for desktop view) */}
          <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-label rounded-full z-50" />
        </div>

        <Suspense fallback={null}>
          <RecommendationModal
            isOpen={isRecommendModalOpen}
            onClose={() => setIsRecommendModalOpen(false)}
            onSubmit={handleRecommendSubmit}
          />
        </Suspense>

        <AnimatePresence>
          {((!user && !viewingUserId) || isAuthModalOpen) && (
            <Suspense fallback={null}>
              <AuthScreen />
            </Suspense>
          )}
          {seeAllSection && (
            <Suspense fallback={null}>
              <SectionSeeAllModal 
                section={seeAllSection}
                onClose={() => setSeeAllSection(null)}
                onLogEpisode={handleLogEpisode}
                albums={albums}
                onAddToAlbum={handleAddToAlbum}
                onCreateAlbum={handleCreateAlbum}
                viewingUserId={viewingUserId}
              />
            </Suspense>
          )}
          {sharedMediaItem && (
            <Suspense fallback={null}>
              <MediaDetailsModal
                item={{
                  id: sharedMediaItem.id,
                  type: sharedMediaItem.type,
                  title: 'Loading...',
                  subtitle: '',
                  image: ''
                }}
                onClose={() => {
                  setSharedMediaItem(null);
                  window.history.pushState({}, '', '/');
                }}
                viewingUserId={viewingUserId}
              />
            </Suspense>
          )}
        </AnimatePresence>
        <ToastProvider />
      </div>
    </ErrorBoundary>
  );
}
