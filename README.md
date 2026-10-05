# FeelWell web

Živá stránka: https://crow-archduke.github.io/feelwell-web/

## Jak upravit texty a obrázky (bez programování)

1. Otevřete **https://app.pagescms.org** a přihlaste se účtem GitHub.
2. Vyberte repozitář **feelwell-web**.
3. V levém menu zvolte část webu (Úvodní stránka, O nás, Vize, Tým, Projekt Daimoon, …), upravte text nebo nahrajte obrázek a klikněte na **Save**.
4. Za 1–2 minuty se změna objeví na živém webu. Obrázky se automaticky zmenší, můžete nahrát i fotku z telefonu.

Tipy: nový řádek v nadpisu = zalomení řádku. Tučné písmo v odstavci: `**slovo**`. Povinný text o spolufinancování z EU je záměrně pevně daný a v editoru se nemění.

## Přidání nového editora

Majitel repozitáře: GitHub → feelwell-web → Settings → Collaborators → Add people (role *Write*). Nový editor musí mít (bezplatný) účet GitHub.

## Pro vývojáře

- `content/*.json` – veškerý obsah, `template.html` – šablona stránky, `.pages.yml` – nastavení editoru
- `npm ci && npm run build` vytvoří složku `dist/`; GitHub Actions ji po každém pushi nasadí na GitHub Pages.
