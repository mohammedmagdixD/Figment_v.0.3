import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Link as LinkIcon, X, Check, Copy, Share2, MessageCircle, Twitter, Instagram, Send, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { haptics } from '../utils/haptics';
import { QRCodeCanvas } from 'qrcode.react';

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
  const qrRef = useRef<HTMLCanvasElement>(null);
  
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

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    
    try {
      const canvas = qrRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${profile.handle.replace('@', '')}-qr.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      haptics.success();
    } catch (err) {
      console.error('Failed to download QR code:', err);
      haptics.error();
    }
  };

  const socialOptions = [
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle className="w-5 h-5" />, 
      url: `https://wa.me/?text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment: ${shareUrl}`)}` 
    },
    { 
      name: 'Twitter', 
      icon: <Twitter className="w-5 h-5" />, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment!`)}&url=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: 'Telegram', 
      icon: <Send className="w-5 h-5" />, 
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${profile.name}'s profile on Figment!`)}` 
    },
    { 
      name: 'Instagram', 
      icon: <Instagram className="w-5 h-5" />, 
      url: `https://www.instagram.com/` 
    },
    { 
      name: 'Messages', 
      icon: <MessageCircle className="w-5 h-5" />, 
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
              className="fixed inset-0 z-[60] bg-overlay backdrop-blur-md"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] px-4 pb-safe-bottom"
            >
              <div className="bg-secondary-system-background/90 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl border border-separator mb-4">
                
                {/* 1. Hero Section */}
                <div className="relative w-full h-32 bg-black shrink-0">
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="w-full h-full object-cover opacity-60 blur-[30px] scale-125"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary-system-background/90 via-secondary-system-background/40 to-transparent" />
                  
                  {/* Handle */}
                  <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                    <div className="w-12 h-1.5 bg-white/30 rounded-full" />
                  </div>

                  <div className="absolute -bottom-14 left-6 flex items-end gap-4">
                    <div className="w-28 h-28 rounded-[24px] overflow-hidden shadow-lg shrink-0 bg-secondary-system-background border border-separator">
                      <img 
                        src={profile.avatar} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Primary Information Section */}
                <div className="pt-16 px-6 pb-6">
                  <div className="mb-8">
                    <h2 className="font-sans text-2xl font-bold leading-tight text-label mb-1">
                      {profile.name}
                    </h2>
                    <p className="font-sans text-base text-secondary-label">
                      {profile.handle}
                    </p>
                  </div>
                  
                  {/* Main Actions */}
                  <div className="flex gap-3 mb-8">
                    <button
                      onClick={() => {
                        haptics.medium();
                        setShowQRCode(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-label text-system-background rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform"
                    >
                      <QrCode className="w-5 h-5" />
                      QR Code
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-tertiary-system-background text-label rounded-xl font-bold shadow-sm border border-separator active:scale-[0.98] transition-transform"
                    >
                      {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {isCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  {/* Socials */}
                  <div className="mb-2">
                    <h3 className="font-sans text-xl font-bold text-label mb-4">Share via</h3>
                    <div className="horizontal-scroll-container hide-scrollbar -mx-6 px-6 pb-2 flex gap-4">
                      {socialOptions.map((option) => (
                        <div key={option.name} className="flex flex-col items-center w-[72px] shrink-0 gap-2">
                          <motion.a
                            href={option.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: window.matchMedia('(hover: hover)').matches ? 1.1 : 1, y: window.matchMedia('(hover: hover)').matches ? -4 : 0 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 600, damping: 35 }}
                            onClick={() => haptics.light()}
                            className="w-[60px] h-[60px] flex items-center justify-center rounded-full bg-secondary-system-background border border-separator shadow-sm transition-colors duration-300 text-label"
                            aria-label={option.name}
                          >
                            {option.icon}
                          </motion.a>
                          <span className="text-xs font-medium text-secondary-label text-center leading-tight">
                            {option.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cancel Button */}
              <button 
                onClick={onClose}
                className="w-full py-4 mb-4 bg-secondary-system-background/90 backdrop-blur-3xl border border-separator rounded-[24px] text-label text-lg font-semibold shadow-xl active:scale-[0.98] transition-transform"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-secondary-system-background/80 backdrop-blur-3xl border border-separator/50 rounded-[40px] p-8 shadow-2xl flex flex-col items-center"
            >
              <button
                onClick={() => {
                  haptics.light();
                  setShowQRCode(false);
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-tertiary-system-background hover:bg-quaternary-system-background text-label transition-colors"
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
                <h3 className="text-xl font-bold text-label">{profile.name}</h3>
                <p className="text-secondary-label font-medium text-sm">{profile.handle}</p>
              </div>

              <div className="p-6 bg-white rounded-[32px] shadow-inner mb-8">
                <QRCodeCanvas 
                  ref={qrRef}
                  value={shareUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/qr-logo.png',
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                />
              </div>

              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 py-4 bg-label text-system-background rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
