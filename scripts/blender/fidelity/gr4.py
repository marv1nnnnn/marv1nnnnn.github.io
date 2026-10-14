"""VSonic GR04 (VSONIC 威索尼克 GR04 "Luxury Classic Edition", c. 2010; the moulded name is R04, its
Chinese model name): a dynamic in-ear monitor from Shenzhen, laid out in a case. Two square black
housings with a smoky brown window printed R04 / VSONIC in gold, a nickel nozzle on a swivel
(VSonic's patented variable-angle nozzle) under a black single-flange tip, the cable leaving the top
through a short relief to be worn over the ear; copper-brown cable, a ribbed black Y-split with a
slider, and a right-angle gold plug.

    blender -b --python scripts/blender/fidelity/gr4.py -- [out.glb] [preview.png]

Sources: onliner.by's gallery of the GR04 Classic and Pro Flagship editions (the same housing);
Headfonia's VSonic line-up shoot-out (2013: "squared housing", "brass tinted cable ... on the thick
side", variable-angle nozzle); head-fi's product page (over-the-ear design); smzdm (11 mm driver,
1.3 m cable, 3.5 mm gold-plated plug).
Sizes and weight are not published: estimated from the photos against the 3.5 mm plug and the
nozzle (about 5 mm across its lip). Housing about 15.5 x 15.5 mm, 7.5 mm deep, 17 mm from window
to tip; cable about 2.2 mm; about 18 g in all. The 1.3 m cable is coiled shorter than it is.

Display: lying in a case (z = 0 is the plinth top), front -Y, origin at the middle of the bottom
of the layout. The earpieces stand on their bottom edges at the front, windows to the visitor,
leaning back on their tips; the cables run back to the Y-split and on into a coil, the plug inside
it. No moving parts.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import bmesh  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('gr4')
kit.reset()

S, SR = 1.55, 0.33  # the square housing, seen from the front, and its corner radius
CAP = 0.32  # the front cap (the frame round the window), deep
BACK = 0.74  # where the tapered back shell ends
WIN, WR = 1.08, 0.16  # the window
CABLE = 0.11  # cable radius

M = {
    'body': kit.material('body', kit.srgb('#141414'), rough=0.42),
    'window': kit.material('window', kit.srgb('#3a1d12'), rough=0.12, coat=0.6),
    'gold': kit.material('gold', kit.srgb('#d2aa63'), rough=0.35, metal=0.85),
    'nickel': kit.material('nickel', kit.srgb('#cfcbc4'), rough=0.16, metal=1.0),
    'mesh': kit.material('mesh', kit.srgb('#2e2e2e'), rough=0.55, metal=0.7),
    'tip': kit.material('tip', kit.srgb('#0d0d0e'), rough=0.62),
    'rubber': kit.material('rubber', kit.srgb('#0f0f10'), rough=0.6),
    'cable': kit.material('cable', kit.srgb('#7b4a30'), rough=0.28, coat=0.5),
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


def loft(rings):
    """Skin rings of equal length (lists of 3D points) and cap both ends."""
    bm = bmesh.new()
    vs = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(rings[0])
    for a, b in zip(vs, vs[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(vs[0])
    bm.faces.new(vs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def smooth(ob, angle=40):
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))
    return ob


def part(name, bm, mat, parent=None, angle=40):
    return smooth(kit.new_object(name, bm, mat, parent), angle)


def cable(name, pts, r, mat, res=3, sides=2):
    """A cable through `pts` (a smooth Bezier with automatic handles), as a mesh."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = sides
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
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
    """Turn `root` about `axis` (world) until the parts `rest` stands on and the parts it `lean`s on
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


# --- An earpiece, modelled with its window to -Y, its top (the cable) up, origin at the window -------
def earpiece(side):
    """side: -1 left, +1 right (mirrors the relief and the nozzle's angle; the print is not mirrored)."""
    s = side
    root = kit.empty(f'ear_{"lr"[s > 0]}')
    parts = []

    # The front cap: a rounded square, its front edge rolled, the window let into it.
    bm = kit.front(kit.prism(kit.rounded_rect(S, S, SR, 6), 0, CAP))
    edges = [e for e in bm.edges if all(v.co.y < -CAP + 1e-4 for v in e.verts)]
    bmesh.ops.bevel(bm, geom=edges, offset=0.1, segments=3, affect='EDGES', profile=0.55)
    kit.transform(bm, translate=(0, CAP, 0))  # front face on y = 0
    cap = part('cap', bm, M['body'], root)
    kit.cut(cap, kit.cutter(kit.transform(kit.front(kit.prism(kit.rounded_rect(WIN + 0.04, WIN + 0.04, WR + 0.02, 6), 0, 0.2)), translate=(0, 0.035, 0))))
    smooth(cap)
    parts.append(cap)
    bm = kit.transform(kit.front(kit.prism(kit.rounded_rect(WIN, WIN, WR, 6), 0, 0.03)), translate=(0, 0.06, 0))
    parts.append(part('window', bm, M['window'], root))
    for body, size, z in (('R04', 0.11, 0.24), ('VSONIC', 0.2, -0.06)):
        t = kit.text_mesh('print', body, size, M['gold'], location=(0, 0.0298, z), bold=True, depth=0, resolution=3, spacing=1.05)
        t.parent = root
        parts.append(t)

    # The back shell, tapering from the cap to the boss.
    rings = []
    for y, w, r in ((CAP - 0.01, S - 0.06, SR - 0.03), (CAP + 0.18, S - 0.12, SR - 0.04), (BACK, 1.12, 0.3)):
        rings.append([(x, y, z) for x, z in kit.rounded_rect(w, w, r, 6)])
    shell = part('shell', loft(rings), M['body'], root)
    kit.bevel(shell, 0.05, 2, 30)
    smooth(shell)
    parts.append(shell)

    # The boss the nozzle swivels in, high on the back; the nozzle leans forward a little.
    bx, bz = 0.0, 0.17
    axis = Vector((-0.18 * s, 1, 0.08)).normalized()
    o = Vector((bx, BACK - 0.12, bz))
    parts.append(part('boss', along(lathe([(0, 0), (0.5, 0), (0.5, 0.06), (0.44, 0.24), (0.38, 0.34), (0.3, 0.38), (0, 0.38)]), o, axis), M['body'], root))
    top = o + axis * 0.38
    nozzle = [(0, -0.02), (0.29, -0.02), (0.29, 0.05), (0.2, 0.07), (0.19, 0.3), (0.245, 0.32), (0.245, 0.4), (0.205, 0.42), (0.205, 0.58), (0.185, 0.61), (0, 0.61)]
    parts.append(part('nozzle', along(lathe(nozzle), top, axis), M['nickel'], root))
    parts.append(part('grille', along(lathe([(0, 0), (0.17, 0), (0.17, 0.006), (0, 0.006)], 24), top + axis * 0.607, axis), M['mesh'], root))
    tip_profile = [(0.2, 0.72), (0.31, 0.735), (0.44, 0.69), (0.535, 0.57), (0.57, 0.41), (0.56, 0.25), (0.52, 0.13), (0.47, 0.075), (0.4, 0.095), (0.3, 0.17), (0.25, 0.2), (0.2, 0.2)]
    tip = part('tip', along(lathe(tip_profile, 28), top, axis), M['tip'], root, 60)
    # The relief: a short black boot out of the top corner of the back shell, leaning out and back.
    rel_o = Vector((0.45 * s, CAP + 0.22, S / 2 - 0.2))
    rel_d = Vector((0.5 * s, 0.3, 1)).normalized()
    rel = [(0, 0), (0.19, 0), (0.19, 0.14), (0.165, 0.2), (0.165, 0.3), (0.15, 0.34), (0.15, 0.44), (0.135, 0.48), (0.13, 0.7), (0.12, 0.72), (0, 0.72)]
    parts.append(part('relief', along(lathe(rel, 20), rel_o, rel_d), M['rubber'], root))
    return root, [p for p in parts if p is not tip], [tip], rel_o + rel_d * 0.72, rel_d


ears = []
for s in (-1, 1):
    root, body, tip, end, d = earpiece(s)
    root.location = (1.25 * s, -3.5, 0)
    root.rotation_euler = (0, 0, math.radians(-14 * s))  # toed in a little, as if set down by hand
    settle(root, body, tip, 'X', 0.0, math.radians(-60))
    bpy.context.view_layer.update()
    ears.append((root, root.matrix_world @ end, (root.matrix_world.to_3x3() @ d).normalized()))

# --- The Y-split: a ribbed black block with a slider under it, lying on its back --------------------
YS = Vector((0, -0.4, 0))  # where the legs go in (the front end of the slider)


def block(w, h, length, y0, r=0.12):
    """A rounded block lying on the plinth, running back (+Y) from y0."""
    bm = kit.prism(kit.rounded_rect(w, h, r, 4), 0, length)
    kit.transform(bm, rotate=(-90, 'X'), translate=(YS.x, YS.y + y0, h / 2))
    ob = part('ysplit', bm, M['rubber'])
    kit.bevel(ob, 0.04, 2, 40)
    return smooth(ob)


block(0.5, 0.38, 0.55, 0)  # the slider
block(0.58, 0.44, 1.0, 0.6)  # the split
ribs = [(0, 0), (0.2, 0)]
for i in range(5):  # the ribbed relief into the single cable
    r = 0.2 - i * 0.02
    ribs += [(r, i * 0.13 + 0.09), (r - 0.04, i * 0.13 + 0.1), (r - 0.04, i * 0.13 + 0.13)]
ribs += [(0.12, 0.7), (0, 0.7)]
part('ysplit', along(lathe(ribs, 16), YS + Vector((0, 1.58, 0.2)), (0, 1, 0)), M['rubber'])
for i in (-1, 0, 1):  # three slots in its top
    kit.new_object('slot', kit.prism(kit.rounded_rect(0.1, 0.16, 0.02, 2), 0.441, 0.443), M['body']).location = (YS.x + i * 0.15, YS.y + 1.05, 0)
t = kit.text_mesh('ysplit_print', 'R04', 0.13, M['body'], location=(YS.x, YS.y + 0.28, 0.381), facing='+Z', bold=True, depth=0.004, resolution=3)
t.data.transform(Matrix.Rotation(math.radians(90), 4, 'Z'))

# --- Cables ---------------------------------------------------------------------------------
for (_, end, d), s in zip(ears, (-1, 1)):
    pts = [
        tuple(end - d * 0.05),
        tuple(end + d * 0.12),
        tuple(end + Vector((0.3 * s, 0.3, -0.35))),
        (end.x + 0.55 * s, end.y + 0.75, 0.45),
        (end.x + 0.6 * s, end.y + 1.3, CABLE),
        (0.6 * s, YS.y - 0.55, CABLE),
        (0.1 * s, YS.y + 0.2, CABLE),
    ]
    cable('leg', pts, CABLE, M['cable'], res=6)

# The main cable leaves the split and goes round a loose coil twice, inwards, to the plug.
CX, CY, SQ = 0.0, 4.9, 0.85
coil = [tuple(YS + Vector((0, 1.7, CABLE))), (0.05, YS.y + 2.5, CABLE)]
turns, n = 2.2, 34
for i in range(n + 1):
    t = i / n
    a = -math.pi / 2 + 0.35 + 2 * math.pi * turns * t
    r = 3.2 - 1.55 * t + 0.07 * math.sin(5 * a)  # a loose coil, not a machine's
    coil.append((CX + r * math.cos(a), CY + SQ * r * math.sin(a), CABLE))
cable('main', coil, CABLE, M['cable'], res=3)

# --- The plug: a right-angle black body, the gold pin lying flat, at the end of the coil -----------
p1, p0 = Vector(coil[-1]), Vector(coil[-2])
tx = (p1 - p0).normalized()
tx.z = 0
tx.normalize()
plug = kit.empty('plug_root')
plug_parts = [
    part('plug_relief', along(lathe([(0, 0), (0.13, 0), (0.13, 0.25), (0.15, 0.27), (0.15, 0.35), (0.17, 0.37), (0.17, 0.45), (0.2, 0.47), (0.21, 0.62), (0, 0.62)], 20), (0, 0, 0), (1, 0, 0)), M['rubber'], plug),
]
bm = kit.prism(kit.rounded_rect(0.95, 0.62, 0.22, 6), -0.24, 0.24)
kit.transform(bm, translate=(1.0, 0.07, 0))
body = part('plug_body', bm, M['rubber'], plug)
kit.bevel(body, 0.08, 3, 40)
plug_parts.append(smooth(body))
pin = [(0, 0), (0.3, 0), (0.3, 0.06), (0.175, 0.08), (0.175, 0.62), (0.18, 0.62), (0.18, 0.7), (0.175, 0.7), (0.175, 0.95), (0.18, 0.95), (0.18, 1.03), (0.13, 1.06), (0.13, 1.1), (0.175, 1.14), (0.175, 1.2), (0.09, 1.38), (0, 1.4)]
plug_parts.append(part('plug_pin', along(lathe(pin, 28), (1.12, 0.36, 0), (0, 1, 0)), M['plug'], plug))
for y in (0.62, 0.95):  # the black insulating rings between sleeve, ring and tip
    plug_parts.append(part('plug_ring', along(lathe([(0, 0), (0.178, 0), (0.178, 0.07), (0, 0.07)], 28), (1.12, 0.36 + y + 0.01, 0), (0, 1, 0)), M['ring'], plug))
plug.location = p1 + Vector((0, 0, 0.24 - CABLE))
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
gr4 = kit.join('gr4', obs)
bpy.context.view_layer.objects.active = gr4
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo = Vector([min(v.co[i] for v in gr4.data.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in gr4.data.vertices) for i in range(3)])
gr4.data.transform(Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
print('size cm', [round(x, 2) for x in (hi - lo)])

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'top', 'front'), samples=32)
