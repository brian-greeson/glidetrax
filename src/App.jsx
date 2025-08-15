import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import TrackReplay from './components/TrackReplay';
import { parseIGCFile } from './utils/igcParser';

function App() {
  const [tracks, setTracks] = useState([]);
  const [isReplayMode, setIsReplayMode] = useState(false);

  const handleFilesUploaded = (parsedTracks) => {
    setTracks(parsedTracks);
  };

  const handleCreateReplay = () => {
    setIsReplayMode(true);
  };

  const handleBackToUpload = () => {
    setIsReplayMode(false);
    setTracks([]);
  };

  return (
    <div className='w-full h-full'>
      {!isReplayMode ? (
        <FileUpload
          onFilesUploaded={handleFilesUploaded}
          onCreateReplay={handleCreateReplay}
          tracks={tracks}
        />
      ) : (
        <TrackReplay tracks={tracks} onBackToUpload={handleBackToUpload} />
      )}
    </div>
  );
}

export default App;
