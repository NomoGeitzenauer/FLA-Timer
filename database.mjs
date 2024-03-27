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

export async function createBewerb(bew_name, bew_art, bew_wetter, bew_datum, bew_threshholdalterspunkte, bew_valuealterspunnkte) {
    const result = await pool.query(`
    INSERT INTO tbl_bewerb (bew_name, bew_art, bew_wetter,bew_datum,bew_threshholdalterspunkte,bew_valuealterspunkte)
    VALUES (?, ?, ?, ?,?,?)
    `, [bew_name, bew_art, bew_wetter, bew_datum, bew_threshholdalterspunkte, bew_valuealterspunnkte]);

    const bew_id = result[0].insertId
    return getBewerb(bew_id);

}

export async function deleteBewerb(bew_id) {
    await pool.query(`
    DELETE FROM tbl_bewerb
    WHERE id_bew = ?
    `, [bew_id]);
    console.log(bew_id);
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

export async function getGruppenByBewerbId(id_bew) {
    // Fetching group information from tbl_gruppe based on id_bew
    const [gruppenRows] = await pool.query(`
    SELECT g.*
    FROM tbl_gruppe g
    JOIN tbl_gru_bew_link l ON g.id_gru = l.id_gb_link_gru_fk
    WHERE l.id_tbl_bew_fk = ?
    `, [id_bew]);

    return gruppenRows;
}


export async function getFehler() {
    const [rows] = await pool.query("SELECT * FROM `tbl_fehler`");
    return rows;
}

export async function getGruppeByDurchlauf(id_dur) {
    const [rows] = await pool.query(`
        SELECT g.*
        FROM tbl_gruppe g
        JOIN tbl_gru_bew_link l ON g.id_gru = l.id_gb_link_gru_fk
        JOIN tbl_durchlauf d ON l.id_gru_bew_link = d.id_tbl_gb_link_fk
        WHERE d.id_dur = ?
    `, [id_dur]);
    return rows[0];
}



export async function createGruppen(gru_name, gru_feuerwehr) {
    const result = await pool.query(`
    INSERT INTO tbl_gruppe (gru_name, gru_feuerwehr)
    VALUES (?, ?, ?)
    `, [gru_name, gru_feuerwehr]);
    const gru_id = result[0].insertId
    return getGruppe(gru_id);
}

export async function deleteGruppe(gru_id) {
    await pool.query(`
    DELETE FROM tbl_gruppe
    WHERE id_gru = ?
    `, [gru_id]);
}

export async function getdruchlaufe(bewerbID) {
    const [rows] = await pool.query(`
        SELECT d.*, b.bew_name, g.gru_name, g.gru_feuerwehr
        FROM tbl_durchlauf d
        JOIN tbl_gru_bew_link l ON d.id_tbl_gb_link_fk = l.id_gru_bew_link
        JOIN tbl_bewerb b ON d.id_tbl_gb_link_fk = l.id_gru_bew_link
        JOIN tbl_gruppe g ON l.id_gb_link_gru_fk = g.id_gru
        WHERE b.id_bew = ?
        ORDER BY d.dur_zeit ASC
    `, [bewerbID]);
    return rows;
}


export async function createFehlerEintrag(fehler, mitglied, durchlauf) {
    const result = await pool.query(`
    INSERT INTO \`tbl_fehler-link\` (id_tbl_fehler_fk, id_tbl_mitglied_fk, id_tbl_durchlauf_fk)
    VALUES (?, ?, ?)
    `, [fehler, mitglied, durchlauf]);
    return result;
}

export async function deleteFehlerEintrag(fehlerID) {
    await pool.query(`
    DELETE FROM \`tbl_fehler-link\`
    WHERE \`id_feh-li\` = ?
    `, [fehlerID]);
}

export async function getdurchlaufFehler(dur_id) {
    const [rows] = await pool.query(`
        SELECT fl.\`id_feh-li\`, f.feh_name, m.mit_name, f.feh_punkte, COUNT(fl.\`id_feh-li\`) as error_count,
               f.feh_punkte * COUNT(fl.\`id_feh-li\`) as total_error_value
        FROM \`tbl_fehler-link\` fl
        JOIN tbl_fehler f ON fl.id_tbl_fehler_fk = f.id_feh
        JOIN tbl_mitglied m ON fl.id_tbl_mitglied_fk = m.id_mit
        WHERE fl.id_tbl_durchlauf_fk = ?
        GROUP BY fl.id_tbl_fehler_fk;
    `, [dur_id]);
    return rows;
}

export async function getdurchlaufFehlerListe(dur_id) {
    const [rows] = await pool.query(`
        SELECT fl.\`id_feh-li\`, f.feh_name, m.mit_name, f.feh_punkte
        FROM \`tbl_fehler-link\` fl
        JOIN tbl_fehler f ON fl.id_tbl_fehler_fk = f.id_feh
        JOIN tbl_mitglied m ON fl.id_tbl_mitglied_fk = m.id_mit
        WHERE fl.id_tbl_durchlauf_fk = ?
    `, [dur_id]);
    return rows;
}

async function getGruppeIdByName(gruppeName) {
    const [rows] = await pool.query('SELECT id_gru FROM tbl_gruppe WHERE gru_name = ?', [gruppeName]);
    if (rows.length > 0) {
        return rows[0].id_gru;
    } else {
        return null;
    }
}

export async function createDurchlauf(bew_id, dur_gruppe, dur_bewerbsbahn) {
    const id_dur_gruppe = await getGruppeIdByName(dur_gruppe);
    if (id_dur_gruppe === null) {
        throw new Error(`Group with name ${dur_gruppe} not found.`);
    }

    // Insert into tbl_gru_bew_link to link bewerb and gruppe
     await pool.query(`
    INSERT INTO tbl_gru_bew_link (id_tbl_bew_fk, id_gb_link_gru_fk)
    VALUES (?, ?)
    `, [bew_id, id_dur_gruppe]);

    const insertId = await pool.query('SELECT LAST_INSERT_ID() as id');
    const lastInsertId = insertId[0][0].id;
    console.log(lastInsertId);

    await pool.query(`
    CALL update_alterspunkte_trigger_after_insert_bew_link(?)
`, [id_dur_gruppe]);
    
   const result = await pool.query(`
         INSERT INTO tbl_durchlauf (id_tbl_gb_link_fk, dur_bewerbsbahn)
         VALUES (?, ?)
     `, [lastInsertId, dur_bewerbsbahn]);
    return result;
}



export async function completeDurchlauf(dur_id, fehlerges, punkte) {
    await pool.query(`
        UPDATE tbl_durchlauf 
        SET \`dur_fehler-gesamt\` = ?, dur_punkte = ? 
        WHERE id_dur = ?
    `, [fehlerges, punkte, dur_id]);
}

export async function getMitglieder(id_gru) {
    const [rows] = await pool.query(`
    SELECT *
     FROM tbl_mitglied
     WHERE id_tbl_gru_fk = ?
     Order by mit_name
     `, [id_gru]);

    return rows;
}

export async function createMitglied(mit_name, mit_nachname, mit_geschlecht, mit_alter, mit_funktion, mit_dienstgrad, gru_id) {
    const [rows] = await pool.query(`
    INSERT INTO tbl_mitglied (mit_name, mit_nachname, mit_geschlecht, mit_alter, mit_funktion, mit_dienstgrad, id_tbl_gru_fk)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [mit_name, mit_nachname, mit_geschlecht, mit_alter, mit_funktion, mit_dienstgrad, gru_id]);
    return rows;
}

export async function deleteMitglied(mit_id, gru_id) {
    await pool.query(`
        DELETE FROM tbl_mitglied
        WHERE id_mit = ? AND id_tbl_gru_fk = ?
    `, [mit_id, gru_id]);
}

export function formatDate(dateString) {
    //console.log(dateString);
    const date = new Date(dateString);
    const day = date.getDate();

    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    const hours = date.getHours();
    let hours_pad = String(hours).padStart(2, '0');
    const minutes = date.getMinutes();
    let minutes_pad = String(minutes).padStart(2, '0');

    return `${day}.${month}.${year}, ${hours_pad}:${minutes_pad}`;
}

