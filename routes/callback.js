var express = require('express');
var router = express.Router();

const SSO_USER_ME_URL = process.env.SSO_USER_ME_URL || 'https://login.taiksu.com.br/api/user/me';

// callback do SSO
router.get('/', async (req, res) => {
  const token = req.query.token; // Pega o Token da Query String URL
  if (!token) return res.status(400).send('Token não informado');

  try {
    const response = await fetch(SSO_USER_ME_URL, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro SSO:", errorText);
      return res.status(401).send("Token inválido ou expirado");
    }

    // Salva os dados do JSON no objeto UserData para descompactar cada campo separadamente
    const userData = await response.json();

    req.session.user = userData; // mantém objeto JSON completo e depois salva cada campo separado
    req.session.id_user = userData.id;
    req.session.name = userData.name;
    req.session.foto = userData.foto;
    req.session.unidade_id = userData.unidade ? userData.unidade.id : null;
    req.session.cidade = userData.unidade ? userData.unidade.cidade : null;
    req.session.grupo_id = userData.grupo_id;
    req.session.token = token; // salva token na sessão
    req.session.save(); //Salva sessão

    res.redirect('/');

  } catch (err) {
    console.error("Erro ao validar token:", err);
    res.status(500).send("Erro interno ao validar token");
  }
});

module.exports = router;
