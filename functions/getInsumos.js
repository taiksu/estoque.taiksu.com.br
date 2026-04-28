async function getInsumos() {
    const response = await fetch('https://insumos.taiksu.com.br/insumos');
    const categorias = await response.json();
    const insumos = Object.values(categorias).flat();
    return insumos;
};

module.exports = getInsumos;
