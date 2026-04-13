import React from 'react';

interface SocialIconProps {
  icon: any;
  className?: string;
}

export function SocialIcon({ icon: Icon, className = "" }: SocialIconProps) {
  if (!Icon) return null;

  const isSimpleIcon = 'path' in Icon;

  if (isSimpleIcon) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={Icon.path} />
      </svg>
    );
  }

  return <Icon className={className} />;
}
