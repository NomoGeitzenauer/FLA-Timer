//using express
import express from 'express'
const app = express()
//using body-parser
import bodyParser from 'body-parser';
//using database
import { getBewerbe, getBewerb, createBewerb, deleteBewerb, getMitglieder, getGruppenByBewerbId, getGruppeByDurchlauf, getFehler, createFehlerEintrag,getdurchlaufFehler,getdurchlaufFehlerListe } from './database.mjs'
import { formatDate,deleteFehlerEintrag } from './database.mjs'
import { getGruppen, createGruppen,deleteGruppe, getdruchlaufe, createDurchlauf,deleteDurchlauf, completeDurchlauf,createMitglied,deleteMitglied, getAlterspunkte, updateAlterspunkte} from './database.mjs'
import moment from 'moment';
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
    res.render("singlegruppe.ejs", { mitglieder,gru_id });
});

app.post("/bewerbe/gruppen/:id", async (req, res) => {
    const gru_id = req.params.id;
    const { name, nachname, geschlecht, alter, funktion, dienstgrad } = req.body;
    console.log(req.body);
    const mitglied = await createMitglied(name, nachname, geschlecht, alter, funktion, dienstgrad, gru_id);
    res.status(201).send({ message: "Mitglied created successfully" });
});

app.post(`/bewerbe/gruppen/:id/mitglieder/delete/:id2`, async (req, res) => {
    const mit_id = req.params.id2;
    const gru_id = req.params.id;
    await deleteMitglied(mit_id,gru_id);
    res.status(201).send({ message: "Mitglied deleted successfully" });
}
);

//all durchlaufe of a bewerb
app.get("/bewerbe/:id/durchlaufe", async (req, res) => {
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
    const gruppen = await getGruppen();
    const durchlaufgruppen = await getGruppenByBewerbId(bew_id);
    const durchlaufe = await getdruchlaufe(bew_id);
    if (!durchlaufe) {
        alert("Noch keine Durchläufe vorhanden")
        res.redirect("/bewerbe")
    }
    res.render("singleBewerb.ejs", {
        formattedBewerb,
        gruppen,
        durchlaufe,
        durchlaufgruppen,
        bew_id
    });
})

//single Durchlauf
app.get("/bewerbe/:id/durchlaufe/:id2", async (req, res) => {
    const bew_id = req.params.id;
    const dur_id = req.params.id2;
    const bewerb = await getBewerb(bew_id);
    const durchlaufgruppe = await getGruppeByDurchlauf(dur_id);
    const fehler = await getFehler();
    const mitglieder = await getMitglieder(durchlaufgruppe.id_gru);
    const durchlauffehler = await getdurchlaufFehler(dur_id);
    const durchlauffehlerliste= await getdurchlaufFehlerListe(dur_id);
    
    const { id, id2 } = req.params;

    //console.log(durchlauffehler);
    if (!bewerb) {
        res.status(404).send("Bewerb not found");
        return;
    }
    const durchlauf = await getdruchlaufe(bew_id);
    if (!durchlauf) {
        res.status(404).send("Durchlauf not found");
        return;
    }
    await updateAlterspunkte(durchlaufgruppe.id_gru,dur_id)
    const alterspunkte = await getAlterspunkte(dur_id);
    
    res.render("singleDurchlauf.ejs", { durchlauf, durchlaufgruppe, bew_id, fehler: fehler, mitglieder, dur_id, durchlauffehler,durchlauffehlerliste,alterspunkte});
}
)

app.post("/bewerbe/time", async (req, res) => {
    const { bew_id, dur_id, time } = req.body;
    console.log(time);
    res.status(201).send({ message: "Time created successfully" });
}
);

app.post("/bewerbe/:id/durchlaufe/erstellt", async (req, res) => {
    const { gruppenname, bewerbsbahn } = req.body;
    const bew_id = req.params.id;
    const dur_gruppe = gruppenname; // Assuming gruppenname is the correct field name
    const durchlauf = await createDurchlauf(bew_id, dur_gruppe, bewerbsbahn);
    res.status(201).send({ message: "Durchlauf created successfully" });
});

app.post("/bewerbe/:id/gruppen/erstellt", async (req, res) => {
    const { gru_name, gru_feuerwehr} = req.body;
    const gruppen = await createGruppen(gru_name, gru_feuerwehr);
    res.status(201).send({ message: "Gruppen created successfully" });
});

//deleting durchlauf

app.post(`/bewerbe/:id/durchlaufe/:id2/delete`, async (req, res) => {
    const dur_id = req.params.id2;
    await deleteDurchlauf(dur_id);
    res.status(201).send({ message: "Durchlauf deleted successfully" });
}
);


app.post(`/bewerbe/:id/gruppen/:id2/delete`, async (req, res) => {	
    const gru_id = req.params.id2;	
    const {gruppeId}=req.body;
    const gruppe= gruppeId;
    await deleteGruppe(gruppe);	
    res.status(201).send({ message: "Gruppe deleted successfully" });	
}
);

app.post("/bewerbe/:id/durchlaufe/:id2/completeDurchlauf", async (req, res) => {
    const dur_id = req.params.id2;
    const { dur_fehlergesamt, dur_punkte } = req.body;
    const fehlerges = dur_fehlergesamt;
    console.log(fehlerges)
    const punkte = dur_punkte;
    await completeDurchlauf(dur_id,fehlerges,punkte);
    res.status(201).send({ message: "Durchlauf completed successfully" });
}
);

app.post("/bewerbe/:id/durchlaufe/:id2/fehlerEintrag", async (req, res) => {
    const { fehlerId, mitgliedId } = req.body; // Make sure to use the correct property names
    console.log(req.body);
    const durchlauf = req.params.id2;
    await createFehlerEintrag(fehlerId, mitgliedId, durchlauf); // Add await here
    res.status(201).send({ message: "Fehler created successfully" });
});

//deleting a fehler
app.post("/bewerbe/:id/durchlaufe/:id2/deletefehlerEintrag/:id3", async (req, res) => {
    console.log(req.body);
    const fehlerID = req.params.id3;
    await deleteFehlerEintrag(fehlerID); // Corrected fehlerID
    res.status(201).send({ message: "Fehler deleted successfully" });
});

//creating a new bewerb
app.post("/bewerbe", async (req, res) => {
    const { bew_name, bew_art, bew_wetter, bew_datum,bew_threshholdalterspunkte,bew_valuealterspunkte } = req.body;
    const datetimeValue = bew_datum;
    const formattedDatetime = moment(datetimeValue).format('YYYY-MM-DD HH:mm');
    console.log(formattedDatetime);
    const bewerb = await createBewerb(bew_name, bew_art, bew_wetter, formattedDatetime, bew_threshholdalterspunkte, bew_valuealterspunkte);
    res.status(201).send({ message: "Bewerb created successfully" });

})

//deleting a bewerb
app.post("/deleteBewerb/:id", async (req, res) => {
    const bew_id = req.params.id;
    await deleteBewerb(bew_id);
    console.log("Bewerb wirklich gelöscht");
    res.status(200).send({ message: "Bewerb deleted successfully" });
})

//creating a new gruppe
app.post("/bewerbe/gruppen", async (req, res) => {
    const { gru_feuerwehr, gru_name} = req.body;
    console.log(req.body);
    const gruppen = await createGruppen(gru_name, gru_feuerwehr);
    res.status(201).send({ message: "Gruppen created successfully" });
});


app.get('/', (req, res, next) => {
    res.redirect('/bewerbe');
});

app.use(express.static('public'));


const HOSTNAME = 'pi-thomas.local'
app.listen(80, HOSTNAME, () => {
    console.log('Server started on http://localhost:80');
})

