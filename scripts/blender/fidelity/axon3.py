"""NUX Axon 3 (NFM-03, 2025), black, a pair: tall little cabinets of charcoal ABS, their fronts
softly rounded and their backs rolled over like pillows, a seam round each a finger behind the face.
On the front a 3/4" silk dome under a domed grille of triangles in a shallow dish, a 3" woofer
behind a flat grille of the same triangles in a black ring, the red NUX badge on the ring's foot,
and the port: an oval mouth in a scoop. Each stands on two rubber saddles, one under the front,
one under the back. The left speaker is the active one: the green light under its woofer, and on
its back the volume knob, Bluetooth key, USB-C, the link out to the right speaker, DC in, AUX, RCA
and 1/4" ins and the power switch. The right one's back has only the link in.

    blender -b --python scripts/blender/fidelity/axon3.py -- [out.glb] [preview.png]

Size (each): 94 W x 205 H x 150 D mm, the pair 1.98 kg (NUX's spec sheet gives "205 (L) x 94 (W) x
150 (H) mm", but its own pictures stand it 205 tall, 94 wide and 150 deep: nuxaudio.com/product/
axon3, and the owner's manual, NUX_NFM03_UserManual_V6_English.pdf). Laid out from NUX's straight-on
renders of the front and back (AXON-3-Studio-Monitors_W_11 / _W_13) and the manual's panel drawings.

The pair stands square on, 6 cm apart, origin at the middle of the bottom of the pair. Nothing moves.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('axon3')
kit.reset()

W, D = 9.4, 15.0
FOOT = 1.4  # the saddles it stands on
HT = 20.5  # the top of the cabinet
CH = HT - FOOT  # the cabinet's own height
R = 1.7  # its corners, seen from the front
F, B = -D / 2, D / 2
GAP = 6.0
TWEET = (0.0, HT - 3.43)
WOOF = (0.0, HT - 10.4)
PORT = (0.0, HT - 16.36)
SEG = 64

M = {
    'shell': kit.material('shell', kit.srgb('#2f2f32'), rough=0.62),
    'seam': kit.material('seam', kit.srgb('#0b0b0c'), rough=0.8),
    'ring': kit.material('ring', kit.srgb('#0d0d0e'), rough=0.32),
    'grille': kit.material('grille', kit.srgb('#2a2b2e'), rough=0.42, metal=0.6),
    'cone': kit.material('cone', kit.srgb('#1c1c1e'), rough=0.55),
    'surround': kit.material('surround', kit.srgb('#111112'), rough=0.6),
    'cap': kit.material('cap', kit.srgb('#0e0e0f'), rough=0.3, coat=0.3),
    'hole': kit.material('hole', kit.srgb('#030303'), rough=0.9),
    'badge': kit.material('badge', kit.srgb('#d01f2a'), rough=0.18, coat=1.0),
    'white': kit.material('white', kit.srgb('#f0f0f0'), rough=0.5),
    'led': kit.material('led', kit.srgb('#5cff7c'), rough=0.2, emission=kit.srgb('#2bff5a'), strength=5.0),
    'rubber': kit.material('rubber', kit.srgb('#121213'), rough=0.85),
    'print': kit.material('print', kit.srgb('#8e8e92'), rough=0.6),
    'knob': kit.material('knob', kit.srgb('#141415'), rough=0.45),
    'nickel': kit.material('nickel', kit.srgb('#b4b6b9'), rough=0.25, metal=1.0),
    'red': kit.material('red', kit.srgb('#c3161c'), rough=0.4),
}


# --- Helpers ----------------------------------------------------------------------------------------

def yslab(pts, y0, y1, cx=0.0, cz=0.0):
    """An outline in (x, z) as seen from the front, made solid from y0 back to y1."""
    bm = kit.front(kit.prism(pts, 0, y1 - y0), y1)
    return kit.transform(bm, translate=(cx, 0, cz))


def ycyl(r, y0, y1, cx=0.0, cz=0.0, seg=SEG, r1=None):
    """A cylinder along Y from y0 to y1 (r at y1, r1 at y0)."""
    bm = kit.cylinder(r, -y1, -y0, seg, r1=r1)
    return kit.transform(bm, rotate=(90, 'X'), translate=(cx, 0, cz))


def box(x0, x1, y0, y1, z0, z1):
    return kit.prism([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1)


def ellipse(a, b, seg=32):
    return [(a * math.cos(2 * math.pi * i / seg), b * math.sin(2 * math.pi * i / seg)) for i in range(seg)]


def bevel_edges(bm, pick, offset, segments=4, profile=0.5):
    edges = [e for e in bm.edges if all(pick(v.co) for v in e.verts)]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=segments, affect='EDGES', profile=profile)
    return bm


def lathe(name, profile, mat, cx, cz, seg=SEG, facing=-1, smooth=True):
    """A surface of revolution about a line along Y through (cx, cz): profile is [(r, y)], outside
    in. Its faces are turned to look along `facing` (-1: to the front)."""
    bm = bmesh.new()
    rings = []
    for r, y in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((cx, y, cz))])
        else:
            rings.append([bm.verts.new((cx + r * math.cos(2 * math.pi * i / seg), y, cz + r * math.sin(2 * math.pi * i / seg))) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            if len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            elif len(a) == 1:
                bm.faces.new((a[0], b[j], b[i]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.normal_update()
    if sum(f.normal.y * f.calc_area() for f in bm.faces) * facing < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    ob = kit.new_object(name, bm, mat)
    if smooth:
        kit.shade_smooth(ob, 70)
    return ob


def cut(ob, bm, mat=None):
    """Boolean away a cutter; with `mat`, the walls it leaves take that material."""
    c = kit.cutter(bm)
    if mat:
        c.data.materials[0] = mat
    kit.apply(ob, 'BOOLEAN', object=c, operation='DIFFERENCE', solver='EXACT', material_mode='TRANSFER' if mat else 'INDEX')
    bpy.data.objects.remove(c)


def text(name, body, size, mat, loc, facing='+Y', align='CENTER', bold=False, res=2, spacing=1.0):
    """Flat print a hair off a face looking along `facing`, upright."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    curve.space_character = spacing
    f = kit.font('sans')
    if f:
        curve.font = f
    curve.size = size
    curve.offset = size * 0.03 if bold else 0
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
    a, u = (Vector((-1, 0, 0)), Vector((0, 0, 1))) if facing == '+Y' else (Vector((1, 0, 0)), Vector((0, 0, 1)))
    n = a.cross(u)
    ob.data.transform(Matrix(((a.x, u.x, n.x, 0), (a.y, u.y, n.y, 0), (a.z, u.z, n.z, 0), (0, 0, 0, 1))))
    ob.location = Vector(loc) + n * 0.002
    return ob


def grille(name, cx, cz, y0, rb, h, pitch, width, angles, mat, thick=0.035, k=8):
    """A grille of straight wires in each direction of `angles` (degrees from +X), `pitch` apart,
    over a disc of radius rb at y0: flat (h = 0) or bent over a spherical cap standing h forward
    (-Y). The gaps between are open; each wire is its face and two edges."""
    R_ = (rb * rb + h * h) / (2 * h) if h else 0.0
    yc = y0 - h + R_

    def lift(x, z, out=0.0):
        if not h:
            return y0 - out
        return yc - math.sqrt(max(R_ * R_ - (x - cx) ** 2 - (z - cz) ** 2, 0.0)) - out

    bm = bmesh.new()
    for deg in angles:
        a = math.radians(deg)
        d = (math.cos(a), math.sin(a))
        n = (-d[1], d[0])
        o = -rb + (rb * 2 % pitch) / 2
        while o <= rb:
            half = math.sqrt(max(rb * rb - o * o, 0.0))
            if half > pitch / 2:
                rows = []
                for i in range(k + 1):
                    t = -half + 2 * half * i / k
                    ring = []
                    for s, out in ((-width / 2, 0.0), (-width / 2, thick), (width / 2, thick), (width / 2, 0.0)):
                        x = cx + o * n[0] + t * d[0] + s * n[0]
                        z = cz + o * n[1] + t * d[1] + s * n[1]
                        ring.append(bm.verts.new((x, lift(x, z, out), z)))
                    rows.append(ring)
                for p, q in zip(rows, rows[1:]):
                    for e in range(3):
                        bm.faces.new((p[e], p[e + 1], q[e + 1], q[e]))
            o += pitch
    bm.normal_update()
    for f in bm.faces:  # all turned to the front
        if f.normal.y > 0.05 or (abs(f.normal.y) <= 0.05 and f.normal.dot(f.calc_center_median() - Vector((cx, f.calc_center_median().y, cz))) < 0):
            f.normal_flip()
    return kit.new_object(name, bm, mat)


# --- The cabinet: one shell, its face eased, its back rolled right over, a seam round it -----------
zc = FOOT + CH / 2
outline = kit.rounded_rect(W, CH, R, 10)
bm = yslab(outline, F, B, cz=zc)
bevel_edges(bm, lambda co: co.y < F + 1e-4, 0.55, 4)
bevel_edges(bm, lambda co: co.y > B - 1e-4, 1.5, 7)
body = kit.new_object('body', bm, M['shell'])
groove = kit.cutter(yslab(kit.rounded_rect(W + 1, CH + 1, R, 10), F + 1.18, F + 1.26, cz=zc))
kit.cut(groove, kit.cutter(yslab(kit.rounded_rect(W - 0.08, CH - 0.08, R - 0.04, 10), F + 1.1, F + 1.4, cz=zc)))
groove.data.materials[0] = M['seam']
kit.apply(body, 'BOOLEAN', object=groove, operation='DIFFERENCE', solver='EXACT', material_mode='TRANSFER')
bpy.data.objects.remove(groove)
cut(body, ycyl(4.3, F - 1, F + 3.0, *WOOF))
cut(body, ycyl(2.35, F - 1, F + 1.2, *TWEET))
# the port: a scoop running down into an oval mouth, black inside
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=1.0)
cut(body, kit.transform(bm, scale=(1.8, 0.75, 0.8), translate=(PORT[0], F, PORT[1] + 0.11)))
cut(body, yslab(ellipse(1.4, 0.6, 40), F - 1, F + 6.0, *PORT), M['hole'])
# the stand socket underneath
cut(body, kit.cylinder(0.48, FOOT - 1, FOOT + 1.0, 24), M['hole'])
kit.shade_smooth(body, 40)
parts = [body]

# --- The woofer: a black ring, the flat grille across it, the cone behind -------------------------
parts += [
    lathe('ring', [(4.5, F + 0.6), (4.5, F - 0.1), (4.46, F - 0.22), (4.36, F - 0.3), (4.22, F - 0.31), (4.1, F - 0.24), (4.05, F - 0.1), (4.05, F + 0.9)], M['ring'], *WOOF),
    lathe('surround', [(4.05, F + 0.9)] + [(3.73 + 0.3 * math.cos(math.pi * i / 6), F + 0.9 - 0.22 * math.sin(math.pi * i / 6)) for i in range(7)], M['surround'], *WOOF, seg=48),
    lathe('cone', [(3.43 - 2.18 * s / 4, F + 0.9 + 1.3 * (s / 4) ** 1.2) for s in range(5)], M['cone'], *WOOF, seg=48),
    lathe('cap', [(1.25 * math.cos(math.pi / 2 * k / 5), F + 2.2 - 0.5 * math.sin(math.pi / 2 * k / 5)) for k in range(6)], M['cap'], *WOOF, seg=40),
    grille('grille', *WOOF, F + 0.05, 4.08, 0, 0.26, 0.055, (0, 60, 120), M['grille'], thick=0.04, k=1),
]

# --- The tweeter: a shallow dish, a ring, a dark dome under a domed grille ----------------------
parts += [
    lathe('wave', [(2.35, F), (2.25, F + 0.15), (2.0, F + 0.3), (1.8, F + 0.36)], M['shell'], *TWEET),
    lathe('rim', [(1.8, F + 0.36), (1.77, F + 0.28), (1.71, F + 0.28), (1.68, F + 0.38)], M['grille'], *TWEET, seg=48),
    lathe('dome', [(1.66 * math.cos(math.pi / 2 * k / 5), F + 0.38 - 0.92 * math.sin(math.pi / 2 * k / 5)) for k in range(6)], M['hole'], *TWEET, seg=32),
    grille('tgrille', *TWEET, F + 0.37, 1.72, 1.0, 0.26, 0.05, (0, 60, 120), M['grille']),
]

# --- The badge on the ring's foot: red, NUX in white ------------------------------------------------
badge = kit.new_object('badge', yslab(ellipse(1.16, 0.36), F - 0.36, F + 0.1, 0, WOOF[1] - 3.8), M['badge'])
kit.bevel(badge, 0.05, 2, angle=40)
kit.shade_smooth(badge, 50)
parts += [badge, text('nux', 'NUX', 0.42, M['white'], (0, F - 0.36, WOOF[1] - 3.8), facing='-Y', bold=True, res=3, spacing=1.15)]


# --- Two rubber saddles under each, the cabinet's rounded foot sitting in them ----------------------
def saddle(y0, y1):
    pts = [(-4.05, 0), (-2.6, 0), (-2.0, 0.42), (2.0, 0.42), (2.6, 0), (4.05, 0), (4.05, 0.28), (3.45, 1.47), (3.15, 1.52),
           (2.85, FOOT), (-2.85, FOOT), (-3.15, 1.52), (-3.45, 1.47), (-4.05, 0.28)]
    ob = kit.new_object('saddle', yslab(pts, y0, y1), M['rubber'])
    kit.bevel(ob, 0.08, 2, angle=30)
    return ob


parts += [saddle(F + 0.5, F + 2.9), saddle(B - 3.8, B - 1.4)]

# --- The name on both backs ---------------------------------------------------------------------------
PY = B  # the back's flat face


def zt(mm):
    """Height on the back, from millimetres down from the top."""
    return HT - mm / 10


parts += [
    text('axon', 'AXON 3', 0.66, M['print'], (0, PY, zt(46)), bold=True, res=3, spacing=1.18),
    text('srm', 'STUDIO REFERENCE MONITOR', 0.2, M['print'], (0, PY, zt(52)), bold=True, spacing=1.12),
]

# One cabinet, twice: the same mesh for both.
cabinet = kit.join('axon3_l', parts)
for m in list(cabinet.modifiers):
    bpy.context.view_layer.objects.active = cabinet
    bpy.ops.object.modifier_apply(modifier=m.name)
X = W / 2 + GAP / 2
cabinet.location.x = -X
twin = cabinet.copy()
twin.name = 'axon3_r'
bpy.context.scene.collection.objects.link(twin)
twin.location.x = X


# --- The left one's panel: the light in front, the controls and sockets on the back ---------------
def label(body_, x, mm, size=0.17):
    return text('label', body_, size, M['print'], (x, PY, zt(mm)), bold=True, spacing=1.12)


def din(x, z):
    """The 4-pin link socket: a black round socket, four pin holes and the key."""
    s = kit.new_object('din', ycyl(0.62, PY - 0.05, PY + 0.08, x, z, 32), M['knob'])
    cut(s, ycyl(0.48, PY + 0.02, PY + 1, x, z, 32), M['hole'])
    pins = [kit.new_object('pin', ycyl(0.05, PY - 0.02, PY + 0.03, x + 0.24 * math.cos(math.radians(a)), z + 0.24 * math.sin(math.radians(a)), 8), M['nickel'])
            for a in (45, 135, 225, 315)]
    return [s, kit.new_object('key', box(x - 0.06, x + 0.06, PY - 0.02, PY + 0.03, z - 0.48, z - 0.3), M['knob'])] + pins


L, Rx = 1.29, -1.29  # the two columns (from behind, the left column is +X)
panel = [
    kit.new_object('led', ycyl(0.15, F - 0.03, F + 0.3, 0, WOOF[1] - 4.92, 16), M['led']),
    # volume knob with its white dot, the Bluetooth key, USB-C
    kit.new_object('volume', ycyl(0.82, PY - 0.05, PY + 0.95, L, zt(72), 40, r1=0.86), M['knob']),
    kit.new_object('dot', ycyl(0.07, PY + 0.95, PY + 0.96, L, zt(72) + 0.58, 12), M['white']),
    kit.new_object('bt', ycyl(0.5, PY - 0.05, PY + 0.3, L, zt(94.5), 32), M['knob']),
    kit.new_object('usbc', yslab(kit.rounded_rect(0.9, 0.32, 0.16, 4), PY - 0.2, PY + 0.02, L, zt(113)), M['hole']),
    kit.new_object('usbtongue', box(L - 0.3, L + 0.3, PY - 0.05, PY + 0.0, zt(113) - 0.04, zt(113) + 0.04), M['nickel']),
    # DC in
    kit.new_object('dc', box(L - 0.65, L + 0.65, PY - 0.05, PY + 0.06, zt(158) - 0.75, zt(158) + 0.75), M['knob']),
    kit.new_object('dchole', ycyl(0.28, PY - 0.05, PY + 0.065, L, zt(158), 20), M['hole']),
    kit.new_object('dcpin', ycyl(0.07, PY - 0.05, PY + 0.07, L, zt(158), 8), M['nickel']),
    # AUX, RCA L/R, 1/4" L/R
    kit.new_object('aux', ycyl(0.3, PY - 0.05, PY + 0.06, Rx, zt(71), 24), M['nickel']),
    kit.new_object('auxhole', ycyl(0.17, PY - 0.05, PY + 0.065, Rx, zt(71), 16), M['hole']),
    # power switch
    kit.new_object('swslot', yslab(kit.rounded_rect(1.25, 0.6, 0.28, 4), PY - 0.05, PY + 0.03, Rx, zt(163.5)), M['knob']),
    kit.new_object('swnub', yslab(kit.rounded_rect(0.55, 0.5, 0.24, 4), PY - 0.05, PY + 0.2, Rx + 0.3, zt(163.5)), M['hole']),
]
for mm, ring in ((88, M['nickel']), (103.7, M['red'])):
    panel += [kit.new_object('rca', ycyl(0.55, PY - 0.05, PY + 0.1, Rx, zt(mm), 32), M['knob']),
              kit.new_object('rcaring', ycyl(0.38, PY - 0.05, PY + 0.32, Rx, zt(mm), 24), ring),
              kit.new_object('rcahole', ycyl(0.17, PY - 0.05, PY + 0.325, Rx, zt(mm), 12), M['hole'])]
for mm in (122, 141):
    panel += [kit.new_object('trs', ycyl(0.62, PY - 0.05, PY + 0.06, Rx, zt(mm), 32), M['knob']),
              kit.new_object('trshole', ycyl(0.33, PY - 0.05, PY + 0.065, Rx, zt(mm), 20), M['hole'])]
panel += din(L, zt(132.6))
panel += [
    label('VOLUME', L, 83.5), label('BLUETOOTH', L, 103.5), label('USB-C', L, 118.5),
    label('SPEAKER CABLE', L, 141), label('(TO R SPEAKER)', L, 144.5), label('DC 24V 2.5A', L, 170.5),
    label('AUX IN', Rx, 79), label('L', Rx - 1.05, 88), label('RCA IN', Rx - 1.05, 96, 0.15), label('R', Rx - 1.05, 103.7),
    label('L', Rx - 1.05, 122), label('1/4" IN', Rx - 1.05, 131.5, 0.15), label('R', Rx - 1.05, 141),
    label('ON', Rx + 1.05, 163.5, 0.15), label('OFF', Rx - 1.1, 163.5, 0.15), label('POWER', Rx, 170.5),
]
controls = kit.join('controls', panel)
controls.location.x -= X

# --- The right one's back: only the link in ---------------------------------------------------------
link = kit.join('link', din(0, zt(140)) + [label('SPEAKER CABLE', 0, 150), label('(TO L SPEAKER)', 0, 153.5)])
link.location.x += X

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
