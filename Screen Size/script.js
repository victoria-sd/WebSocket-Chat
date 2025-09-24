const btn = document.querySelector('.screen_size');
const height = document.documentElement.clientHeight;
const width = document.documentElement.clientWidth;

btn.addEventListener('click', () => {
  window.alert(`Высота экрана: ${height}, ширина экрана: ${width}`)
});
