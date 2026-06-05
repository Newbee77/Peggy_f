#!/usr/bin/env python3
"""
Genererar `gallery.html` genom att läsa alla bilder i en mapp.
Använd: python3 build_gallery.py --src Gallery_img --out .
"""
import os
import argparse
import shutil
import time
from pathlib import Path

def make_gallery(src_dir:Path, out_file:Path):
    if not src_dir.exists():
        print(f"Källa saknas: {src_dir}")
        return
    imgs = [p for p in sorted(src_dir.iterdir()) if p.suffix.lower() in ['.jpg','.jpeg','.png','.webp','.gif']]
    rel = os.path.relpath(src_dir, out_file.parent)
    parts = ['<div class="gallery-grid">']
    for p in imgs:
        src = f"{rel}/{p.name}"
        parts.append(f'<figure><img src="{src}" alt="{p.stem}"></figure>')
    parts.append('</div>')
    out_file.write_text('\n'.join(parts), encoding='utf-8')
    print(f"Genererade {out_file} med {len(imgs)} bilder.")


def is_image_file(path:Path):
    return path.is_file() and path.suffix.lower() in ['.jpg','.jpeg','.png','.webp','.gif']


def scan_images(src_dir:Path):
    images = {}
    for p in sorted(src_dir.iterdir()):
        if is_image_file(p):
            stat = p.stat()
            images[p.name] = (stat.st_mtime, stat.st_size)
    return images


def prepare_images_dir(src_dir:Path, out_dir:Path):
    images_dir = src_dir
    try:
        src_dir.relative_to(out_dir)
    except ValueError:
        images_dir = out_dir / src_dir.name
        if images_dir.exists():
            shutil.rmtree(images_dir)
        images_dir.mkdir(parents=True, exist_ok=True)
        for p in sorted(src_dir.iterdir()):
            if is_image_file(p):
                shutil.copy2(p, images_dir / p.name)
    return images_dir


def build_gallery(src_dir:Path, out_file:Path):
    images_dir = prepare_images_dir(src_dir, out_file.parent)
    make_gallery(images_dir, out_file)
    return scan_images(src_dir)


def watch_gallery(src_dir:Path, out_file:Path, interval:float):
    print(f"Övervakar {src_dir} och uppdaterar {out_file} var {interval} sekund.")
    previous_images = {}
    while True:
        try:
            current_images = scan_images(src_dir)
            if current_images != previous_images:
                build_gallery(src_dir, out_file)
                previous_images = current_images
        except KeyboardInterrupt:
            print('\nAvslutar watcher.')
            break
        except Exception as exc:
            print(f"Kunde inte uppdatera galleriet: {exc}")
        time.sleep(interval)

def main():
    parser = argparse.ArgumentParser(description='Generera gallery.html från en bildmapp')
    parser.add_argument('--src', default='Gallery_img', help='Sökväg till bildmappen (relativt script)')
    parser.add_argument('--out', default='.', help='Utmatningsmapp där gallery.html sparas')
    parser.add_argument('--watch', action='store_true', help='Övervaka bildmappen och uppdatera automatiskt')
    parser.add_argument('--interval', type=float, default=2.0, help='Intervall i sekunder för automatisk uppdatering')
    args = parser.parse_args()
    script_dir = Path(__file__).parent

    src_dir = Path(args.src)
    if not src_dir.is_absolute():
        src_dir = (script_dir / src_dir).resolve()
    else:
        src_dir = src_dir.resolve()

    out_dir = Path(args.out)
    if not out_dir.is_absolute():
        out_dir = (script_dir / out_dir).resolve()
    else:
        out_dir = out_dir.resolve()

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / 'gallery.html'

    if args.watch:
        watch_gallery(src_dir, out_file, args.interval)
    else:
        build_gallery(src_dir, out_file)

if __name__=='__main__':
    main()
