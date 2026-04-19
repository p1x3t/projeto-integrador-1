const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs'); // Biblioteca para mexer com arquivos

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const FILE_PATH = './agendamentos.json';

app.post('/agendar', (req, res) => {
    const novoAgendamento = req.body;

    // 1. Ler o que já existe no arquivo
    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        let lista = [];
        if (!err && data) {
            lista = JSON.parse(data);
        }

        // 2. Adicionar o novo agendamento da Lanails Art
        lista.push(novoAgendamento);

        // 3. Salvar de volta no arquivo
        fs.writeFile(FILE_PATH, JSON.stringify(lista, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ status: 'Erro', mensagem: 'Erro ao salvar.' });
            }
            console.log('✅ Agendamento salvo no Banco de Dados Zanza!');
            res.json({ status: 'Sucesso', mensagem: `Obrigada, ${novoAgendamento.nome}! Seu horário foi solicitado.` });
        });
    });
});

app.listen(3000, () => {
    console.log('🚀 Zanza On-line em http://localhost:3000');
});