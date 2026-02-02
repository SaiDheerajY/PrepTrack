import { useState } from "react";

function Tasks({ tasks = [], setTasks, markActivity, resetTasks }) {
  const [taskInput, setTaskInput] = useState("");
  const [priority, setPriority] = useState("Medium");

  const getPriorityWeight = (p) => {
    // Safety check: if p is undefined, treat as Medium
    const safePriority = p || "Medium";
    if (safePriority === "High") return 3;
    if (safePriority === "Medium") return 2;
    return 1; // Low
  };

  const sortByPriority = (a, b) => {
    return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  };

  const activeTasks = tasks
    .filter((task) => !task.completed)
    .sort(sortByPriority);

  const completedTasks = tasks
    .filter((task) => task.completed)
    .sort(sortByPriority);

  const handleAddTask = () => {
    if (taskInput.trim() === "") return;
    setTasks([
      ...tasks,
      { text: taskInput, completed: false, priority: priority },
    ]);
    setTaskInput("");
    setPriority("Medium");
    markActivity();
  };

  return (
    <div className="section-container">
      <h1>PrepTrack.</h1>
      <h2>Tasks</h2>

      <div className="input-group">
        <input
          type="text"
          placeholder="Add a task..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <button onClick={handleAddTask}>Add</button>
        <button className="reset-btn" onClick={resetTasks}>
          Reset
        </button>
      </div>

      <div className="list-container">
        <ul>
          {activeTasks.map((task, index) => (
            <li
              key={`active-${index}`}
              onClick={() => {
                setTasks(
                  tasks.map((t) => (t === task ? { ...t, completed: true } : t))
                );
                markActivity();
              }}
            >
              {/* FIX: Add fallback here so it doesn't crash on old tasks */}
              <span className={`priority-dot ${(task.priority || "Medium").toLowerCase()}`}></span>
              {task.text}
            </li>
          ))}

          {completedTasks.map((task, index) => (
            <li
              key={`done-${index}`}
              className="completed"
              onClick={() => {
                setTasks(
                  tasks.map((t) =>
                    t === task ? { ...t, completed: false } : t
                  )
                );
              }}
            >
              {/* FIX: Add fallback here too */}
              <span className={`priority-dot ${(task.priority || "Medium").toLowerCase()}`}></span>
              {task.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Tasks;