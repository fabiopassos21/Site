const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    // Cria tabela de usuários e insere dados
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    )`);

    const usersData = [
       "Fabio", "Leticia", "Valeria", "Paulo", "Bruno",
        "Adriana", "Ademir", "Vinicius", "Felipe", "Neusa",
        "Angelica", "Tainara", "Maria", "Marcinho",
        "Keila", "Samuel", "Sidney", "Pino","Felipe Barbosa","Thais","Amanda","Naldo","naldo","angelica",
        "Simara", "Ailton", "Neli", "Roberto", "Diego","Priscila","Massaru","Carmen","Rodolfo","Jose","Rogerio","Edson"
    ];

    const stmtInsertUser = db.prepare("INSERT INTO users (name) VALUES (?)");
    usersData.forEach(name => {
        stmtInsertUser.run(name);
    });
    stmtInsertUser.finalize();

    // Cria tabela de seleções de presentes com coluna selected_by
    db.run(`CREATE TABLE gifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        gift_id INTEGER,
        disabled INTEGER DEFAULT 0, -- Coluna para desabilitar presentes
        selected_by TEXT, -- Coluna para armazenar o nome do usuário
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
