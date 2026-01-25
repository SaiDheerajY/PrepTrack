import YouTube from "react-youtube";
import { useState } from "react";

function Videos({ videos, setVideos, markActivity, resetVideos }) {
  const [input, setInput] = useState("");

async function addVideo() {
  const id = extractVideoId(input);
  if (!id) return;

  const title = await fetchVideoTitle(id);

  setVideos([
    ...videos,
    {
      id,
      title,
      progress: 0,
      completed: false
    }
  ]);

  setInput("");
}
function deleteVideo(index) {
  setVideos(videos.filter((_, i) => i !== index));
}
  function onStateChange(event, index) {
    const player = event.target;

    const interval = setInterval(() => {
      const current = player.getCurrentTime();
      const duration = player.getDuration();

      if (!duration) return;

      const percent = Math.floor((current / duration) * 100);

      setVideos(prev =>
        prev.map((v, i) =>
          i === index
            ? {
                ...v,
                progress: percent,
                completed: percent >= 90
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
    <div>
      <h2>Videos</h2>

      <input
        placeholder="Paste YouTube link..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={addVideo}>Add</button>
      <button className="reset-btn" onClick={resetVideos}>
        Reset Videos
      </button>

      {videos.map((video, index) => (
        <div key={video.id} className="video-card">
          <YouTube
            videoId={video.id}
            onStateChange={(e) => onStateChange(e, index)}
            opts={{ width: "100%", height: "100%" }}
          />

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${video.progress}%` }}
            />
          </div>
          <div className="video-header">
  <span className={video.completed ? "completed" : ""}>
    {video.title}
  </span>

  <button
    className="delete-btn"
    onClick={() => deleteVideo(index)}
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
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
  );
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
