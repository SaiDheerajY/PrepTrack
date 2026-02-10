import { useState } from "react";
import { createPortal } from "react-dom";

function Calendar({ dailyLog = {} }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today); // Track displayed month
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  // Navigation Handlers
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  function getHeatLevel(log) {
    if (!log) return 0;
    const tasks = log.tasksCompleted?.length || 0;
    const videos = log.videosCompleted?.length || 0;
    const total = tasks + videos;

    if (total === 0) return 0;
    if (total <= 2) return 1;
    if (total <= 5) return 2;
    return 3;
  }

  const selectedKey = selectedDate.toDateString();
  const selectedLog = dailyLog?.[selectedKey];

  const days = [];

  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = date.toDateString();
    const log = dailyLog[key];
    const heat = getHeatLevel(log);

    const isToday = date.toDateString() === today.toDateString();

    days.push(
      <div
        key={key}
        className={`calendar-day heat-${heat} ${key === selectedKey ? "selected" : ""} ${isToday ? "is-today" : ""}`}
        onClick={() => {
          setSelectedDate(date);
          setShowModal(true);
        }}
      >
        {day}
      </div>
    );
  }

  return (
    <>
      <div className="calendar-box">
        <div className="calendar-header">
          <button onClick={prevMonth} className="nav-btn">&lt;</button>
          <h2>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="nav-btn">&gt;</button>
        </div>

        <div className="calendar-grid">{days}</div>

        <div className="calendar-details">
          <p>{selectedDate.toDateString()}</p>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{selectedDate.toDateString()}</h2>

              <h3>Tasks completed</h3>
              {selectedLog?.tasksCompleted?.length ? (
                <ul>
                  {selectedLog.tasksCompleted.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No tasks</p>
              )}

              <h3>Videos watched</h3>
              {selectedLog?.videosCompleted?.length ? (
                <ul>
                  {selectedLog.videosCompleted.map((video, i) => (
                    <li key={i}>{video}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No videos</p>
              )}
              <div style={{ textAlign: "left", marginTop: "20px" }}> {/* Left align button */}
                <button
                  className="bracket-btn"
                  onClick={() => setShowModal(false)}
                >
                  [ CLOSE ]
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
}

export default Calendar;
