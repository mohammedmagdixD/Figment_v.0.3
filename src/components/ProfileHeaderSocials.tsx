import React, { useState } from 'react';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { UserSocial } from '../types/user';
import { SocialLinksMoreModal } from './SocialLinksMoreModal';
import { SocialIcon } from './SocialIcon';
import { DotsThree } from '@phosphor-icons/react';

interface ProfileHeaderSocialsProps {
  socials: UserSocial[];
}

export function ProfileHeaderSocials({ socials }: ProfileHeaderSocialsProps) {
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  if (!socials || socials.length === 0) return null;

  const sortedSocials = [...socials].sort((a, b) => a.position - b.position);
  
  let displaySocials = [];
  let showMore = false;

  if (sortedSocials.length <= 5) {
    displaySocials = sortedSocials;
  } else {
    displaySocials = sortedSocials.slice(0, 4);
    showMore = true;
  }

  const getUrl = (social: UserSocial) => {
    if (social.platform === 'personal_website') {
      return social.url.split('||')[0];
    }
    const platformDef = SOCIAL_PLATFORMS[social.platform];
    if (!platformDef) return '#';
    return platformDef.urlTemplate.replace('{handle}', social.url);
  };

  return (
    <>
      <div className="flex items-center justify-center gap-6 mt-6 mb-2">
        {displaySocials.map((social) => {
          const platformDef = SOCIAL_PLATFORMS[social.platform];
          if (!platformDef) return null;
          const Icon = platformDef.icon;
          
          return (
            <a
              key={social.id}
              href={getUrl(social)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-label hover:opacity-70 transition-opacity"
            >
              <SocialIcon icon={Icon} className="w-7 h-7" />
            </a>
          );
        })}
        {showMore && (
          <button
            onClick={() => setIsMoreModalOpen(true)}
            className="flex items-center justify-center text-label hover:opacity-70 transition-opacity"
          >
            <DotsThree weight="bold" className="w-7 h-7" />
          </button>
        )}
      </div>

      <SocialLinksMoreModal
        isOpen={isMoreModalOpen}
        onClose={() => setIsMoreModalOpen(false)}
        socials={sortedSocials}
      />
    </>
  );
}
