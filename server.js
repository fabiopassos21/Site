const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = require('./database'); // Importa o arquivo do banco de dados SQLite

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = '$2a$10$zjWMTphrbmGC0S8D0Gav1.dYqSvPc/GiJ3O5.XJAy/kE7JQBB7pW6';
const binId = '667db440ad19ca34f87fc213';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));

// Middleware para verificar se o usuário está logado
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

// Rota para página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Endpoint para validação de login
app.post('/login', (req, res) => {
    const { username } = req.body;

    // Consulta ao banco de dados para verificar o usuário
    db.get('SELECT * FROM users WHERE name = ?', [username], (err, row) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            res.status(500).send('Erro ao autenticar');
        } else if (row) {
            // Usuário encontrado, define na sessão e redireciona
            req.session.user = { name: username };
            res.redirect(`/paginaPrincipal.html?username=${encodeURIComponent(username)}`);
        } else {
            // Usuário não encontrado
            res.status(401).send('Credenciais inválidas');
        }
    });
});

// Rota para a página principal após login
app.get('/paginaPrincipal.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'paginaPrincipal.html'));
});

// Rota para a página de lista de presentes (gifts.html)
app.get('/gifts.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gifts.html'));
});

// Endpoint para salvar seleções de checkboxes
app.post('/save-selections', (req, res) => {
    const selections = req.body;

    axios.put(`https://api.jsonbin.io/v3/b/${binId}`, selections, {
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey
        }
    })
    .then(response => {
        res.send('Seleções salvas com sucesso!');
    })
    .catch(error => {
        console.error('Erro ao salvar seleções:', error);
        res.status(500).send('Erro ao salvar seleções');
    });
});

// Endpoint para limpar seleções de checkboxes
app.post('/clear-selections', checkAuth, async (req, res) => {
    const username = req.session.user.name;
    const selections = {
        presente1: false,
        presente2: false,
        presente3: false,
        presente4: false
        // Adicione mais presentes conforme necessário
    };

    try {
        // Salvar as seleções no JSONBin
        await axios.put(binId, selections, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            }
        });

        res.send('Seleções limpas com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar seleções:', error.message);
        res.status(500).send('Erro ao limpar seleções');
    }
});

// Endpoint para obter seleções de checkboxes
app.get('/get-selections', (req, res) => {
    axios.get(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
            'X-Master-Key': apiKey
        }
    })
    .then(response => {
        res.json(response.data.record);
    })
    .catch(error => {
        console.error('Erro ao recuperar seleções:', error);
        res.status(500).send('Erro ao recuperar seleções');
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
