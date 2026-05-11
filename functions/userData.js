async function userData({ userId, token }) {
try {
    const colaborador = await fetch('https://login.taiksu.com.br/api/users/' + userId,
        {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }
    );
    
    const userData = await colaborador.json();
    return userData;
} catch (error) {
    console.error('[userData]: Erro ao buscar dados do usuário', error);
    throw new Error(error);
}
};

module.exports = userData;