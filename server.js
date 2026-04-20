const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

app.use(express.json());

const FILE_PATH = './agendamentos.json';
const USERS_PATH = './usuarios.json';

// Garante que os arquivos existam
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, '[]');
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, '[]');

// --- ROTAS DAS PÁGINAS ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cliente', (req, res) => {
    res.sendFile(path.join(__dirname, 'cliente.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Rota para ler as configurações (Serviços, Nome da Empresa, etc)
app.get('/api/config', (req, res) => {
    const CONFIG_PATH = './config.json';
    if (!fs.existsSync(CONFIG_PATH)) {
        // Se o arquivo não existir por algum motivo, enviamos um padrão
        return res.json({ nomeEmpresa: "Minha Empresa", servicos: [] });
    }
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    res.json(JSON.parse(data));
});

// --- API DE AUTENTICAÇÃO ---

app.post('/api/auth', (req, res) => {
    const { email, senha, nome, acao } = req.body;
    let usuarios = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));

    if (acao === 'cadastro') {
        const nomes = (nome || "").trim().split(/\s+/);
        if (nomes.length < 2) return res.status(400).json({ mensagem: "Digite nome e sobrenome." });
        
        usuarios.push({ email, senha: bcrypt.hashSync(senha, 10), nome });
        fs.writeFileSync(USERS_PATH, JSON.stringify(usuarios, null, 2));
        res.json({ mensagem: "Cadastrado com sucesso!" });
    } else {
        const u = usuarios.find(u => u.email === email);
        if (u && bcrypt.compareSync(senha, u.senha)) {
            res.json({ nome: u.nome, email: u.email });
        } else {
            res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }
    }
});

// --- API DE AGENDAMENTOS ---

app.get('/api/horarios-ocupados', (req, res) => {
    const dataBusca = req.query.data;
    const lista = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    const ocupados = lista.filter(a => a.data === dataBusca).map(a => a.hora);
    res.json(ocupados);
});

app.post('/agendar', (req, res) => {
    const novo = req.body;
    let lista = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

    // Regra dos 15 dias para manutenção
    if (novo.servico.includes("Manutenção")) {
        const ultima = lista.filter(a => a.email === novo.email && a.servico.includes("Manutenção")).pop();
        if (ultima) {
            const diff = Math.ceil(Math.abs(new Date(novo.data) - new Date(ultima.data)) / (1000 * 60 * 60 * 24));
            if (diff < 15) return res.status(400).json({ mensagem: `Intervalo de manutenção deve ser 15 dias. Faltam ${15-diff}.` });
        }
    }

    novo.status = "Pendente";
    novo.dataRegistro = new Date().toLocaleString();
    lista.push(novo);
    fs.writeFileSync(FILE_PATH, JSON.stringify(lista, null, 2));
    res.json({ mensagem: "Agendado com sucesso!" });
});

app.get('/api/agendamentos', (req, res) => res.json(JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'))));

app.post('/api/pagar', (req, res) => {
    const { index } = req.body;
    let lista = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    if (lista[index]) lista[index].status = "Pago";
    fs.writeFileSync(FILE_PATH, JSON.stringify(lista, null, 2));
    res.json({ mensagem: "Pago!" });
});

app.delete('/api/excluir/:index', (req, res) => {
    let lista = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    lista.splice(req.params.index, 1);
    fs.writeFileSync(FILE_PATH, JSON.stringify(lista, null, 2));
    res.json({ mensagem: "Excluído!" });
});

app.use(express.static(__dirname));

app.listen(3000, () => console.log("🚀 Sistema Zanza em http://localhost:3000"));