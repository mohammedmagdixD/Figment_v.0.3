import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Link as LinkIcon, X, Check, Copy, Share2, MessageCircle, Twitter, Instagram, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { haptics } from '../utils/haptics';
import { QRCodeSVG } from 'qrcode.react';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    handle: string;
    avatar?: string;
  };
}

export function ShareSheet({ isOpen, onClose, profile }: ShareSheetProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const origin = window.location.origin;
  const shareUrl = `${origin}/@${profile.handle.replace('@', '')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      haptics.success();
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      haptics.error();
      console.error('Failed to copy:', err);
    }
  };

  const socialOptions = [
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle className="w-6 h-6" />, 
      color: 'bg-[#25D366]', 
      url: `https://wa.me/?text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment: ${shareUrl}`)}` 
    },
    { 
      name: 'Twitter', 
      icon: <Twitter className="w-6 h-6" />, 
      color: 'bg-[#000000]', 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment!`)}&url=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: 'Telegram', 
      icon: <Send className="w-6 h-6" />, 
      color: 'bg-[#0088cc]', 
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment!`)}` 
    },
    { 
      name: 'Instagram', 
      icon: <Instagram className="w-6 h-6" />, 
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', 
      url: `https://www.instagram.com/` // Instagram doesn't support direct link sharing via URL easily, but we can open the app
    },
    { 
      name: 'Messages', 
      icon: <MessageCircle className="w-6 h-6" />, 
      color: 'bg-[#34C759]', 
      url: `sms:?&body=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment: ${shareUrl}`)}` 
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] px-4 pb-safe-bottom"
            >
              <div className="bg-[var(--secondary-system-background)]/95 backdrop-blur-2xl rounded-t-[32px] overflow-hidden shadow-2xl border-t border-[var(--separator)]">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-[var(--separator)] rounded-full" />
                </div>

                <div className="px-6 pt-4 pb-8">
                  <h2 className="text-xl font-bold text-[var(--label)] text-center mb-8">Share Profile</h2>
                  
                  {/* Main Actions */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => {
                        haptics.medium();
                        setShowQRCode(true);
                      }}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[var(--tertiary-system-background)] rounded-2xl hover:bg-[var(--quaternary-system-background)] transition-colors group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--label)] text-[var(--system-background)] group-hover:scale-110 transition-transform">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--label)]">QR Code</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[var(--tertiary-system-background)] rounded-2xl hover:bg-[var(--quaternary-system-background)] transition-colors group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--label)] text-[var(--system-background)] group-hover:scale-110 transition-transform">
                        {isCopied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                      </div>
                      <span className="text-sm font-semibold text-[var(--label)]">
                        {isCopied ? 'Copied!' : 'Copy Link'}
                      </span>
                    </button>
                  </div>

                  {/* Socials */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-[var(--secondary-label)] uppercase tracking-wider px-1">Send to</p>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2">
                      {socialOptions.map((option) => (
                        <a
                          key={option.name}
                          href={option.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => haptics.light()}
                          className="flex flex-col items-center gap-2 shrink-0"
                        >
                          <div className={`w-14 h-14 flex items-center justify-center rounded-full ${option.color} text-white shadow-lg active:scale-90 transition-transform`}>
                            {option.icon}
                          </div>
                          <span className="text-xs font-medium text-[var(--secondary-label)]">{option.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cancel Button */}
              <button 
                onClick={onClose}
                className="w-full py-4 my-4 bg-[var(--secondary-system-background)]/95 backdrop-blur-2xl rounded-2xl text-[var(--label)] text-lg font-semibold shadow-lg active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Code Full Screen View */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-[var(--system-background)] flex flex-col items-center justify-center p-8"
          >
            <button
              onClick={() => {
                haptics.light();
                setShowQRCode(false);
              }}
              className="absolute top-12 right-6 p-2 rounded-full bg-[var(--secondary-system-background)] text-[var(--label)]"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-sm flex flex-col items-center gap-8">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover border-4 border-[var(--system-background)] shadow-xl"
                  />
                </div>
                <h3 className="text-2xl font-bold text-[var(--label)]">{profile.name}</h3>
                <p className="text-[var(--secondary-label)] font-medium">{profile.handle}</p>
              </div>

              <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-black/5">
                <QRCodeSVG 
                  value={shareUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                  imageSettings={profile.avatar ? {
                    src: profile.avatar,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-[var(--secondary-label)] text-sm font-medium">Scan this code to view profile</p>
                <div className="flex items-center justify-center gap-2 text-[var(--label)] font-bold text-lg">
                  <Share2 className="w-5 h-5" />
                  <span>figment.social</span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="mt-4 flex items-center gap-2 px-8 py-4 bg-[var(--label)] text-[var(--system-background)] rounded-full font-bold shadow-xl active:scale-95 transition-transform"
              >
                {isCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                {isCopied ? 'Copied!' : 'Copy Profile Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
