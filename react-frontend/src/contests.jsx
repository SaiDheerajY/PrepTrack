import React from "react";
function Contests() {
  const contests = [
    { name: "LeetCode Weekly 390", date: "2026-02-02" },
    { name: "Codeforces Round 950", date: "2026-01-30" },
    { name: "LeetCode Biweekly 120", date: "2026-01-15" },
    { name: "LeetCode Biweekly 122", date: "2026-01-27" }
  ];

  const today = new Date();

  const upcoming = contests.filter(
    (contest) => new Date(contest.date) >= today
  );

  const past = contests.filter(
    (contest) => new Date(contest.date) < today
  );

  return (
    <div>
      <h2>Contests</h2>

      <h3>Upcoming</h3>
      <ul>
        {upcoming.map((contest, index) => (
          <li key={index}>
            {contest.name} — {contest.date}
          </li>
        ))}
      </ul>

      <h3>Past</h3>
      <ul>
        {past.map((contest, index) => (
          <li key={index}>
            {contest.name} — {contest.date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Contests;
