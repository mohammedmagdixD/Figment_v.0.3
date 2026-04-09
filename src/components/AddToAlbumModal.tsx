import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { Album } from '../services/api';
import { useScrollLock } from '../hooks/useScrollLock';

interface AddToAlbumModalProps {
  item: any;
  albums: Album[];
  onClose: () => void;
  onAddToAlbum: (albumId: string, item: any) => void;
  onCreateAlbum: (title: string, description: string, coverImage: string, firstItem: any) => void;
}

export function AddToAlbumModal({ item, albums, onClose, onAddToAlbum, onCreateAlbum }: AddToAlbumModalProps) {
  useScrollLock(!!item);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCover, setNewCover] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateAlbum(newTitle, newDescription, newCover, item);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
          onWheel={(e) => e.preventDefault()}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.y > 120 || velocity.y > 500) {
              onClose();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 mt-4 sm:mt-0">
            <h2 className="font-serif text-xl font-semibold text-ink-black dark:text-white">
              {isCreating ? 'Create New Album' : 'Add to Album'}
            </h2>
            <button 
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center bg-light dark:bg-[#2C2C2E] rounded-full text-dark-gray dark:text-ios-gray-1 hover:text-ink-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto hide-scrollbar overlay-content">
            {isCreating ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-black dark:text-white mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-base font-sans text-ink-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-black/10 dark:focus:ring-white/10 transition-all placeholder:text-gray dark:placeholder:text-ios-gray-1"
                    placeholder="E.g., Summer Vibes"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-black dark:text-white mb-1">Description (Optional)</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-base font-sans text-ink-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-black/10 dark:focus:ring-white/10 transition-all resize-none h-24 placeholder:text-gray dark:placeholder:text-ios-gray-1"
                    placeholder="What's this album about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-black dark:text-white mb-1">Cover Image URL (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-5 w-5 text-gray dark:text-ios-gray-1" />
                    </div>
                    <input
                      type="url"
                      value={newCover}
                      onChange={(e) => setNewCover(e.target.value)}
                      className="w-full bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-base font-sans text-ink-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-black/10 dark:focus:ring-white/10 transition-all placeholder:text-gray dark:placeholder:text-ios-gray-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3.5 rounded-xl font-sans font-semibold text-base text-ink-black dark:text-white bg-light dark:bg-[#2C2C2E] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="flex-1 py-3.5 rounded-xl font-sans font-semibold text-base text-white dark:text-ink-black bg-ink-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create & Add
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-light dark:hover:bg-[#2C2C2E] transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#3A3A3C] transition-colors">
                    <Plus className="w-6 h-6 text-ink-black dark:text-white" />
                  </div>
                  <span className="font-sans font-medium text-base text-ink-black dark:text-white">New Album...</span>
                </button>

                {albums.length > 0 && (
                  <div className="h-px bg-black/5 dark:bg-white/10 my-2" />
                )}

                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => {
                      onAddToAlbum(album.id, item);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-light dark:hover:bg-[#2C2C2E] transition-colors text-left"
                  >
                    {album.coverImage ? (
                      <img src={album.coverImage || undefined} alt={album.title} className="w-12 h-12 rounded-lg object-cover bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray dark:text-ios-gray-1" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-medium text-base text-ink-black dark:text-white truncate">{album.title}</h3>
                      <p className="font-sans text-sm text-gray dark:text-ios-gray-1 truncate">
                        {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
