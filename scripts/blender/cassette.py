"""Build the home-page cassette and pencil in Blender and export them as public/models/cassette.glb.

Run with Blender's Python module (pip install bpy==4.2.0, Python 3.11):
    python scripts/blender/cassette.py [out.glb] [preview.png]

Units are centimetres. The cassette face points +Z (glTF +Y after export); the long side is X.
Object names are read by components/tape/Cassette3D.tsx: hubL, hubR, packL, packR, label, pencil.
"""

import math
import sys

import bpy  # noqa: I001  (bpy first: it provides bmesh and mathutils)
import bmesh
from mathutils import Matrix

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/models/cassette.glb'
PREVIEW = sys.argv[2] if len(sys.argv) > 2 else None

W, H, T = 10.04, 6.38, 1.2  # a Philips compact cassette: 100.4 x 63.8 x 12 mm
HUB_X, HUB_Y = 2.1, 0.3  # hubs 42 mm apart
WIN = (6.8, 2.0)  # window size, centred on the hubs
LABEL = (8.6, 4.2, 0.45)  # width, height, centre y

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, rough=0.5, metal=0.0, transmission=0.0, ior=1.45, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = ior
    p.inputs['Alpha'].default_value = alpha
    return m


M = {
    'shell': material('shell', (0.018, 0.018, 0.02), rough=0.32),
    'shell_matte': material('shell_matte', (0.03, 0.03, 0.032), rough=0.7),
    'window': material('window', (0.92, 0.94, 0.96), rough=0.04, transmission=1.0, ior=1.49),
    'hub': material('hub', (0.86, 0.83, 0.76), rough=0.45),
    'tape': material('tape', (0.07, 0.035, 0.02), rough=0.42),
    'screw': material('screw', (0.75, 0.75, 0.78), rough=0.28, metal=1.0),
    'roller': material('roller', (0.9, 0.9, 0.88), rough=0.35),
    'felt': material('felt', (0.55, 0.5, 0.42), rough=1.0),
    'label': material('label', (0.93, 0.9, 0.82), rough=0.85),
    'paint': material('paint', (0.96, 0.62, 0.02), rough=0.3),
    'wood': material('wood', (0.78, 0.58, 0.38), rough=0.85),
    'graphite': material('graphite', (0.08, 0.08, 0.09), rough=0.35, metal=0.6),
    'ferrule': material('ferrule', (0.86, 0.76, 0.52), rough=0.22, metal=1.0),
    'eraser': material('eraser', (0.9, 0.46, 0.45), rough=0.9),
}


def new_object(name, bm, mat, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(ob)
    if isinstance(mat, list):
        for m in mat:
            ob.data.materials.append(m)
    else:
        ob.data.materials.append(mat)
    if parent:
        ob.parent = parent
    return ob


def rounded_rect(w, h, r, seg=8):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def prism(pts, z0, z1):
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(list(reversed(bottom)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bottom[i], bottom[j], top[j], top[i]))
    return bm


def cylinder(r, z0, z1, seg=48, r1=None, x=0.0, y=0.0):
    r1 = r if r1 is None else r1
    bm = bmesh.new()
    bottom = [bm.verts.new((x + r * math.cos(2 * math.pi * i / seg), y + r * math.sin(2 * math.pi * i / seg), z0)) for i in range(seg)]
    top = [bm.verts.new((x + r1 * math.cos(2 * math.pi * i / seg), y + r1 * math.sin(2 * math.pi * i / seg), z1)) for i in range(seg)]
    bm.faces.new(list(reversed(bottom)))
    if r1 > 0:
        bm.faces.new(top)
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((bottom[i], bottom[j], top[j], top[i]))
    return bm


def apply(ob, kind, **kw):
    mod = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(mod, k, v)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)


def cut(ob, cutter, union=False):
    apply(ob, 'BOOLEAN', object=cutter, operation='UNION' if union else 'DIFFERENCE', solver='EXACT')
    bpy.data.objects.remove(cutter)


def shade_smooth(ob, angle=35):
    for p in ob.data.polygons:
        p.use_smooth = True
    mod = ob.modifiers.new('ws', 'WEIGHTED_NORMAL')
    mod.keep_sharp = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))


# --- Shell -------------------------------------------------------------------------------------
shell = new_object('shell', prism(rounded_rect(W, H, 0.42), -T / 2, T / 2), [M['shell'], M['shell_matte']])
apply(shell, 'BEVEL', width=0.05, segments=3, limit_method='ANGLE', angle_limit=math.radians(50))

# The head end: a raised trapezoid across the bottom edge, both faces.
trap = [(-3.1, -H / 2), (3.1, -H / 2), (2.45, -H / 2 + 1.15), (-2.45, -H / 2 + 1.15)]
bump = new_object('bump', prism(trap, -T / 2 - 0.07, T / 2 + 0.07), M['shell'])
apply(bump, 'BEVEL', width=0.035, segments=2, limit_method='ANGLE', angle_limit=math.radians(50))
cut(shell, bump, union=True)

def window_cutter():
    bm = prism(rounded_rect(*WIN, 0.5), -1, 1)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, HUB_Y, 0))
    return new_object('c', bm, M['shell'])


# The window, all the way through.
cut(shell, window_cutter())
# Openings along the bottom edge where the tape passes the head, pinch roller and guides.
for x, w in ((0, 1.4), (-2.05, 0.9), (2.05, 0.9), (-3.95, 0.7), (3.95, 0.7)):
    bm = prism(rounded_rect(w, 0.7, 0.08, 3), -0.5, 0.5)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x, -H / 2 + 0.25, 0))
    cut(shell, new_object('c', bm, M['shell']))
# Capstan and guide holes in the head end.
for x, r in ((-2.6, 0.2), (2.6, 0.2), (-1.2, 0.14), (1.2, 0.14)):
    cut(shell, new_object('c', cylinder(r, -1, 1, 24, x=x, y=-H / 2 + 0.72), M['shell']))
# A shallow recess for the label.
bm = prism(rounded_rect(LABEL[0] + 0.1, LABEL[1] + 0.1, 0.2), T / 2 - 0.03, T / 2 + 0.2)
bmesh.ops.translate(bm, verts=bm.verts, vec=(0, LABEL[2], 0))
cut(shell, new_object('c', bm, M['shell']))
# Grip ribs on the two short sides.
for side in (-1, 1):
    for k in range(7):
        bm = prism(rounded_rect(0.06, 0.12, 0.02, 2), -T / 2 + 0.2, T / 2 - 0.2)
        bmesh.ops.translate(bm, verts=bm.verts, vec=(side * W / 2, -0.9 + k * 0.3, 0))
        cut(shell, new_object('c', bm, M['shell']))
shade_smooth(shell)

# The matte band printed around the window on real shells.
bm = prism(rounded_rect(WIN[0] + 0.5, WIN[1] + 0.5, 0.7), T / 2 - 0.031, T / 2 - 0.029)
bmesh.ops.translate(bm, verts=bm.verts, vec=(0, HUB_Y, 0))
band = new_object('band', bm, M['shell_matte'])
cut(band, window_cutter())

# --- Window panes ------------------------------------------------------------------------------
for z in (T / 2 - 0.09, -T / 2 + 0.05):
    bm = prism(rounded_rect(WIN[0] + 0.3, WIN[1] + 0.3, 0.6), z, z + 0.04)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, HUB_Y, 0))
    pane = new_object('window', bm, M['window'])
    shade_smooth(pane)

# --- Hubs and tape -------------------------------------------------------------------------------
def hub(name, x):
    bm = cylinder(0.62, -0.3, 0.3, 48)
    ob = new_object(name, bm, M['hub'])
    cut(ob, new_object('c', cylinder(0.4, -1, 1, 48), M['hub']))
    for k in range(6):
        a = 2 * math.pi * k / 6
        bm = prism(rounded_rect(0.2, 0.09, 0.03, 2), -0.3, 0.3)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, 'Z'))
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0.36 * math.cos(a), 0.36 * math.sin(a), 0))
        cut(ob, new_object('c', bm, M['hub']), union=True)
    # Flange lip, so the hub reads as a spool through the window.
    cut(ob, new_object('c', cylinder(0.75, -0.3, -0.22, 48), M['hub']), union=True)
    shade_smooth(ob)
    ob.location = (x, HUB_Y, 0)
    return ob


hub('hubL', -HUB_X)
hub('hubR', HUB_X)
# Tape packs: radius 1 here, scaled by the page to how much tape is on each side.
for name, x in (('packL', -HUB_X), ('packR', HUB_X)):
    # A solid disc: the page scales it, and the hub sits over its centre.
    ob = new_object(name, cylinder(1.0, -0.19, 0.19, 96), M['tape'])
    shade_smooth(ob, 60)
    ob.location = (x, HUB_Y, 0)

# The tape along the head edge, over two rollers.
bm = prism([(-4.3, -H / 2 + 0.36), (4.3, -H / 2 + 0.36), (4.3, -H / 2 + 0.39), (-4.3, -H / 2 + 0.39)], -0.19, 0.19)
new_object('tapeRun', bm, M['tape'])
for x in (-4.3, 4.3):
    new_object('roller', cylinder(0.22, -0.3, 0.3, 32, x=x, y=-H / 2 + 0.6), M['roller'])
new_object('felt', prism(rounded_rect(0.9, 0.12, 0.03, 2), -0.2, 0.2), M['felt']).location = (0, -H / 2 + 0.47, 0)

# --- Screws ------------------------------------------------------------------------------------
for x, y in ((-4.6, 2.78), (4.6, 2.78), (-4.6, -2.78), (4.6, -2.78), (0, -H / 2 + 0.5)):
    z = T / 2 + (0.07 if y < -2.9 else 0)
    s = new_object('screw', cylinder(0.17, z - 0.02, z + 0.02, 32, r1=0.15, x=x, y=y), M['screw'])
    for rot in (0, 90):
        bm = prism(rounded_rect(0.2, 0.035, 0.01, 1), z - 0.01, z + 0.1)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(rot), 3, 'Z'))
        bmesh.ops.translate(bm, verts=bm.verts, vec=(x, y, 0))
        cut(s, new_object('c', bm, M['screw']))
    shade_smooth(s)

# --- Label -------------------------------------------------------------------------------------
bm = bmesh.new()
lw, lh, ly = LABEL
vs = [bm.verts.new((x, ly + y, T / 2 - 0.012)) for x, y in ((-lw / 2, -lh / 2), (lw / 2, -lh / 2), (lw / 2, lh / 2), (-lw / 2, lh / 2))]
f = bm.faces.new(vs)
uv = bm.loops.layers.uv.new('UVMap')
for loop, (u, v) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
    loop[uv].uv = (u, v)
new_object('label', bm, M['label'])

# --- Pencil ------------------------------------------------------------------------------------
# Origin at the point; the pencil runs up +Z. Hex body, sharpened cone, ferrule and eraser.
pencil = bpy.data.objects.new('pencil', None)
scene.collection.objects.link(pencil)
L = 9.5  # a pencil that has been sharpened a few times
R = 0.4  # across corners
parts = []
parts.append(new_object('lead', cylinder(0.0, 0.0, 0.35, 24, r1=0.07), M['graphite'], pencil))
parts.append(new_object('cone', cylinder(0.07, 0.35, 2.0, 6, r1=R), M['wood'], pencil))
body = new_object('body', cylinder(R, 2.0, L - 1.6, 6), M['paint'], pencil)
apply(body, 'BEVEL', width=0.03, segments=2, limit_method='ANGLE', angle_limit=math.radians(40))
parts.append(body)
ferrule = new_object('ferrule', cylinder(0.41, L - 1.62, L - 0.7, 48), M['ferrule'], pencil)
for k in range(3):
    cut(ferrule, new_object('c', cylinder(0.5, L - 1.45 + k * 0.12, L - 1.4 + k * 0.12, 48), M['ferrule']))
    ring = new_object('c', cylinder(0.4, L - 1.45 + k * 0.12, L - 1.4 + k * 0.12, 48), M['ferrule'])
    cut(ferrule, ring, union=True)
parts.append(ferrule)
eraser = new_object('eraser', cylinder(0.38, L - 0.7, L, 48), M['eraser'], pencil)
apply(eraser, 'BEVEL', width=0.1, segments=4, limit_method='ANGLE', angle_limit=math.radians(40))
parts.append(eraser)
for p in parts:
    shade_smooth(p, 40)

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True, export_materials='EXPORT')
print('exported', OUT)

if PREVIEW:
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    scene.collection.objects.link(cam)
    cam.location = (3, -9, 26)
    cam.rotation_euler = (math.radians(20), 0, math.radians(8))
    cam.data.lens = 60
    scene.camera = cam
    pencil.location = (HUB_X, HUB_Y, 0.1)
    pencil.rotation_euler = (math.radians(-35), math.radians(20), 0)
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3
    sun.rotation_euler = (math.radians(35), math.radians(-25), 0)
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.25, 0.26, 0.28, 1)
    scene.world = world
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.device = 'CPU'
    scene.render.resolution_x, scene.render.resolution_y = 1000, 700
    scene.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    print('rendered', PREVIEW)
