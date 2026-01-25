import { useState } from "react";

function Videos({ videos, setVideos, markActivity}) {
  const [videoInput, setVideoInput] = useState("");

  return (
    <div>
      <h2>Videos</h2>

      <input
        type="text"
        placeholder="Paste YouTube link..."
        value={videoInput}
        onChange={(e) => setVideoInput(e.target.value)}
      />

      <button
        onClick={() => {
          if (videoInput.trim() === "") return;

          setVideos([
            ...videos,
            { url: videoInput, completed: false }
          ]);

          setVideoInput("");
          markActivity();
        }}
      >
        Add Video
      </button>

      <ul>
        {videos.map((video, index) => (
          <li
            key={index}
            onClick={() =>{
              setVideos(
                videos.map((v, i) =>
                  i === index ? { ...v, completed: !v.completed } : v
                )
              );
              markActivity();
            }}
            style={{
              cursor: "pointer",
              textDecoration: video.completed ? "line-through" : "none",
              opacity: video.completed ? 0.6 : 1
            }}
          >
            {video.url}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Videos;
