import mysql from 'mysql2';

import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise();

export async function getBewerbe() {
    const [rows] = await pool.query("SELECT * FROM `tbl_bewerb`");
    return rows;
}

export async function getBewerb(bew_id) {
    const [rows] = await pool.query(`
        SELECT *
        FROM tbl_bewerb
        WHERE id_bew = ?
        `, [bew_id]);
    return rows[0];
}

export async function createBewerb(bew_name, bew_art, bew_wetter) {
    const result = await pool.query(`
    INSERT INTO tbl_bewerb (bew_name, bew_art, bew_wetter)
    VALUES (?, ?, ?)
    `, [bew_name, bew_art, bew_wetter]);
    const bew_id = result[0].insertId
    return getBewerb(bew_id);

}

export async function getGruppen() {
    const [rows] = await pool.query("SELECT * FROM `tbl_gruppe`");
    return rows;
}

export async function getGruppe(id_gru) {
    const [rows] = await pool.query(`
        SELECT *
        FROM tbl_gruppe
        WHERE id_gru = ?
        `, [id_gru]);
    return rows[0];
}

export async function createGruppen(gru_name, gru_feuerwehr, gru_alterspunkte) {
    const result = await pool.query(`
    INSERT INTO tbl_gruppe (gru_name, gru_feuerwehr, gru_alterspunkte)
    VALUES (?, ?, ?)
    `, [gru_name, gru_feuerwehr, gru_alterspunkte]);
    const gru_id = result[0].insertId
    return getGruppe(gru_id);
}

export async function getdruchlaufe(bewerbID) {
    const [rows] = await pool.query(`
        SELECT d.*, b.bew_name, g.gru_name, g.gru_feuerwehr
        FROM tbl_durchlauf d
        JOIN tbl_bewerb b ON d.id_tbl_bew_fk = b.id_bew
        JOIN tbl_gruppe g ON d.id_tbl_gru_fk = g.id_gru
        WHERE d.id_tbl_bew_fk = ?
        ORDER BY d.dur_zeit ASC
    `, [bewerbID]);
    return rows;
}

export async function getMitglieder(id_mit) {
    const [rows] = await pool.query(`
    SELECT *
     FROM tbl_mitglied
     WHERE id_tbl_gru_fk = ?
     Order by mit_name
     `, [id_mit]);
     
    return rows;
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
}