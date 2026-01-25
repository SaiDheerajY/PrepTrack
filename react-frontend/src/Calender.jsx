import { useState } from "react";

function Calendar({ dailyLog={} }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toDateString());

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  // empty cells before month start
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  return (
    <div className="calendar-box">
      <h2>Calendar</h2>

      <div className="calendar-grid">
        {days.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const dateStr = date.toDateString();
          const hasActivity = dailyLog[dateStr];

          return (
            <div
              key={idx}
              className={`calendar-cell ${
                dateStr === selectedDate ? "active" : ""
              }`}
              onClick={() => setSelectedDate(dateStr)}
            >
              {date.getDate()}
              {hasActivity && <span className="dot" />}
            </div>
          );
        })}
      </div>

      <div className="day-details">
        <h3>{selectedDate}</h3>

        {dailyLog[selectedDate] ? (
          <>
            <p>Tasks done: {dailyLog[selectedDate].tasksCompleted?.length || 0}</p>
            <p>Videos done: {dailyLog[selectedDate].videosCompleted?.length || 0}</p>
          </>
        ) : (
          <p>No activity</p>
        )}
      </div>
    </div>
  );
}

export default Calendar;
