import { BsGithub } from 'react-icons/bs';
// BsSpotify removed
// IoIosMail, IoIosCall removed

export default function MobileDock() {
  // Email and Spotify handlers removed as icons are omitted
  const handleGithubClick = () => {
    window.open('https://github.com/marv1nnnnn', '_blank');
  };


  return (
    <div className='fixed bottom-0 left-0 right-0 md:hidden'>
      {/* Adjust justify-center since only one icon remains */}
      <div className='mx-4 mb-4 p-3 bg-gradient-to-t from-gray-700 to-gray-800 backdrop-blur-xl rounded-3xl flex justify-center items-center max-w-[400px] mx-auto'>
        {/* Phone icon removed */}

        {/* Email button removed */}

        {/* GitHub Button */}
        <button
          onClick={handleGithubClick}
          className='flex flex-col items-center cursor-pointer'
        >
          <div className='w-18 h-18 bg-gradient-to-t from-black to-black/60 rounded-2xl flex items-center justify-center'>
            <BsGithub size={55} className='text-white' />
          </div>
        </button>

        {/* Spotify button removed */}
      </div>
    </div>
  );
}
