"""Fixture tests for token_fit.py.

    python -m unittest scripts/test_token_fit.py

Synthetic 512-square RGBA tokens: a disc with a thin green fringe and confetti for despill, a
figure with a long staff for the fit's cap, a two-tone figure for derim, a head-and-torso pair
for headmatch. No real art, no API.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import token_fit as tf  # noqa: E402

E = 512
BROWN = (150, 100, 60)
GREEN = (60, 200, 60)


def grid():
    y, x = np.mgrid[0:E, 0:E]
    return y.astype(np.float32) + 0.5, x.astype(np.float32) + 0.5


def blank():
    return np.zeros((E, E, 3), np.float32), np.zeros((E, E), np.float32)


def paint(rgb, alpha, mask, colour, a=255.0):
    rgb[mask] = colour
    alpha[mask] = a


def ellipse(cx, cy, rx, ry):
    y, x = grid()
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def save(path, rgb, alpha):
    tf.save(str(path), rgb, alpha)


def fringed_disc():
    """A brown disc with a 2 px half-transparent green fringe, 12 confetti specks and one
    64 px blob that must survive the speck drop."""
    rgb, alpha = blank()
    y, x = grid()
    r = np.sqrt((x - 256) ** 2 + (y - 256) ** 2)
    paint(rgb, alpha, r <= 100, BROWN)
    paint(rgb, alpha, (r > 100) & (r <= 102), GREEN, 128.0)
    paint(rgb, alpha, (r > 102) & (r <= 103), GREEN, 40.0)
    for i in range(12):
        sy, sx = 20 + i * 38, 470 - (i % 3) * 7
        paint(rgb, alpha, (y >= sy) & (y < sy + 2) & (x >= sx) & (x < sx + 2), GREEN)
    paint(rgb, alpha, (y >= 440) & (y < 448) & (x >= 40) & (x < 48), BROWN)   # 64 px, kept
    return rgb, alpha


def staff_figure(with_staff=True):
    """An 80 x 110 ellipse body (sqrt area ~166) and, with the staff, an 8 px pole from
    y = 40 to y = 500 that the fit must keep whole."""
    rgb, alpha = blank()
    y, x = grid()
    paint(rgb, alpha, ellipse(256, 256, 80, 110), BROWN)
    if with_staff:
        paint(rgb, alpha, (x >= 330) & (x < 338) & (y >= 40) & (y < 500), (120, 80, 40))
    return rgb, alpha


def head_torso(head_r):
    rgb, alpha = blank()
    y, x = grid()
    paint(rgb, alpha, ellipse(256, 300, 90, 120), BROWN)
    paint(rgb, alpha, (x - 256) ** 2 + (y - 150) ** 2 <= head_r ** 2, (40, 30, 30))
    return rgb, alpha


class FitTests(unittest.TestCase):
    def test_body_target_reached_and_centred(self):
        rgb, alpha = staff_figure(with_staff=False)
        out, oa, r = tf.fit(rgb, alpha, 245, 10, 10, 14, 0.55, 0.85)
        self.assertFalse(r["capped"])
        self.assertAlmostEqual(r["body_sqrt_area"], 166, delta=3)
        body, _ = tf.body_mask(out, oa, 14, 0.55, 0.85)
        self.assertAlmostEqual(np.sqrt(body.sum()), 245, delta=4)
        x0, y0, x1, y1 = tf.bbox(oa > 0)
        self.assertAlmostEqual((x0 + x1) / 2, 256, delta=2)
        self.assertAlmostEqual((y0 + y1) / 2, 256, delta=2)

    def test_long_staff_caps_the_scale_inside_the_margin(self):
        rgb, alpha = staff_figure()
        out, oa, r = tf.fit(rgb, alpha, 245, 10, 10, 14, 0.55, 0.85)
        self.assertTrue(r["capped"])
        self.assertGreater(r["wanted"], 1.4)
        self.assertAlmostEqual(r["scale"], 1.038, delta=0.01)
        x0, y0, x1, y1 = tf.bbox(oa > 0)
        self.assertGreaterEqual(min(x0, y0), 10)
        self.assertLessEqual(max(x1, y1), E - 10)
        # the staff is still whole: as tall as it was, times the scale (solid alpha, so the
        # resampler's faint ringing past the edge does not count)
        sx0, sy0, sx1, sy1 = tf.bbox(oa > 127)
        self.assertAlmostEqual(sy1 - sy0, 460 * r["scale"], delta=3)

    def test_refit_is_a_no_op(self):
        rgb, alpha = staff_figure(with_staff=False)
        out, oa, _ = tf.fit(rgb, alpha, 245, 10, 10, 14, 0.55, 0.85)
        out2, oa2, r2 = tf.fit(out, oa, 245, 10, 10, 14, 0.55, 0.85)
        self.assertAlmostEqual(r2["scale"], 1.0, delta=0.02)
        self.assertLessEqual(abs(r2["shift"][0]), 3)
        self.assertLessEqual(abs(r2["shift"][1]), 3)

    def test_glow_is_not_body(self):
        rgb, alpha = staff_figure(with_staff=False)
        y, x = grid()
        paint(rgb, alpha, ellipse(256, 256, 160, 160) & ~ellipse(256, 256, 80, 110), (255, 200, 40))
        body, glow_n = tf.body_mask(rgb, alpha, 14, 0.55, 0.85)
        self.assertGreater(glow_n, 1000)
        self.assertAlmostEqual(np.sqrt(body.sum()), 166, delta=4)

    def test_shrink_centres_the_figure(self):
        rgb, alpha = staff_figure(with_staff=False)
        out, oa = tf.rescale_on_canvas(rgb, alpha, 0.5)
        x0, y0, x1, y1 = tf.bbox(oa > 127)
        self.assertAlmostEqual(x1 - x0, 80, delta=3)
        self.assertAlmostEqual((x0 + x1) / 2, 256, delta=2)

    def test_edge_fade(self):
        w = tf.edge_fade(E, 10)
        self.assertEqual(w[256, 256], 1.0)
        self.assertLess(w[0, 256], 0.1)
        self.assertAlmostEqual(w[5, 256], 0.55, delta=0.01)


class SquashTests(unittest.TestCase):
    def figure(self):
        rgb, alpha = blank()
        y, x = grid()
        paint(rgb, alpha, (y >= 100) & (y < 400) & (x >= 206) & (x < 306), BROWN)
        return rgb, alpha

    def test_graded_squash_keeps_width_and_centre(self):
        rgb, alpha = self.figure()
        scales = tf.row_scales(E, (100, 160), 0.97, 0.90, 24)
        self.assertEqual(scales[50], 1.0)
        self.assertEqual(scales[120], np.float32(0.97))
        self.assertAlmostEqual(scales[300], 0.90, places=5)
        nrgb, nalpha = tf.remap_rows(rgb, alpha, scales)
        x0, y0, x1, y1 = tf.bbox(nalpha > 127)
        self.assertEqual(x1 - x0, 100)
        expected = 60 * 0.97 + 24 * 0.935 + (300 - 84) * 0.90
        self.assertAlmostEqual(y1 - y0, expected, delta=3)

    def test_cli_anchor(self):
        tmp = Path(tempfile.mkdtemp(prefix="tokenfit-"))
        try:
            rgb, alpha = self.figure()
            src = tmp / "fig.png"
            save(src, rgb, alpha)
            for anchor in ("centre", "top"):
                out = tmp / f"sq-{anchor}.png"
                r = subprocess.run([sys.executable, str(HERE / "token_fit.py"), "squash", str(src), str(out),
                                    "--head", "100:160", "--anchor", anchor], capture_output=True, text=True)
                self.assertEqual(r.returncode, 0, r.stderr)
                _, oa = tf.load(str(out))
                x0, y0, x1, y1 = tf.bbox(oa > 127)
                if anchor == "top":
                    self.assertEqual(y0, 100)
                else:
                    self.assertAlmostEqual((y0 + y1) / 2, 250, delta=2)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class DespillTests(unittest.TestCase):
    def test_fringe_rebuilt_and_specks_dropped(self):
        rgb, alpha = fringed_disc()
        out, oa, r = tf.despill_edges(rgb, alpha, 3, 2, 40)
        kept = oa > 0
        self.assertTrue((out[kept][:, 1] <= np.maximum(out[kept][:, 0], out[kept][:, 2])).all())
        y, x = grid()
        ring = (np.sqrt((x - 256) ** 2 + (y - 256) ** 2) > 100) & (oa > 0)
        self.assertTrue(ring.any())
        self.assertLess(np.abs(out[ring] - np.array(BROWN)).max(), 2)
        # alpha untouched where kept: the fringe is still half transparent
        self.assertTrue((oa[ring & (alpha == 128)] == 128).all())
        self.assertEqual(r["specks"], 12)
        labels, areas = tf.label_components(oa > 0)
        self.assertEqual(len(areas) - 1, 2)
        self.assertEqual(sorted(areas[1:])[0], 64)

    def test_interior_untouched(self):
        rgb, alpha = fringed_disc()
        out, _, _ = tf.despill_edges(rgb, alpha, 3, 2, 40)
        y, x = grid()
        deep = np.sqrt((x - 256) ** 2 + (y - 256) ** 2) < 90
        self.assertTrue((out[deep] == np.array(BROWN)).all())


class HueTests(unittest.TestCase):
    def test_green_patch_becomes_blood_by_brightness(self):
        rgb, alpha = blank()
        y, x = grid()
        paint(rgb, alpha, ellipse(256, 256, 120, 120), BROWN)
        patch = (x >= 200) & (x < 240) & (y >= 240) & (y < 280)
        paint(rgb, alpha, patch, (60, 180, 60))
        out, n = tf.hue_rebuild(rgb, alpha, 38, 170, 0.18, tf.parse_color("BF262A"))
        self.assertEqual(n, int(patch.sum()))
        px = out[patch][0]
        self.assertAlmostEqual(px[0], 0.75 * 180, delta=1.5)
        self.assertAlmostEqual(px[1], 0.2 * px[0], delta=1.5)
        self.assertAlmostEqual(px[2], 0.22 * px[0], delta=1.5)
        self.assertTrue((out[ellipse(256, 256, 120, 120) & ~patch] == np.array(BROWN)).all())
        out2, n2 = tf.hue_rebuild(rgb, alpha, 38, 170, 0.18, tf.parse_color("BF262A"), box=(0, 0, 100, 100))
        self.assertEqual(n2, 0)

    def test_hue_wraps(self):
        self.assertTrue(tf.hue_in(np.array([350.0, 10.0, 180.0]), 330, 30).tolist() == [True, True, False])


class DerimTests(unittest.TestCase):
    def two_tone(self):
        rgb, alpha = blank()
        y, x = grid()
        disc = ellipse(256, 256, 120, 120)
        paint(rgb, alpha, disc, BROWN)
        band = disc & (x < 150)
        paint(rgb, alpha, band, (80, 100, 200))
        return rgb, alpha, band, disc

    def test_cool_band_takes_warm_colour_and_halves_the_highlight(self):
        rgb, alpha, band, disc = self.two_tone()
        out, n = tf.derim(rgb, alpha, 6)
        self.assertEqual(n, int(band.sum()))
        h, s, v = tf.hsv(out)
        self.assertTrue((h[band] < 60).all())
        # own value 200 against a warm 150: pulled halfway, to 175
        self.assertAlmostEqual(float(np.median(out[band].max(axis=-1))), 175, delta=4)
        self.assertTrue((out[disc & ~band] == np.array(BROWN)).all())

    def test_protect_box(self):
        rgb, alpha, band, disc = self.two_tone()
        out, n = tf.derim(rgb, alpha, 6, protect=(0, 0, 160, 512))
        self.assertEqual(n, 0)
        self.assertTrue((out == rgb).all())


class HeadmatchTests(unittest.TestCase):
    def test_measure_and_rescale(self):
        tmp = Path(tempfile.mkdtemp(prefix="tokenfit-"))
        try:
            a, b = tmp / "a.png", tmp / "b.png"
            save(a, *head_torso(50))
            save(b, *head_torso(35))
            wa, _ = tf.head_width(*tf.load(str(a)))
            wb, _ = tf.head_width(*tf.load(str(b)))
            self.assertAlmostEqual(wa, 100, delta=3)
            self.assertAlmostEqual(wb, 70, delta=3)
            out = tmp / "match.png"
            r = subprocess.run([sys.executable, str(HERE / "token_fit.py"), "headmatch", str(a), str(b), str(out),
                                "--debug", str(tmp / "dbg")], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("token A rescaled", r.stdout)
            wm, _ = tf.head_width(*tf.load(str(out)))
            self.assertAlmostEqual(wm, wb, delta=3)
            self.assertTrue((tmp / "dbg" / "headmatch-a.png").exists())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class CliTests(unittest.TestCase):
    def test_help_and_never_in_place(self):
        for sub in ("fit", "squash", "despill", "hue", "derim", "headmatch"):
            r = subprocess.run([sys.executable, str(HERE / "token_fit.py"), sub, "--help"],
                               capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, sub)
        tmp = Path(tempfile.mkdtemp(prefix="tokenfit-"))
        try:
            src = tmp / "disc.png"
            save(src, *fringed_disc())
            r = subprocess.run([sys.executable, str(HERE / "token_fit.py"), "despill", str(src), str(src)],
                               capture_output=True, text=True)
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("never writes in place", r.stderr)
            out = tmp / "fit.png"
            r = subprocess.run([sys.executable, str(HERE / "token_fit.py"), "fit", str(src), str(out), "--shrink", "79"],
                               capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            with Image.open(out) as im:
                self.assertEqual(im.size, (E, E))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
