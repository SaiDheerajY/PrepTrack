import YouTube from "react-youtube";
import { useState } from "react";

function Videos({ videos, setVideos, markActivity, resetVideos }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("Medium");

  const getPriorityWeight = (p) => {
    const safePriority = p || "Medium";
    if (safePriority === "High") return 3;
    if (safePriority === "Medium") return 2;
    return 1;
  };

  const sortedVideos = [...videos].sort(
    (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
  );

  async function addVideo() {
    const id = extractVideoId(input);
    if (!id) return;

    const title = await fetchVideoTitle(id);

    setVideos([
      ...videos,
      {
        id,
        title,
        priority, 
        progress: 0,
        completed: false,
      },
    ]);

    setInput("");
    setPriority("Medium");
  }

  function deleteVideo(targetVideo) {
    setVideos(videos.filter((v) => v !== targetVideo));
  }

  function onStateChange(event, index, originalVideo) {
    const player = event.target;

    const interval = setInterval(() => {
      const current = player.getCurrentTime();
      const duration = player.getDuration();

      if (!duration) return;

      const percent = Math.floor((current / duration) * 100);

      setVideos((prev) =>
        prev.map((v) =>
          v === originalVideo 
            ? {
                ...v,
                progress: percent,
                completed: percent >= 90,
              }
            : v
        )
      );

      if (percent >= 90) {
        markActivity();
        clearInterval(interval);
      }
    }, 1000);
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
        <div key={video.id + video.title} className="video-card">
          <YouTube
            videoId={video.id}
            onStateChange={(e) => onStateChange(e, null, video)}
            opts={{ width: "100%", height: "200px" }}
          />

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${video.progress}%` }}
            />
          </div>
          <div className="video-header">
            <span className={video.completed ? "completed" : ""}>
               {/* FIX: Safety check for existing videos */}
              <span className={`priority-badge ${(video.priority || "Medium").toLowerCase()}`}>
                {video.priority || "Medium"}
              </span>{" "}
              {video.title}
            </span>

            <button className="delete-btn" onClick={() => deleteVideo(video)}>
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
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );
  const data = await res.json();
  return data.title.split(" ").slice(0, 6).join(" ");
}

export default Videos;