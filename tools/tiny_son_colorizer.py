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
BLAZE = [(-1.35,87),(1.35,87),(2,82.5),(2.55,78),(3.1,73.5),(3.9,69),(5.4,64),(-5.4,64),(-3.9,69),(-3.1,73.5),(-2.55,78),(-2,82.5)]
MUZZLE = [(-5.5,66),(5.5,66),(9.2,65),(11.4,63.3),(10.9,60.4),(8.2,58.7),(0,57.8),(-8.2,58.7),(-10.9,60.4),(-11.4,63.3),(-9.2,65)]
BIB = [(-14.8,58.5),(14.8,58.5),(15.3,54),(14.2,49),(12.8,43),(11.2,37),(9.4,31),(8,25),(7.2,19),(-7.2,19),(-8,25),(-9.4,31),(-11.2,37),(-12.8,43),(-14.2,49),(-15.3,54)]

PALETTE = {
    'coat': '#141619',
    'white': '#F2EEE5',
    'amber': '#C58A2E',
    'amber_rim': '#8A571C',
    'pupil': '#24150E',
    'nose': '#2A171A',
    'inner_ear': '#B87983',
}


def hex_rgba(h: str, alpha: int = 255) -> np.ndarray:
    h = h.lstrip('#')
    return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)] + [alpha], dtype=np.uint8)


def point_in_poly(x, z, poly):
    x = np.asarray(x)
    z = np.asarray(z)
    inside = np.zeros(x.shape, dtype=bool)
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, zi = poly[i]
        xj, zj = poly[j]
        cross = ((zi > z) != (zj > z)) & (x < (xj - xi) * (z - zi) / ((zj - zi) + 1e-15) + xi)
        inside ^= cross
        j = i
    return inside


def ellipsoid_mask(c, rx, ry, rz, cx, cy, cz):
    x, y, z = c[:, 0], c[:, 1], c[:, 2]
    return ((x-cx)/rx)**2 + ((y-cy)/ry)**2 + ((z-cz)/rz)**2 <= 1.0


def white_vertex_mask(vertices):
    """PASS E tuxedo regions evaluated at vertices, not triangle centroids.

    This is preview-only material assignment. It keeps the accepted geometry frozen
    while allowing interpolation across a triangle that crosses a color boundary,
    eliminating the lightning-bolt / sawtooth artifact seen in the V1 mobile USDZ.
    """
    x, y, z = vertices[:, 0], vertices[:, 1], vertices[:, 2]
    blaze = point_in_poly(x, z, BLAZE) & (y >= -25.0) & (y <= -11.8)
    muzzle = point_in_poly(x, z, MUZZLE) & (y >= -25.0) & (y <= -9.0)
    bib = point_in_poly(x, z, BIB) & (y >= -25.0) & (y <= 1.0)
    fore_l = (x >= -11.4) & (x <= -0.2) & (y >= -15.0) & (y <= 3.0) & (z >= 0.0) & (z <= 34.0)
    fore_r = (x >= 0.2) & (x <= 11.4) & (y >= -15.0) & (y <= 3.0) & (z >= 0.0) & (z <= 34.0)
    paw_l = ellipsoid_mask(vertices, 6.8, 7.6, 5.0, -5.8, -6.4, 4.2)
    paw_r = ellipsoid_mask(vertices, 6.8, 7.6, 5.0, 5.8, -6.4, 4.2)
    rear_l = ellipsoid_mask(vertices, 5.2, 6.2, 4.0, -13.0, 0.0, 3.0)
    rear_r = ellipsoid_mask(vertices, 5.2, 6.2, 4.0, 13.0, 0.55, 3.0)
    return blaze | muzzle | bib | fore_l | fore_r | paw_l | paw_r | rear_l | rear_r


def load_mesh(path: Path) -> trimesh.Trimesh:
    mesh = trimesh.load(path, force='mesh', process=False)
    if not isinstance(mesh, trimesh.Trimesh):
        raise TypeError(f'Expected mesh: {path}')
    # Merge duplicate STL vertices only. This does not move geometry; it makes
    # smooth preview shading and vertex-color interpolation possible and shrinks GLB size.
    mesh.merge_vertices(digits_vertex=5)
    mesh.remove_unreferenced_vertices()
    return mesh


def scaled(mesh: trimesh.Trimesh, scale: float) -> trimesh.Trimesh:
    out = mesh.copy()
    out.apply_scale(scale)
    return out


def assign_main_vertex_colors(mesh: trimesh.Trimesh):
    colors = np.tile(hex_rgba(PALETTE['coat']), (len(mesh.vertices), 1))
    white = white_vertex_mask(mesh.vertices)
    colors[white] = hex_rgba(PALETTE['white'])
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=colors)
    return int(white.sum()), colors


def assign_eye_vertex_colors(mesh: trimesh.Trimesh, side: str):
    """Warm amber iris with a broad soft pupil, not a razor slit.

    The accepted eye geometry remains untouched. The pupil is material only and is
    restricted to the front hemisphere (-Y side) of the insert.
    """
    v = mesh.vertices
    cx = -8.8594 if side == 'left' else 8.8595
    cy = -16.42
    cz = 70.77
    dx = v[:, 0] - cx
    dy = v[:, 1] - cy
    dz = v[:, 2] - cz

    # Amber base with a darker warm rim toward the visible outline.
    nx = dx / 4.18
    nz = dz / 1.53
    radial = np.sqrt(nx*nx + nz*nz)
    base = hex_rgba(PALETTE['amber']).astype(float)
    rim = hex_rgba(PALETTE['amber_rim']).astype(float)
    t = np.clip((radial - 0.55) / 0.42, 0.0, 1.0)[:, None]
    colors = np.round(base[None, :] * (1.0 - t) + rim[None, :] * t).astype(np.uint8)
    colors[:, 3] = 255

    # A broad rounded vertical pupil reads sleepy/feline rather than predatory slit.
    front = dy < -0.18
    pupil = front & (((dx / 1.05)**2 + (dz / 1.00)**2) <= 1.0)
    colors[pupil] = hex_rgba(PALETTE['pupil'])

    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=colors)
    return int(pupil.sum()), colors


def solid_vertex_color(mesh: trimesh.Trimesh, hex_color: str):
    colors = np.tile(hex_rgba(hex_color), (len(mesh.vertices), 1))
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=colors)
    return colors


def neutral_vertex_material(name: str, roughness: float):
    # White base allows glTF vertex colors to remain authoritative.
    return PBRMaterial(
        name=name,
        baseColorFactor=np.array([1.0, 1.0, 1.0, 1.0]),
        metallicFactor=0.0,
        roughnessFactor=roughness,
    )


def _fmt_rgb(c):
    c = np.asarray(c[:3], dtype=float) / 255.0
    return f'({c[0]:.6f}, {c[1]:.6f}, {c[2]:.6f})'


def write_usdz(vertex_meshes, out_path: Path, meters_per_unit=0.001):
    """Write Apple Quick Look USDZ using per-vertex displayColor.

    Each mesh binds one material whose UsdPreviewSurface diffuseColor is driven by
    displayColor through UsdPrimvarReader_float3. This keeps smooth color boundaries
    without splitting Canon geometry into jagged material islands.
    """
    usda_path = out_path.with_suffix('.usda')
    lines = [
        '#usda 1.0', '(', '    defaultPrim = "TinySon"',
        f'    metersPerUnit = {meters_per_unit}', '    upAxis = "Z"', ')', '',
        'def Xform "TinySon"', '{',
        '    def Scope "Looks"', '    {'
    ]

    for mat_name, roughness in [('BodyVertexColor', 0.90), ('EyeVertexColor', 0.48), ('NoseVertexColor', 0.62), ('EarVertexColor', 0.84)]:
        lines += [
            f'        def Material "{mat_name}"', '        {',
            f'            token outputs:surface.connect = </TinySon/Looks/{mat_name}/PreviewSurface.outputs:surface>',
            f'            def Shader "PreviewSurface"', '            {',
            '                uniform token info:id = "UsdPreviewSurface"',
            f'                color3f inputs:diffuseColor.connect = </TinySon/Looks/{mat_name}/ColorReader.outputs:result>',
            '                float inputs:metallic = 0.0',
            f'                float inputs:roughness = {roughness:.3f}',
            '                token outputs:surface', '            }',
            '            def Shader "ColorReader"', '            {',
            '                uniform token info:id = "UsdPrimvarReader_float3"',
            '                token inputs:varname = "displayColor"',
            '                float3 outputs:result', '            }',
            '        }'
        ]
    lines += ['    }']

    for name, mesh, colors, mat_name in vertex_meshes:
        v = np.asarray(mesh.vertices)
        f = np.asarray(mesh.faces, dtype=np.int64)
        bb = mesh.bounds
        lines += [f'    def Mesh "{name}"', '    {', '        uniform token subdivisionScheme = "none"', '        uniform bool doubleSided = true']
        lines.append(f'        rel material:binding = </TinySon/Looks/{mat_name}>')
        lines.append('        float3[] extent = [({}, {}, {}), ({}, {}, {})]'.format(
            *(f'{x:.6f}' for x in [bb[0,0], bb[0,1], bb[0,2], bb[1,0], bb[1,1], bb[1,2]])))

        lines.append('        point3f[] points = [')
        for start in range(0, len(v), 256):
            pts = v[start:start+256]
            s = ', '.join(f'({p[0]:.5f}, {p[1]:.5f}, {p[2]:.5f})' for p in pts)
            if start + 256 < len(v): s += ','
            lines.append('            ' + s)
        lines.append('        ]')

        # USD vertex color interpolation follows point order.
        lines.append('        color3f[] primvars:displayColor = [')
        for start in range(0, len(colors), 256):
            cc = colors[start:start+256]
            s = ', '.join(_fmt_rgb(c) for c in cc)
            if start + 256 < len(colors): s += ','
            lines.append('            ' + s)
        lines.append('        ]')
        lines.append('        uniform token primvars:displayColor:interpolation = "vertex"')

        lines.append('        int[] faceVertexCounts = [')
        for start in range(0, len(f), 96):
            n = min(96, len(f) - start)
            s = ', '.join(['3'] * n)
            if start + n < len(f): s += ','
            lines.append('            ' + s)
        lines.append('        ]')
        lines.append('        int[] faceVertexIndices = [')
        flat = f.reshape(-1)
        for start in range(0, len(flat), 768):
            chunk = flat[start:start+768]
            s = ', '.join(str(int(i)) for i in chunk)
            if start + 768 < len(flat): s += ','
            lines.append('            ' + s)
        lines += ['        ]', '    }']

    lines += ['}']
    text = '\n'.join(lines) + '\n'
    usda_path.write_text(text)

    filename = usda_path.name
    base = 30 + len(filename.encode('utf-8'))
    needed = (-base) % 64
    extra = b''
    if needed:
        if needed < 4:
            needed += 64
        payload_len = needed - 4
        extra = struct.pack('<HH', 0xCAFE, payload_len) + b'\0' * payload_len
    zi = zipfile.ZipInfo(filename=filename)
    zi.compress_type = zipfile.ZIP_STORED
    zi.extra = extra
    zi.create_system = 3
    zi.external_attr = 0o100644 << 16
    with zipfile.ZipFile(out_path, 'w') as zf:
        zf.writestr(zi, text.encode('utf-8'))
    return usda_path


def build(parts_dir: Path, out_dir: Path, height_mm: float):
    out_dir.mkdir(parents=True, exist_ok=True)
    scale = height_mm / 100.0

    main = load_mesh(parts_dir / 'main.stl')
    eye_l = load_mesh(parts_dir / 'eye_left.stl')
    eye_r = load_mesh(parts_dir / 'eye_right.stl')
    nose = load_mesh(parts_dir / 'nose.stl')
    inner_l = load_mesh(parts_dir / 'inner_left.stl')
    inner_r = load_mesh(parts_dir / 'inner_right.stl')

    white_vertices, main_colors = assign_main_vertex_colors(main)
    pupil_l, eye_l_colors = assign_eye_vertex_colors(eye_l, 'left')
    pupil_r, eye_r_colors = assign_eye_vertex_colors(eye_r, 'right')
    nose_colors = solid_vertex_color(nose, PALETTE['nose'])
    ear_l_colors = solid_vertex_color(inner_l, PALETTE['inner_ear'])
    ear_r_colors = solid_vertex_color(inner_r, PALETTE['inner_ear'])

    # Apply only a uniform scale to create Tiny Son. No vertex positions are otherwise changed.
    main_s, eye_l_s, eye_r_s, nose_s, inner_l_s, inner_r_s = [
        scaled(m, scale) for m in (main, eye_l, eye_r, nose, inner_l, inner_r)
    ]

    # Re-attach color visuals after copies, to be explicit.
    main_s.visual = trimesh.visual.ColorVisuals(mesh=main_s, vertex_colors=main_colors)
    eye_l_s.visual = trimesh.visual.ColorVisuals(mesh=eye_l_s, vertex_colors=eye_l_colors)
    eye_r_s.visual = trimesh.visual.ColorVisuals(mesh=eye_r_s, vertex_colors=eye_r_colors)
    nose_s.visual = trimesh.visual.ColorVisuals(mesh=nose_s, vertex_colors=nose_colors)
    inner_l_s.visual = trimesh.visual.ColorVisuals(mesh=inner_l_s, vertex_colors=ear_l_colors)
    inner_r_s.visual = trimesh.visual.ColorVisuals(mesh=inner_r_s, vertex_colors=ear_r_colors)

    body_mat = neutral_vertex_material('Remy_Body_VertexColor', 0.90)
    eye_mat = neutral_vertex_material('Remy_Eye_VertexColor', 0.48)
    nose_mat = neutral_vertex_material('Remy_Nose_VertexColor', 0.62)
    ear_mat = neutral_vertex_material('Remy_Ear_VertexColor', 0.84)

    scene = trimesh.Scene()
    glb_parts = [
        ('REMY_BODY', main_s, body_mat),
        ('EYE_LEFT', eye_l_s, eye_mat),
        ('EYE_RIGHT', eye_r_s, eye_mat),
        ('NOSE', nose_s, nose_mat),
        ('INNER_EAR_LEFT', inner_l_s, ear_mat),
        ('INNER_EAR_RIGHT', inner_r_s, ear_mat),
    ]
    for name, m, material in glb_parts:
        # ColorVisuals are authoritative; preserve them and attach neutral PBR only where exporter supports it.
        scene.add_geometry(m, node_name=name, geom_name=name)

    glb = out_dir / f'Tiny_Son_{height_mm:g}mm_COLORED_V2_AMBER.glb'
    glb.write_bytes(scene.export(file_type='glb'))

    usdz = out_dir / f'Tiny_Son_{height_mm:g}mm_COLORED_V2_AMBER_AR.usdz'
    usdz_parts = [
        ('REMY_BODY', main_s, main_colors, 'BodyVertexColor'),
        ('EYE_LEFT', eye_l_s, eye_l_colors, 'EyeVertexColor'),
        ('EYE_RIGHT', eye_r_s, eye_r_colors, 'EyeVertexColor'),
        ('NOSE', nose_s, nose_colors, 'NoseVertexColor'),
        ('INNER_EAR_LEFT', inner_l_s, ear_l_colors, 'EarVertexColor'),
        ('INNER_EAR_RIGHT', inner_r_s, ear_r_colors, 'EarVertexColor'),
    ]
    usda = write_usdz(usdz_parts, usdz)

    re = trimesh.load(glb, process=False)
    geoms = list(re.geometry.values()) if isinstance(re, trimesh.Scene) else [re]
    combo = trimesh.util.concatenate(geoms)
    source_bounds = main.bounds.copy() * scale
    report = {
        'status': 'COLORED_PREVIEW_V2_AMBER_GENERATED',
        'geometry_mutation': False,
        'preview_topology_operation': 'duplicate STL vertices merged only; coordinates preserved; uniform scale only',
        'source': 'PASS E region equations on PASS D accepted surface tessellation',
        'target_height_mm': height_mm,
        'palette': PALETTE,
        'anti_menace_repairs': [
            'amber eye palette replaces green/chartreuse',
            'broad rounded pupil material region replaces featureless slit read',
            'vertex-interpolated tuxedo region removes triangle-centroid lightning-bolt boundary artifact',
            'higher body roughness reduces harsh muzzle shelf specular read',
            'high-resolution PASS E tessellation retained before duplicate-vertex merge',
        ],
        'main_vertices_after_duplicate_merge': int(len(main.vertices)),
        'main_faces': int(len(main.faces)),
        'white_vertices': int(white_vertices),
        'left_pupil_vertices': int(pupil_l),
        'right_pupil_vertices': int(pupil_r),
        'glb': str(glb),
        'usdz': str(usdz),
        'usda': str(usda),
        'glb_geometry_count': len(geoms),
        'glb_bbox_mm': combo.bounds.tolist(),
        'glb_height_mm': float(combo.bounds[1, 2] - combo.bounds[0, 2]),
        'source_main_scaled_bbox_mm': source_bounds.tolist(),
    }
    (out_dir / 'Tiny_Son_Color_V2_Report.json').write_text(json.dumps(report, indent=2))
    return report


def main_cli():
    ap = argparse.ArgumentParser()
    ap.add_argument('--parts-dir', type=Path, required=True)
    ap.add_argument('--out-dir', type=Path, required=True)
    ap.add_argument('--height', type=float, default=50.0)
    a = ap.parse_args()
    print(json.dumps(build(a.parts_dir, a.out_dir, a.height), indent=2))


if __name__ == '__main__':
    main_cli()
