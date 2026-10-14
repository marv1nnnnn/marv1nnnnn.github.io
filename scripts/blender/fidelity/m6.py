"""MEElectronics M6 (2009), clear: the original sports in-ear, worn over the ear. A flat, rounded
clear shell like a little custom monitor, the driver and its red and green wires showing through,
MEE and L / R printed on the face, a wide clear nozzle under a milky single-flange tip; a ribbed
clear relief out of the top into two inches of stainless memory wire that holds the hook; clear
cable over silver braid, a clear Y-split with a slider above it, and a clear right-angle plug.

    blender -b --python scripts/blender/fidelity/m6.py -- [out.glb] [preview.png]

Sources: The Gadgeteer's review (2010-12: "Dimension: 0.65" H x 0.75" W x 1" L", 9 mm drivers,
1.4 m cord, stainless memory wire, gold right-angle plug, clear cable with braided silver inside,
clear slider over the split); The Headphone List (reviewed 2009-11: plastic housings, two inches of
memory wire, low-profile L-plug, 4 mm nozzle); TechEnclave's review (2010-11: black or clear,
"2D like", the clear one shown). MEE gives 20 g for the later Sport-Fi M6; Expert Reviews 4 g
(an earpiece); with its cable, about 20 g. Laid out from those photos: the face about 18.5 x 16 mm,
the shell 6 mm thick, 25 mm from face to tip. The 1.4 m cable is coiled shorter than it is.

Display: lying in a case (z = 0 is the plinth top), front -Y, origin at the middle of the bottom
of the layout. The earpieces lie at the front as if worn by someone facing the visitor (the right
one on the left), tops outwards, each settled on its tip with its face tilted to the front; the
hooks curl out and round, the legs come in round the front and back between the two, through the
slider to the split and on into a coil, the plug inside it. No moving parts.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import bmesh  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('m6')
kit.reset()

T = 0.6  # the shell, inner side (z = 0) to face
WIRE, CABLE = 0.1, 0.085  # memory wire and cable radii

M = {
    'clear': kit.material('clear', kit.srgb('#cdd7dd'), rough=0.04, alpha=0.16),
    'frost': kit.material('frost', kit.srgb('#e9eef0'), rough=0.4, alpha=0.62),
    'print': kit.material('print', kit.srgb('#f4f4f2'), rough=0.5),
    'driver': kit.material('driver', kit.srgb('#5d6268'), rough=0.3, metal=1.0),
    'dark': kit.material('dark', kit.srgb('#1b1c1e'), rough=0.6),
    'red': kit.material('red', kit.srgb('#c23a2c'), rough=0.4),
    'green': kit.material('green', kit.srgb('#2f8f5a'), rough=0.4),
    'braid': kit.material('braid', kit.srgb('#c9ccd0'), rough=0.3, metal=0.75),
    'cable': kit.material('cable', kit.srgb('#c3c7cc'), rough=0.28, metal=0.5),
    'plug': kit.material('plug', kit.srgb('#e0b450'), rough=0.18, metal=1.0),
    'ring': kit.material('ring', kit.srgb('#111111'), rough=0.4),
}


# --- Helpers ---------------------------------------------------------------------------------
def lathe(profile, seg=24):
    """A solid of revolution round +Z from a closed (r, z) outline; r = 0 makes a pole."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:] + rings[:1]):
        if len(a) == 1 and len(b) == 1:
            continue
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1:
                bm.faces.new((a[0], b[j], b[i]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def along(bm, origin, direction):
    """Turn a part modelled along +Z to point along `direction`, its base at `origin`."""
    q = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized())
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=q.to_matrix())
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(origin))
    return bm


def smooth(ob, angle=40):
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))
    return ob


def part(name, bm, mat, parent=None, angle=40):
    return smooth(kit.new_object(name, bm, mat, parent), angle)


def spline(pts, per=6, closed=False):
    """Centripetal Catmull-Rom through `pts`, `per` samples a span: a smooth path, without the
    cusps a uniform one makes where points bunch up, that can be cut anywhere."""
    pts = [Vector(p) for p in pts]
    ext = pts[-1:] + pts + pts[:2] if closed else [2 * pts[0] - pts[1]] + pts + [2 * pts[-1] - pts[-2]]
    out = []
    for i in range(len(ext) - 3):
        p0, p1, p2, p3 = ext[i:i + 4]
        t1 = max((p1 - p0).length, 1e-4) ** 0.5
        t2 = t1 + max((p2 - p1).length, 1e-4) ** 0.5
        t3 = t2 + max((p3 - p2).length, 1e-4) ** 0.5
        for k in range(per):
            t = t1 + (t2 - t1) * k / per
            a1 = p0 * ((t1 - t) / t1) + p1 * (t / t1)
            a2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
            a3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
            b1 = a1 * ((t2 - t) / t2) + a2 * (t / t2)
            b2 = a2 * ((t3 - t) / (t3 - t1)) + a3 * ((t - t1) / (t3 - t1))
            out.append(b1 * ((t2 - t) / (t2 - t1)) + b2 * ((t - t1) / (t2 - t1)))
    if not closed:
        out.append(pts[-1])
    return out


def cable(name, pts, r, mat, sides=2):
    """A cable along a dense polyline, as a mesh."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = sides
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.append(mat)
    return smooth(ob, 60)


def world_verts(obs):
    bpy.context.view_layer.update()
    return [o.matrix_world @ v.co for o in obs for v in o.data.vertices]


def settle(root, rest, lean, axis, lo, hi):
    """Turn `root` about `axis` (world) until the parts it `rest`s on and the parts it `lean`s on
    reach the plinth together, then set it down on z = 0."""
    base = root.rotation_euler.to_matrix()

    def gap(angle):
        root.rotation_euler = (Matrix.Rotation(angle, 3, axis) @ base).to_euler()
        return min(v.z for v in world_verts(lean)) - min(v.z for v in world_verts(rest))

    g_lo = gap(lo)
    for _ in range(30):
        mid = (lo + hi) / 2
        g = gap(mid)
        lo, hi, g_lo = (mid, hi, g) if (g > 0) == (g_lo > 0) else (lo, mid, g_lo)
    gap((lo + hi) / 2)
    root.location.z -= min(v.z for v in world_verts(rest + lean))


def solid(pts, z0, z1):
    """kit.prism, whichever way round the outline runs."""
    bm = kit.prism(pts, z0, z1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def flat_text(name, body, size, mat, location, shear=0.0, parent=None):
    """Printed lettering lying on a face that looks up (+Z), sheared for italics."""
    t = kit.text_mesh(name, body, size, mat, location=(0, 0, 0), facing='+Z', bold=True, depth=0, resolution=3)
    t.data.transform(Matrix(((1, shear, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1))))
    t.location = location
    t.parent = parent
    return t


# --- An earpiece, modelled face up (+Z), the top of the face (the cable) +Y, the nozzle side +X -----
# The right one; the left is its mirror image (its print is not mirrored).
OUTLINE = [(-0.95, -0.12), (-0.86, 0.42), (-0.52, 0.74), (0.0, 0.82), (0.46, 0.76), (0.78, 0.44), (0.92, -0.06),
           (0.78, -0.56), (0.36, -0.8), (-0.26, -0.8), (-0.74, -0.58)]


def earpiece(s):
    root = kit.empty(f'ear_{"lr"[s > 0]}')
    bm = solid([(s * p.x, p.y) for p in spline(OUTLINE, 3, closed=True)], 0, T)
    for z, off, seg in ((T, 0.2, 3), (0.0, 0.24, 3)):  # the face rolls over; the inner side is rounder
        edges = [e for e in bm.edges if all(abs(v.co.z - z) < 1e-4 for v in e.verts)]
        bmesh.ops.bevel(bm, geom=edges, offset=off, segments=seg, affect='EDGES', profile=0.55)
    shell = part('shell', bm, M['clear'], root, 50)

    # The nozzle: a clear stem out of the inner side, forward and in, the tip on it; the bore dark.
    nd = Vector((0.55 * s, 0.08, -1)).normalized()
    no = Vector((0.4 * s, -0.05, 0.25))
    stem = part('stem', along(lathe([(0, 0), (0.5, 0), (0.47, 0.3), (0.34, 0.5), (0.27, 0.6), (0.25, 0.95), (0.285, 0.98), (0.285, 1.05), (0.22, 1.08), (0, 1.08)]), no, nd), M['clear'], root)
    bore = part('bore', along(lathe([(0, 0.45), (0.13, 0.45), (0.13, 1.085), (0, 1.085)], 16), no, nd), M['dark'], root)
    tip_profile = [(0.19, 1.16), (0.31, 1.18), (0.45, 1.13), (0.55, 1.0), (0.585, 0.84), (0.57, 0.67), (0.53, 0.55), (0.47, 0.5), (0.4, 0.52), (0.3, 0.6), (0.26, 0.64), (0.19, 0.64)]
    tip = part('tip', along(lathe(tip_profile, 24), no, nd), M['frost'], root, 60)

    # What shows through: the 9 mm driver behind the nozzle, and its red and green wires.
    dc = no + Vector((-0.12 * s, 0.02, 0.06))
    parts = [
        part('driver', along(lathe([(0, 0), (0.45, 0), (0.45, 0.1), (0.32, 0.13), (0, 0.13)], 32), dc, -nd), M['driver'], root),
        part('magnet', along(lathe([(0, 0), (0.26, 0), (0.26, 0.12), (0, 0.12)], 20), dc, nd), M['dark'], root),
    ]
    for k, mat in ((-1, 'red'), (1, 'green')):
        path = spline([(0.1 * s + 0.05 * k, 0.72, 0.32), (0.05 * s + 0.08 * k, 0.45, 0.4), (dc.x + 0.12 * k, dc.y + 0.3, 0.33), (dc.x + 0.1 * k, dc.y + 0.12, 0.3)], 4)
        w = cable('wire', path, 0.014, M[mat], sides=0)
        w.parent = root
        parts.append(w)

    # The print: MEE with its swoosh, and the side, on the face.
    parts.append(flat_text('mee', 'MEE', 0.3, M['print'], (-0.12 * s, 0.1, T + 0.001), shear=0.25, parent=root))
    arc = [(-0.12 * s + 0.42 * math.cos(a), -0.02 + 0.13 * math.sin(a)) for a in [math.pi * (1.05 + 0.9 * i / 12) for i in range(13)]]
    band = [(x, y - 0.012) for x, y in arc] + [(x, y + 0.012) for x, y in reversed(arc)]
    parts.append(part('swoosh', solid(band, T + 0.0005, T + 0.0015), M['print'], root))
    parts.append(flat_text('side', 'R' if s > 0 else 'L', 0.17, M['print'], (-0.1 * s, -0.36, T + 0.001), parent=root))

    # The relief: ribbed clear plastic out of the top of the shell, along the face.
    ro = Vector((0.12 * s, 0.55, T / 2))
    rd = Vector((0.3 * s, 1, -0.12)).normalized()
    rel = [(0, 0), (0.21, 0), (0.21, 0.3)]
    for i in range(4):
        z = 0.38 + i * 0.15
        r = 0.19 - i * 0.012
        rel += [(r, z), (r - 0.035, z + 0.02), (r - 0.035, z + 0.1), (r, z + 0.12)]
    rel += [(0.15, 1.02), (0.13, 1.08), (0, 1.08)]
    parts.append(part('relief', along(lathe(rel, 16), ro, rd), M['clear'], root))
    end = ro + rd * 1.06
    return root, [shell] + parts, [tip, stem, bore], end, rd


# Laid out as if worn by someone facing the visitor, the right one on the left: tops outwards,
# nozzles back, so each tilts its face to the front as it settles on its tip.
ears = []
for s in (-1, 1):
    root, rest, lean, end, d = earpiece(s)
    root.location = (-1.4 * s, -2.3, 0)
    root.rotation_euler = (0, 0, math.radians(84 * s))
    settle(root, rest, lean, 'X', 0.0, math.radians(70))
    bpy.context.view_layer.update()
    ears.append((root.matrix_world @ end, (root.matrix_world.to_3x3() @ d).normalized()))

# --- Hooks, legs, slider, split -----------------------------------------------------------------
YS = Vector((0, 0.2, 0))  # the front end of the Y-split; the slider sits just in front of it
for (e, d), p in zip(ears, (1, -1)):  # p: outwards
    # Two inches of memory wire, curled as it was last worn: up (outwards), over, and down behind the
    # ear (towards the front); then the cable comes in round the front and back between the two.
    def at(up, back, z=WIRE):
        return Vector((e.x + up * p, e.y - back, z))

    arc = [at(0.65 + 0.8 * math.cos(a), 0.75 + 0.8 * math.sin(a)) for a in [math.radians(-90 + 25 * k) for k in range(9)]]
    arc[0].z, arc[1].z = 0.45, 0.2  # it comes down off the relief
    hook = [e - d * 0.05, e + d * 0.25] + arc
    leg = [at(-0.5, 1.48, CABLE), (1.2 * p, e.y - 1.8, CABLE), (0.45 * p, e.y - 1.55, CABLE), (0.22 * p, e.y - 0.85, CABLE),
           (0.15 * p, YS.y - 1.5, CABLE), (0.1 * p, YS.y - 0.5, CABLE), (0.07 * p, YS.y + 0.6, CABLE)]
    path = [Vector((q.x, q.y, max(q.z, WIRE))) for q in spline([tuple(q) for q in hook] + leg, 5)]  # never into the plinth
    cut_at = 5 * (len(hook) - 1)  # the wire ends where the hook does
    cable('wire', path[:cut_at + 1], WIRE, M['braid'])
    cable('leg', path[cut_at:], CABLE, M['cable'])
    # a clear sleeve over the join
    a, b = path[cut_at - 1], path[cut_at + 1]
    part('sleeve', along(lathe([(0, 0), (0.13, 0), (0.13, 0.3), (0, 0.3)], 16), path[cut_at] - (b - a).normalized() * 0.15, b - a), M['clear'])


def block(w, h, length, y0, mat, r=0.12):
    """A rounded block lying on the plinth, running back (+Y) from y0."""
    bm = kit.prism(kit.rounded_rect(w, h, r, 4), 0, length)
    kit.transform(bm, rotate=(-90, 'X'), translate=(YS.x, YS.y + y0, h / 2))
    ob = part('block', bm, mat)
    kit.bevel(ob, min(w, h) * 0.2, 2, 40)
    return smooth(ob)


block(0.48, 0.3, 0.38, -0.85, M['clear'], 0.13)  # the slider
block(0.5, 0.36, 0.9, 0.0, M['clear'], 0.16)  # the split
ribs = [(0, 0), (0.17, 0)]
for i in range(4):
    r = 0.17 - i * 0.015
    ribs += [(r, i * 0.12 + 0.08), (r - 0.03, i * 0.12 + 0.09), (r - 0.03, i * 0.12 + 0.12)]
ribs += [(0.11, 0.55), (0, 0.55)]
part('block', along(lathe(ribs, 16), YS + Vector((0, 0.88, 0.17)), (0, 1, 0)), M['clear'])

# The main cable, out of the split and round a loose coil twice, inwards, to the plug.
CX, CY, SQ = 0.0, 4.2, 0.85
coil = [YS + Vector((0, 0.5, CABLE)), YS + Vector((0.05, 1.2, CABLE))]
turns, n = 2.1, 26
for i in range(n + 1):
    t = i / n
    a = -math.pi / 2 + 0.4 + 2 * math.pi * turns * t
    r = 2.75 - 1.25 * t + 0.07 * math.sin(5 * a)
    coil.append(Vector((CX + r * math.cos(a), CY + SQ * r * math.sin(a), CABLE)))
coil = spline(coil, 3)
cable('main', coil, CABLE, M['cable'])

# --- The plug: a clear right-angle boot, the gold pin lying flat, at the end of the coil ------------
tx = coil[-1] - coil[-2]
plug = kit.empty('plug_root')
rel = [(0, 0), (0.11, 0)]
for i in range(5):
    r = 0.12 + i * 0.012
    rel += [(r, 0.06 + i * 0.1), (r + 0.03, 0.08 + i * 0.1), (r + 0.03, 0.13 + i * 0.1)]
rel += [(0.2, 0.62), (0, 0.62)]
plug_parts = [part('plug_relief', along(lathe(rel, 16), (0, 0, 0), (1, 0, 0)), M['clear'], plug)]
bm = kit.prism(kit.rounded_rect(0.85, 0.55, 0.2, 6), -0.21, 0.21)
kit.transform(bm, translate=(0.95, 0.06, 0))
body = part('plug_body', bm, M['clear'], plug)
kit.bevel(body, 0.07, 3, 40)
plug_parts.append(smooth(body))
pin = [(0, -0.3), (0.2, -0.3), (0.3, 0), (0.3, 0.06), (0.175, 0.08), (0.175, 0.62), (0.18, 0.62), (0.18, 0.7), (0.175, 0.7), (0.175, 0.95), (0.18, 0.95), (0.18, 1.03), (0.13, 1.06), (0.13, 1.1), (0.175, 1.14), (0.175, 1.2), (0.09, 1.38), (0, 1.4)]
plug_parts.append(part('plug_pin', along(lathe(pin, 24), (1.05, 0.33, 0), (0, 1, 0)), M['plug'], plug))
for y in (0.62, 0.95):  # the black insulating rings between sleeve, ring and tip
    plug_parts.append(part('plug_ring', along(lathe([(0, 0), (0.178, 0), (0.178, 0.07), (0, 0.07)], 24), (1.05, 0.33 + y + 0.01, 0), (0, 1, 0)), M['ring'], plug))
plug_parts.append(cable('plug_core', [Vector((0.3, 0, 0)), Vector((0.95, 0, 0)), Vector((1.05, 0.15, 0))], CABLE, M['cable']))
plug_parts[-1].parent = plug
plug.location = coil[-1] + Vector((0, 0, 0.21 - CABLE))
plug.rotation_euler = (0, 0, math.atan2(tx.y, tx.x))
bpy.context.view_layer.update()
plug.location.z -= min(v.z for v in world_verts(plug_parts))

# --- One object, set down with its origin at the middle of the bottom of the layout ---------------
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in obs:
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
for o in [o for o in bpy.context.scene.objects if o.type == 'EMPTY']:
    bpy.data.objects.remove(o)
m6 = kit.join('m6', obs)
bpy.context.view_layer.objects.active = m6
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo = Vector([min(v.co[i] for v in m6.data.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in m6.data.vertices) for i in range(3)])
m6.data.transform(Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
print('size cm', [round(x, 2) for x in (hi - lo)])

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'top', 'front'), samples=32)
