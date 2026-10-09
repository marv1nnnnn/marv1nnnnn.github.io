"""Shared parts for the players of side B's "repeat" (public/repeat/): every device is built by its own
script in this folder and exported as public/repeat/models/<id>.glb.

Run one with the Blender binary (5.x), from the repository root:
    blender -b --python scripts/blender/repeat/ipod.py -- [out.glb] [preview.png]

Conventions, read by public/repeat/stage.js:
- Centimetres. The device stands on its bottom edge: up is +Z, its front faces -Y (Blender's front
  view), its origin is the middle of its bottom edge. After export (glTF +Y up) the front faces +Z,
  towards the page's camera.
- `screen`: a flat quad with UVs 0..1 (u across, v up) facing the way the display does. The page
  draws the display into a canvas and puts it there; the mesh's own material is only for previews.
- Anything the page presses, turns or moves is its own object, named for what it is (`btn_play`,
  `key_rew`, `door`, `wheel`, `tf`...), with its origin where it moves from (a key's rest position,
  a door's hinge). `press` (custom property, exported as glTF extras) is how far it travels when
  pressed, in cm: into the body (Blender +Y) for a part on the front; with `axis` = 'z', down
  (Blender -Z) for a key on the top edge.
- Printed lettering is real geometry a hair above the surface (text_mesh), so it stays sharp close up.
"""

import math
import os
import subprocess
import sys

import bpy  # noqa: I001  (bpy first: it provides bmesh and mathutils)
import bmesh
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def args(default_id):
    """[out.glb] [preview.png] after Blender's own `--`."""
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = a[0] if a else os.path.join(ROOT, 'public', 'repeat', 'models', f'{default_id}.glb')
    return out, (a[1] if len(a) > 1 else None)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def material(name, color, rough=0.5, metal=0.0, coat=0.0, transmission=0.0, ior=1.45, alpha=1.0, emission=None, strength=1.0):
    """A principled material, as the glTF exporter understands it. Colours are linear RGB."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = 0.04
    p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = ior
    p.inputs['Alpha'].default_value = alpha
    if alpha < 1:
        m.surface_render_method = 'BLENDED'
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = strength
    return m


def srgb(hex_):
    """'#RRGGBB' to linear RGB, so colours can be picked by eye."""
    h = hex_.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def new_object(name, bm, mat, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(ob)
    for m in mat if isinstance(mat, list) else [mat]:
        ob.data.materials.append(m)
    if parent:
        ob.parent = parent
    return ob


def empty(name, parent=None, location=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = location
    if parent:
        ob.parent = parent
    return ob


def rounded_rect(w, h, r, seg=8):
    """Outline of a w x h rectangle with corner radius r, centred, counter-clockwise."""
    r = min(r, w / 2, h / 2)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def circle(r, seg=48, x=0.0, y=0.0):
    return [(x + r * math.cos(2 * math.pi * i / seg), y + r * math.sin(2 * math.pi * i / seg)) for i in range(seg)]


def prism(pts, z0, z1):
    """Extrude a 2D outline (in XY) from z0 to z1."""
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


def transform(bm, rotate=None, translate=None, scale=None):
    """rotate: (degrees, 'X'|'Y'|'Z') or a list of them, applied in order."""
    if scale:
        bmesh.ops.scale(bm, verts=bm.verts, vec=scale)
    for deg, axis in ([rotate] if rotate and isinstance(rotate[0], (int, float)) else rotate or []):
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(deg), 3, axis))
    if translate:
        bmesh.ops.translate(bm, verts=bm.verts, vec=translate)
    return bm


def front(bm, y=0.0):
    """Stand an XY outline extruded along Z up as a front-facing slab: XY becomes XZ, +Z becomes -Y.
    Use for anything modelled flat as if lying on its back (outline in x, z; thickness along -Y)."""
    return transform(bm, rotate=(90, 'X'), translate=(0, y, 0))


def apply(ob, kind, **kw):
    mod = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(mod, k, v)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)


def bevel(ob, width, segments=3, angle=50):
    apply(ob, 'BEVEL', width=width, segments=segments, limit_method='ANGLE', angle_limit=math.radians(angle))


def cut(ob, cutter, union=False):
    apply(ob, 'BOOLEAN', object=cutter, operation='UNION' if union else 'DIFFERENCE', solver='EXACT')
    bpy.data.objects.remove(cutter)


def cutter(bm):
    return new_object('cutter', bm, bpy.data.materials.get('cutter') or material('cutter', (1, 0, 1)))


def shade_smooth(ob, angle=35):
    for p in ob.data.polygons:
        p.use_smooth = True
    mod = ob.modifiers.new('ws', 'WEIGHTED_NORMAL')
    mod.keep_sharp = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))


def quad(name, w, h, mat, location=(0, 0, 0), facing='-Y', parent=None):
    """A w x h rectangle with UVs 0..1 (u across, v up as seen from in front), facing -Y (a front
    face), +Z (a top face) or +Y (a back face). For screens and anything the page draws on."""
    bm = bmesh.new()
    corners = ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))
    if facing == '-Y':
        pos = [(x, 0, y) for x, y in corners]
    elif facing == '+Y':
        pos = [(-x, 0, y) for x, y in corners]
    else:
        pos = [(x, y, 0) for x, y in corners]
    vs = [bm.verts.new(p) for p in pos]
    f = bm.faces.new(vs)
    if facing == '+Y':
        f.normal_flip()
    uv = bm.loops.layers.uv.new('UVMap')
    for loop in f.loops:
        i = vs.index(loop.vert)
        loop[uv].uv = ((0, 0), (1, 0), (1, 1), (0, 1))[i]
    ob = new_object(name, bm, mat, parent)
    ob.location = location
    return ob


FONTS = os.path.join(os.path.dirname(__file__), 'fonts')


def font(kind='sans', weight=500):
    """A font file for lettering: Helvetica-like or CJK. Chinese is set in the static Noto Sans SC cut
    for these scripts (fonts/make.py: rerun it after adding Chinese lettering); without it, in the
    system's variable CJK font, which Blender fills badly. Falls back to Blender's own (Latin only)."""
    if kind == 'cjk':
        path = os.path.join(FONTS, f'NotoSansSC-{weight}.ttf')
        if os.path.exists(path):
            return bpy.data.fonts.load(path, check_existing=True)
    pattern = {'sans': 'TeX Gyre Heros', 'cjk': 'Noto Sans CJK SC', 'serif-cjk': 'Noto Serif CJK SC', 'mono': 'DejaVu Sans Mono'}[kind]
    try:
        path = subprocess.run(['fc-match', '-f', '%{file}', pattern], capture_output=True, text=True, check=True).stdout.strip()
        if path and os.path.exists(path):
            return bpy.data.fonts.load(path, check_existing=True)
    except (OSError, subprocess.CalledProcessError, RuntimeError):
        pass
    return None


_EM = {}


def em(f):
    """How much to scale a CJK font so 中 stands 0.88 of the size asked for (the system's variable Noto
    CJK comes in at about a third of its real size; the static cut is near 1)."""
    if f.name not in _EM:
        c = bpy.data.curves.new('em', 'FONT')
        c.body = '中'
        c.font = f
        ob = bpy.data.objects.new('em', c)
        bpy.context.scene.collection.objects.link(ob)
        bpy.context.view_layer.update()
        h = ob.dimensions.y
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(c)
        _EM[f.name] = 0.88 / h if h > 1e-6 else 1.0
    return _EM[f.name]


def text_mesh(name, body, size, mat, location=(0, 0, 0), facing='-Y', align='CENTER', kind='sans', depth=0.004, bold=False, parent=None, spacing=1.0, resolution=5, weight=None):
    """Printed or moulded lettering as a mesh: `depth` cm thick, its back on `location`, readable from
    the side it faces. size is the cap height-ish (Blender's text size) in cm; raise `resolution` for
    big lettering whose curves would show facets."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.extrude = depth / 2
    curve.space_character = spacing
    curve.resolution_u = resolution  # segments per glyph curve: small print needs few
    f = font(kind, weight or (700 if bold else 500))
    if f:
        curve.font = f
        curve.font_bold = f
        if 'cjk' in kind:
            curve.size = size * em(f)
            bold = False  # the weight is the font's; outsetting tears CJK outlines
    if bold:
        curve.offset = size * 0.012
    ob = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    # Lift it so its back sits on the surface, then turn it to face the way asked.
    for v in ob.data.vertices:
        v.co.z += depth / 2
    rot = {'-Y': Matrix.Rotation(math.radians(90), 4, 'X'), '+Z': Matrix.Identity(4), '+Y': Matrix.Rotation(math.radians(-90), 4, 'X') @ Matrix.Rotation(math.pi, 4, 'Z')}[facing]
    ob.data.transform(rot)
    ob.location = location
    if parent:
        ob.parent = parent
    return ob


def join(name, obs):
    """Join meshes that share no motion into one object (fewer draw calls)."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    return ob


def origin_to(ob, point):
    """Move an object's origin to `point` (world) without moving its geometry: for hinges and keys."""
    p = Vector(point)
    ob.data.transform(Matrix.Translation(ob.location - p))
    ob.location = p


def export(out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    for ob in list(bpy.data.objects):
        if ob.name.startswith('cutter'):
            bpy.data.objects.remove(ob)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_yup=True, export_materials='EXPORT', export_extras=True)
    print('exported', out, f'{os.path.getsize(out) / 1024:.0f} KB')


def preview(path, size=(1100, 900), views=('three-quarter',), samples=64):
    """Render the device for a look: a soft studio, the camera framing the whole thing. More than
    one view goes side by side into numbered files next to `path`."""
    scene = bpy.context.scene
    obs = [o for o in scene.objects if o.type == 'MESH']
    lo = Vector((min(v[i] for o in obs for v in (o.matrix_world @ Vector(c) for c in o.bound_box)) for i in range(3)))
    hi = Vector((max(v[i] for o in obs for v in (o.matrix_world @ Vector(c) for c in o.bound_box)) for i in range(3)))
    centre = (lo + hi) / 2
    radius = (hi - lo).length / 2

    world = bpy.data.worlds.new('studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.05, 0.055, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    scene.world = world

    def area(name, loc, energy, size_, color=(1, 0.97, 0.92)):
        light = bpy.data.lights.new(name, 'AREA')
        light.energy = energy * radius * radius
        light.size = size_ * radius
        light.color = color
        ob = bpy.data.objects.new(name, light)
        ob.location = centre + Vector(loc) * radius
        d = centre - ob.location
        ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.collection.objects.link(ob)

    area('key', (-2.5, -3.5, 3), 180, 2.5)
    area('fill', (3.5, -2, 1), 60, 3, (0.85, 0.9, 1))
    area('rim', (1, 4, 3), 140, 2)
    # A floor to stand on, out of sight below the device.
    floor = new_object('floor', prism(rounded_rect(radius * 12, radius * 12, 0.1, 1), lo.z - 0.02, lo.z - 0.01), material('floor', srgb('#2a2622'), rough=0.8))

    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    scene.collection.objects.link(cam)
    cam.data.lens = 70
    scene.camera = cam
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.cycles.device = 'CPU'
    scene.render.film_transparent = False
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.view_settings.view_transform = 'AgX'
    directions = {
        'front': Vector((0, -1, 0.08)),
        'three-quarter': Vector((-0.7, -1, 0.45)),
        'back': Vector((0.6, 1, 0.35)),
        'top': Vector((0.15, -0.5, 1)),
        'side': Vector((1, -0.25, 0.2)),
    }
    root, ext = os.path.splitext(path)
    for i, view in enumerate(views):
        d = directions[view].normalized()
        half = math.atan(18 * min(1, size[1] / size[0]) / cam.data.lens)  # the narrower half-angle
        dist = radius / math.sin(half) * 1.04
        cam.location = centre + d * dist
        cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = path if len(views) == 1 else f'{root}-{i + 1}-{view}{ext}'
        bpy.ops.render.render(write_still=True)
        print('rendered', scene.render.filepath)
    bpy.data.objects.remove(floor)
