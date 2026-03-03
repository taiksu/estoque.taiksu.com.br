  const btnAbrir = document.getElementById('abrir-menu');
  const btnFechar = document.getElementById('fechar-menu');
  const menu = document.getElementById('menu-lateral');
  const overlay = document.getElementById('menu-overlay');

  const abrirMenu = () => {
    menu.classList.remove('translate-x-full');
    menu.classList.add('translate-x-0');
    overlay.classList.remove('hidden');
  };

  const fecharMenu = () => {
    menu.classList.add('translate-x-full');
    menu.classList.remove('translate-x-0');
    overlay.classList.add('hidden');
  };

  btnAbrir.addEventListener('click', abrirMenu);
  btnFechar.addEventListener('click', fecharMenu);
  overlay.addEventListener('click', fecharMenu);
