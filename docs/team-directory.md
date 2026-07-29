# Team-Directory-Sync

YBase ist die Quelle für die öffentliche Organisationsstruktur. Der
read-only Endpoint `GET /api/v1/team-directory` veröffentlicht die Daten der
Organisation aus `YFN_TEAM_DIRECTORY_ORGANIZATION_ID`.

## Sichtbarkeit

Der Feed enthält ausschließlich aktive Mitglieder. Für die operative
Teamstruktur werden außerdem ein aktives Department, ein aktives Team und ein
Name vorausgesetzt. Die interne Position ist optional und wird nicht im
Organigramm veröffentlicht. Eine optionale `boardMembership` ordnet ein
Vorstandsmitglied direkt einem aktiven Department zu. Vorstandsmitglieder sind
keinem Team innerhalb dieses Departments zugeordnet. Die optionale
`secondaryRole` innerhalb der Vorstandszuordnung wird als Nebenrolle
veröffentlicht.

Ein optionales `secondaryTeamId` veröffentlicht dieselbe Person zusätzlich als
Mitglied eines zweiten Teams. `isTeamLead` markiert die Person im Hauptteam aus
`teamId` als Lead, `isSecondaryTeamLead` unabhängig davon im weiteren Team aus
`secondaryTeamId`. Für bestehende Consumer enthält `role` bei diesen
Mitgliedschaften zusätzlich `"Lead"` und ist für alle anderen Mitgliedschaften
leer.

Teams mit `isChapter: true` werden als Chapter veröffentlicht. Chapter führen
weder Lead- noch allgemeine Positionen und stehen innerhalb ihres Departments
nach den übrigen Teams.

Interne Berechtigungsrollen wie `admin`, `finance` oder `people_culture` werden
nicht veröffentlicht.

## Darstellung im Organigramm

Der Consumer stellt die Ebenen in dieser Reihenfolge dar:

1. Vorstand
2. Departments
3. Teams
4. Teammitglieder

Vorstandsmitglieder stehen auf Department-Ebene oberhalb der Teams. Innerhalb
des Vorstands wird die optionale Position zusätzlich dargestellt. Innerhalb
eines Teams stehen Leads vor den übrigen Mitgliedern und erhalten eine
Lead-Hervorhebung. Weitere Positionen von Teammitgliedern werden nicht
dargestellt.

## Vertrag

```json
{
  "version": "v1",
  "generatedAt": "2026-07-28T12:00:00.000Z",
  "revision": "sha256",
  "data": {
    "board": [
      {
        "id": "ybase:org:member:user",
        "departmentId": "ybase:org:department:department",
        "name": "Ada Beispiel",
        "role": "Operations",
        "isChair": true,
        "secondaryRole": "Finanzen"
      }
    ],
    "departments": [
      {
        "id": "ybase:org:department:department",
        "name": "Programs",
        "teams": [
          {
            "id": "ybase:org:team:team",
            "name": "Startup in School",
            "isChapter": false,
            "members": [
              {
                "id": "ybase:org:member:user",
                "name": "Ada Beispiel",
                "role": "Lead",
                "isLead": true
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Die `revision` ist ein Hash über `data` und wird als ETag ausgeliefert. Der
YBase-Endpoint darf 60 Sekunden gecacht und bis zu 300 Sekunden veraltet
weiterverwendet werden. Der Landingpage-Consumer lädt den Feed serverseitig und
revalidiert ihn derzeit alle fünf Minuten.
