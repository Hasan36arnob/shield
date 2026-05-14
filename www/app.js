const quotes = [

  "Discipline is stronger than desire.",

  "Your future is watching you.",

  "A weak mind obeys urges.",

  "Control brings freedom.",

  "Every second matters.",

  "Win the private battle.",

  "Focus creates power."

];

let streak =
  localStorage.getItem("streak") || 0;

document.getElementById("streak").innerText =
  "Clean Days: " + streak;

let running = false;

function startFocus(){

  if(running) return;

  running = true;

  let time = 300;

  const timer = setInterval(() => {

    let min = Math.floor(time / 60);

    let sec = time % 60;

    sec =
      sec < 10 ? "0" + sec : sec;

    document.getElementById("timer").innerText =
      `${min}:${sec}`;

    document.getElementById("quote").innerText =
      quotes[Math.floor(Math.random() * quotes.length)];

    time--;

    if(time < 0){

      clearInterval(timer);

      streak++;

      localStorage.setItem("streak", streak);

      document.getElementById("streak").innerText =
        "Clean Days: " + streak;

      document.getElementById("timer").innerText =
        "DONE";

      alert("You won today's battle.");

      running = false;
    }

  },1000);
}

function resetStreak(){

  streak = 0;

  localStorage.setItem("streak", streak);

  document.getElementById("streak").innerText =
    "Clean Days: 0";
}