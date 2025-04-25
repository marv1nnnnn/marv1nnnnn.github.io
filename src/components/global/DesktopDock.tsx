import { useState } from 'react';
import { BsGithub } from 'react-icons/bs';
// BsSpotify, BsTerminal removed
// IoIosMail removed
import { VscVscode } from 'react-icons/vsc';
import { RiTerminalFill } from 'react-icons/ri';

export default function DesktopDock() {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const handleGithubClick = () => {
    window.open('https://github.com/marv1nnnnn', '_blank');
  };

  // Email, Calendar, Spotify handlers removed as icons are omitted

  const handleVSCodeClick = () => {
    window.location.href = 'vscode:/';
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className='absolute -top-14 left-1/2 -translate-x-1/2'>
      <div className='relative px-3 py-1 bg-[#1d1d1f]/80 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap border border-px border-gray-600'>
        {text}
        <div className='absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 bg-[#1d1d1f]/80 backdrop-blur-sm rotate-45 border-b border-r border-gray-600' />
      </div>
    </div>
  );

  return (
    <div className='fixed bottom-0 left-1/2 -translate-x-1/2 hidden md:block z-50'>
      <div className='relative mb-2 p-3 bg-gradient-to-t from-gray-700 to-gray-800 backdrop-blur-2xl rounded-2xl'>
        <div className='flex items-end space-x-4'>
          {/* VSCode */}
          <button
            onClick={handleVSCodeClick}
            onMouseEnter={() => setHoveredIcon('vscode')}
            onMouseLeave={() => setHoveredIcon(null)}
            className='relative'
          >
            <div className='w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg'>
              <VscVscode size={45} className='text-blue-500' />
            </div>
            {hoveredIcon === 'vscode' && <Tooltip text='Launch VS Code' />}
          </button>

          {/* Email button removed */}

          {/* Github */}
          <button
            onClick={handleGithubClick}
            onMouseEnter={() => setHoveredIcon('github')}
            onMouseLeave={() => setHoveredIcon(null)}
            className='relative'
          >
            <div className='w-14 h-14  bg-gradient-to-t from-black to-black/60 rounded-xl flex items-center justify-center shadow-lg'>
              <BsGithub size={45} className='text-gray-100' />
            </div>
            {hoveredIcon === 'github' && <Tooltip text='My GitHub' />}
          </button>

          {/* Calendar button removed */}

          {/* Spotify button removed */}

          {/* Divider */}
          <div className='flex items-center'>
            <div className='w-px h-14 bg-white/20' />
          </div>

          {/* Terminal */}
          <button
            onMouseEnter={() => setHoveredIcon('terminal')}
            onMouseLeave={() => setHoveredIcon(null)}
            className='relative'
          >
            <div className='w-14 h-14 rounded-2xl overflow-hidden shadow-lg'>
              <div className='absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-500 rounded-xl'></div>
              <div className='absolute inset-[2px] rounded-xl bg-black'>
                <div className='absolute top-1 left-2'>
                  <RiTerminalFill size={20} className='text-white' />
                </div>
              </div>
            </div>
            {hoveredIcon === 'terminal' && <Tooltip text='Terminal' />}
          </button>
        </div>
      </div>
    </div>
  );
}
