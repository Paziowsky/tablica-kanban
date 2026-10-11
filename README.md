# Tablica Zadań Zespołu (Team Task Board / Kanban)

Projekt zaliczeniowy z przedmiotu: **Frameworki programowania**  
Kierunek: Informatyka, studia I stopnia inżynierskie, semestr VII  

---

### 1. Tytuł i opis projektu
**Tytuł:** Tablica zadań zespołu (Team Kanban Board)  
**Opis:**  
Aplikacja jest przeznaczona dla małych zespołów projektowych i developerskich potrzebujących przejrzystego narzędzia do organizacji codziennej pracy. Rozwiązuje problem chaosu informacyjnego oraz braku transparentności w realizacji zadań wewnątrz zespołu. Umożliwia użytkownikom tworzenie zadań, przypisywanie osób odpowiedzialnych, definiowanie terminów wykonania oraz monitorowanie postępu prac w oparciu o kolumny statusów (np. *Do zrobienia*, *W toku*, *Zakończone*). Dzięki intuicyjnemu interfejsowi członkowie zespołu mogą łatwo edytować parametry zgłoszeń, aktualizować ich stan oraz filtrować zadania według priorytetów i wykonawców.

### 2. Rodzaj aplikacji
* **Aplikacja webowa** (responsywna, dostosowana do urządzeń desktopowych oraz mobilnych).

### 3. Główny zasób (operacje CRUD)
Głównym zasobem aplikacji jest **Zadanie** (`Task`), reprezentowane przez następujące pola:
* `id` – unikalny identyfikator zadania,
* `title` – tytuł / krótka nazwa zadania (np. min. 3 znaki),
* `description` – szczegółowy opis zadania,
* `status` – status zadania (`TODO` / `IN_PROGRESS` / `DONE`),
* `priority` – priorytet (`LOW` / `MEDIUM` / `HIGH`),
* `assignee` – osoba przypisana (imię/nazwisko lub email wykonawcy),
* `dueDate` – planowany termin realizacji,
* `createdAt` – data utworzenia zadania.

### 4. Wybrane frameworki i uzasadnienie wyboru

| Kategoria | Wybrany framework | Uzasadnienie wyboru |
| :--- | :--- | :--- |
| **A – Framework aplikacji** | **Next.js** (App Router) | Umożliwia budowę pełnej aplikacji webowej w jednym spójnym projekcie (Fullstack), łącząc renderowanie interfejsu (React) z dedykowanymi handlerami API REST (`Route Handlers`) i obsługą bazy SQLite. |
| **B – Framework UI** | **Bootstrap 5** | Zapewnia gotowy, sprawdzony system siatki (Grid) oraz bogaty zestaw responsywnych komponentów (karty Kanban, modale, formularze, badge'e statusów), co pozwala na szybką budowę spójnego i czytelnego UI. |
| **C – Framework testowy** | **Playwright** | Pozwala na nowoczesne, niezawodne testowanie scenariuszy End-to-End (E2E) w rzeczywistych przeglądarkach, idealnie sprawdzając się przy testach formularzy, przepływu zmiany statusów zadań i scenariuszy negatywnych. |

### 5. Link do repozytorium
* **URL:** `https://github.com/paziowsky/tablica-kanban`

---

## 2. Planowana architektura i środowisko

* **Runtime:** Node.js (wersja `>= 18.x` / `20.x LTS`)
* **Warstwa danych:** Baza danych SQLite (z użyciem `better-sqlite3`)
* **Architektura API:** RESTful API obsługujące metody `GET`, `POST`, `PUT`/`PATCH`, `DELETE` wraz z kodami `200`, `201`, `204`, `400`, `404`

---
