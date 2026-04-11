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
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] px-4 pb-safe-bottom"
            >
              <div className="bg-[var(--secondary-system-background)]/80 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl border border-white/10 mb-4">
                {/* Handle */}
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                <div className="px-6 pt-2 pb-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-sm">
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--label)]">{profile.name}</h2>
                      <p className="text-sm text-[var(--secondary-label)]">Share Profile</p>
                    </div>
                  </div>
                  
                  {/* Main Actions */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                      onClick={() => {
                        haptics.medium();
                        setShowQRCode(true);
                      }}
                      className="flex flex-col items-start justify-between p-4 h-28 bg-white/5 border border-white/5 rounded-[24px] hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-[var(--label)] group-hover:scale-110 transition-transform shadow-sm">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--label)]">QR Code</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex flex-col items-start justify-between p-4 h-28 bg-white/5 border border-white/5 rounded-[24px] hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-[var(--label)] group-hover:scale-110 transition-transform shadow-sm">
                        {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-semibold text-[var(--label)]">
                        {isCopied ? 'Copied!' : 'Copy Link'}
                      </span>
                    </button>
                  </div>

                  {/* Socials */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[var(--secondary-label)] uppercase tracking-wider px-1">Share via</p>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 -mx-2 px-2">
                      {socialOptions.map((option) => (
                        <a
                          key={option.name}
                          href={option.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => haptics.light()}
                          className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                          <div className={`w-14 h-14 flex items-center justify-center rounded-[20px] ${option.color} text-white shadow-lg group-active:scale-90 transition-all duration-300 group-hover:rounded-[16px]`}>
                            {option.icon}
                          </div>
                          <span className="text-[11px] font-medium text-[var(--secondary-label)]">{option.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cancel Button */}
              <button 
                onClick={onClose}
                className="w-full py-4 mb-4 bg-[var(--secondary-system-background)]/80 backdrop-blur-3xl border border-white/10 rounded-[24px] text-[var(--label)] text-lg font-semibold shadow-xl active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Code Modal View */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[var(--secondary-system-background)]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col items-center"
            >
              <button
                onClick={() => {
                  haptics.light();
                  setShowQRCode(false);
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[var(--label)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-8 mt-4">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 animate-pulse blur-md opacity-40" />
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="relative w-full h-full rounded-full object-cover border-2 border-white/20 shadow-xl"
                  />
                </div>
                <h3 className="text-xl font-bold text-[var(--label)]">{profile.name}</h3>
                <p className="text-[var(--secondary-label)] font-medium text-sm">{profile.handle}</p>
              </div>

              <div className="p-6 bg-white rounded-[32px] shadow-inner mb-8">
                <QRCodeSVG 
                  value={shareUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={profile.avatar ? {
                    src: profile.avatar,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--label)] text-[var(--system-background)] rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform"
              >
                {isCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                {isCopied ? 'Copied!' : 'Copy Profile Link'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
