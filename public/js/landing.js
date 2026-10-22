// Typing effect for the status line
const messages = ["site under construction", "come back soon"];
const typedEl = document.getElementById("typed");

let msgIndex = 0;
let charIndex = 0;
let deleting = false;

function tick() {
  const current = messages[msgIndex];

  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(tick, 1600);
      return;
    }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      msgIndex = (msgIndex + 1) % messages.length;
    }
  }

  setTimeout(tick, deleting ? 35 : 60);
}

tick();
