import { useState, useEffect } from "react";
import Tasks from "./Tasks";
import Videos from "./Videos";
import "./App.css";
import Contests from "./contests";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [streak, setStreak] = useState(0);
  const [dailyLog, setDailyLog] = useState({});

 function markActivity() {
  const today = new Date().toDateString();
  const lastStreakDate = localStorage.getItem("lastStreakDate");

  if (lastStreakDate !== today) {
    setStreak((prev) => prev + 1);
    localStorage.setItem("lastStreakDate", today);
  }
}
function resetTasks() {
  const today = new Date().toDateString();

  const completedTasks = tasks
    .filter(t => t.completed)
    .map(t => t.text);

  setDailyLog(prev => ({
    ...prev,
    [today]: {
      ...(prev[today] || {}),
      tasksCompleted: completedTasks
    }
  }));

  setTasks([]);
}
function resetVideos() {
  const today = new Date().toDateString();

  const completedVideos = videos
    .filter(v => v.completed)
    .map(v => v.url);

  setDailyLog(prev => ({
    ...prev,
    [today]: {
      ...(prev[today] || {}),
      videosCompleted: completedVideos
    }
  }));

  setVideos([]);
}



  // Load from localStorage
useEffect(() => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks"));
  const savedVideos = JSON.parse(localStorage.getItem("videos"));
  const savedStreak = JSON.parse(localStorage.getItem("streak"));

  if (savedTasks) setTasks(savedTasks);
  if (savedVideos) setVideos(savedVideos);
  if (savedStreak !== null) setStreak(savedStreak);

  setLoaded(true); //  VERY IMPORTANT
}, []);


  // Save tasks
  useEffect(() => {
    if(!loaded)return;
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks,loaded]);

  // Save videos
  useEffect(() => {
    if(!loaded)return;
    localStorage.setItem("videos", JSON.stringify(videos));
  }, [videos,loaded]);
  //streaksave
  useEffect(() => {
    if(!loaded) return;
  localStorage.setItem("streak", JSON.stringify(streak));
}, [streak,loaded]);
  useEffect(() => {
    const savedLog = JSON.parse(localStorage.getItem("dailyLog"));
   if (savedLog) setDailyLog(savedLog);
  }, []);
  useEffect(() => {
  localStorage.setItem("dailyLog", JSON.stringify(dailyLog));
}, [dailyLog]);



  return (
  <div className="dashboard">
    <div className="left-panel">
      <Tasks
  tasks={tasks}
  setTasks={setTasks}
  markActivity={markActivity}
  resetTasks={resetTasks}
/>

<Videos
  videos={videos}
  setVideos={setVideos}
  markActivity={markActivity}
  resetVideos={resetVideos}
/>

    </div>

    <div className="right-panel">
  <Contests />

  <h2>Streak</h2>
<p>🔥 {streak} day{streak !== 1 ? "s" : ""}</p>
</div>

  </div>
);
window.addEventListener("mousemove", (e) => {
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
});

}


export default App;
