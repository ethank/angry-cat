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
  subtitle.textContent = "Don't wake the cat.";
  content.appendChild(subtitle);

  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.textContent = 'PLAY';
  content.appendChild(playBtn);

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
