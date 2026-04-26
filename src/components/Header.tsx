import React, { useState } from 'react';
import { Link as LinkIcon, Share, MoreHorizontal, Sparkles, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../utils/haptics';
import { useAuth } from '../contexts/AuthContext';
import { ShareSheet } from './ShareSheet';
import { ProfileHeaderSocials } from './ProfileHeaderSocials';
import { ManageLinksScreen } from './ManageLinksScreen';

interface HeaderProps {
  profile: any;
  isOwnProfile?: boolean;
  onRecommendClick?: () => void;
  onAuthClick?: () => void;
  onSocialsChange?: (socials: any[]) => void;
}

export const Header = React.memo(function Header({ profile, isOwnProfile = true, onRecommendClick, onAuthClick, onSocialsChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isManageLinksOpen, setIsManageLinksOpen] = useState(false);

  const handleShare = () => {
    haptics.light();
    setIsShareSheetOpen(true);
  };

  return (
    <>
      <header className="px-4 pt-[calc(env(safe-area-inset-top)+3rem)] pb-6 relative">
        {/* Top Actions - Glassmorphic */}
        <div className="absolute top-4 right-4 flex gap-3 z-10">
          {!isOwnProfile ? (
            <>
              <motion.button 
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={handleShare}
                className="p-2.5 bg-secondary-system-background/70 backdrop-blur-md border border-separator shadow-sm rounded-full text-label hover:bg-secondary-system-background/90 transition-colors"
              >
                <Share className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={() => {
                  haptics.light();
                  onAuthClick?.();
                }}
                className="p-2.5 bg-secondary-system-background/70 backdrop-blur-md border border-separator shadow-sm rounded-full text-label hover:bg-secondary-system-background/90 transition-colors"
              >
                <LogIn className="w-4 h-4" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button 
                whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                onClick={handleShare}
                className="p-2.5 bg-secondary-system-background/70 backdrop-blur-md border border-separator shadow-sm rounded-full text-label hover:bg-secondary-system-background/90 transition-colors"
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
                className="p-2.5 bg-secondary-system-background/70 backdrop-blur-md border border-separator shadow-sm rounded-full text-label hover:bg-secondary-system-background/90 transition-colors"
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
            className="mt-5 font-serif text-3xl font-bold leading-tight text-label tracking-tight"
          >
            {profile.name}
          </motion.h1>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="font-sans text-base font-medium leading-relaxed text-secondary-label mt-1"
          >
            {profile.handle}
          </motion.p>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 font-sans text-base font-medium leading-relaxed text-secondary-label opacity-80 max-w-[290px]"
          >
            {profile.bio}
          </motion.p>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex gap-3 mt-7"
          >
            <ProfileHeaderSocials socials={profile.socials} />
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
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-label text-system-background rounded-full font-medium shadow-md hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Recommend
            </motion.button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {isActionSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionSheetOpen(false)}
              className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom"
            >
              <div className="bg-secondary-system-background/90 backdrop-blur-xl rounded-2xl mb-2 overflow-hidden">
                <button className="w-full py-4 text-label text-lg font-medium border-b border-separator hover:bg-tertiary-system-background transition-colors">
                  Connections
                </button>
                <button 
                  onClick={() => {
                    haptics.medium();
                    setIsActionSheetOpen(false);
                    setIsManageLinksOpen(true);
                  }}
                  className="w-full py-4 text-label text-lg font-medium border-b border-separator hover:bg-tertiary-system-background transition-colors"
                >
                  Links
                </button>
                <button className="w-full py-4 text-label text-lg font-medium border-b border-separator hover:bg-tertiary-system-background transition-colors">
                  Privacy
                </button>
                <button className="w-full py-4 text-label text-lg font-medium border-b border-separator hover:bg-tertiary-system-background transition-colors">
                  Settings
                </button>
                <button 
                  onClick={() => {
                    haptics.medium();
                    signOut();
                    setIsActionSheetOpen(false);
                  }}
                  className="w-full py-4 text-red-500 text-lg font-medium hover:bg-tertiary-system-background transition-colors"
                >
                  Log out
                </button>
              </div>
              <button 
                onClick={() => setIsActionSheetOpen(false)}
                className="w-full py-4 mb-4 bg-secondary-system-background/90 backdrop-blur-xl rounded-2xl text-label text-lg font-semibold hover:bg-tertiary-system-background transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ShareSheet 
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        profile={{
          name: profile.name,
          handle: profile.handle,
          avatar: profile.avatar
        }}
      />

      <ManageLinksScreen
        isOpen={isManageLinksOpen}
        onClose={() => setIsManageLinksOpen(false)}
        socials={profile.socials}
        onSocialsChange={onSocialsChange || (() => {})}
        userId={user?.id || ''}
      />
    </>
  );
});
