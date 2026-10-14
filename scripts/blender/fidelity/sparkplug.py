"""The Koss Spark Plug (c. 2005), white: an in-ear "stereophone" built like its name. A white body
ribbed like a spark plug's insulator, a satin silver band printed KOSS round it, and a tapered black
memory-foam cushion (formed hydrophilic urethane) on the nozzle, its sound bore open at the end. The
back is a flat disc, a ring of ten vents round the L or R. The cord leaves the body's side through a
ringed relief, white, joins at a small Y and ends in a right-angled 3.5 mm plug.

    blender -b --python scripts/blender/fidelity/sparkplug.py -- [out.glb] [preview.png]

Sources: Koss's product photos (koss.com/products/sparkplug: SparkPlugk, SparkPlugw), the white
Spark Plug of the mid-2000s in its Koss-Europe blister and on audiofanzine and Les Numeriques, the
spare cushions; Soundhouse (Japan): the body 25 x 15 x 15 mm without the cushion, 14 g, 1.2 m
straight cord, L-shaped 3.5 mm plug, the same tube port and driver as The Plug (1999); on sale by
November 2005 (a hwupgrade.it classified). Koss sells it in black and white; the white, the
original's colour, is the one most pictured.
Sizes beyond those are estimated from the photos against the 15 mm body: the cushion 16.5 mm long,
14.3 mm across at the body and 10.5 mm at its end, the band 5 mm wide, the body 7.8 mm long, the
relief 9 mm, the cord about 1.5 mm. The 1.2 m cord is coiled shorter than it is.

Display: lying in a case (z = 0 is the plinth top), front -Y, origin at the middle of the bottom of
the layout. The earpieces lie on their sides at the front, backs together and cushions out, resting
on the band and the cushion's end; their cords run back to the Y and on into a loose coil, the plug
inside it. Nothing moves.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('sparkplug')
kit.reset()

CABLE = 0.075  # cord radius
SEG = 32  # round parts

M = {
    'shell': kit.material('shell', kit.srgb('#f1f0ec'), rough=0.22, coat=0.4),
    'band': kit.material('band', kit.srgb('#c4c6c9'), rough=0.3, metal=1.0),
    'foam': kit.material('foam', kit.srgb('#1b1b1c'), rough=0.95),
    'ink': kit.material('ink', kit.srgb('#161616'), rough=0.5),
    'vent': kit.material('vent', kit.srgb('#5d5a55'), rough=0.6),
    'cord': kit.material('cord', kit.srgb('#ecebe7'), rough=0.35),
    'nickel': kit.material('nickel', kit.srgb('#d6d6d4'), rough=0.16, metal=1.0),
    'ring': kit.material('ring', kit.srgb('#1a1a1a'), rough=0.4),
}


# --- Helpers ----------------------------------------------------------------------------------------
def lathe(profile, seg=SEG):
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


def part(name, bm, mat, angle=40):
    ob = kit.new_object(name, bm, mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))
    return ob


def letters(name, body, size, mat, res=2):
    """Flat lettering in the XY plane, centred, facing +Z."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    f = kit.font('sans')
    if f:
        curve.font = f
    curve.offset = size * 0.02
    ob = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    return ob


def cord(name, pts, mat, res=4):
    """A cord through `pts` (a smooth Bezier with automatic handles), as a mesh."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = CABLE
    cu.bevel_resolution = 1
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
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


# --- An earpiece, along +Z from its back (z = 0) to the cushion's end; the relief out along -Y -------
RELIEF_Z = 0.5  # where the relief leaves the body, back from the band
BODY = [  # the white body: the back's rim, three ribs, into the band
    (0, 0.03), (0.6, 0.03), (0.63, 0.0), (0.69, 0.0), (0.725, 0.03), (0.745, 0.1), (0.745, 0.15), (0.725, 0.21),
    (0.665, 0.26), (0.665, 0.33), (0.73, 0.39), (0.75, 0.45), (0.75, 0.5), (0.73, 0.56),
    (0.67, 0.61), (0.67, 0.67), (0.73, 0.72), (0.73, 0.78), (0, 0.78),
]
BAND = [(0.55, 0.775), (0.725, 0.775), (0.742, 0.792), (0.742, 1.263), (0.725, 1.28), (0.55, 1.28)]
TIP = [  # the foam cushion, tapering away from the body, the bore open at its end
    (0, 1.275), (0.7, 1.275), (0.722, 1.3), (0.725, 1.36), (0.68, 1.75), (0.62, 2.3), (0.56, 2.8), (0.545, 2.87),
    (0.515, 2.925), (0.46, 2.945), (0.19, 2.945), (0.15, 2.92), (0.14, 2.88), (0.14, 2.62), (0, 2.62),
]
RELIEF = [  # out of the body's side, ringed at its end where the cord leaves it
    (0, 0.5), (0.175, 0.5), (0.175, 0.86), (0.16, 0.9), (0.14, 1.05), (0.125, 1.2), (0.14, 1.22), (0.14, 1.28),
    (0.115, 1.3), (0.14, 1.32), (0.14, 1.38), (0.1, 1.44), (CABLE, 1.47), (0, 1.47),
]


def band_print(name, theta, mat):
    """KOSS round the band: the lettering bent onto it, reading round, its tops towards the back."""
    ob = letters(name, 'KOSS', 0.42, mat)
    r, zc = 0.742, 1.03
    for v in ob.data.vertices:
        x, y, z = v.co
        a = theta - x / r
        rr = r + 0.0025 + z
        v.co = (rr * math.cos(a), rr * math.sin(a), zc - y)
    return ob


def earpiece(side):
    """side: 'L' or 'R'. Returns (body parts, cushion parts) in the earpiece's own frame."""
    body = [
        part('body', lathe(BODY), M['shell'], 50),
        part('band', lathe(BAND), M['band'], 50),
        part('relief', along(lathe(RELIEF, 16), (0, 0, RELIEF_Z), (0, -1, 0)), M['shell'], 50),
    ]
    for k in range(3):
        body.append(band_print('koss', math.radians(90 + 120 * k), M['ink']))
    # the back: ten vents round the letter (none at top and bottom)
    vents = bmesh.new()
    for k in range(12):
        if k in (3, 9):
            continue
        a = math.radians(30 * k)
        c = kit.cylinder(0.055, -0.004, 0.0, 10, x=0.4 * math.cos(a), y=0.4 * math.sin(a))
        kit.transform(c, translate=(0, 0, 0.03))
        me = bpy.data.meshes.new('tmp')
        c.to_mesh(me)
        c.free()
        vents.from_mesh(me)
        bpy.data.meshes.remove(me)
    body.append(part('vents', vents, M['vent'], 20))
    t = letters('side', side, 0.26, M['vent'])
    # facing out of the back (-Z), upright with the relief down: reading along -X
    t.data.transform(Matrix(((-1, 0, 0, 0), (0, 1, 0, 0), (0, 0, -1, 0.026), (0, 0, 0, 1))))
    body.append(t)
    return body, [part('cushion', lathe(TIP), M['foam'], 60)]


def lay(obs, cushion, origin, toward, back):
    """Set an earpiece down: its axis along `toward` (in the plane), the relief pointing `back`, tilted
    about the relief until it rests on its band and the cushion's end together."""
    d0 = Vector((toward[0], toward[1], 0)).normalized()
    h = Vector((back[0], back[1], 0))
    h = (h - d0 * h.dot(d0)).normalized()  # square to the axis

    def frame(tilt):
        d = (d0 * math.cos(tilt) + Vector((0, 0, -math.sin(tilt)))).normalized()
        y = -h
        x = y.cross(d)
        return Matrix(((x.x, y.x, d.x), (x.y, y.y, d.y), (x.z, y.z, d.z)))

    pts_body = [v.co.copy() for o in obs for v in o.data.vertices]
    pts_tip = [v.co.copy() for o in cushion for v in o.data.vertices]
    lo, hi = 0.0, math.radians(20)
    for _ in range(30):  # the tilt at which the cushion's end comes down to the band's level
        mid = (lo + hi) / 2
        B = frame(mid)
        g = min((B @ p).z for p in pts_tip) - min((B @ p).z for p in pts_body)
        lo, hi = (mid, hi) if g > 0 else (lo, mid)
    B = frame((lo + hi) / 2).to_4x4()
    B.translation = Vector(origin)
    for o in obs + cushion:
        o.data.transform(B)
    floor = min(v.co.z for o in obs + cushion for v in o.data.vertices)
    for o in obs + cushion:
        o.data.transform(Matrix.Translation((0, 0, -floor)))
    end = B @ Vector((0, -1.47, RELIEF_Z)) - Vector((0, 0, floor))
    return end, (B.to_3x3() @ Vector((0, -1, 0))).normalized()


parts = []
ends = []
for side, s in (('L', -1), ('R', 1)):
    body, cushion = earpiece(side)
    # backs together near the middle, cushions out and a little forward; the reliefs back
    a = math.radians(14)
    end, d = lay(body, cushion, (0.75 * s, -3.4, 0), (s * math.cos(a), -math.sin(a)), (s * 0.15, 1))
    parts += body + cushion
    ends.append((end, d, s))

# --- The Y: a little white bullet lying along Y, the two leads into its front --------------------------
YS = Vector((0, 0.4, 0))  # its front end
Y_PROFILE = [(0, 0), (0.1, 0), (0.17, 0.08), (0.2, 0.25), (0.205, 0.7), (0.19, 0.95), (0.14, 1.12), (0.1, 1.2), (0, 1.2)]
ysplit = part('ysplit', along(lathe(Y_PROFILE, 16), YS + Vector((0, 0, 0.205)), (0, 1, 0)), M['cord'])
parts.append(ysplit)

for end, d, s in ends:
    pts = [
        end - d * 0.05,
        end + d * 0.3,
        Vector((end.x + 0.45 * s, end.y + 0.75, 0.18)),
        Vector((1.0 * s, YS.y - 0.75, CABLE)),
        Vector((0.25 * s, YS.y - 0.3, CABLE + 0.06)),
        YS + Vector((0.05 * s, 0.1, 0.2)),
    ]
    parts.append(cord('lead', pts, M['cord'], res=5))

# The cord leaves the Y and goes round a loose coil twice, inwards, to the plug.
CX, CY, SQ = 0.0, 4.25, 0.7
coil = [YS + Vector((0, 1.15, 0.2)), Vector((0.05, YS.y + 1.45, CABLE)), Vector((0.4, YS.y + 1.55, CABLE))]
turns, n = 1.45, 26  # ends at the back of the coil, the plug lying inside it
for i in range(n + 1):
    t = i / n
    a = -math.pi / 2 + 0.3 + 2 * math.pi * turns * t
    r = 4.1 - 1.5 * t + 0.07 * math.sin(5 * a)  # a loose coil, not a machine's
    coil.append(Vector((CX + r * math.cos(a), CY + SQ * r * math.sin(a), CABLE)))

# --- The plug: right-angled, white, its nickel pin lying flat, at the end of the coil ----------------------
H = 0.27  # the plug's axis above the plinth
p1, p0 = coil[-1], coil[-2]
tx = Vector((p1.x - p0.x, p1.y - p0.y, 0)).normalized()
coil.append(p1 + tx * 0.25 + Vector((0, 0, H - CABLE)))  # up into the plug's relief
p1 = coil[-1] - Vector((0, 0, H))
plug = []
relief = [(0, 0), (CABLE + 0.01, 0), (0.12, 0.08), (0.13, 0.2)]
for k in range(4):  # ribbed
    z = 0.22 + 0.11 * k
    relief += [(0.15, z), (0.15, z + 0.06), (0.13, z + 0.08)]
relief += [(0.2, 0.68), (0.2, 0.7), (0, 0.7)]
plug.append(part('plug_relief', along(lathe(relief, 16), (0, 0, H), (1, 0, 0)), M['cord']))
bm = kit.prism(kit.rounded_rect(0.95, 0.56, 0.2, 5), H - 0.25, H + 0.25)
kit.transform(bm, translate=(1.1, 0.06, 0))
body = part('plug_body', bm, M['cord'])
kit.bevel(body, 0.07, 2, 40)
plug.append(body)
pin = [(0, 0), (0.27, 0), (0.27, 0.12), (0.175, 0.15), (0.175, 0.62), (0.18, 0.62), (0.18, 0.7), (0.175, 0.7), (0.175, 0.95), (0.18, 0.95), (0.18, 1.03), (0.13, 1.06), (0.13, 1.1), (0.175, 1.14), (0.175, 1.2), (0.09, 1.38), (0, 1.4)]
plug.append(part('plug_pin', along(lathe(pin, 20), (1.2, 0.33, H), (0, 1, 0)), M['nickel']))
for y in (0.62, 0.95):
    plug.append(part('plug_ring', along(lathe([(0, 0), (0.178, 0), (0.178, 0.07), (0, 0.07)], 20), (1.2, 0.33 + y + 0.01, H), (0, 1, 0)), M['ring']))
R = Matrix.Rotation(math.atan2(tx.y, tx.x), 4, 'Z')
for o in plug:
    o.data.transform(Matrix.Translation(p1) @ R)
parts += plug
parts.append(cord('main', coil, M['cord'], res=3))

# --- One object, its origin at the middle of the bottom of the layout ------------------------------------
sp = kit.join('sparkplug', parts)
lo = Vector([min(v.co[i] for v in sp.data.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in sp.data.vertices) for i in range(3)])
sp.data.transform(Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
print('size [w, h, d] cm:', [round(v, 2) for v in (hi.x - lo.x, hi.z - lo.z, hi.y - lo.y)])

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'top', 'side'), samples=32)
