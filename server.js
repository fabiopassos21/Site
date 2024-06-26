const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database'); // Configuração do banco de dados SQLite
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
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
    db.get("SELECT * FROM users WHERE name = ?", [username], (err, row) => {
        if (err) {
            res.status(500).send('Erro no servidor');
        } else if (row) {
            req.session.user = row;
            // Redireciona para a página principal com o nome de usuário na query string
            res.redirect(`/paginaPrincipal.html?username=${encodeURIComponent(username)}`);
        } else {
            res.status(401).send('Credenciais inválidas');
        }
    });
});

// Rota para a página principal após login
app.get('/paginaPrincipal.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'paginaPrincipal.html'));
});

// Rota para a página de lista de presentes
app.get('/gifts.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gifts.html'));
});

// Endpoint para salvar presentes selecionados
app.post('/save-gifts', checkAuth, async (req, res) => {
    const userId = req.session.user.id;
    const selectedGifts = Array.isArray(req.body.gifts) ? req.body.gifts.map(Number) : [parseInt(req.body.gifts)];

    if (!selectedGifts.length) {
        return res.status(400).send('Nenhum presente selecionado');
    }

    try {
        const stmt = db.prepare("INSERT INTO gifts (user_id, gift_id) VALUES (?, ?)");
        selectedGifts.forEach(giftId => {
            stmt.run(userId, giftId);
        });
        stmt.finalize();

        // Desabilita os presentes selecionados
        await db.run("UPDATE gifts SET disabled = 1 WHERE user_id = ? AND gift_id IN (" + selectedGifts.join(',') + ")", [userId]);

        res.redirect('/gifts.html');
    } catch (error) {
        console.error('Erro ao salvar presentes:', error.message);
        res.status(500).send('Erro ao salvar presentes');
    }
});

// Endpoint para obter presentes já selecionados
app.get('/get-selected-gifts', checkAuth, (req, res) => {
    const userId = req.session.user.id;
    db.all("SELECT gift_id FROM gifts WHERE user_id = ? AND disabled = 1", [userId], (err, rows) => {
        if (err) {
            res.status(500).send('Erro ao obter presentes selecionados');
        } else {
            const selectedGifts = rows.map(row => row.gift_id);
            res.json(selectedGifts);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
