Det holdes fortsatt på å sette opp prosjektet slik at vi alle sammen kan
jobbe parallelt. Her er det som fortsatt skal gjøres.

lage databasen i supabase
generere typescript types fra supabase som vi legger i `types/` mappa
skrive om alle funksjonssignaturer i `services` og i `store` slik at de stemmer
implementere grunnleggende auth
lage en enkel jest og maestro test for å sjekke at det faktisk funker
implementer funkasjonlaitet for trip i service store og page. så har alle et
eksempel på hvordan det skal se ut. hvordan det henger sammen, og jeg tror også
mange trenger trips for å gjøre det de skal gjøre.


Jeg har slått av confirm email mens vi tester. vi burde slå på dette når vi får
login og sånn til å funke

kanskje vi kan lage noen claude/ ai jobber til å lese over all kildekoden vår
for å se etter mangler på konsekventhet. for eksempel at noen kaller det
"updateTask" mens andre kaller det "editEvent"
