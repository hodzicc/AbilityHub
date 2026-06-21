# AbilityHub

Centralizovana platforma za integraciju web i mobilnih aplikacija za osobe sa Down sindromom.

## Struktura

```txt
AbilityHub/
  FE/          Next.js web aplikacija (roditelj / admin)
  BE/          .NET 9 mikroservisi iza API gatewaya
  MobileApp/   Flutter referentna mobilna aplikacija (korisnik / dijete)
```

Mobilna aplikacija (QR/lozinka prijava, sinhronizacija preferencija, prijava
aktivnosti s metrikama) ima vlastiti vodič za pokretanje u `MobileApp/README.md`.

## Frontend

```bash
cd FE
npm install
npm run dev
```

Lokalni frontend se pokreće na `http://localhost:3000`.

Demo korisnici:

```txt
roditelj@example.com
admin@example.com
```

Lozinka može biti bilo koji tekst u trenutnom mock auth modu.
