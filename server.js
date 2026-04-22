const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

app.use(express.json());
app.use(express.static(__dirname));

const FILE_PATH = './agendamentos.json';
const USERS_PATH = './usuarios.json';
const CONFIG_PATH = './config.json';

// Garante que os arquivos existam
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, '[]');
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, '[]');

// --- ROTAS DAS PÁGINAS ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/cliente', (req, res) => res.sendFile(path.join(__dirname, 'cliente.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- API DE AUTENTICAÇÃO ---

// ROTA DE CADASTRO (CLIENTE E ADMIN)
app.post('/register', (req, res) => {
    const { nome, email, senha, tipo, whatsapp } = req.body;
    try {
        let usuarios = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
        
        // Verifica se usuário já existe
        if (usuarios.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
        }

        // Criptografa a senha antes de salvar
        const salt = bcrypt.genSaltSync(10);
        const senhaCriptografada = bcrypt.hashSync(senha, salt);

        const novoUsuario = { 
            nome, 
            email, 
            senha: senhaCriptografada, 
            tipo: tipo || 'cliente',
            whatsapp: whatsapp || ''
        };

        usuarios.push(novoUsuario);
        fs.writeFileSync(USERS_PATH, JSON.stringify(usuarios, null, 2));
        
        res.json({ success: true, message: "Cadastro realizado com sucesso!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erro ao salvar usuário." });
    }
});

// ROTA DE LOGIN
app.post('/login', (req, res) => {
    // Note que mudei 'password' para 'senha' para bater com o banco
    const { email, senha, tipo } = req.body; 
    try {
        const usuarios = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
        const u = usuarios.find(user => user.email === email && user.tipo === tipo);

        if (u) {
            // Compara a senha digitada com o hash do banco
            const senhaValida = bcrypt.compareSync(senha, u.senha);

            if (senhaValida) {
                return res.json({ 
                    success: true, 
                    nome: u.nome, 
                    redirect: tipo === 'admin' ? 'admin.html' : 'cliente.html' 
                });
            }
        }
        res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erro no servidor." });
    }
});

// --- RESTO DAS SUAS ROTAS (Config, Agendamentos, etc) ---
app.get('/api/config', (req, res) => {
    if (!fs.existsSync(CONFIG_PATH)) return res.json({ nomeEmpresa: "Zanza Estética", servicos: [] });
    res.json(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
});

app.get('/api/agendamentos', (req, res) => res.json(JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'))));

app.post('/agendar', (req, res) => {
    const novo = req.body;
    let lista = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    novo.status = "Pendente";
    novo.dataRegistro = new Date().toLocaleString();
    lista.push(novo);
    fs.writeFileSync(FILE_PATH, JSON.stringify(lista, null, 2));
    res.json({ mensagem: "Agendado com sucesso!" });
});

app.listen(3000, () => console.log("🚀 Sistema Zanza rodando em http://localhost:3000"));