export function createLauncher(onStart) {
  const launcher = document.getElementById('launcher');

  // Build launcher DOM
  const bg = document.createElement('div');
  bg.className = 'launcher-bg';

  const fog = document.createElement('div');
  fog.className = 'fog';
  bg.appendChild(fog);

  const content = document.createElement('div');
  content.className = 'launcher-content';

  const eyes = document.createElement('div');
  eyes.className = 'cat-eyes';
  const leftEye = document.createElement('div');
  leftEye.className = 'eye left';
  const rightEye = document.createElement('div');
  rightEye.className = 'eye right';
  eyes.appendChild(leftEye);
  eyes.appendChild(rightEye);
  content.appendChild(eyes);

  const title = document.createElement('h1');
  title.className = 'title';
  title.textContent = 'ANGRY CAT';
  content.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'subtitle';
  subtitle.textContent = "Spencer is having his crazy time.";
  content.appendChild(subtitle);

  // Controls info
  const controlsBox = document.createElement('div');
  controlsBox.className = 'launcher-controls';

  const controlsTitle = document.createElement('p');
  controlsTitle.className = 'launcher-controls-title';
  controlsTitle.textContent = 'CONTROLS';
  controlsBox.appendChild(controlsTitle);

  const controlsList = [
    ['W A S D', 'Move'],
    ['MOUSE', 'Look around'],
    ['SHIFT', 'Sprint'],
    ['H', 'Help'],
    ['ESC', 'Pause'],
  ];

  controlsList.forEach(([key, action]) => {
    const row = document.createElement('div');
    row.className = 'launcher-controls-row';

    const keyEl = document.createElement('span');
    keyEl.className = 'launcher-key';
    keyEl.textContent = key;
    row.appendChild(keyEl);

    const actionEl = document.createElement('span');
    actionEl.className = 'launcher-action';
    actionEl.textContent = action;
    row.appendChild(actionEl);

    controlsBox.appendChild(row);
  });

  content.appendChild(controlsBox);

  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.textContent = 'PLAY';
  content.appendChild(playBtn);

  const credits = document.createElement('p');
  credits.className = 'launcher-credits';
  credits.textContent = 'Made for Ada Kaplan';
  content.appendChild(credits);

  bg.appendChild(content);
  launcher.appendChild(bg);

  playBtn.addEventListener('click', () => {
    launcher.classList.add('fade-out');
    setTimeout(() => {
      launcher.style.display = 'none';
      onStart();
    }, 500);
  });
}
