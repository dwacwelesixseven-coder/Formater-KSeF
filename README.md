# Formater raportów KSeF

Wersja startowa pochodzi z pliku `index.html` przekazanego przez właściciela 11 listopada 2026. Kod aplikacji znajduje się w **public/index.html**. Plik został skopiowany bez zmian; składnia jego wbudowanego JavaScript została sprawdzona. Aktualności względem działającej aplikacji na Cloudflare jeszcze nie potwierdzono.

## Publikowanie

Aplikacja jest statyczną stroną HTML. Nie wymaga kompilacji.

- Katalog plików do publikacji: **public**.
- Polecenie budowania: pozostawione puste.
- Plik startowy: **public/index.html**.

Automatyczne publikowanie do istniejącej aplikacji Cloudflare wymaga potwierdzenia adresu i konfiguracji projektu. Wysłanie zmian do tego repozytorium samo w sobie nie aktualizuje jeszcze działającej aplikacji.

## Działanie

Aplikacja wczytuje raporty KSeF i przetwarza je w przeglądarce. Korzysta z bibliotek JSZip 3.10.1 i SheetJS 0.18.5 pobieranych z CDN oraz z Google Fonts. Nie umieszczaj w repozytorium rzeczywistych faktur, raportów klientów ani danych dostępowych Cloudflare.

## Dalsze zmiany

Edytuj **public/index.html**. Przed publikacją sprawdź wczytywanie plików, wynik formatowania i pobieranie raportu na przykładowych danych. Szczegóły automatycznej publikacji zostaną dodane po połączeniu właściwego projektu Cloudflare.
