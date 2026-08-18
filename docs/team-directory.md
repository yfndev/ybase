# Team-Directory-Sync

YBase ist die Quelle für die öffentliche Organisationsstruktur. Der
read-only Endpoint `GET /api/v1/team-directory` veröffentlicht die Daten der
Organisation aus `YFN_TEAM_DIRECTORY_ORGANIZATION_ID`.

## Sichtbarkeit

Der Feed enthält ausschließlich aktive Mitglieder. Für die operative
Teamstruktur werden außerdem ein aktives Department, ein aktives Team und ein
Name vorausgesetzt. Die interne Position ist optional und wird nicht im
Organigramm veröffentlicht. Eine optionale `boardMembership` ordnet ein
Vorstandsmitglied direkt einem aktiven Department zu. Über `secondaryTeamId`
kann ein Vorstandsmitglied zusätzlich einem Team zugeordnet und dort mit
`isSecondaryTeamLead` als Lead gekennzeichnet werden.

Für Team- und Vorstandsmitglieder wird `imageUrl` veröffentlicht, sobald ein
Profilbild vorhanden und das öffentliche Profil vollständig ausgefüllt ist.

Ein optionales `secondaryTeamId` veröffentlicht dieselbe Person zusätzlich als
Mitglied eines Teams. Für reguläre Mitglieder ist dies neben `teamId` das zweite
Team; für Vorstandsmitglieder ist es die einzige direkte Teamzuordnung.
`isTeamLead` markiert reguläre Mitglieder im Hauptteam als Lead,
`isSecondaryTeamLead` unabhängig davon im weiteren Team. Für bestehende
Consumer enthält `role` bei diesen Mitgliedschaften zusätzlich `"Lead"` und ist
für alle anderen Mitgliedschaften leer.

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

Vorstandsmitglieder stehen auf Department-Ebene oberhalb der Teams. Mit einer
zusätzlichen Teamzuordnung erscheinen sie außerdem im entsprechenden Team.
Innerhalb eines Teams stehen Leads vor den übrigen Mitgliedern und erhalten
eine Lead-Hervorhebung. Weitere Positionen von Teammitgliedern werden nicht
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
        "imageUrl": "https://ybase.example/api/v1/team-directory/images/user"
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
