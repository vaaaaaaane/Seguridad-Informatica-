require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de PostgreSQL (Ubu)
const pgPool = new Pool({
    host: process.env.UBNT_HOST,
    user: process.env.UBNT_USER,
    password: process.env.UBNT_PASS,
    database: process.env.UBNT_DB,
    port: process.env.UBNT_PORT,
    ssl: false
});

// Configuración de SQL Server (Win)
const sqlConfig = {
    server: process.env.WIN_HOST,
    user: process.env.WIN_USER,
    password: process.env.WIN_PASS,
    database: process.env.WIN_DB,
    port: parseInt(process.env.WIN_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Endpoint
app.post('/api/guardar/windows', async (req, res) => {
    const { usuario, nombre, paterno, materno, estado, municipio, latitud, longitud, temperatura, humedad, viento } = req.body;
    try {
        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('Usuario', sql.VarChar, usuario)
            .input('Nombre', sql.VarChar, nombre)
            .input('Paterno', sql.VarChar, paterno)
            .input('Materno', sql.VarChar, materno)
            .input('Estado', sql.VarChar, estado)
            .input('Municipio', sql.VarChar, municipio)
            .input('Latitud', sql.Decimal(9, 6), latitud)
            .input('Longitud', sql.Decimal(9, 6), longitud)
            .input('Temperatura', sql.Decimal(5, 2), temperatura)
            .input('Humedad', sql.Decimal(5, 2), humedad)
            .input('Viento', sql.VarChar, viento)
            .query(`INSERT INTO Georreferencia (Usuario, Nombre, Paterno, Materno, Estado, Municipio, Latitud, Longitud, Temperatura, Humedad, Viento)
                    VALUES (@Usuario, @Nombre, @Paterno, @Materno, @Estado, @Municipio, @Latitud, @Longitud, @Temperatura, @Humedad, @Viento)`);
        
        res.json({ status: 'success', server: 'Windows Server 2022 (SQL Server)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint 2: Guardar en Servidor 2 (Ubuntu / PostgreSQL)
app.post('/api/guardar/ubuntu', async (req, res) => {
    const { usuario, nombre, paterno, materno, estado, municipio, latitud, longitud, temperatura, humedad, viento } = req.body;
    try {
        const query = `
            INSERT INTO "Georreferencia" ("Usuario", "Nombre", "Paterno", "Materno", "Estado", "Municipio", "Latitud", "Longitud", "Temperatura", "Humedad", "Viento")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
        const values = [usuario, nombre, paterno, materno, estado, municipio, latitud, longitud, temperatura, humedad, viento];
        
        await pgPool.query(query, values);
        res.json({ status: 'success', server: 'Ubuntu Server (PostgreSQL)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Servidor dispo en http://localhost:3000'));