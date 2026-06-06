// bf-geometry.js — SINGLE SOURCE OF TRUTH for the shared bed geometry.
// The TV-lift footboard, the Touchstone 23401 lift, and the 74x85 drawer base live HERE, once.
// BF-M01 (full master) and BF-D09 (dock-interface detail) both import these builders, so the
// cabinet + base can never drift between models — change this file and both update.
//
// Design: dependency injection. The builder BODIES (every dimension + position — the actual shape)
// are defined here verbatim from the master. Each host passes a `ctx` with its own engine bits
// (box/cyl/line3 from makeEngine, mats from makeMaterials, its groups, and its label/pieceLabel).
// Geometry is shared; labelling/ghosting stays per-host.
//
// Units: inches. X = width (0 centred), Y = height AFF, Z = head(0) -> foot(+). Seam plane Z = 85.
import * as THREE from 'three';

// ----------------------------------------------------------------------------
//  SPEC — the canonical dimensions (verified against ProjectData/bed-frame-spec.json)
// ----------------------------------------------------------------------------
export const SPEC = Object.freeze({
  W: 130,
  H: 72,
  D: 8,
  topCapH: 2,
  bottomCapH: 2,
  sideW: 2,
  panelTh: 1.0,
  skinTh: 1.0,
  frontPanelSeamAFF: 36,
  loadReceiverRailDepth: 7,
  mullionW: 4,
  seamX: 36,
  uDrop: 4,
  uFrontLand: 1.5,
  uGap: 1.75,
  uCenterLand: 1.5,
  uRearLand: 1.5,
  speaker: {
    weightLb: 28.4,
    cutW: 11.26,
    cutH: 20.71,
    bodyW: 12.6,
    bodyH: 22.1,
    bodyD: 5.2,
    centerX: 51,
    bottom: 39.25,
    top: 60
  },
  nightstand: { W: 26, D: 20, H: 11, bottom: 17, top: 28, centerX: 51, drwFaceH: 7.5, lipH: 1.4 },
  switchPanel: {
    W: 1.5,
    H: 6.0,
    D: 0.55,
    centerY: 37.25,
    buttonsAFF: [35.0, 36.5, 38.0, 39.5],
    buttonDia: 12 / 25.4,
    wireChaseDia: 0.5
  },
  base: { W: 74, L: 85, top: 17, bayW: 67, bayL: 81, shoulder: 3.5, toeH: 2.0, toeInset: 1.5, carcassBottom: 2.0 },
  drawer: { perSide: 3, intH: 10.75, intW: 19, intD: 33, recess: 1.5, faceH: 12.0, faceGap: 0.25 },
  footboard: { W: 74, H: 41, D: 16, sideTh: 2.0, faceTh: 1.0, deckTh: 1.0, rearTh: 0.75 },
  lift: { travel: 36, retractBody: 31, raised: 68.5, baseW: 28.375, basePlateW: 9.875, basePlateD: 5.125, bodyD: 7.0, deckTopY: 8.0 },
  tv: { W: 48.0, H: 27.8, D: 1.5, retractBottom: 11.95, raisedBottom: 47.0 },
  lid: { W: 60, D: 14.25, T: 1.0, flushTop: 41, raisedTop: 76 },
  soundbar: { W: 51.18, H: 2.5, D: 4.45, retractBottom: 8.35, raisedBottom: 43.35 },
  cubby: { clearH: 6.0, W: 70, D: 14.25, floorY: 1.0 },
  fullBedZ: { headBack: -8, headFront: 0, baseHead: 0, baseFoot: 85, footBack: 85, footFront: 101 }
});

// ----------------------------------------------------------------------------
//  Materials — identical instances in both models
// ----------------------------------------------------------------------------
export function makeMaterials() {
  return {
    shell: new THREE.MeshStandardMaterial({ color: 0xd7ad6d, roughness: 0.72, metalness: 0.02 }),
    shellGhost: new THREE.MeshStandardMaterial({ color: 0xe9c98d, roughness: 0.75, transparent: true, opacity: 0.52, depthWrite: false }),
    skin: new THREE.MeshStandardMaterial({ color: 0xe8cc98, roughness: 0.82, transparent: true, opacity: 0.48, depthWrite: false }),
    collector: new THREE.MeshStandardMaterial({ color: 0xb9772e, roughness: 0.78, metalness: 0.02 }),
    receiver: new THREE.MeshStandardMaterial({ color: 0x6f9cbc, roughness: 0.68, transparent: true, opacity: 0.78 }),
    night: new THREE.MeshStandardMaterial({ color: 0x8fb26a, roughness: 0.74, transparent: true, opacity: 0.78 }),
    baseWood: new THREE.MeshStandardMaterial({ color: 0xd4b477, roughness: 0.76, transparent: true, opacity: 0.50, depthWrite: false }),
    baseStructure: new THREE.MeshStandardMaterial({ color: 0xc9974c, roughness: 0.72, transparent: true, opacity: 0.72, depthWrite: false }),
    footWood: new THREE.MeshStandardMaterial({ color: 0xd2aa67, roughness: 0.78, transparent: true, opacity: 0.54, depthWrite: false }),
    void: new THREE.MeshStandardMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.16, depthWrite: false }),
    speaker: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.48, transparent: true, opacity: 0.64 }),
    grille: new THREE.MeshStandardMaterial({ color: 0x05080d, roughness: 0.66 }),
    speakerBaffle: new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.52, metalness: 0.08 }),
    speakerCone: new THREE.MeshStandardMaterial({ color: 0x263241, roughness: 0.62, metalness: 0.04 }),
    driverRubber: new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.70, metalness: 0.02 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.82 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.36, metalness: 0.76 }),
    liftSteel: new THREE.MeshStandardMaterial({ color: 0x3f4754, roughness: 0.34, metalness: 0.72 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd8a33b, roughness: 0.24, metalness: 0.86 }),
    tenon: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.58, transparent: true, opacity: 0.82 }),
    switchPlate: new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.48, metalness: 0.22 }),
    panelScrew: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.34, metalness: 0.72 }),
    panelBatten: new THREE.MeshStandardMaterial({ color: 0xc9914b, roughness: 0.68, transparent: true, opacity: 0.66 }),
    access: new THREE.MeshStandardMaterial({ color: 0xfb923c, transparent: true, opacity: 0.22, depthWrite: false }),
    ledWarm: new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xff8a1c, emissiveIntensity: 0.56, roughness: 0.36 }),
    ledRed: new THREE.MeshStandardMaterial({ color: 0xff4c5c, emissive: 0x7f0d17, emissiveIntensity: 0.62, roughness: 0.36 }),
    tvGlass: new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.18, metalness: 0.12, transparent: true, opacity: 0.68 }),
    soundbar: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.52, metalness: 0.25, transparent: true, opacity: 0.82 }),
    cableAC: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.42, metalness: 0.02 }),
    cableLV: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.42, metalness: 0.02 }),
    cableSpeaker: new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.42, metalness: 0.02 }),
    ghost: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, transparent: true, opacity: 0.12, depthWrite: false })
  };
}

// ----------------------------------------------------------------------------
//  Engine — box / cyl / line3 / addEdges, identical mesh creation in both models
// ----------------------------------------------------------------------------
export function makeEngine() {
  function addEdges(mesh, group, color = 0x17212b, opacity = 0.34) {
    const e = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    line.scale.copy(mesh.scale);
    group.add(line);
    return line;
  }
  function box(group, name, sx, sy, sz, x, y, z, mat, options = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = options.cast !== false;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (options.edges !== false) addEdges(mesh, group, options.edgeColor || 0x17212b, options.edgeOpacity ?? 0.34);
    return mesh;
  }
  function cyl(group, name, radius, length, x, y, z, mat, axis = 'z', options = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, options.segments || 32), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = options.cast !== false;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function line3(group, name, points, color = 0xf8fafc, opacity = 0.72) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(geometry, material);
    line.name = name;
    group.add(line);
    return line;
  }
  return { addEdges, box, cyl, line3 };
}

// ----------------------------------------------------------------------------
//  Derived Z geometry (from SPEC) — identical in both models
// ----------------------------------------------------------------------------
export function deriveZ() {
  const ZB = SPEC.fullBedZ;
  const baseMidZ = (ZB.baseHead + ZB.baseFoot) / 2;
  const footMidZ = (ZB.footBack + ZB.footFront) / 2;
  const liftBackerZ = ZB.footFront - SPEC.footboard.faceTh;
  const liftFrontZ = liftBackerZ - SPEC.lift.bodyD;
  const liftCenterZ = (liftBackerZ + liftFrontZ) / 2;
  const liftScreenZ = liftFrontZ - SPEC.tv.D;
  const soundbarFrontZ = liftScreenZ - SPEC.soundbar.D;
  const soundbarCenterZ = (liftScreenZ + soundbarFrontZ) / 2;
  return { ZB, baseMidZ, footMidZ, liftBackerZ, liftFrontZ, liftCenterZ, liftScreenZ, soundbarFrontZ, soundbarCenterZ };
}

// ----------------------------------------------------------------------------
//  BUILDER: 74 x 85 grounded 6-drawer base  (verbatim from master addFullBedBase)
//  ctx: { box, cyl, line3, mats, groups:{bedBase,slats,wiring}, label, pieceLabel, drawerGroups, THREE? }
// ----------------------------------------------------------------------------
export function buildBedBase(ctx) {
  const { box, cyl, line3, mats, groups, label, pieceLabel, drawerGroups } = ctx;
  const { baseMidZ } = deriveZ();
  function addBaseSideBoltHead(x, y) {
    cyl(groups.bedBase, `bed-base side bolt head aligned x=${x} y=${y}`, 0.46, 0.18, x, y, 0.18, mats.steel, 'z', { segments: 32, cast: false });
    cyl(groups.bedBase, `bed-base bolt shaft aligned x=${x} y=${y}`, 0.16, 2.2, x, y, 1.2, mats.darkSteel, 'z', { segments: 24, cast: false });
  }
  const B = SPEC.base;
  const DWR = SPEC.drawer;
  const group = groups.bedBase;
  box(group, 'BF-BASE toe plinth ghost', B.W - 2 * B.toeInset, B.toeH, B.L - 2 * B.toeInset, 0, B.toeH / 2, baseMidZ, mats.baseWood, { edgeColor: 0x5f411a, edgeOpacity: 0.46 });
  [-1, 1].forEach(s => {
    const xc = s * (B.W / 2 - 1.2);
    box(group, `BF-BASE ${s < 0 ? 'left' : 'right'} continuous side exoskeleton chord top rail`, 2.4, 2.6, B.L, xc, 15.7, baseMidZ, mats.baseStructure);
    box(group, `BF-BASE ${s < 0 ? 'left' : 'right'} continuous side exoskeleton chord bottom rail`, 2.4, 1.4, B.L, xc, 2.7, baseMidZ, mats.baseStructure);
    [[3.8, 2.8], [30.65, 0.6], [56.35, 0.6], [81.8, 1.6]].forEach(([sz, sl], k) => box(group, `BF-BASE ${s < 0 ? 'left' : 'right'} side frame stile ${k}`, 2.4, 11, sl, xc, 8.9, sz, mats.baseStructure, { edgeColor: 0x5f411a, edgeOpacity: 0.42, cast: false }));
  });
  box(group, 'BF-BASE head rail receiver face', B.W, B.top, 2.4, 0, B.top / 2, 1.2, mats.baseStructure);
  box(group, 'BF-BASE foot rail receiver face', B.W, B.top, 2.4, 0, B.top / 2, B.L - 1.2, mats.baseStructure);
  box(group, 'BF-BASE center spine continuous', 3.0, B.top - B.toeH, B.L, 0, (B.top + B.toeH) / 2, baseMidZ, mats.baseStructure);
  box(group, 'BF-BASE left mattress shoulder rail', 2.0, 0.8, B.bayL, -B.bayW / 2 - 0.9, B.top + 0.15, 2 + B.bayL / 2, mats.baseWood);
  box(group, 'BF-BASE right mattress shoulder rail', 2.0, 0.8, B.bayL, B.bayW / 2 + 0.9, B.top + 0.15, 2 + B.bayL / 2, mats.baseWood);
  box(group, 'BF-BASE head mattress shoulder rail', B.bayW, 0.8, 1.6, 0, B.top + 0.15, 2.8, mats.baseWood);
  box(group, 'BF-BASE foot mattress shoulder rail', B.bayW, 0.8, 1.6, 0, B.top + 0.15, 82.2, mats.baseWood);

  for (let i = 0; i < 13; i += 1) {
    const z = 5.5 + i * 6.15;
    box(groups.slats, `BF-BASE removable slat ${i + 1}`, B.bayW, 0.45, 1.25, 0, 16.25, z, mats.ghost, { edgeColor: 0xe2e8f0, edgeOpacity: 0.34, cast: false });
  }

  const drawerSpan = (B.L - 5 - 3) / 3;
  const drawerDepth = 32.6;
  [-1, 1].forEach(side => {
    const faceX = side * (B.W / 2 + 0.08);
    const boxXc = side * (B.W / 2 - 0.9 - drawerDepth / 2);
    const wallXc = side * (B.W / 2 - 0.9 - (drawerDepth + 1) / 2);
    [0, 1, 2].forEach(w => box(group, `BF-BASE drawer divider wall ${side < 0 ? 'L' : 'R'} ${w}`, drawerDepth + 1, DWR.intH + 1.6, 1.0, wallXc, 8.7, 5 + w * drawerSpan, mats.baseStructure, { edgeColor: 0x5f411a, edgeOpacity: 0.42, cast: false }));
    box(group, `BF-BASE foot drawer-rail support wall (L) slide leg ${side < 0 ? 'L' : 'R'}`, drawerDepth + 1, DWR.intH + 1.6, 1.0, wallXc, 8.7, 81, mats.baseStructure, { edgeColor: 0x5f411a, edgeOpacity: 0.42, cast: false });
    box(group, `BF-BASE foot drawer-rail support wall (L) gap-cover return ${side < 0 ? 'L' : 'R'}`, drawerDepth + 1, 1.0, 2.6, wallXc, 14.4, 82.3, mats.baseStructure, { edgeColor: 0x5f411a, edgeOpacity: 0.42, cast: false });
    box(group, `BF-BASE drawer-bay TOP dust cover ${side < 0 ? 'L' : 'R'}`, drawerDepth, 0.6, 77, boxXc, 14.7, 43.5, mats.baseWood, { edgeColor: 0x5f411a, edgeOpacity: 0.4, cast: false });
    box(group, `BF-BASE drawer-bay BACK wall (walls off the centre wiring chase) ${side < 0 ? 'L' : 'R'}`, 0.5, DWR.intH + 1.6, 77, side * 2.9, 8.7, 43.5, mats.baseStructure, { edgeColor: 0x5f411a, edgeOpacity: 0.42, cast: false });
    for (let i = 0; i < DWR.perSide; i += 1) {
      const z = 5 + drawerSpan / 2 + i * drawerSpan;
      const sName = side < 0 ? 'left' : 'right', sAbbr = side < 0 ? 'L' : 'R';
      const isFoot = i === DWR.perSide - 1, gap = isFoot ? 1.0 : 0;
      [z - drawerSpan / 2 + 0.6, z + drawerSpan / 2 - 0.6 - gap].forEach((sz, s) => box(group, `BF-BASE full-extension slide rail (cabinet) ${sAbbr} ${i + 1}-${s}`, drawerDepth, 0.5, 0.32, boxXc, 11.6, sz, mats.steel, { edgeColor: 0x60a5fa, edgeOpacity: 0.45, cast: false }));
      const dg = new THREE.Group(); group.add(dg); drawerGroups.push({ g: dg, axis: 'x', dir: side, ext: drawerDepth - 2 });
      box(dg, `BF-BASE drawer face ${sName} ${i + 1}`, 0.7, DWR.faceH, drawerSpan - 0.5, faceX, 8.6, z, mats.baseWood, { edgeColor: 0x604618, edgeOpacity: 0.52 });
      const dW = drawerDepth, dH = DWR.intH, dL = drawerSpan - 2.0 - gap, tw = 0.5, dyc = 8.8, bz = z - gap / 2;
      box(dg, `BF-BASE drawer ${sName} ${i + 1} floor`, dW, tw, dL, boxXc, dyc - dH / 2 + tw / 2, bz, mats.baseWood, { edgeColor: 0x8a6a32, edgeOpacity: 0.42, cast: false });
      box(dg, `BF-BASE drawer ${sName} ${i + 1} inner wall`, tw, dH, dL, boxXc - side * (dW / 2 - tw / 2), dyc, bz, mats.baseWood, { edgeColor: 0x8a6a32, edgeOpacity: 0.42, cast: false });
      box(dg, `BF-BASE drawer ${sName} ${i + 1} front wall`, tw, dH, dL, boxXc + side * (dW / 2 - tw / 2), dyc, bz, mats.baseWood, { edgeColor: 0x8a6a32, edgeOpacity: 0.42, cast: false });
      box(dg, `BF-BASE drawer ${sName} ${i + 1} side wall A`, dW, dH, tw, boxXc, dyc, bz - dL / 2 + tw / 2, mats.baseWood, { edgeColor: 0x8a6a32, edgeOpacity: 0.42, cast: false });
      box(dg, `BF-BASE drawer ${sName} ${i + 1} side wall B`, dW, dH, tw, boxXc, dyc, bz + dL / 2 - tw / 2, mats.baseWood, { edgeColor: 0x8a6a32, edgeOpacity: 0.42, cast: false });
      const bbev = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, drawerSpan - 1.0), mats.baseWood);
      bbev.position.set(faceX + side * 0.1, 14.35, z); bbev.rotation.z = -side * Math.PI / 4; bbev.castShadow = false;
      bbev.name = `BF-BASE drawer ${sName} ${i + 1} beveled top-edge pull (handle-less sharknose)`;
      dg.add(bbev);
      [z - drawerSpan / 2 + 0.6, z + drawerSpan / 2 - 0.6 - gap].forEach((sz, s) => box(dg, `BF-BASE full-extension slide (drawer) ${sAbbr} ${i + 1}-${s}`, drawerDepth - 1, 0.34, 0.2, boxXc, 11.6, sz, mats.darkSteel, { edgeOpacity: 0.22, cast: false }));
    }
  });

  [-36, -4, 4, 36].forEach(x => [5, 14.5].forEach(y => addBaseSideBoltHead(x, y)));
  label('all bed cabling runs the CENTRE chase (side bays are full of drawers)', 0, 14.8, B.L - 9, 'blue', 'base');
  box(groups.wiring, 'BF-BASE foot-gap cable drop behind the 1 in-short foot drawer', 5, 7, 1.8, 0, 9, 82, mats.void, { edgeColor: 0x38bdf8, edgeOpacity: 0.66, cast: false });
  [-2, 2].forEach(x => {
    box(groups.wiring, `BF-BASE centre base-to-headboard cable bore (head rail + bottom cap -> rear cavity) x=${x}`, 1.4, 2.2, 8.4, x, 1, -1.8, mats.void, { edgeColor: 0x38bdf8, edgeOpacity: 0.66, cast: false });
    cyl(groups.wiring, `BF-BASE centre cable run foot-gap to head x=${x}`, 0.3, 80, x, 7, 42, mats.cableSpeaker, 'z', { segments: 16, cast: false });
  });
  [-2, 2].forEach(x => box(groups.wiring, `centre cable raceway through receiver ladder x=${x}`, 1.4, 41, 1.4, x, 21.5, -5, mats.void, { edgeColor: 0x22d3ee, edgeOpacity: 0.5, cast: false }));
  [-36, 36].forEach(x => box(groups.wiring, `mullion cable bore (speaker crossing) x=${x}`, 4.4, 1.4, 1.4, x, SPEC.speaker.bottom + 2, -5, mats.void, { edgeColor: 0x22d3ee, edgeOpacity: 0.6, cast: false }));
  label('centre cable chase: foot gap -> up the spine -> bottom-frame bore -> headboard rear cavity', 0, 9.2, 60, 'blue', 'base');
  line3(groups.wiring, 'AC mains: powerCON dock inlet -> cubby strip + lift', [
    [-33, 6, 85.5], [-31.5, 5.5, 89], [-10, 5.5, 93], [-10, 4, 93]
  ], 0xf97316, 0.86);
  line3(groups.wiring, 'LV/HDMI/control: internal cubby loom (cabinet-resident gear)', [
    [31.5, 5.5, 90], [31.5, 5.5, 93], [10, 5.5, 93], [10, 4, 93]
  ], 0x38bdf8, 0.86);
  line3(groups.wiring, '24V + Casambi: base hub -> centre bore -> up the rear cavity to the top-cap LED', [
    [-2, 7, 6], [-2, 7, 2.5], [-2, 1, 2.5], [-2, 1, -5], [-2, 66, -5], [-2, 70, -5], [-2, 70, -4]
  ], 0x38bdf8, 0.8);
  label('74 x 85 grounded base; central spine and continuous side exoskeleton', 0, 19.5, 43, 'blue', 'base');
  label('base/headboard bolts align to x=-36,-4,+4,+36 at AFF 5 and 14.5', 0, 17.5, 2.8, 'steel', 'base');
  pieceLabel('BF-BASE-L-CHORD', 'left side chord (top+bottom rails, drawer openings between)', -36.5, 15.7, 42.5, '2.4 rails x 85', 'base');
  pieceLabel('BF-BASE-R-CHORD', 'right side chord (top+bottom rails, drawer openings between)', 36.5, 15.7, 42.5, '2.4 rails x 85', 'base');
  pieceLabel('BF-BASE-SPINE', 'base center spine', 0, 10, 42.5, '3 x 15 x 85', 'base');
}

// ----------------------------------------------------------------------------
//  BUILDER: TV-lift footboard + Touchstone 23401  (verbatim from master addFootboardAndLift)
//  ctx adds: groups:{footboard,liftSystem}, liftStage1, liftCarriage (THREE.Groups)
// ----------------------------------------------------------------------------
export function buildFootboardAndLift(ctx) {
  const { box, cyl, mats, groups, label, pieceLabel, liftStage1, liftCarriage } = ctx;
  const { ZB, footMidZ, liftBackerZ, liftFrontZ, liftCenterZ, liftScreenZ, soundbarFrontZ, soundbarCenterZ } = deriveZ();
  const F = SPEC.footboard;
  const C = SPEC.cubby;
  const L = SPEC.lift;
  const group = groups.footboard;
  const cubbyCeilY = L.deckTopY - F.deckTh;
  box(group, 'FB left side panel ghost', F.sideTh, F.H, F.D, -F.W / 2 + F.sideTh / 2, F.H / 2, footMidZ, mats.footWood);
  box(group, 'FB right side panel ghost', F.sideTh, F.H, F.D, F.W / 2 - F.sideTh / 2, F.H / 2, footMidZ, mats.footWood);
  box(group, 'FB bed-side service/back wall ghost (solid; no cubby holes)', F.W, F.H, F.rearTh, 0, F.H / 2, ZB.footBack + F.rearTh / 2, mats.footWood);
  box(group, 'FB bottom deck / cubby floor (single floor)', F.W - 2 * F.sideTh, F.deckTh, F.D, 0, F.deckTh / 2, footMidZ, mats.footWood, { edgeColor: 0x5f411a, edgeOpacity: 0.4 });
  const apronH = F.H - cubbyCeilY;
  box(group, 'FB front apron (closes upper front above cubby; no lift-compartment sightline)', F.W - 2 * F.sideTh, apronH, F.faceTh, 0, cubbyCeilY + apronH / 2, ZB.footFront - F.faceTh / 2, mats.footWood, { edgeColor: 0x5f411a, edgeOpacity: 0.42 });
  box(group, 'FB flat raised lift deck / cubby ceiling 8 AFF', C.W, F.deckTh, C.D, 0, L.deckTopY - F.deckTh / 2, footMidZ, mats.footWood, { edgeColor: 0x5f411a, edgeOpacity: 0.4 });
  box(group, 'FB left front-to-back lift-deck rib', 1.25, C.clearH, C.D, -15.625, C.floorY + C.clearH / 2, footMidZ, mats.footWood);
  box(group, 'FB right front-to-back lift-deck rib', 1.25, C.clearH, C.D, 15.625, C.floorY + C.clearH / 2, footMidZ, mats.footWood);
  [-25.625, -5, 5, 25.625].forEach((x, i) => {
    box(group, `FB cubby rear-edge ceiling U-notch ${i + 1}`, 1.25, 1.25, 0.9, x, cubbyCeilY, ZB.footBack + F.rearTh + 0.45, mats.void, { edgeColor: 0x38bdf8, edgeOpacity: 0.78, cast: false });
  });
  // Cabinet side walls are SEALED — no cable holes. Power and speakers cross the foot seam through the
  // dock connectors (powerCON 120V AC + speakON NL4), so the old AC/LV side pass-throughs were removed.
  const topInX = F.W / 2 - F.sideTh, lidHalf = SPEC.lid.W / 2 + 0.25, topY = F.H - 0.5;
  const fillerW = topInX - lidHalf, topD = F.D - F.rearTh - F.faceTh;
  [-1, 1].forEach(s => box(group, `FB fixed top filler ${s < 0 ? 'left' : 'right'} (closes gap beside lid slot)`, fillerW, 1.0, topD, s * (lidHalf + fillerW / 2), topY, ZB.footBack + F.rearTh + topD / 2, mats.footWood, { edges: false }));
  label('TV-lift footboard 74 x 41 x 16: apron closes the upper front; cubby opens below; fixed fillers close the top beside the lid slot', 0, 44, footMidZ, 'gold', 'footboard');
  label('empty flat cubby (3 bays / 2 ribs); 4 rear-edge ceiling U-notches; sealed side walls (power + speakers cross at the dock connectors); no devices', 0, 9.5, ZB.footBack - 1.4, 'blue', 'footboard');
  pieceLabel('FB-CAB-01', 'TV-lift footboard cabinet ghost', 0, 41.8, footMidZ, '74 x 41 x 16', 'footboard');

  const lift = groups.liftSystem, bpTop = L.deckTopY + 0.4;
  const bodyW = 5.5, bodyH = 22, bodyD = 3.6;
  box(lift, 'Touchstone 23401 floor base plate 9.875 x 5.125', L.basePlateW, 0.4, L.basePlateD, 0, L.deckTopY + 0.2, liftCenterZ, mats.liftSteel, { edgeColor: 0xd1d5db, edgeOpacity: 0.5 });
  [-3.55, 3.55].forEach(hx => [liftCenterZ - 1.7, liftCenterZ, liftCenterZ + 1.7].forEach(hz => {
    cyl(lift, `Touchstone floor mount hole x=${hx} z=${hz.toFixed(1)}`, 0.22, 0.55, hx, L.deckTopY + 0.2, hz, mats.darkSteel, 'y', { segments: 18, cast: false });
    cyl(lift, `Touchstone floor mount screw head x=${hx} z=${hz.toFixed(1)}`, 0.3, 0.12, hx, L.deckTopY + 0.44, hz, mats.steel, 'y', { segments: 18, cast: false });
  }));
  box(lift, 'Touchstone stationary outer body / housing', bodyW, bodyH, bodyD, 0, bpTop + bodyH / 2, liftCenterZ, mats.liftSteel, { edgeColor: 0xd1d5db, edgeOpacity: 0.5 });
  box(lift, 'Touchstone body front seam', bodyW - 0.5, bodyH - 1.0, 0.05, 0, bpTop + bodyH / 2, liftCenterZ - bodyD / 2 - 0.03, mats.steel, { edgeOpacity: 0.16, cast: false });
  [bpTop + 5, bpTop + 11, bpTop + 17].forEach(sy => cyl(lift, `Touchstone body service hole y=${sy.toFixed(0)}`, 0.16, 0.12, 0, sy, liftCenterZ - bodyD / 2 - 0.05, mats.darkSteel, 'z', { segments: 14, cast: false }));
  [bpTop + bodyH - 7, bpTop + bodyH - 2.5].forEach(ty => {
    box(lift, `Touchstone rear mount tab y=${ty.toFixed(0)}`, 3.4, 1.5, 0.5, 0, ty, liftBackerZ - 0.25, mats.liftSteel, { edgeColor: 0xd1d5db, edgeOpacity: 0.5, cast: false });
    [-1.0, 1.0].forEach(tx => cyl(lift, `Touchstone rear mount hole x=${tx} y=${ty.toFixed(0)}`, 0.16, 0.6, tx, ty, liftBackerZ - 0.25, mats.darkSteel, 'z', { segments: 14, cast: false }));
  });
  box(liftStage1, 'Touchstone middle telescoping stage', bodyW - 1.4, bodyH - 2, bodyD - 0.8, 0, bpTop + (bodyH - 2) / 2 + 0.7, liftCenterZ, mats.steel, { edgeColor: 0xd1d5db, edgeOpacity: 0.45 });
  const car = liftCarriage, carMidY = SPEC.tv.retractBottom + SPEC.tv.H / 2;
  box(car, 'Touchstone inner mast (telescoping)', bodyW - 2.6, bodyH - 3, bodyD - 1.4, 0, bpTop + (bodyH - 3) / 2 + 0.9, liftCenterZ, mats.liftSteel, { edgeColor: 0xd1d5db, edgeOpacity: 0.45 });
  box(car, 'Touchstone TV bracket central mount plate', 5.5, 12, 0.5, 0, carMidY, liftFrontZ + 0.15, mats.liftSteel, { edgeOpacity: 0.32 });
  [['upper', carMidY + 6.4], ['lower', carMidY - 6.4]].forEach(([k, ry]) => box(car, `Touchstone TV bracket ${k} horizontal rail 28.375`, L.baseW, 1.2, 0.55, 0, ry, liftFrontZ - 0.25, mats.steel, { edgeOpacity: 0.34 }));
  [-6.0, 6.0].forEach(sx => {
    box(car, `Touchstone vertical slotted VESA strap x=${sx}`, 1.5, 14.5, 0.45, sx, carMidY, liftFrontZ - 0.55, mats.liftSteel, { edgeOpacity: 0.32 });
    for (let hy = -6; hy <= 6; hy += 1.7) box(car, `VESA slot x=${sx} y=${hy.toFixed(1)}`, 0.42, 0.6, 0.12, sx, carMidY + hy, liftFrontZ - 0.79, mats.darkSteel, { edges: false, cast: false });
  });
  cyl(car, 'Touchstone flat-top lid roller', 0.4, 5.5, 0, carMidY + 7.6, liftFrontZ - 0.1, mats.darkSteel, 'x', { segments: 16, cast: false });
  const tvCenterY = SPEC.tv.retractBottom + SPEC.tv.H / 2;
  box(car, '55 in Sony OLED ghost panel no stand', SPEC.tv.W, SPEC.tv.H, SPEC.tv.D, 0, tvCenterY, liftScreenZ + SPEC.tv.D / 2, mats.tvGlass, { edgeColor: 0x64748b, edgeOpacity: 0.5 });
  const sbCenterY = SPEC.soundbar.retractBottom + SPEC.soundbar.H / 2;
  box(car, 'Sony Bravia Theatre Bar 9 ghost body', SPEC.soundbar.W, SPEC.soundbar.H, SPEC.soundbar.D, 0, sbCenterY, soundbarCenterZ, mats.soundbar, { edgeColor: 0x94a3b8, edgeOpacity: 0.44 });
  const vz = liftFrontZ - 0.55;
  const sbFrontZ = soundbarFrontZ;
  box(car, 'Sanus WSBSBTV1 VESA hub plate (bolts to TV VESA holes, behind TV)', 4.5, 5.0, 0.4, 0, carMidY, vz - 0.35, mats.darkSteel, { edgeColor: 0x94a3b8, edgeOpacity: 0.4 });
  [carMidY + 2.4, carMidY - 2.4].forEach(ry => box(car, 'Sanus WSBSBTV1 VESA width rail', 16, 0.7, 0.3, 0, ry, vz - 0.55, mats.darkSteel, { edgeColor: 0x94a3b8, edgeOpacity: 0.36, cast: false }));
  box(car, 'Sanus WSBSBTV1 vertical height-adjust column', 2.6, carMidY - 8.0, 1.5, 0, (carMidY + 8.0) / 2, vz - 0.35, mats.liftSteel, { edgeColor: 0xd1d5db, edgeOpacity: 0.4 });
  box(car, 'Sanus WSBSBTV1 soundbar mount bar 43.86', 43.86, 1.0, 1.2, 0, 8.0, vz - 0.35, mats.darkSteel, { edgeColor: 0x94a3b8, edgeOpacity: 0.4 });
  [-21.9, 21.9].forEach(ax => {
    box(car, `Sanus WSBSBTV1 forward soundbar arm (3.6 in forward) x=${ax}`, 0.6, 0.6, (vz - 0.35) - sbFrontZ, ax, 8.0, ((vz - 0.35) + sbFrontZ) / 2, mats.darkSteel, { edgeColor: 0x94a3b8, edgeOpacity: 0.4, cast: false });
    box(car, `Sanus WSBSBTV1 soundbar cradle lip x=${ax}`, 0.6, 1.6, 0.3, ax, 8.7, sbFrontZ + 0.15, mats.darkSteel, { edgeColor: 0x94a3b8, edgeOpacity: 0.42, cast: false });
  });
  [-5, 5].forEach(bx => [carMidY - 4, carMidY + 4].forEach(by => cyl(car, `Sanus VESA share bolt x=${bx} y=${by.toFixed(0)}`, 0.17, 1.4, bx, by, vz + 0.1, mats.steel, 'z', { segments: 14, cast: false })));
  box(car, 'ash-faced lightweight connected lid ghost', SPEC.lid.W, SPEC.lid.T, SPEC.lid.D, 0, SPEC.lid.flushTop - SPEC.lid.T / 2, footMidZ, mats.footWood, { edgeColor: 0x5f411a, edgeOpacity: 0.42 });
  label('Touchstone 23401 per the vendor drawing: 9.875 x 5.125 floor plate w/ 6 floor-mount holes (3/side) + 2 rear-wall tabs; 2-stage telescope; 28.375 TV bracket + slotted VESA straps', 0, 36.5, liftFrontZ - 2.2, 'steel', 'lift');
  label('6 floor-mount holes (3 each side) bolt the base plate to the 8 AFF deck; 2 rear tabs bolt to the back wall (manual p13)', 0, 6.4, liftCenterZ + 1.0, 'warn', 'lift');
  label('55 in TV + soundbar retract above the flat 8 AFF deck; no scabbard', 0, 12.2, soundbarFrontZ - 1.2, 'green', 'lift');
  label('Sanus WSBSBTV1-B2: bolts to the TV VESA holes; column + 43.86 in bar project the soundbar 3.6 in FORWARD (back flush w/ screen); co-moves on the lift', 0, 5.5, soundbarFrontZ - 1.0, 'steel', 'lift');
  pieceLabel('LIFT-23401', 'Touchstone 23401 ghost mechanism', 0, 32, liftCenterZ - 4.2, '9.875x5.125 plate (6 holes + 2 rear) + body + telescoping mast + 28.375 bracket', 'lift');
}

// ----------------------------------------------------------------------------
//  BUILDER: detachable dock hardware at the foot-of-bed seam (Z = 85).
//  Shared so the master (BF-M01, docked) and the dock detail (BF-D09, animated)
//  show the SAME powerCON / speakON / locating dowels / bed bolts.
//  ctx: { cabGroup, baseGroup }  — cabinet-side parts go on cabGroup (which BF-D09
//  translates to dock/undock); base-side parts go on baseGroup (fixed).
//  Returns { acMat, spkMat } so a host can pulse the connectors on mate.
// ----------------------------------------------------------------------------
export function buildDockHardware(ctx) {
  const { cabGroup, baseGroup } = ctx;
  const SEAM = SPEC.fullBedZ.footBack;   // 85
  const steel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.36, metalness: 0.76 });
  const housing = new THREE.MeshStandardMaterial({ color: 0x23282f, roughness: 0.5, metalness: 0.55 });
  const acMat = new THREE.MeshStandardMaterial({ color: 0xe0962f, roughness: 0.45, metalness: 0.2, emissive: 0x3a2406, emissiveIntensity: 0.5 });
  const spkMat = new THREE.MeshStandardMaterial({ color: 0x3b6fb0, roughness: 0.45, metalness: 0.2, emissive: 0x06182f, emissiveIntensity: 0.5 });
  const bore = new THREE.MeshStandardMaterial({ color: 0x0d1014, roughness: 1 });
  const pocketRing = new THREE.MeshStandardMaterial({ color: 0xb89a5c, roughness: 0.7 });
  const pocketWell = new THREE.MeshStandardMaterial({ color: 0x6f5a32, roughness: 0.9 });
  function zc(r1, r2, len, mat, seg = 26) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, seg), mat); m.rotation.x = Math.PI / 2; m.castShadow = true; return m; }
  function plug(mat, npins, name) {
    const g = new THREE.Group(); g.name = name;
    const h = zc(0.58, 0.58, 1.5, housing); h.position.z = -0.4; g.add(h);
    const collar = zc(0.72, 0.66, 0.42, mat); collar.position.z = -1.05; g.add(collar);
    const ring = npins === 3 ? [[0, 0.26], [0.22, -0.13], [-0.22, -0.13]] : [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]];
    for (const [px, py] of ring) { const pin = zc(0.075, 0.075, 0.9, steel); pin.position.set(px, py, -1.5); g.add(pin); }
    return g;
  }
  function socket(mat, name) {
    const g = new THREE.Group(); g.name = name;
    const shell = zc(0.74, 0.74, 1.2, housing); shell.position.z = -0.55; g.add(shell);
    const face = zc(0.74, 0.74, 0.12, mat); g.add(face);
    const b = zc(0.6, 0.6, 1.0, bore); b.position.z = -0.5; g.add(b);
    return g;
  }
  function pocket(group, x, y, into) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 0.2), pocketRing); r.position.set(x, y, SEAM + into * 0.05); group.add(r);
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.5), pocketWell); w.position.set(x, y, SEAM + into * 0.3); group.add(w);
  }
  // cabinet-side: plugs + dowels protrude -Z toward the base
  const acPlug = plug(acMat, 3, 'powerCON plug (120V AC)'); acPlug.position.set(-33, 6, SEAM); cabGroup.add(acPlug);
  const spkPlug = plug(spkMat, 4, 'speakON NL4 plug (speakers L+R)'); spkPlug.position.set(33, 6, SEAM); cabGroup.add(spkPlug);
  pocket(cabGroup, -33, 6, -1); pocket(cabGroup, 33, 6, -1);
  for (const x of [-19, 19]) {
    const d = zc(0.1875, 0.1875, 3.4, steel); d.name = 'locating dowel'; d.position.set(x, 12, SEAM - 1.5); cabGroup.add(d);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1875, 0.5, 18), steel); tip.rotation.x = -Math.PI / 2; tip.position.set(x, 12, SEAM - 3.45); tip.castShadow = true; cabGroup.add(tip);
    const collar = zc(0.34, 0.34, 0.4, dark); collar.position.set(x, 12, SEAM + 0.2); cabGroup.add(collar);
  }
  // base-side: sockets + bushings + bed bolts, recessed into the base foot face
  const acSock = socket(acMat, 'powerCON socket'); acSock.position.set(-33, 6, SEAM); baseGroup.add(acSock);
  const spkSock = socket(spkMat, 'speakON socket'); spkSock.position.set(33, 6, SEAM); baseGroup.add(spkSock);
  pocket(baseGroup, -33, 6, 1); pocket(baseGroup, 33, 6, 1);
  for (const x of [-19, 19]) {
    const bush = zc(0.42, 0.42, 1.0, dark); bush.name = 'dowel bushing'; bush.position.set(x, 12, SEAM - 0.5); baseGroup.add(bush);
    const b = zc(0.22, 0.22, 1.2, bore); b.position.set(x, 12, SEAM - 0.5); baseGroup.add(b);
    const flange = zc(0.55, 0.55, 0.18, steel); flange.position.set(x, 12, SEAM + 0.02); baseGroup.add(flange);
  }
  for (const x of [-29, -11, 11, 29]) {
    const shaft = zc(0.26, 0.26, 4.5, dark); shaft.name = 'bed bolt'; shaft.position.set(x, 14, SEAM - 1.2); baseGroup.add(shaft);
    const head = zc(0.5, 0.5, 0.5, steel, 6); head.position.set(x, 14, SEAM - 3.4); baseGroup.add(head);
  }
  return { acMat, spkMat };
}
