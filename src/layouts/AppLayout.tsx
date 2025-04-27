import { useEffect, useState } from 'react';
import MacToolbar from '../components/global/MacToolbar';
import MacTerminal from '../components/global/MacTerminal';
import MobileDock from '../components/global/MobileDock';
import DesktopDock from '../components/global/DesktopDock';
import BlogContentModal from '../components/global/BlogContentModal';

interface AppLayoutProps {
  initialBg: string;
  backgroundMap: Record<string, string>;
}

export default function Desktop({ initialBg, backgroundMap }: AppLayoutProps) {
  const [currentBg, setCurrentBg] = useState<string>(initialBg);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const lastBg = localStorage.getItem('lastBackground');

    let selectedBg = initialBg;
    if (lastBg === initialBg) {
      const bgKeys = Object.keys(backgroundMap);
      const availableBgs = bgKeys.filter((bg) => bg !== lastBg);
      selectedBg =
        availableBgs[Math.floor(Math.random() * availableBgs.length)];
    }
    setCurrentBg(selectedBg);
    localStorage.setItem('lastBackground', selectedBg);
  }, [initialBg, backgroundMap]);

  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (currentBg && backgroundMap[currentBg]) {
        try {
          // Dynamically import the image
          const imageUrl = backgroundMap[currentBg];
          setBackgroundImageUrl(imageUrl);
        } catch (error) {
          console.error('Error loading background image:', error);
          setBackgroundImageUrl(null); // Fallback or error handling
        }
      }
    };

    loadBackgroundImage();
  }, [currentBg, backgroundMap]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });

  const openModal = (title: string, content: string) => {
    setModalContent({ title, content });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent({ title: '', content: '' }); // Clear content on close
  };


  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none' }}
      />

      <div className='relative z-10'>
        <MacToolbar onBlogFileSelect={openModal} /> {/* Pass openModal to MacToolbar */}
      </div>

      <div className='relative z-0 flex items-center justify-center h-[calc(100vh-10rem)] md:h-[calc(100vh-1.5rem)] pt-6'>
        <MacTerminal />
      </div>

      <MobileDock />
      <DesktopDock />

      {isModalOpen && (
        <BlogContentModal
          title={modalContent.title}
          content={modalContent.content}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
