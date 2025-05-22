# Full Stack, osa 8: GraphQL

Kurssin Full Stack Open osan 8 tehtävien palautusrepositorio. Tämän osan aiheena on GraphQL.

Frontissa on edelleen käytössä react-scripts, koska fronttiin liittyvät tehtävät on tehty ennen vite-päivitystä kurssimateriaaleissa.

## MongoDB ongelmat

MongoDB Atlas ei suostunut käynnistämään uudestaan osassa 3 luotua tietokantaklusteria, vaan jäi jumiin "Your Cluster is being created" vaiheeseen useaksi tunniksi. Klusterin terminointi puolestaan on edelleen jumissa "Your cluster is shutting down" vaiheessa, eikä uutta ilmaista klusteria pysty luomaan.

Tämän vuoksi MongoDB tietokantaa on pyöritetty dockerilla kurssin osan 12 ohjeiden mukaan. Kontin voi käynnistää komennolla `docker compose -f docker-compose.dev.yml up`. Tietokantaan luodaan käyttäjä mongo-init.js skriptillä.

Lisää seuraavat .env tiedostoon ennen tietokannan ja sovelluksen käynnistämistä (HUOM. jos yhdistetään MongoDB Atlaksen clusteriin niin varmista että MONGODB_URL on sitä mitä pitääkin, alla oleva on docker konttia varten):

```
MONGODB_URL=mongodb://username:password@localhost:3456/database npm run dev
MONGODB_DATABASE=database
MONGODB_USER=username
MONGODB_PASSWORD=password
JWT_SECRET=jwtsecret
PORT=4000
```

## Sovelluksen käynnistäminen

Bakcend: `npm run start`
Frontend: `npm run start`
