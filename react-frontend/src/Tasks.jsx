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
      {/* HEADER */}
      <div className="section-title">
        // TASKS :: LIST
      </div>

      {/* INPUT ROW */}
      <div className="terminal-input-row">
        <span>&gt;</span>
        <input
          type="text"
          className="terminal-input"
          placeholder="New_task_name..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
        >
          <option value="High">PRIORITY: HIGH</option>
          <option value="Medium">PRIORITY: MED</option>
          <option value="Low">PRIORITY: LOW</option>
        </select>

        <button className="bracket-btn" onClick={handleAddTask}>[ ADD ]</button>
        <button className="text-btn" onClick={resetTasks}>
          [ RESET ]
        </button>
      </div>

      <div className="list-container">
        <ul>
          {activeTasks.map((task, index) => (
            <li
              key={`active-${index}`}
              className="task-item"
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
              className="task-item completed"
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