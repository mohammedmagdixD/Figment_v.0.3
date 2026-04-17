import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { X, List, Trash, Plus } from '@phosphor-icons/react';
import { UserSocial } from '../types/user';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { upsertUserSocials, deleteUserSocial } from '../services/supabaseData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AddSocialLinkModal } from './AddSocialLinkModal';
import { SocialIcon } from './SocialIcon';

interface ManageLinksScreenProps {
  isOpen: boolean;
  onClose: () => void;
  socials: UserSocial[];
  onSocialsChange: (socials: UserSocial[]) => void;
  userId: string;
}

export function ManageLinksScreen({ isOpen, onClose, socials, onSocialsChange, userId }: ManageLinksScreenProps) {
  const [items, setItems] = useState<UserSocial[]>(socials);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setItems(socials);
  }, [socials]);

  if (!isOpen) return null;

  const handleReorder = async (newOrder: UserSocial[]) => {
    // Optimistic update
    const updatedItems = newOrder.map((item, index) => ({ ...item, position: index }));
    setItems(updatedItems);
    onSocialsChange(updatedItems);

    try {
      await upsertUserSocials(updatedItems);
    } catch (error) {
      console.error('Failed to reorder socials:', error);
      // Revert on failure
      setItems(socials);
      onSocialsChange(socials);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const previousItems = [...items];
    const newItems = items.filter(item => item.id !== deleteId);
    
    // Optimistic update
    setItems(newItems);
    onSocialsChange(newItems);
    setDeleteId(null);

    try {
      await deleteUserSocial(deleteId);
      // Re-index remaining items
      const reindexed = newItems.map((item, index) => ({ ...item, position: index }));
      await upsertUserSocials(reindexed);
      setItems(reindexed);
      onSocialsChange(reindexed);
    } catch (error) {
      console.error('Failed to delete social:', error);
      // Revert
      setItems(previousItems);
      onSocialsChange(previousItems);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-system-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-separator shrink-0 pt-safe">
        <h2 className="text-xl font-bold text-label">Manage Links</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-secondary-system-background text-secondary-label transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {items.length === 0 ? (
          <div className="text-center text-secondary-label mt-10">
            No links added yet.
          </div>
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
            {items.map((social) => {
              const platformDef = SOCIAL_PLATFORMS[social.platform];
              if (!platformDef) return null;
              const Icon = platformDef.icon;

              return (
                <Reorder.Item
                  key={social.id}
                  value={social}
                  className="flex items-center gap-4 py-3 border-b border-separator last:border-0"
                >
                  <div className="cursor-grab active:cursor-grabbing text-tertiary-label">
                    <List weight="bold" className="w-6 h-6" />
                  </div>
                  
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 text-label">
                    <SocialIcon icon={Icon} className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-label font-medium text-base truncate">{platformDef.name}</p>
                    <p className="text-secondary-label text-sm truncate">
                      {social.platform === 'personal_website' ? social.url.split('||')[0] : `@${social.url}`}
                    </p>
                  </div>

                  <button
                    onClick={() => setDeleteId(social.id)}
                    className="p-2 text-secondary-label hover:text-label transition-colors"
                  >
                    <Trash className="w-6 h-6" />
                  </button>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-system-background via-system-background to-transparent pb-safe">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-4 rounded-2xl bg-label text-system-background font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus weight="bold" className="w-5 h-5" />
          Add New Link
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Link"
        message="Are you sure you want to remove this link from your profile? You can always add it back later."
      />

      <AddSocialLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userId={userId}
        currentCount={items.length}
        onAdd={(newSocial) => {
          const newItems = [...items, newSocial];
          setItems(newItems);
          onSocialsChange(newItems);
        }}
      />
    </div>
  );
}
