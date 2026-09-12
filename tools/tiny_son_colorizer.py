from __future__ import annotations

import argparse
import json
import struct
import zipfile
from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

# Canon PASS E region definitions in the 100 mm authority coordinate system.
# Geometry is never resculpted here. These equations only partition the
# accepted PASS D tessellation into material regions for preview/AR exports.
BLAZE = [(-1.35,87),(1.35,87),(2,82.5),(2.55,78),(3.1,73.5),(3.9,69),(5.4,64),(-5.4,64),(-3.9,69),(-3.1,73.5),(-2.55,78),(-2,82.5)]
MUZZLE = [(-5.5,66),(5.5,66),(9.2,65),(11.4,63.3),(10.9,60.4),(8.2,58.7),(0,57.8),(-8.2,58.7),(-10.9,60.4),(-11.4,63.3),(-9.2,65)]
BIB = [(-14.8,58.5),(14.8,58.5),(15.3,54),(14.2,49),(12.8,43),(11.2,37),(9.4,31),(8,25),(7.2,19),(-7.2,19),(-8,25),(-9.4,31),(-11.2,37),(-12.8,43),(-14.2,49),(-15.3,54)]

PALETTE = {
    "coat": "#17191C",
    "white": "#F3F0E8",
    "eyes": "#9EAA58",
    "nose": "#241719",
    "inner_ear": "#B77A84",
}


def hex_rgba(h: str, alpha: int = 255):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)


def point_in_poly(x, z, poly):
    x = np.asarray(x)
    z = np.asarray(z)
    inside = np.zeros(x.shape, dtype=bool)
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, zi = poly[i]
        xj, zj = poly[j]
        cross = ((zi > z) != (zj > z)) & (
            x < (xj - xi) * (z - zi) / ((zj - zi) + 1e-15) + xi
        )
        inside ^= cross
        j = i
    return inside


def ellipsoid_mask(c, rx, ry, rz, cx, cy, cz):
    x, y, z = c[:, 0], c[:, 1], c[:, 2]
    return ((x-cx)/rx)**2 + ((y-cy)/ry)**2 + ((z-cz)/rz)**2 <= 1.0


def white_face_mask(centroids):
    x, y, z = centroids[:, 0], centroids[:, 1], centroids[:, 2]

    blaze = point_in_poly(x, z, BLAZE) & (y >= -25.0) & (y <= -11.8)
    muzzle = point_in_poly(x, z, MUZZLE) & (y >= -25.0) & (y <= -9.0)
    bib = point_in_poly(x, z, BIB) & (y >= -25.0) & (y <= 1.0)

    fore_l = (x >= -11.4) & (x <= -0.2) & (y >= -15.0) & (y <= 3.0) & (z >= 0.0) & (z <= 34.0)
    fore_r = (x >= 0.2) & (x <= 11.4) & (y >= -15.0) & (y <= 3.0) & (z >= 0.0) & (z <= 34.0)

    paw_l = ellipsoid_mask(centroids, 6.8, 7.6, 5.0, -5.8, -6.4, 4.2)
    paw_r = ellipsoid_mask(centroids, 6.8, 7.6, 5.0, 5.8, -6.4, 4.2)
    rear_l = ellipsoid_mask(centroids, 5.2, 6.2, 4.0, -13.0, 0.0, 3.0)
    rear_r = ellipsoid_mask(centroids, 5.2, 6.2, 4.0, 13.0, 0.55, 3.0)

    return blaze | muzzle | bib | fore_l | fore_r | paw_l | paw_r | rear_l | rear_r


def material(name, color, roughness):
    return PBRMaterial(
        name=name,
        baseColorFactor=np.array(hex_rgba(color), dtype=float) / 255.0,
        metallicFactor=0.0,
        roughnessFactor=roughness,
    )


def load_mesh(path: Path):
    mesh = trimesh.load(path, force="mesh", process=False)
    if not isinstance(mesh, trimesh.Trimesh):
        raise TypeError(f"Expected mesh at {path}")
    return mesh


def scaled(mesh, factor):
    out = mesh.copy()
    out.apply_scale(factor)
    return out


def write_usdz(meshes, materials, out_path: Path, meters_per_unit=0.001):
    usda_path = out_path.with_suffix(".usda")
    lines = [
        "#usda 1.0",
        "(",
        '    defaultPrim = "TinySon"',
        f"    metersPerUnit = {meters_per_unit}",
        '    upAxis = "Z"',
        ")",
        "",
        'def Xform "TinySon"',
        "{",
        '    def Scope "Looks"',
        "    {",
    ]

    for key, color in materials.items():
        rgb = np.array(hex_rgba(color)[:3], dtype=float) / 255.0
        lines += [
            f'        def Material "{key}"',
            "        {",
            f"            token outputs:surface.connect = </TinySon/Looks/{key}/PreviewSurface.outputs:surface>",
            '            def Shader "PreviewSurface"',
            "            {",
            '                uniform token info:id = "UsdPreviewSurface"',
            f"                color3f inputs:diffuseColor = ({rgb[0]:.6f}, {rgb[1]:.6f}, {rgb[2]:.6f})",
            "                float inputs:metallic = 0.0",
            "                float inputs:roughness = 0.72",
            "                token outputs:surface",
            "            }",
            "        }",
        ]
    lines += ["    }"]

    for name, mesh, material_key in meshes:
        v = np.asarray(mesh.vertices)
        f = np.asarray(mesh.faces, dtype=np.int64)
        bb = mesh.bounds
        lines += [
            f'    def Mesh "{name}"',
            "    {",
            '        uniform token subdivisionScheme = "none"',
            "        uniform bool doubleSided = true",
            f"        rel material:binding = </TinySon/Looks/{material_key}>",
            "        float3[] extent = [({}, {}, {}), ({}, {}, {})]".format(
                *(f"{x:.6f}" for x in [bb[0,0], bb[0,1], bb[0,2], bb[1,0], bb[1,1], bb[1,2]])
            ),
            "        point3f[] points = [",
        ]
        for start in range(0, len(v), 256):
            pts = v[start:start+256]
            row = ", ".join(f"({p[0]:.5f}, {p[1]:.5f}, {p[2]:.5f})" for p in pts)
            if start + 256 < len(v):
                row += ","
            lines.append("            " + row)
        lines += ["        ]", "        int[] faceVertexCounts = ["]
        for start in range(0, len(f), 96):
            n = min(96, len(f) - start)
            row = ", ".join(["3"] * n)
            if start + n < len(f):
                row += ","
            lines.append("            " + row)
        lines += ["        ]", "        int[] faceVertexIndices = ["]
        flat = f.reshape(-1)
        for start in range(0, len(flat), 768):
            chunk = flat[start:start+768]
            row = ", ".join(str(int(i)) for i in chunk)
            if start + 768 < len(flat):
                row += ","
            lines.append("            " + row)
        lines += ["        ]", "    }"]
    lines += ["}"]

    text = "\n".join(lines) + "\n"
    usda_path.write_text(text)

    filename = usda_path.name
    base = 30 + len(filename.encode("utf-8"))
    needed = (-base) % 64
    extra = b""
    if needed:
        if needed < 4:
            needed += 64
        payload_len = needed - 4
        extra = struct.pack("<HH", 0xCAFE, payload_len) + b"\0" * payload_len

    zi = zipfile.ZipInfo(filename=filename)
    zi.compress_type = zipfile.ZIP_STORED
    zi.extra = extra
    zi.create_system = 3
    zi.external_attr = 0o100644 << 16
    with zipfile.ZipFile(out_path, "w") as zf:
        zf.writestr(zi, text.encode("utf-8"))
    return usda_path


def build(parts_dir: Path, out_dir: Path, height_mm: float):
    out_dir.mkdir(parents=True, exist_ok=True)
    scale = height_mm / 100.0

    main = load_mesh(parts_dir / "main.stl")
    white = white_face_mask(main.triangles_center)
    black_faces = np.nonzero(~white)[0]
    white_faces = np.nonzero(white)[0]

    black = main.submesh([black_faces], append=True, repair=False)
    tuxedo = main.submesh([white_faces], append=True, repair=False)
    eye_l = load_mesh(parts_dir / "eye_left.stl")
    eye_r = load_mesh(parts_dir / "eye_right.stl")
    nose = load_mesh(parts_dir / "nose.stl")
    ear_l = load_mesh(parts_dir / "inner_left.stl")
    ear_r = load_mesh(parts_dir / "inner_right.stl")

    named = [
        ("COAT_BLACK", scaled(black, scale), "coat"),
        ("TUXEDO_WHITE", scaled(tuxedo, scale), "white"),
        ("EYE_LEFT", scaled(eye_l, scale), "eyes"),
        ("EYE_RIGHT", scaled(eye_r, scale), "eyes"),
        ("NOSE", scaled(nose, scale), "nose"),
        ("INNER_EAR_LEFT", scaled(ear_l, scale), "inner_ear"),
        ("INNER_EAR_RIGHT", scaled(ear_r, scale), "inner_ear"),
    ]

    scene = trimesh.Scene()
    mats = {
        "coat": material("Remy_Coat", PALETTE["coat"], 0.78),
        "white": material("Remy_Tuxedo", PALETTE["white"], 0.82),
        "eyes": material("Remy_Eyes", PALETTE["eyes"], 0.34),
        "nose": material("Remy_Nose", PALETTE["nose"], 0.52),
        "inner_ear": material("Remy_InnerEar", PALETTE["inner_ear"], 0.72),
    }
    for name, mesh, key in named:
        mesh.visual.material = mats[key]
        scene.add_geometry(mesh, node_name=name, geom_name=name)

    glb = out_dir / f"Tiny_Son_{height_mm:g}mm_COLORED.glb"
    glb.write_bytes(scene.export(file_type="glb"))

    usdz = out_dir / f"Tiny_Son_{height_mm:g}mm_COLORED_AR.usdz"
    write_usdz(named, PALETTE, usdz)

    reloaded = trimesh.load(glb, process=False)
    geoms = list(reloaded.geometry.values()) if isinstance(reloaded, trimesh.Scene) else [reloaded]
    combo = trimesh.util.concatenate(geoms)
    report = {
        "status": "COLORED_PREVIEW_GENERATED",
        "geometry_mutation": False,
        "source": "PASS E material-region equations applied to PASS D accepted surface tessellation",
        "target_height_mm": height_mm,
        "palette": PALETTE,
        "main_source_faces": int(len(main.faces)),
        "coat_faces": int(len(black_faces)),
        "white_faces": int(len(white_faces)),
        "white_face_pct": float(len(white_faces) / len(main.faces) * 100),
        "glb_geometry_count": len(geoms),
        "glb_bbox_mm": combo.bounds.tolist(),
        "glb_height_mm": float(combo.bounds[1,2] - combo.bounds[0,2]),
    }
    (out_dir / "Tiny_Son_Color_Report.json").write_text(json.dumps(report, indent=2))
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parts-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--height", type=float, default=50.0)
    args = parser.parse_args()
    print(json.dumps(build(args.parts_dir, args.out_dir, args.height), indent=2))


if __name__ == "__main__":
    main()
