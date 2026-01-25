// Get elements from HTML
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
renderTasks();
// Video elements
const videoInput = document.getElementById("videoInput");
const addVideoBtn = document.getElementById("addVideoBtn");
const videoList = document.getElementById("videoList");

let videos = JSON.parse(localStorage.getItem("videos")) || [];
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
renderVideos();
