// Get elements from HTML
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
 // video elements
const videoInput = document.getElementById("videoInput");
const addVideoBtn = document.getElementById("addVideoBtn");
const videoList = document.getElementById("videoList");
// Contest elements
const upcomingList = document.getElementById("upcomingList");
const pastList = document.getElementById("pastList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let videos = JSON.parse(localStorage.getItem("videos")) || [];
const contests = [
  { name: "LeetCode Weekly 390", date: "2026-02-02" },
  { name: "Codeforces Round 950", date: "2026-01-30" },
  { name: "LeetCode Biweekly 120", date: "2026-01-15" },
  { name: "LeetCode Biweekly 122", date: "2026-01-27" }
];

// Function to show tasks on the page
function renderTasks() {
  taskList.innerHTML = ""; // clear old list

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = task;

    // Click task to delete
    li.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    taskList.appendChild(li);
  });
}
// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
addTaskBtn.addEventListener("click",() =>{
    const task = taskInput.value.trim();
    if(task ==="") return;//ingnore empt list
    tasks.push(task);
    taskInput.value = "";
    saveTasks();
    renderTasks();
});
// Video elements
function renderVideos() {
  videoList.innerHTML = "";

  videos.forEach((video, index) => {
    const li = document.createElement("li");
    li.textContent = video.url;

    // If completed, style differently
    if (video.completed) {
      li.style.textDecoration = "line-through";
      li.style.opacity = "0.6";
    }

    // Toggle completed on click
    li.addEventListener("click", () => {
      videos[index].completed = !videos[index].completed;
      saveVideos();
      renderVideos();
    });

    videoList.appendChild(li);
  });
}
function saveVideos() {
  localStorage.setItem("videos", JSON.stringify(videos));
}
addVideoBtn.addEventListener("click", () => {
  const url = videoInput.value.trim();

  if (url === "") return;

  videos.push({
    url: url,
    completed: false
  });

  videoInput.value = "";
  saveVideos();
  renderVideos();
});
//contests 
function renderContests() {
  upcomingList.innerHTML = "";
  pastList.innerHTML = "";

  const today = new Date();

  contests.forEach(contest => {
    const contestDate = new Date(contest.date);
    const li = document.createElement("li");
    li.textContent = `${contest.name} — ${contest.date}`;

    if (contestDate >= today) {
      upcomingList.appendChild(li);
    } else {
      pastList.appendChild(li);
    }
  });
}
renderTasks();
renderVideos();
renderContests();

