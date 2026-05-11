const { balancoController } = require('../controllers');
const { ListaBalanco } = require('../models');
const { Op } = require('sequelize');

async function balancoMensal(req, res, next) {

    // Ignora se for a rota de balanço
    if (req.url.includes('balanco')) {
        res.locals.listaPendente = await balancoController.verificaListaPendente(req, res);
        res.locals.alertaBalanco = false;
        return next(); // Pula o resto do middleware
    }

    const hoje = new Date().getDate();
    let alertaBalanco = false;
    res.locals.listaPendente = await balancoController.verificaListaPendente(req, res);

    if (hoje >= 28) {
        console.log('[balancoMensal]: Verificando fim do mês');

        // Verifica se um balanço foi realizado nos ultimos 5 dias
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 5);
        const balancoRealizado = await ListaBalanco.findOne({
            where: {
                unidade_id: req.session.unidade_id,
                efetuado_em: {
                    [Op.gte]: dataLimite
                }
            }
        });

        if (!balancoRealizado) {
            alertaBalanco = true;
        }
    }

    res.locals.alertaBalanco = alertaBalanco;
    next();
};

module.exports = balancoMensal;