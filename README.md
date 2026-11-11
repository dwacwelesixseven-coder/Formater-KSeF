# Formater raportów KSeF

Wersja startowa pochodzi z pliku `index.html` przekazanego przez właściciela 11 listopada 2026. Kod aplikacji znajduje się w **public/index.html**. Plik został skopiowany bez zmian; składnia jego wbudowanego JavaScript została sprawdzona. Porównanie z https://formater-ksef.pages.dev tego dnia potwierdziło identyczną zawartość HTML.

## Publikowanie

Aplikacja jest statyczną stroną HTML. Nie wymaga kompilacji.

- Katalog plików do publikacji: **public**.
- Polecenie budowania: pozostawione puste.
- Plik startowy: **public/index.html**.

Automatyczne publikowanie jest przygotowane w **.github/workflows/deploy-cloudflare.yml**. Docelowy projekt to istniejący **formater-ksef**, pod adresem https://formater-ksef.pages.dev. Przed publikacją workflow odczytuje ustawienia projektu z Cloudflare, sprawdza adres i używa jego obecnej gałęzi produkcyjnej. Nie zakłada, że ta gałąź nazywa się main.

## Jednorazowe połączenie Cloudflare z GitHubem

1. W Cloudflare utwórz token API z uprawnieniem **Account → Cloudflare Pages → Edit**, ograniczony do konta zawierającego projekt formater-ksef. Strona: https://dash.cloudflare.com/profile/api-tokens.
2. Skopiuj **Account ID** tego konta z panelu Cloudflare.
3. W GitHub otwórz **Settings → Secrets and variables → Actions → New repository secret** w tym repozytorium. Dodaj dwa sekrety:
   - **CLOUDFLARE_API_TOKEN** — utworzony token.
   - **CLOUDFLARE_ACCOUNT_ID** — identyfikator konta Cloudflare.
4. Otwórz **Actions → Publish Formater KSeF → Run workflow**, wybierz main i uruchom. Dodanie sekretów samo nie uruchamia publikacji.

Nie wklejaj tokenu do pliku ani do rozmowy. W GitHub wpisuje się go w polu wartości sekretu. Jeżeli nie dodano jeszcze obu sekretów, workflow sprawdzi kod i poinformuje w podsumowaniu, że publikacja nie została wykonana.

Po połączeniu każda zmiana **public/** wysłana do gałęzi **main** uruchomi sprawdzenie składni i publikację. W razie błędu sprawdzania kodu lub połączenia z Cloudflare publikacja nie jest wykonywana. README i pliki robocze nie trafiają na stronę; publikowany jest tylko katalog public. Ten sposób działa również dla projektu utworzonego wcześniej przez ręczne przesyłanie plików, bez przenoszenia istniejącego adresu.

Publikacje korzystają z grupy `formater-ksef-production-v2`; nowa próba zastępuje poprzednią próbę w tej grupie. Pierwotna grupa `cloudflare-pages-production` została zmieniona po zablokowaniu uruchomienia bez utworzenia zadań i błędzie anulowania po stronie GitHuba. Projekt i adres Cloudflare pozostają te same.

## Działanie

Aplikacja wczytuje raporty KSeF i przetwarza je w przeglądarce. Korzysta z bibliotek JSZip 3.10.1 i SheetJS 0.18.5 pobieranych z CDN oraz z Google Fonts. Nie umieszczaj w repozytorium rzeczywistych faktur, raportów klientów ani danych dostępowych Cloudflare.

## Dalsze zmiany

Opcja **Wiersze „Razem” pod tabelą** tworzy osobny wiersz dla każdej waluty, np. „Razem EUR” i „Razem PLN”. Formuły SUMIF i zapisane wyniki uwzględniają tylko faktury w danej walucie. Arkusz **Podsumowanie** zawiera osobne wiersze zakupu i sprzedaży dla każdej waluty, z liczbą faktur oraz kwotami netto, VAT i brutto. Brak waluty stanowi osobną grupę; nie zakłada się PLN. Kody walut są normalizowane do wielkich liter. Kwoty różnych walut nie są łączone ani przeliczane.

Sprawdzenie sum, formuł i podsumowania: `node scripts/test-currency-totals.mjs`.

Przycisk **Pobierz wszystkie dokumenty** zapisuje raporty kolejno do wskazanych folderów klientów albo, bez połączenia z folderem, do jednego archiwum ZIP. Przy każdym raporcie pojawia się stan zapisywania, zielony ptaszek po zakończonym zapisie lub czerwony krzyżyk z przyczyną błędu. Nieudana próba nie zatrzymuje pozostałych raportów. Brak wybranego folderu również jest oznaczany jako nieudana próba. W trakcie zapisu zmiana listy i ponowne uruchomienie pobierania są zablokowane.

W przeglądarkach obsługujących wybór pliku wynik potwierdzany jest dopiero po zamknięciu zapisu. Przy zwykłym pobieraniu przez przeglądarkę strona nie może potwierdzić końca pobierania: zamiast zielonego ptaszka pokazuje neutralny komunikat „Przekazano przeglądarce”. ZIP-y z fakturami nadal służą do sprawdzania kompletności raportów; przycisk zapisuje wygenerowane raporty XLSX.

Sprawdzenie zapisu i obsługi błędów: `node scripts/test-downloads.mjs`. Test obejmuje wyniki mieszane, błąd zapisu/zamknięcia pliku, anulowanie, jeden ZIP dla wielu raportów i ochronę przed ponownym kliknięciem.

Edytuj **public/index.html**. Przed publikacją sprawdź wczytywanie plików, wynik formatowania i pobieranie raportu na przykładowych danych. Workflow kontroluje składnię, ale nie zastępuje sprawdzenia poprawności raportów.
