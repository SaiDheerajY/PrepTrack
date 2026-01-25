import { useState, useEffect } from "react";
import Tasks from "./Tasks";
import Videos from "./Videos";

function App() {
  const [tasks, setTasks] = useState([]);
  const [videos, setVideos] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks"));
    const savedVideos = JSON.parse(localStorage.getItem("videos"));

    if (savedTasks) setTasks(savedTasks);
    if (savedVideos) setVideos(savedVideos);
  }, []);

  // Save tasks
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save videos
  useEffect(() => {
    localStorage.setItem("videos", JSON.stringify(videos));
  }, [videos]);

  return (
    <div style={{ padding: "20px" }}>
      <Tasks tasks={tasks} setTasks={setTasks} />
      <hr />
      <Videos videos={videos} setVideos={setVideos} />
    </div>
  );
}

export default App;
