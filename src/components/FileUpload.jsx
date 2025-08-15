import React, { useState, useCallback } from 'react';
import { parseIGCFile } from '../utils/igcParser';

const FileUpload = ({ onFilesUploaded, onCreateReplay, tracks }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setIsDragOver(false);
      setIsProcessing(true);
      setError('');

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.toLowerCase().endsWith('.igc')
      );

      if (files.length === 0) {
        setError('Please drop IGC files only');
        setIsProcessing(false);
        return;
      }

      try {
        const parsedTracks = [];
        for (const file of files) {
          try {
            const track = await parseIGCFile(file);
            parsedTracks.push(track);
          } catch (parseError) {
            console.error(`Failed to parse ${file.name}:`, parseError);
            setError(`Failed to parse ${file.name}: ${parseError.message}`);
          }
        }

        if (parsedTracks.length > 0) {
          onFilesUploaded(parsedTracks);
        }
      } catch (error) {
        setError(`Error processing files: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFilesUploaded]
  );

  const handleFileInput = useCallback(
    async (e) => {
      const files = Array.from(e.target.files).filter((file) =>
        file.name.toLowerCase().endsWith('.igc')
      );

      if (files.length === 0) return;

      setIsProcessing(true);
      setError('');

      try {
        const parsedTracks = [];
        for (const file of files) {
          try {
            const track = await parseIGCFile(file);
            parsedTracks.push(track);
          } catch (parseError) {
            console.error(`Failed to parse ${file.name}:`, parseError);
            setError(`Failed to parse ${file.name}: ${parseError.message}`);
          }
        }

        if (parsedTracks.length > 0) {
          onFilesUploaded(parsedTracks);
        }
      } catch (error) {
        setError(`Error processing files: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFilesUploaded]
  );

  const handlePilotNameChange = (trackId, newName) => {
    const updatedTracks = tracks.map((track) =>
      track.id === trackId ? { ...track, pilotName: newName } : track
    );
    onFilesUploaded(updatedTracks);
  };

  const removeTrack = (trackId) => {
    const updatedTracks = tracks.filter((track) => track.id !== trackId);
    onFilesUploaded(updatedTracks);
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>GlideTrax</h1>
          <p className='text-lg text-gray-600'>3D GPS Track Replay</p>
        </div>

        {/* File Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className='space-y-4'>
            <div className='text-6xl text-gray-400 mb-4'>📁</div>
            <h3 className='text-xl font-semibold text-gray-700'>
              Drop your IGC files here
            </h3>
            <p className='text-gray-500'>Or click to browse files</p>
            <input
              type='file'
              multiple
              accept='.igc'
              onChange={handleFileInput}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center justify-center space-x-2'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
              <span className='text-blue-700'>Processing files...</span>
            </div>
          </div>
        )}

        {/* Uploaded Tracks List */}
        {tracks.length > 0 && (
          <div className='mt-8 bg-white rounded-xl shadow-lg p-6'>
            <h3 className='text-xl font-semibold text-gray-900 mb-4'>
              Uploaded Tracks ({tracks.length})
            </h3>

            <div className='space-y-4 max-h-96 overflow-y-auto'>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3'>
                      <div
                        className='w-4 h-4 rounded-full'
                        style={{ backgroundColor: track.color }}
                      ></div>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {track.name}
                        </p>
                        <div className='flex items-center space-x-2'>
                          <input
                            type='text'
                            value={track.pilotName}
                            onChange={(e) =>
                              handlePilotNameChange(track.id, e.target.value)
                            }
                            className='text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Pilot name'
                          />
                          <span className='text-sm text-gray-500'>
                            {track.coordinates.length} points
                          </span>
                          <span className='text-sm text-gray-500'>
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTrack(track.id)}
                    className='text-red-600 hover:text-red-800 p-2'
                    title='Remove track'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Create Replay Button */}
            <div className='mt-6 text-center'>
              <button
                onClick={onCreateReplay}
                disabled={tracks.length === 0}
                className='px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
              >
                Create 3D Replay
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className='mt-8 text-center text-gray-600'>
          <p className='mb-2'>Supported format: IGC (.igc)</p>
          <p className='text-sm'>Drop one or more IGC files to get started</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
