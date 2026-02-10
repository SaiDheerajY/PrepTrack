import YouTube from "react-youtube";
import { useState, useRef } from "react";

function Videos({ videos = [], setVideos, markActivity, resetVideos, onDeleteVideo }) {
  const [input, setInput] = useState("");
  const [activeVideoId, setActiveVideoId] = useState(videos.length > 0 ? videos[0].id : null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const intervalsRef = useRef({});

  const activeVideo = videos.find(v => v.id === activeVideoId);

  // ... (addVideo and deleteVideo functions remain the same) ...
  async function addVideo() {
    const id = extractVideoId(input);
    if (!id) {
      alert("Invalid YouTube URL");
      return;
    }

    try {
      const title = await fetchVideoTitle(id);

      setVideos((prev) => [
        ...prev,
        {
          id,
          title: title || "Video",
          url: input.trim(),
          progress: 0,
          completed: false,
        },
      ]);

      if (!activeVideoId) setActiveVideoId(id);
      setInput("");
    } catch (error) {
      console.error("Error adding video:", error);
      alert("Failed to add video");
    }
  }

  function deleteVideo(video) {
    if (intervalsRef.current[video.id]) {
      clearInterval(intervalsRef.current[video.id]);
      delete intervalsRef.current[video.id];
    }

    if (activeVideoId === video.id) {
      setActiveVideoId(null);
    }

    if (onDeleteVideo) {
      onDeleteVideo(video);
    } else {
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    }
  }

  function onStateChange(event, video) {
    if (event.data !== 1) return;
    if (intervalsRef.current[video.id]) return;

    const player = event.target;

    const interval = setInterval(() => {
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      if (!duration) return;

      const percent = Math.floor((current / duration) * 100);

      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? {
              ...v,
              progress: percent,
              completed: percent >= 90,
            }
            : v
        )
      );

      if (percent >= 90) {
        markActivity?.();
        clearInterval(interval);
        delete intervalsRef.current[video.id];
      }
    }, 1000);

    intervalsRef.current[video.id] = interval;
  }

  return (
    <div className="section-container">
      <div className="section-title">
        VIDEOS :: PLAYLIST
      </div>

      <div className="terminal-input-row">
        <span>&gt;</span>
        <input
          type="text"
          className="terminal-input"
          placeholder="Paste_YouTube_URL..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addVideo()}
        />
        <button className="bracket-btn" onClick={addVideo}>[ ADD ]</button>
        <button className="text-btn" onClick={resetVideos}>
          [ RESET ]
        </button>
      </div>

      {/* CENTRAL PLAYER */}
      {activeVideoId && (
        <div className={`central-player ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="player-controls">
            <span className="terminal-green">VIEW :: {activeVideo?.title}</span>
            <button className="text-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
              [ {isCollapsed ? "EXPAND" : "COLLAPSE"} ]
            </button>
          </div>

          {!isCollapsed && (
            <>
              <YouTube
                videoId={activeVideoId}
                opts={{
                  width: "100%",
                  height: "220",
                  playerVars: {
                    autoplay: 0,
                    controls: 1,
                    modestbranding: 1,
                  },
                }}
                onStateChange={(e) => onStateChange(e, activeVideo)}
              />
              <div className="active-video-details">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${activeVideo?.progress || 0}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIDEO LIST */}
      <div className="video-list-container">
        {videos.map((video) => (
          <div
            key={video.id}
            className={`video-list-item ${activeVideoId === video.id ? 'active' : ''}`}
            onClick={() => setActiveVideoId(video.id)}
          >
            <div className="item-prefix">[ {video.completed ? 'X' : ' '} ]</div>
            <div className={`video-title-item ${video.completed ? 'completed' : ''}`}>
              {video.title}
            </div>
            <div className="item-progress">{video.progress}%</div>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteVideo(video);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function extractVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

async function fetchVideoTitle(videoId) {
  try {
    // noembed.com is more CORS-friendly
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    const data = await res.json();
    return data.title ? data.title.split(" ").slice(0, 6).join(" ") : "Unknown Title";
  } catch (error) {
    console.error("Failed to fetch video title:", error);
    return "Video " + videoId;
  }
}

export default Videos;
