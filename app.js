//using express
import express from 'express'
const app = express()
//using body-parser
import bodyParser from 'body-parser';
//using database
import { getBewerbe, getBewerb, createBewerb, getMitglieder, getGruppenByBewerbId } from './database.mjs'
import { formatDate } from './database.mjs'
import { getGruppen, createGruppen, getdruchlaufe } from './database.mjs'
//import { getMitglieder } from './database.mjs'
app.set("view engine", "ejs");

app.use(bodyParser.json());
//all of the bewerbe
app.get("/bewerbe", async (req, res) => {
    const bewerbe = await getBewerbe();
    const formattedBewerbe = bewerbe.map(bewerb => ({
        ...bewerb,
        bew_datum_formatted: formatDate(bewerb.bew_datum)
    }));
    res.render("bewerbe.ejs", { bewerbe: formattedBewerbe });
});

app.get("/bewerbe/gruppen/", async (req, res) => {
    const gruppen = await getGruppen();
    res.render("gruppen.ejs", { gruppen });
});

app.get("/bewerbe/gruppen/:id", async (req, res) => {
    const gru_id = req.params.id;
    const mitglieder = await getMitglieder(gru_id);
    if (!mitglieder) {
        res.status(404).send("mitglieder not found");
        return;
    }
    res.render("singlegruppe.ejs", { mitglieder });
});



app.get("/bewerbe/:id", async (req, res) => {
    const bew_id = req.params.id;
    const bewerb = await getBewerb(bew_id);
    if (!bewerb) {
        res.status(404).send("Bewerb not found");
        return;
    }
    const formattedBewerb = {
        bew_datum_formatted: formatDate(bewerb.bew_datum),
        bew_art: bewerb.bew_art,
        bew_wetter: bewerb.bew_wetter,
        bew_name: bewerb.bew_name
    };
    const gruppen = await getGruppenByBewerbId(bew_id);
    const durchlaufe = await getdruchlaufe(bew_id);
    if (!durchlaufe) {
        alert("Noch keine Durchläufe vorhanden")
        res.redirect("/bewerbe")
    }
    res.render("singleBewerb.ejs", {
        formattedBewerb,
        gruppen,
        durchlaufe
    });
})

//creating a new bewerb
app.post("/bewerbe", async (req, res) => {
    const { bew_name, bew_art, bew_wetter,bew_datum } = req.body;
    const bewerb = await createBewerb(bew_name, bew_art, bew_wetter, bew_datum);
    res.status(201).send({ message: "Bewerb created successfully" });

})
app.post("/bewerbe/gruppen", async (req, res) => {
    const { gru_feuerwehr, gru_name, gru_alterspunkte } = req.body;
    console.log(req.body);
    const gruppen = await createGruppen(gru_name, gru_feuerwehr, gru_alterspunkte);
    res.status(201).send({ message: "Gruppen created successfully" });
});


app.get('/', (req, res, next) => {
    res.redirect('/bewerbe');
});

app.use(express.static('public'));

const HOSTNAME='pi-thomas.local'
app.listen(80,HOSTNAME, () => {
    console.log('Server started on http://localhost:80');
})