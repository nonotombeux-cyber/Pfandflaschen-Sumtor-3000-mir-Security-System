// ==========================================
// SUPABASE VERBINDUNG
// ==========================================

const SUPABASE_URL =
    "https://xqebvayiqkwavszbyjpz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_UEPx_zsXdv5O8YrevoUtog_npSkk3YK";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// EINSTELLUNGEN
// ==========================================

const PFAND_PRO_FLASCHE = 0.25;

let flaschen = 0;

let alarmAn = true;


// ==========================================
// BESTAND AUS DATENBANK LADEN
// ==========================================

async function bestandLaden() {

    const { data, error } =
        await supabaseClient
            .from("bestand")
            .select("flaschen")
            .eq("id", 1)
            .single();


    if (error) {

        console.error(error);

        zeigeMeldung(
            "Datenbank konnte nicht geladen werden."
        );

        return;
    }


    flaschen = data.flaschen;

    anzeigeAktualisieren();
}


// ==========================================
// ANZEIGE AKTUALISIEREN
// ==========================================

function anzeigeAktualisieren() {

    document.getElementById(
        "flaschenAnzahl"
    ).textContent = flaschen;


    const wert =
        flaschen * PFAND_PRO_FLASCHE;


    document.getElementById(
        "pfandWert"
    ).textContent =
        wert.toFixed(2).replace(".", ",") + " €";


    let prozent =
        flaschen * 5;


    if (prozent > 100) {
        prozent = 100;
    }


    document.getElementById(
        "fortschrittBalken"
    ).style.width =
        prozent + "%";
}


// ==========================================
// BESTAND ÄNDERN
// ==========================================

async function bestandAendern(neuerBestand) {

    if (neuerBestand < 0) {
        return false;
    }


    const { error } =
        await supabaseClient
            .from("bestand")
            .update({
                flaschen: neuerBestand
            })
            .eq("id", 1);


    if (error) {

        console.error(error);

        alert(
            "Der Bestand konnte nicht gespeichert werden."
        );

        return false;
    }


    flaschen = neuerBestand;

    anzeigeAktualisieren();

    return true;
}


// ==========================================
// FLASCHE HINZUFÜGEN
// ==========================================

async function flascheHinzufuegen() {

    const neuerBestand =
        flaschen + 1;


    const erfolgreich =
        await bestandAendern(neuerBestand);


    if (!erfolgreich) {
        return;
    }


    await verlaufSpeichern(
        "hinzugefügt",
        "Bestand",
        1
    );


    zeigeMeldung(
        "1 Flasche hinzugefügt."
    );
}


// ==========================================
// FLASCHE ENTFERNEN
// ==========================================

async function flascheEntfernen() {

    if (flaschen <= 0) {

        zeigeMeldung(
            "Keine Flaschen vorhanden."
        );

        return;
    }


    const neuerBestand =
        flaschen - 1;


    const erfolgreich =
        await bestandAendern(neuerBestand);


    if (!erfolgreich) {
        return;
    }


    await verlaufSpeichern(
        "entnommen",
        "Bestand",
        1
    );


    zeigeMeldung(
        "1 Flasche entfernt."
    );
}


// ==========================================
// ENTNAHME
// ==========================================

async function entnahmeSpeichern() {

    const nameInput =
        document.getElementById("name");

    const anzahlInput =
        document.getElementById("anzahl");


    const name =
        nameInput.value.trim();


    const anzahl =
        Number(anzahlInput.value);


    if (name === "") {

        alert(
            "Bitte einen Namen eingeben."
        );

        nameInput.focus();

        return;
    }


    if (
        !Number.isInteger(anzahl) ||
        anzahl < 1
    ) {

        alert(
            "Bitte eine gültige Anzahl eingeben."
        );

        anzahlInput.focus();

        return;
    }


    if (anzahl > flaschen) {

        alert(
            "Es sind nur " +
            flaschen +
            " Flaschen vorhanden."
        );

        return;
    }


    const neuerBestand =
        flaschen - anzahl;


    const erfolgreich =
        await bestandAendern(
            neuerBestand
        );


    if (!erfolgreich) {
        return;
    }


    await verlaufSpeichern(
        "entnommen",
        name,
        anzahl
    );


    nameInput.value = "";
    anzahlInput.value = "";


    zeigeMeldung(
        anzahl +
        " Flasche" +
        (anzahl === 1 ? "" : "n") +
        " entnommen."
    );


    verlaufLaden();
}


// ==========================================
// VERLAUF SPEICHERN
// ==========================================

async function verlaufSpeichern(
    typ,
    name,
    anzahl
) {

    const { error } =
        await supabaseClient
            .from("verlauf")
            .insert({
                typ: typ,
                name: name,
                anzahl: anzahl
            });


    if (error) {

        console.error(
            "Verlauf Fehler:",
            error
        );
    }


    verlaufLaden();
}


// ==========================================
// VERLAUF LADEN
// ==========================================

async function verlaufLaden() {

    const { data, error } =
        await supabaseClient
            .from("verlauf")
            .select("*")
            .order(
                "zeit",
                {
                    ascending: false
                }
            )
            .limit(20);


    const verlauf =
        document.getElementById(
            "verlauf"
        );


    if (error) {

        console.error(error);

        verlauf.innerHTML = `
            <div class="leer">
                Verlauf konnte nicht geladen werden.
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        verlauf.innerHTML = `
            <div class="leer">
                Noch keine Änderungen vorhanden.
            </div>
        `;

        return;
    }


    verlauf.innerHTML = "";


    data.forEach(
        function(eintrag) {

            const zeile =
                document.createElement(
                    "div"
                );


            zeile.className =
                "entnahme";


            const datum =
                new Date(
                    eintrag.zeit
                );


            const uhrzeit =
                datum.toLocaleTimeString(
                    "de-DE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            const istHinzugefuegt =
                eintrag.typ === "hinzugefügt";


            const zeichen =
                istHinzugefuegt
                    ? "+"
                    : "-";


            const klasse =
                istHinzugefuegt
                    ? "hinzu"
                    : "entnommen";


            zeile.innerHTML = `
                <div>
                    <div class="entnahme-name">
                        ${sichererText(eintrag.name)}
                    </div>

                    <div class="entnahme-details">
                        ${uhrzeit} Uhr
                    </div>
                </div>

                <div class="entnahme-anzahl ${klasse}">
                    ${zeichen}${eintrag.anzahl} Flasche${eintrag.anzahl === 1 ? "" : "n"}
                </div>
            `;


            verlauf.appendChild(
                zeile
            );
        }
    );
}


// ==========================================
// SICHERER TEXT
// ==========================================

function sichererText(text) {

    const element =
        document.createElement("div");

    element.textContent =
        text || "";


    return element.innerHTML;
}


// ==========================================
// MELDUNG
// ==========================================

function zeigeMeldung(text) {

    const meldung =
        document.getElementById(
            "bestandMeldung"
        );


    meldung.textContent =
        text;


    setTimeout(
        function() {

            meldung.textContent = "";

        },
        2500
    );
}


// ==========================================
// ALARM
// ==========================================

function alarmUmschalten() {

    alarmAn =
        !alarmAn;


    const status =
        document.getElementById(
            "alarmStatus"
        );


    const statusText =
        document.getElementById(
            "statusText"
        );


    const alarmText =
        document.getElementById(
            "alarmText"
        );


    const alarmBeschreibung =
        document.getElementById(
            "alarmBeschreibung"
        );


    const alarmButton =
        document.getElementById(
            "alarmButton"
        );


    if (alarmAn) {

        status.classList.remove(
            "status-aus"
        );

        status.classList.add(
            "status-an"
        );


        statusText.textContent =
            "AKTIV";


        alarmText.textContent =
            "Überwachung aktiv";


        alarmBeschreibung.textContent =
            "Das System überwacht den Pfandbestand.";


        alarmButton.classList.add(
            "an"
        );

    } else {

        status.classList.remove(
            "status-an"
        );

        status.classList.add(
            "status-aus"
        );


        statusText.textContent =
            "AUS";


        alarmText.textContent =
            "Überwachung deaktiviert";


        alarmBeschreibung.textContent =
            "Das Alarmsystem ist momentan ausgeschaltet.";


        alarmButton.classList.remove(
            "an"
        );
    }
}


// ==========================================
// START
// ==========================================

async function starten() {

    await bestandLaden();

    await verlaufLaden();
}


starten();