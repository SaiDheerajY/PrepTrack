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