import { useState } from "react";

function Calendar({ dailyLog = {} }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  // Empty slots before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  return (
    <div className="calendar-box">
      <h2>Calendar</h2>

      <div className="calendar-grid">
        {days.map((date, index) => {
          if (!date) return <div key={index} />;

          const dateStr = date.toDateString();
          const hasActivity = dailyLog?.[dateStr];

          return (
            <div
              key={index}
              className={`calendar-cell ${
                selectedDate === dateStr ? "active" : ""
              }`}
              onClick={() => {
                setSelectedDate(dateStr);
                setShowModal(true);
              }}
            >
              {date.getDate()}
              {hasActivity && <span className="dot" />}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedDate}</h2>

            <h3>Tasks completed</h3>
            {dailyLog[selectedDate]?.tasksCompleted?.length ? (
              <ul>
                {dailyLog[selectedDate].tasksCompleted.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No tasks</p>
            )}

            <h3>Videos watched</h3>
            {dailyLog[selectedDate]?.videosCompleted?.length ? (
              <ul>
                {dailyLog[selectedDate].videosCompleted.map((video, i) => (
                  <li key={i}>{video}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No videos</p>
            )}

            <button
              className="reset-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
