import YouTube from "react-youtube";
import { useState, useRef } from "react";

function Videos({ videos = [], setVideos, markActivity, resetVideos, onDeleteVideo }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("Medium");

  // Track active intervals per video ID
  const intervalsRef = useRef({});

  const getPriorityWeight = (p = "Medium") =>
    p === "High" ? 3 : p === "Medium" ? 2 : 1;

  const sortedVideos = [...videos].sort(
    (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
  );

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
          priority,
          progress: 0,
          completed: false,
        },
      ]);

      setInput("");
      setPriority("Medium");
    } catch (error) {
      console.error("Error adding video:", error);
      alert("Failed to add video");
    }
  }

  function deleteVideo(video) {
    // Clear interval if exists
    if (intervalsRef.current[video.id]) {
      clearInterval(intervalsRef.current[video.id]);
      delete intervalsRef.current[video.id];
    }

    // Call parent handler if available, else local (fallback)
    if (onDeleteVideo) {
      onDeleteVideo(video);
    } else {
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    }
  }

  function onStateChange(event, video) {
    // Only start tracking when PLAYING
    if (event.data !== 1) return;

    // Prevent duplicate intervals
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
      <h2>Videos</h2>

      <div className="input-group">
        <input
          placeholder="Paste YouTube link..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <button onClick={addVideo}>Add</button>
        <button className="reset-btn" onClick={resetVideos}>
          Reset
        </button>
      </div>

      {sortedVideos.map((video) => (
        <div key={video.id} className="video-card">
          <YouTube
            videoId={video.id}
            opts={{
              width: "100%",
              height: "220",
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
              },
            }}
            onStateChange={(e) => onStateChange(e, video)}
          />


          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${video.progress}%` }}
            />
          </div>

          <div className="video-header">
            <span className={video.completed ? "completed" : ""}>
              <span
                className={`priority-badge ${video.priority.toLowerCase()}`}
              >
                {video.priority}
              </span>{" "}
              {video.title}
            </span>

            <button
              className="delete-btn"
              onClick={() => deleteVideo(video)}
            >
              ✕
            </button>
          </div>

          <p>{video.progress}% watched</p>
        </div>
      ))}
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
