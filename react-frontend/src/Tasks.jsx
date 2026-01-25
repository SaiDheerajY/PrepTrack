import { useState } from "react";
function Tasks({ tasks, setTasks, markActivity,resetTasks }) {
  const [taskInput, setTaskInput] = useState("");
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

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
          setTasks([
             ...tasks,
  { text: taskInput, completed: false }
]);

          setTaskInput("");
          markActivity();
        }}
      >
        Add
      </button>
    <button className="reset-btn" onClick={resetTasks}>Reset</button>
    <div className="list-container">
  <ul>
    {activeTasks.map((task, index) => (
      <li
        key={`active-${index}`}
        onClick={() => {
          setTasks(
            tasks.map(t =>
              t === task ? { ...t, completed: true } : t
            )
          );
          markActivity();
        }}
      >
        {task.text}
      </li>
    ))}

    {completedTasks.map((task, index) => (
      <li
        key={`done-${index}`}
        className="completed"
        onClick={() => {
          setTasks(
            tasks.map(t =>
              t === task ? { ...t, completed: false } : t
            )
          );
        }}
      >
        {task.text}
      </li>
    ))}
  </ul>
</div>

    </div>
  );
}

export default Tasks;
