import { useState } from "react";
function Tasks({ tasks, setTasks, markActivity }) {
  const [taskInput, setTaskInput] = useState("");

  return (
    <div>
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
          markActivity();
        }}
      >
        Add
      </button>

      <ul>
        {tasks.map((task, index) => (
          <li
            key={index}
            onClick={() =>{
              setTasks(tasks.filter((_, i) => i !== index));
              markActivity();
            }}
            style={{ cursor: "pointer" }}
          >
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tasks;
