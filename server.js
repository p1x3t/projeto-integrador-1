const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve o seu index.html

// Rota para receber os dados do agendamento (Nome e E-mail)
app.post('/agendar', (req, res) => {
    const { nome, email, servico } = req.body;
    console.log(`Agendamento recebido para ${nome} (${email}) - Serviço: ${servico}`);
    res.json({ status: 'Sucesso', mensagem: `Obrigada, ${nome}! Seu horário foi solicitado.` });
});

app.listen(3000, () => {
    console.log('Plataforma Zanza On-line em http://localhost:3000');
});