import * as THREE from 'three';
import { ARDrop } from '../../engine/arDrops';

/**
 * Oppretter stiliserte Askeladden-turvotter i norsk strikkestil.
 * Rød ull (0xb91c1c), kremhvit ullkant (0xfef08a) og detaljer.
 */
export function createMitten(isLeft: boolean): THREE.Group {
  const group = new THREE.Group();

  // Ull-materiale
  const woolRed = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.85,
    metalness: 0.05,
  });

  const woolCream = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woolNavy = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.85,
  });

  // Håndflate / vottekropp
  const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.28, 8, 16);
  const body = new THREE.Mesh(bodyGeo, woolRed);
  body.scale.set(1.0, 1.2, 0.65);
  group.add(body);

  // Dekorativt Marius/Nordisk strikkebånd over votteryggen
  const stripeGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.05, 16);
  const stripe = new THREE.Mesh(stripeGeo, woolCream);
  stripe.scale.set(1.0, 1.0, 0.66);
  stripe.position.y = 0.02;
  group.add(stripe);

  // Tommel (stikker innover mot midten)
  const thumbGeo = new THREE.CapsuleGeometry(0.065, 0.14, 8, 12);
  const thumb = new THREE.Mesh(thumbGeo, woolRed);
  const thumbDir = isLeft ? 1 : -1;
  thumb.position.set(0.14 * thumbDir, -0.04, 0.06);
  thumb.rotation.z = -0.65 * thumbDir;
  thumb.rotation.x = 0.25;
  group.add(thumb);

  // Ribbestrikket mansjett rundt håndleddet
  const cuffGeo = new THREE.CylinderGeometry(0.18, 0.19, 0.14, 16);
  const cuff = new THREE.Mesh(cuffGeo, woolNavy);
  cuff.position.y = -0.22;
  group.add(cuff);

  const cuffTrimGeo = new THREE.TorusGeometry(0.185, 0.02, 8, 16);
  const cuffTrim = new THREE.Mesh(cuffTrimGeo, woolCream);
  cuffTrim.rotation.x = Math.PI / 2;
  cuffTrim.position.y = -0.28;
  group.add(cuffTrim);

  // Vinkling for naturlig førstepersonshold
  group.rotation.x = -0.25;
  group.rotation.y = isLeft ? 0.35 : -0.35;
  group.rotation.z = isLeft ? -0.15 : 0.15;

  return group;
}

/**
 * 3D Mikkel Rev (lavpoly eventyrstil)
 * Står på bakken, logrer med halen og hopper glad når man vinker.
 */
export function createFox(): {
  group: THREE.Group;
  tail: THREE.Group;
  head: THREE.Group;
} {
  const group = new THREE.Group();

  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xdf5a16,
    roughness: 0.7,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.9,
  });

  // Kropp
  const bodyGeo = new THREE.CapsuleGeometry(0.24, 0.42, 8, 12);
  const body = new THREE.Mesh(bodyGeo, orangeMat);
  body.rotation.x = Math.PI / 3;
  body.position.set(0, 0.35, 0);
  group.add(body);

  // Hvitt bryst
  const chestGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const chest = new THREE.Mesh(chestGeo, whiteMat);
  chest.scale.set(0.9, 1.2, 0.8);
  chest.position.set(0, 0.42, 0.16);
  group.add(chest);

  // Hode-gruppe
  const head = new THREE.Group();
  head.position.set(0, 0.6, 0.22);

  const headGeo = new THREE.ConeGeometry(0.22, 0.36, 8);
  const headMesh = new THREE.Mesh(headGeo, orangeMat);
  headMesh.rotation.x = Math.PI / 2;
  head.add(headMesh);

  // Snutetupp
  const noseGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const nose = new THREE.Mesh(noseGeo, darkMat);
  nose.position.set(0, -0.02, 0.2);
  head.add(nose);

  // Hvite kinn
  const cheekGeo = new THREE.SphereGeometry(0.09, 6, 6);
  const leftCheek = new THREE.Mesh(cheekGeo, whiteMat);
  leftCheek.position.set(0.1, -0.02, 0.08);
  head.add(leftCheek);
  const rightCheek = new THREE.Mesh(cheekGeo, whiteMat);
  rightCheek.position.set(-0.1, -0.02, 0.08);
  head.add(rightCheek);

  // Øyne
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(0.08, 0.09, 0.12);
  head.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(-0.08, 0.09, 0.12);
  head.add(rightEye);

  // Ører
  const earGeo = new THREE.ConeGeometry(0.08, 0.18, 5);
  const leftEar = new THREE.Mesh(earGeo, orangeMat);
  leftEar.position.set(0.12, 0.18, -0.04);
  leftEar.rotation.z = -0.25;
  head.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, orangeMat);
  rightEar.position.set(-0.12, 0.18, -0.04);
  rightEar.rotation.z = 0.25;
  head.add(rightEar);

  group.add(head);

  // 4 poter / bein
  const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.28, 6);
  [
    [-0.12, 0.14, 0.14],
    [0.12, 0.14, 0.14],
    [-0.14, 0.14, -0.16],
    [0.14, 0.14, -0.16],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  // Stor buskete hale med hvit tupp
  const tail = new THREE.Group();
  tail.position.set(0, 0.3, -0.28);

  const tailGeo = new THREE.ConeGeometry(0.16, 0.45, 8);
  const tailBase = new THREE.Mesh(tailGeo, orangeMat);
  tailBase.rotation.x = -Math.PI / 3;
  tail.add(tailBase);

  const tailTipGeo = new THREE.ConeGeometry(0.1, 0.2, 8);
  const tailTip = new THREE.Mesh(tailTipGeo, whiteMat);
  tailTip.position.set(0, 0.25, -0.15);
  tailTip.rotation.x = -Math.PI / 3;
  tail.add(tailTip);

  group.add(tail);

  return { group, tail, head };
}

/**
 * 3D Nøtteliten Ekorn (lavpoly)
 */
export function createSquirrel(): {
  group: THREE.Group;
  tail: THREE.Group;
} {
  const group = new THREE.Group();

  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.75,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.8,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Kropp
  const bodyGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const body = new THREE.Mesh(bodyGeo, brownMat);
  body.scale.set(0.9, 1.2, 0.9);
  body.position.set(0, 0.25, 0);
  group.add(body);

  // Lys mage
  const bellyGeo = new THREE.SphereGeometry(0.13, 8, 8);
  const belly = new THREE.Mesh(bellyGeo, creamMat);
  belly.position.set(0, 0.25, 0.1);
  group.add(belly);

  // Hode
  const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const head = new THREE.Mesh(headGeo, brownMat);
  head.position.set(0, 0.44, 0.08);
  group.add(head);

  // Ører
  const earGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
  const earL = new THREE.Mesh(earGeo, brownMat);
  earL.position.set(0.07, 0.55, 0.06);
  group.add(earL);
  const earR = new THREE.Mesh(earGeo, brownMat);
  earR.position.set(-0.07, 0.55, 0.06);
  group.add(earR);

  // Øyne
  const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, darkMat);
  eyeL.position.set(0.06, 0.46, 0.19);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, darkMat);
  eyeR.position.set(-0.06, 0.46, 0.19);
  group.add(eyeR);

  // Gyllen kongle/nøtt i forpotene
  const acornGeo = new THREE.ConeGeometry(0.07, 0.12, 6);
  const acorn = new THREE.Mesh(acornGeo, goldMat);
  acorn.rotation.x = Math.PI;
  acorn.position.set(0, 0.28, 0.18);
  group.add(acorn);

  // Stor krøllet ekornhale over ryggen
  const tail = new THREE.Group();
  tail.position.set(0, 0.16, -0.12);

  const tailGeo = new THREE.TorusGeometry(0.2, 0.09, 8, 16, Math.PI * 1.2);
  const tailMesh = new THREE.Mesh(tailGeo, brownMat);
  tailMesh.rotation.y = Math.PI / 2;
  tailMesh.rotation.z = -Math.PI / 3;
  tailMesh.position.set(0, 0.15, -0.05);
  tail.add(tailMesh);

  group.add(tail);

  return { group, tail };
}

/**
 * 3D Skattekiste på bakken
 */
export function createChest(): {
  group: THREE.Group;
  lid: THREE.Group;
} {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Kistebunn
  const baseGeo = new THREE.BoxGeometry(0.48, 0.28, 0.34);
  const base = new THREE.Mesh(baseGeo, woodMat);
  base.position.y = 0.14;
  group.add(base);

  // Gull-bånd
  const bandGeo = new THREE.BoxGeometry(0.5, 0.3, 0.06);
  const bandL = new THREE.Mesh(bandGeo, goldMat);
  bandL.position.set(0, 0.14, 0.1);
  group.add(bandL);
  const bandR = new THREE.Mesh(bandGeo, goldMat);
  bandR.position.set(0, 0.14, -0.1);
  group.add(bandR);

  // Lokk (hengslet bak)
  const lid = new THREE.Group();
  lid.position.set(0, 0.28, -0.17);

  const lidGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12, 1, false, 0, Math.PI);
  const lidMesh = new THREE.Mesh(lidGeo, woodMat);
  lidMesh.rotation.z = Math.PI / 2;
  lidMesh.position.set(0, 0, 0.17);
  lid.add(lidMesh);

  // Lås foran
  const lockGeo = new THREE.BoxGeometry(0.08, 0.1, 0.05);
  const lock = new THREE.Mesh(lockGeo, goldMat);
  lock.position.set(0, -0.02, 0.36);
  lid.add(lock);

  group.add(lid);

  return { group, lid };
}

/**
 * Høythengende mål i tau (Gullpose / Nøkkel / Ravfjær / Ugle)
 */
export function createHangingTarget(drop: ARDrop): {
  group: THREE.Group;
  rope: THREE.Mesh;
  target: THREE.Group;
} {
  const group = new THREE.Group();

  // Tau fra toppen (y = 2.2) ned til opphengspunktet
  const ropeHeight = 1.3;
  const ropeGeo = new THREE.CylinderGeometry(0.015, 0.015, ropeHeight, 6);
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.9,
  });
  const rope = new THREE.Mesh(ropeGeo, ropeMat);
  rope.position.y = ropeHeight / 2;
  group.add(rope);

  // Selve målet som henger nederst
  const target = new THREE.Group();
  target.position.y = 0;

  if (drop.id.includes('nokkel')) {
    // Gullnøkkel
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.8,
      roughness: 0.2,
    });
    // Nøkkelhode (ring)
    const ringGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    const ring = new THREE.Mesh(ringGeo, goldMat);
    ring.position.y = -0.05;
    target.add(ring);

    // Skaft
    const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8);
    const shaft = new THREE.Mesh(shaftGeo, goldMat);
    shaft.position.y = -0.26;
    target.add(shaft);

    // Skjegg / tenner
    const bitGeo = new THREE.BoxGeometry(0.08, 0.1, 0.03);
    const bit = new THREE.Mesh(bitGeo, goldMat);
    bit.position.set(0.04, -0.38, 0);
    target.add(bit);
  } else if (drop.id.includes('solkrystall') || drop.category === 'coin') {
    // Pose med gullmynter
    const pouchMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.7,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.7,
      roughness: 0.25,
    });

    const sackGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const sack = new THREE.Mesh(sackGeo, pouchMat);
    sack.scale.set(1.0, 1.2, 0.9);
    sack.position.y = -0.16;
    target.add(sack);

    // Knytesnor i toppen
    const tieGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    const tie = new THREE.Mesh(tieGeo, goldMat);
    tie.rotation.x = Math.PI / 2;
    tie.position.y = -0.02;
    target.add(tie);

    // Mynter som titter opp
    const coinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    const coin1 = new THREE.Mesh(coinGeo, goldMat);
    coin1.rotation.x = 0.4;
    coin1.position.set(0.04, 0.04, 0.02);
    target.add(coin1);
  } else if (drop.id.includes('ugle') || drop.animalSpecies === 'ugle') {
    // 3D Hubroen Ugle perched i treet
    const owl = createOwl();
    owl.position.y = -0.28;
    target.add(owl);
  } else if (drop.id.includes('ravfjaer') || drop.id.includes('fjaer')) {
    // 3D Ravfjær
    const feather = createFeather();
    feather.position.y = -0.25;
    target.add(feather);
  } else {
    // Standard eventyrmål (Svevende lodd / krystall)
    const gemGeo = new THREE.OctahedronGeometry(0.2, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.4,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.y = -0.15;
    target.add(gem);
  }

  group.add(target);
  return { group, rope, target };
}

/**
 * 3D Hubro / Ugle i lavpoly eventyrstil
 */
export function createOwl(): THREE.Group {
  const group = new THREE.Group();

  const brownMat = new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 0.8 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 });
  const goldEyeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

  // Kropp
  const bodyGeo = new THREE.CapsuleGeometry(0.18, 0.28, 8, 12);
  const body = new THREE.Mesh(bodyGeo, brownMat);
  group.add(body);

  // Lys brystkasse
  const chestGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const chest = new THREE.Mesh(chestGeo, creamMat);
  chest.scale.set(0.9, 1.2, 0.6);
  chest.position.set(0, -0.02, 0.11);
  group.add(chest);

  // Store ugleøyne
  [-0.08, 0.08].forEach(x => {
    const eyeRingGeo = new THREE.TorusGeometry(0.065, 0.015, 6, 12);
    const eyeRing = new THREE.Mesh(eyeRingGeo, creamMat);
    eyeRing.position.set(x, 0.12, 0.15);
    group.add(eyeRing);

    const eyeGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const eye = new THREE.Mesh(eyeGeo, goldEyeMat);
    eye.position.set(x, 0.12, 0.15);
    group.add(eye);

    const pupilGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const pupil = new THREE.Mesh(pupilGeo, darkMat);
    pupil.position.set(x, 0.12, 0.185);
    group.add(pupil);
  });

  // Nebb
  const beakGeo = new THREE.ConeGeometry(0.035, 0.08, 4);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.rotation.x = Math.PI / 1.3;
  beak.position.set(0, 0.07, 0.18);
  group.add(beak);

  // Øredusker / fjærhorn
  [-0.1, 0.1].forEach((x, i) => {
    const tuftGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    const tuft = new THREE.Mesh(tuftGeo, brownMat);
    tuft.position.set(x, 0.26, 0.04);
    tuft.rotation.z = (i === 0 ? 0.35 : -0.35);
    group.add(tuft);
  });

  // Vinger foldet inn
  [-0.17, 0.17].forEach((x, i) => {
    const wingGeo = new THREE.BoxGeometry(0.06, 0.28, 0.14);
    const wing = new THREE.Mesh(wingGeo, brownMat);
    wing.position.set(x, -0.04, 0.02);
    wing.rotation.z = (i === 0 ? -0.15 : 0.15);
    group.add(wing);
  });

  return group;
}

/**
 * 3D Ravfjær
 */
export function createFeather(): THREE.Group {
  const group = new THREE.Group();

  const quillMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0x312e81,
    emissiveIntensity: 0.25,
  });

  // Stilken (quill)
  const shaftGeo = new THREE.CylinderGeometry(0.01, 0.018, 0.45, 6);
  const shaft = new THREE.Mesh(shaftGeo, quillMat);
  shaft.position.y = 0;
  group.add(shaft);

  // Fjærblad
  const bladeGeo = new THREE.CapsuleGeometry(0.08, 0.26, 4, 8);
  const blade = new THREE.Mesh(bladeGeo, featherMat);
  blade.scale.set(0.9, 1.0, 0.12);
  blade.position.set(0.02, 0.08, 0);
  blade.rotation.z = 0.08;
  group.add(blade);

  group.rotation.z = 0.2;
  return group;
}


/**
 * Myk kontaktskygge-dekal for bakken under dyr og skatter
 */
export function createGroundDecal(): THREE.Mesh {
  const decalGeo = new THREE.CircleGeometry(0.45, 24);
  const decalMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.rotation.x = -Math.PI / 2;
  return decal;
}

/**
 * 3D Bumerang
 */
export function createBoomerangMesh(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.6,
    metalness: 0.1,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.5,
  });

  // V-formet bumerang med to vinger
  const wingGeo = new THREE.BoxGeometry(0.05, 0.32, 0.015);
  const wing1 = new THREE.Mesh(wingGeo, woodMat);
  wing1.position.set(-0.09, 0.1, 0);
  wing1.rotation.z = 0.55;
  group.add(wing1);

  const wing2 = new THREE.Mesh(wingGeo, woodMat);
  wing2.position.set(0.09, 0.1, 0);
  wing2.rotation.z = -0.55;
  group.add(wing2);

  // Sentrums-skjøt
  const jointGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
  const joint = new THREE.Mesh(jointGeo, stripeMat);
  joint.rotation.x = Math.PI / 2;
  group.add(joint);

  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

/**
 * 3D Lasso-løkke
 */
export function createLassoMesh(): THREE.Group {
  const group = new THREE.Group();

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xca8a04,
    emissiveIntensity: 0.4,
    roughness: 0.6,
  });

  // Hoved-løkke
  const loopGeo = new THREE.TorusGeometry(0.32, 0.025, 8, 32);
  const loop = new THREE.Mesh(loopGeo, ropeMat);
  loop.rotation.x = Math.PI / 2;
  group.add(loop);

  // Knute
  const knotGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const knot = new THREE.Mesh(knotGeo, ropeMat);
  knot.position.set(0, 0, 0.32);
  group.add(knot);

  return group;
}

/**
 * 3D Solkastet Solsteinspeil
 */
export function createSunMirrorMesh(): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.6,
    roughness: 0.3,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    metalness: 0.9,
    roughness: 0.05,
    emissive: 0xfef08a,
    emissiveIntensity: 0.3,
  });

  // Rund ramme
  const frameGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.rotation.x = Math.PI / 2;
  group.add(frame);

  // Speilflate
  const mirrorGeo = new THREE.CircleGeometry(0.18, 16);
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.position.z = 0.016;
  group.add(mirror);

  return group;
}

/**
 * Gyllen 3D Luks-mynt
 */
export function createFloatingCoinMesh(): THREE.Group {
  const group = new THREE.Group();

  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0xd97706,
    emissiveIntensity: 0.2,
  });

  const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24);
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI / 2;
  group.add(coin);

  return group;
}
