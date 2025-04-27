import { useState, useEffect } from 'react';
import { MdWifi } from 'react-icons/md';
import { FaApple } from 'react-icons/fa';
import {
  IoSearchSharp,
  IoBatteryHalfOutline,
  IoCellular,
} from 'react-icons/io5';
import { VscVscode } from 'react-icons/vsc';
export interface MacToolbarProps {
  onBlogFileSelect: (title: string, content: string) => void;
}

export default function MacToolbar({ onBlogFileSelect }: MacToolbarProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const [blogFiles, setBlogFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchBlogFiles = async () => {
      try {
        const response = await fetch('/api/blog-files');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        console.log('Fetched blog files:', files); // Log fetched files
        setBlogFiles(files);
      } catch (error) {
        console.error('Error fetching blog files:', error);
      }
    };

    fetchBlogFiles();
  }, []);

  const formatMacDate = (date: Date) => {
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hour = date.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
    const minute = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${weekday} ${month} ${day} ${hour.replace(
      /\s?[AP]M/,
      ''
    )}:${minute} ${period}`;
  };

  const formatIPhoneTime = (date: Date) => {
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');

    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${hour}:${minute}`;
  };

  const handleVSCodeClick = () => {
    window.location.href = 'vscode:/';
  };

  const handleBlogFileClick = async (fileName: string) => {
    setIsFileMenuOpen(false); // Close menu immediately

    try {
      const cleanedFileName = fileName.replace(/\.md$/, ''); // Remove .md extension
      console.log('Fetching blog content for fileName:', fileName, 'cleanedFileName:', cleanedFileName); // Add logging
      const response = await fetch(`/api/blog-content/${cleanedFileName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      onBlogFileSelect(fileName, data.content); // Use the prop to pass data up
    } catch (error) {
      console.error(`Error fetching blog content for ${fileName}:`, error);
      // Optionally display an error message to the user
    }
  };


  return (
    <>
      <div className='sticky top-0 z-50 md:hidden bg-transparent text-white h-12 px-8 flex items-center justify-between text-base font-medium'>
        <span className='font-semibold'>
          {formatIPhoneTime(currentDateTime)}
        </span>
        <div className='flex items-center gap-1.5'>
          <IoCellular size={20} />
          <MdWifi size={20} />
          <IoBatteryHalfOutline size={24} />
        </div>
      </div>

      <div className='sticky top-0 z-50 hidden md:flex bg-black/20 backdrop-blur-md text-white h-6 px-4 items-center justify-between text-sm'>
        <div className='flex items-center space-x-4'>
          <FaApple size={16} />
          <span className='font-semibold cursor-default'>Marvin Ma</span>
          <div className='relative'>
            <span
              className='cursor-default hover:bg-white/20 px-2 rounded'
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            >
              File
            </span>
            {isFileMenuOpen && (
              <div className='absolute top-full left-0 mt-1 w-48 bg-gray-800 text-white rounded shadow-lg py-1 z-50'>
                {blogFiles.map((file) => (
                  <div
                    key={file}
                    className='px-4 py-1 hover:bg-blue-500 cursor-default'
                    onClick={() => {
                      console.log('Clicked file:', file); // Log the file being clicked
                      handleBlogFileClick(file);
                    }}
                  >
                    {file}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className='cursor-default'>Edit</span>
          <span className='cursor-default'>View</span>
          <span className='cursor-default'>Go</span>
          <span className='cursor-default'>Window</span>
          <span className='cursor-default'>Help</span>
        </div>
        <div className='flex items-center space-x-4'>
          <VscVscode
            size={16}
            className='cursor-default hover:opacity-80 transition-opacity'
            onClick={handleVSCodeClick}
            title='Open in VSCode'
          />
          <MdWifi size={16} />
          <IoSearchSharp size={16} />
          <span className='cursor-default'>
            {formatMacDate(currentDateTime)}
          </span>
        </div>
      </div>
    </>
  );
}
