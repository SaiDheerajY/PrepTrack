import { useState, useEffect } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");

  // Load tasks once
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks"));
    if (savedTasks) {
      setTasks(savedTasks);
    }
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tasks</h2>

      <input
        type="text"
        placeholder="Add a task..."
        value={taskInput}
        onChange={(e) => setTaskInput(e.target.value)}
      />

      <button
        onClick={() => {
          if (taskInput.trim() === "") return;
          setTasks([...tasks, taskInput]);
          setTaskInput("");
        }}
      >
        Add
      </button>

      <ul>
        {tasks.map((task, index) => (
          <li
            key={index}
            onClick={() =>
              setTasks(tasks.filter((_, i) => i !== index))
            }
            style={{ cursor: "pointer" }}
          >
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
