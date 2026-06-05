# Peggy's Fisk — Modern hemsida

Instruktioner:

1. Placera dina bilder i en mapp `Gallery_img` inne i `peggys-website`
2. Kör följande för att generera `gallery.html`:

```bash
python3 peggys-website/build_gallery.py --src Gallery_img --out peggys-website
```

3. Alternativt kan du köra i övervakningsläge för att bygga om galleriet automatiskt när bilder ändras:

```bash
python3 peggys-website/build_gallery.py --src Gallery_img --out peggys-website --watch
```

Använd `--interval 5` för längre paus mellan kontroller om du vill.

3. Öppna en lokal server för att se sidan (rekommenderas):

```bash
cd peggys-website
python3 -m http.server 8000
# sedan öppna http://localhost:8000
```

Uppdatera `menu.md`, `about.md` och `contact.md` för att ändra innehållet. Kör `build_gallery.py` igen efter att ha lagt till eller tagit bort bilder.
