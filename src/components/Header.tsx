import { Twitter, Instagram, Github, Link as LinkIcon, Share, MoreHorizontal, Sparkles, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../utils/haptics';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface HeaderProps {
  profile: any;
  isOwnProfile?: boolean;
  onRecommendClick?: () => void;
  onAuthClick?: () => void;
}

export function Header({ profile, isOwnProfile = true, onRecommendClick, onAuthClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'github': return <Github className="w-5 h-5" />;
      default: return <LinkIcon className="w-5 h-5" />;
    }
  };

  const getHoverClass = (iconName: string) => {
    switch (iconName) {
      case 'twitter': return 'hover:bg-quiet-sky hover:border-quiet-sky hover:shadow-[0_0_15px_rgba(196,227,243,0.5)] text-[var(--label)]';
      case 'instagram': return 'hover:bg-cherry-blossom hover:border-cherry-blossom hover:shadow-[0_0_15px_rgba(244,200,221,0.5)] text-[var(--label)]';
      case 'github': return 'hover:bg-whispering-leaf hover:border-whispering-leaf hover:shadow-[0_0_15px_rgba(209,234,205,0.5)] text-[var(--label)]';
      default: return 'hover:bg-morning-haze hover:border-morning-haze hover:shadow-[0_0_15px_rgba(253,236,201,0.5)] text-[var(--label)]';
    }
  };

  const handleShare = async () => {
    haptics.light();
    const shareUrl = `${window.location.origin}/@${profile.handle.replace('@', '')}`;
    const shareData = {
      title: `${profile.name}'s Profile`,
      text: `Check out ${profile.name}'s recommendations!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Profile link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <>
      <header className="px-4 pt-12 pb-6 relative">
        {/* Top Actions - Glassmorphic */}
        <div className="absolute top-4 right-4 flex gap-3 z-10">
          {!isOwnProfile ? (
            <motion.button 
              whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => {
                haptics.light();
                onAuthClick?.();
              }}
              className="p-2.5 bg-[var(--secondary-system-background)]/70 backdrop-blur-md border border-[var(--separator)] shadow-sm rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)]/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
            </motion.button>
          ) : (
            <>
              <motion.button 
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={handleShare}
                className="p-2.5 bg-[var(--secondary-system-background)]/70 backdrop-blur-md border border-[var(--separator)] shadow-sm rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)]/90 transition-colors"
              >
                <Share className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={() => {
                  haptics.light();
                  setIsActionSheetOpen(true);
                }}
                className="p-2.5 bg-[var(--secondary-system-background)]/70 backdrop-blur-md border border-[var(--separator)] shadow-sm rounded-full text-[var(--label)] hover:bg-[var(--secondary-system-background)]/90 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>

        <div className="flex flex-col items-center text-center mt-4 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative cursor-pointer"
          >
            <img 
              src={profile.avatar || undefined} 
              alt={profile.name} 
              className="w-28 h-28 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-5 font-serif text-3xl font-bold leading-tight text-[var(--label)] tracking-tight"
          >
            {profile.name}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="font-sans text-base font-medium leading-relaxed text-[var(--secondary-label)] mt-1"
          >
            {profile.handle}
          </motion.p>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 font-sans text-base font-medium leading-relaxed text-[var(--secondary-label)] opacity-80 max-w-[290px]"
          >
            {profile.bio}
          </motion.p>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex gap-3 mt-7"
          >
            {profile.socials.map((social: any, index: number) => (
              <motion.a 
                key={index}
                href={social.url}
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.1 : 1, y: window.matchMedia('(hover: hover)').matches ? -4 : 0 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={() => haptics.light()}
                className={`w-12 h-12 flex items-center justify-center rounded-full bg-[var(--secondary-system-background)]/70 backdrop-blur-sm border border-[var(--separator)] shadow-sm transition-colors duration-300 ${getHoverClass(social.icon)}`}
                aria-label={social.platform}
              >
                {getIcon(social.icon)}
              </motion.a>
            ))}
          </motion.div>

          {!isOwnProfile && (
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 30 }}
              whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptics.medium();
                onRecommendClick?.();
              }}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-[var(--label)] text-[var(--system-background)] rounded-full font-medium shadow-md hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Recommend
            </motion.button>
          )}
        </div>
      </header>

      {/* iOS Action Sheet */}
      <AnimatePresence>
        {isActionSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom"
            >
              <div className="bg-[var(--secondary-system-background)]/90 backdrop-blur-xl rounded-2xl mb-2 overflow-hidden">
                <button className="w-full py-4 text-[var(--label)] text-lg font-medium border-b border-[var(--separator)] hover:bg-[var(--tertiary-system-background)] transition-colors">
                  Connections
                </button>
                <button className="w-full py-4 text-[var(--label)] text-lg font-medium border-b border-[var(--separator)] hover:bg-[var(--tertiary-system-background)] transition-colors">
                  Links
                </button>
                <button className="w-full py-4 text-[var(--label)] text-lg font-medium border-b border-[var(--separator)] hover:bg-[var(--tertiary-system-background)] transition-colors">
                  Privacy
                </button>
                <button className="w-full py-4 text-[var(--label)] text-lg font-medium border-b border-[var(--separator)] hover:bg-[var(--tertiary-system-background)] transition-colors">
                  Settings
                </button>
                <button 
                  onClick={() => {
                    haptics.medium();
                    signOut();
                    setIsActionSheetOpen(false);
                  }}
                  className="w-full py-4 text-red-500 text-lg font-medium hover:bg-[var(--tertiary-system-background)] transition-colors"
                >
                  Log out
                </button>
              </div>
              <button 
                onClick={() => setIsActionSheetOpen(false)}
                className="w-full py-4 mb-4 bg-[var(--secondary-system-background)]/90 backdrop-blur-xl rounded-2xl text-[var(--label)] text-lg font-semibold hover:bg-[var(--tertiary-system-background)] transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
