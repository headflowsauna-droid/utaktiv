import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ARDrop } from '../../engine/arDrops';
import {
  createMitten,
  createFox,
  createSquirrel,
  createChest,
  createHangingTarget,
  createGroundDecal,
  createBoomerangMesh,
  createLassoMesh,
  createSunMirrorMesh,
  createFloatingCoinMesh,
} from './arMeshes';
import { arAudio } from './arAudio';

export interface ARWorldCanvasProps {
  activeDrop: ARDrop;
  activeTool: 'lasso' | 'boomerang' | 'solkast';
  isCollected: boolean;
  onCollect: (drop: ARDrop, method: 'lasso' | 'boomerang' | 'solkast' | 'pickup') => void;
  gyroOffset: { x: number; y: number };
  onWaveAnimal?: (animalName: string) => void;
  triggerThrowSignal?: number; // increments when user presses external throw button
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const ARWorldCanvas: React.FC<ARWorldCanvasProps> = ({
  activeDrop,
  activeTool,
  isCollected,
  onCollect,
  gyroOffset,
  onWaveAnimal,
  triggerThrowSignal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaksjons-tilstander
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  // Three.js objektreferanser lagret i ref for stabil render-loop
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    animFrameId: number;

    // Votter
    leftMitten: THREE.Group | null;
    rightMitten: THREE.Group | null;
    mittenToolMesh: THREE.Group | null;

    // Verden og mål
    groundDecal: THREE.Mesh | null;
    targetGroup: THREE.Group | null;
    foxTail: THREE.Group | null;
    hangingRope: THREE.Mesh | null;
    hangingTargetGroup: THREE.Group | null;
    chestLid: THREE.Group | null;

    // Kaste-effekter
    inFlightTool: THREE.Group | null;
    sunBeam: THREE.Mesh | null;

    // Animasjons-tilstander
    mittenAction: 'idle' | 'wave' | 'throw' | 'scoop';
    actionTime: number;
    animalHappyTime: number;

    // Fysikk for kapping og fall
    isRopeCut: boolean;
    fallingTargetPos: { x: number; y: number; z: number };
    fallingTargetVelY: number;
    hasLandedOnGround: boolean;

    // Kastefysikk
    toolFlightProgress: number; // 0 to 1
    toolFlightType: 'lasso' | 'boomerang' | 'solkast' | null;

    // Partikler
    particles: Particle[];
  }>({
    renderer: null,
    scene: null,
    camera: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    animFrameId: 0,
    leftMitten: null,
    rightMitten: null,
    mittenToolMesh: null,
    groundDecal: null,
    targetGroup: null,
    foxTail: null,
    hangingRope: null,
    hangingTargetGroup: null,
    chestLid: null,
    inFlightTool: null,
    sunBeam: null,
    mittenAction: 'idle',
    actionTime: 0,
    animalHappyTime: 0,
    isRopeCut: false,
    fallingTargetPos: { x: 0, y: 0, z: -2.5 },
    fallingTargetVelY: 0,
    hasLandedOnGround: false,
    toolFlightProgress: 0,
    toolFlightType: null,
    particles: [],
  });

  // Hjelpefunksjon for å skape gnister / konfetti-partikler
  const spawnParticles = useCallback((pos: THREE.Vector3, color: number, count = 12) => {
    const s = stateRef.current;
    if (!s.scene) return;

    const geo = new THREE.SphereGeometry(0.035, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      s.scene.add(mesh);

      s.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2.0 + 0.5,
        vz: (Math.random() - 0.5) * 1.5,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }, []);

  // Vink til dyret
  const triggerWave = useCallback(() => {
    const s = stateRef.current;
    if (s.mittenAction !== 'idle') return;

    s.mittenAction = 'wave';
    s.actionTime = 0;
    s.animalHappyTime = 1.5;

    arAudio.playAnimalHappySound();
    if (onWaveAnimal) {
      onWaveAnimal(activeDrop.title);
    }

    // Skap små hjerte/stjernepartikler ved dyret
    if (s.targetGroup) {
      spawnParticles(new THREE.Vector3(0, -0.2, -2.3), 0xf43f5e, 14); // Rosa/hjertefarge
    }
  }, [activeDrop.title, onWaveAnimal, spawnParticles]);

  // Plukk opp skatt fra bakken
  const triggerScoop = useCallback(() => {
    const s = stateRef.current;
    if (s.mittenAction !== 'idle') return;

    s.mittenAction = 'scoop';
    s.actionTime = 0;
    arAudio.playScoopSound();

    setTimeout(() => {
      onCollect(activeDrop, 'pickup');
      if (s.targetGroup) {
        s.targetGroup.visible = false;
      }
    }, 600);
  }, [activeDrop, onCollect]);

  // Kast aktivt verktøy (Lasso, Bumerang, Solkast)
  const triggerThrow = useCallback(() => {
    const s = stateRef.current;
    if (s.mittenAction === 'throw' || s.toolFlightProgress > 0) return;

    s.mittenAction = 'throw';
    s.actionTime = 0;
    s.toolFlightProgress = 0.01;
    s.toolFlightType = activeTool;

    if (activeTool === 'lasso') {
      arAudio.playWhipSound();
    } else if (activeTool === 'boomerang') {
      arAudio.playBoomerangWhoosh();
    } else if (activeTool === 'solkast') {
      arAudio.playAnimalHappySound();
    }
  }, [activeTool]);

  // Reager på eksternt kastesignal
  useEffect(() => {
    if (triggerThrowSignal && triggerThrowSignal > 0) {
      triggerThrow();
    }
  }, [triggerThrowSignal, triggerThrow]);

  // Oppdater holdt verktøy i høyre vott
  const updateHeldToolMesh = useCallback(() => {
    const s = stateRef.current;
    if (!s.rightMitten) return;

    if (s.mittenToolMesh) {
      s.rightMitten.remove(s.mittenToolMesh);
      s.mittenToolMesh = null;
    }

    let newMesh: THREE.Group | null = null;
    if (activeTool === 'lasso') {
      newMesh = createLassoMesh();
      newMesh.scale.set(0.35, 0.35, 0.35);
      newMesh.position.set(-0.06, 0.12, 0.05);
      newMesh.rotation.x = 0.4;
    } else if (activeTool === 'boomerang') {
      newMesh = createBoomerangMesh();
      newMesh.scale.set(0.45, 0.45, 0.45);
      newMesh.position.set(-0.04, 0.14, 0.04);
      newMesh.rotation.z = 0.3;
    } else if (activeTool === 'solkast') {
      newMesh = createSunMirrorMesh();
      newMesh.scale.set(0.4, 0.4, 0.4);
      newMesh.position.set(-0.05, 0.12, 0.05);
      newMesh.rotation.x = 0.5;
    }

    if (newMesh) {
      s.mittenToolMesh = newMesh;
      s.rightMitten.add(newMesh);
    }
  }, [activeTool]);

  // Bygg / rekonfigurer 3D scenen når activeDrop endres
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;

    // Fjern eksisterende mål og tau
    if (s.targetGroup) {
      s.scene.remove(s.targetGroup);
      s.targetGroup = null;
    }
    if (s.groundDecal) {
      s.scene.remove(s.groundDecal);
      s.groundDecal = null;
    }
    if (s.inFlightTool) {
      s.scene.remove(s.inFlightTool);
      s.inFlightTool = null;
    }
    if (s.sunBeam) {
      s.scene.remove(s.sunBeam);
      s.sunBeam = null;
    }

    s.isRopeCut = false;
    s.hasLandedOnGround = false;
    s.fallingTargetVelY = 0;
    s.toolFlightProgress = 0;
    s.toolFlightType = null;
    s.mittenAction = 'idle';

    const isHighTree = activeDrop.targetPlacement === 'high_tree';

    if (isHighTree) {
      // 1. Høythengende mål i tau (Pose med gullmynter / Gullnøkkel / Ravfjær)
      const hanging = createHangingTarget(activeDrop);
      hanging.group.position.set(0, 0.9, -2.5);
      s.scene.add(hanging.group);
      s.targetGroup = hanging.group;
      s.hangingRope = hanging.rope;
      s.hangingTargetGroup = hanging.target;

      // Dekal på bakken under det hengende målet (subtil lys)
      const decal = createGroundDecal();
      decal.position.set(0, -0.75, -2.5);
      decal.scale.set(0.6, 0.6, 0.6);
      s.scene.add(decal);
      s.groundDecal = decal;

      s.fallingTargetPos = { x: 0, y: 0.9, z: -2.5 };
    } else {
      // 2. Bakke-mål (Mikkel Rev / Nøtteliten Ekorn / Skattekiste)
      const decal = createGroundDecal();
      decal.position.set(0, -0.75, -2.4);
      s.scene.add(decal);
      s.groundDecal = decal;

      if (activeDrop.id.includes('rev') || activeDrop.animalSpecies === 'rev') {
        const fox = createFox();
        fox.group.position.set(0, -0.75, -2.4);
        s.scene.add(fox.group);
        s.targetGroup = fox.group;
        s.foxTail = fox.tail;
      } else if (activeDrop.id.includes('ekorn') || activeDrop.animalSpecies === 'ekorn') {
        const squirrel = createSquirrel();
        squirrel.group.position.set(0, -0.75, -2.4);
        s.scene.add(squirrel.group);
        s.targetGroup = squirrel.group;
        s.foxTail = squirrel.tail;
      } else if (activeDrop.id.includes('kiste')) {
        const chest = createChest();
        chest.group.position.set(0, -0.75, -2.4);
        s.scene.add(chest.group);
        s.targetGroup = chest.group;
        s.chestLid = chest.lid;
      } else {
        // Generelt bakkefunn (f.eks. solsteinspeil eller luks-mynt på bakken)
        const coin = createFloatingCoinMesh();
        coin.position.set(0, -0.45, -2.4);
        s.scene.add(coin);
        s.targetGroup = coin;
      }
    }

    if (isCollected && s.targetGroup) {
      s.targetGroup.visible = false;
      if (s.groundDecal) {
        (s.groundDecal.material as THREE.MeshBasicMaterial).opacity = 0.1;
      }
    }

    updateHeldToolMesh();
  }, [activeDrop, isCollected, updateHeldToolMesh]);

  // Initialiser Three.js WebGL renderer, lys og votter én gang
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Renderer med transparent bakgrunn
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;

    // Scene
    const scene = new THREE.Scene();

    // Kamera
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.set(0, 0, 0);

    // Belysning: Solskinn og omgivelseslys
    const ambientLight = new THREE.AmbientLight(0xfff6e5, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(2, 4, 2);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xdcfce7, 0.5);
    scene.add(hemiLight);

    // Førstepersons Askeladden-turvotter i forgrunnen
    const leftMitten = createMitten(true);
    leftMitten.position.set(-0.62, -0.76, -1.3);
    scene.add(leftMitten);

    const rightMitten = createMitten(false);
    rightMitten.position.set(0.62, -0.76, -1.3);
    scene.add(rightMitten);

    // Lagre til stateRef
    const s = stateRef.current;
    s.renderer = renderer;
    s.scene = scene;
    s.camera = camera;
    s.leftMitten = leftMitten;
    s.rightMitten = rightMitten;

    updateHeldToolMesh();

    // Håndter vindusskalering
    const handleResize = () => {
      if (!container || !s.renderer || !s.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Hovedanimasjons-loop
    let lastTime = performance.now();

    const animate = () => {
      s.animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const time = now * 0.001;

      // 1. Gyroscope respons (subtil kamera-tilt)
      if (s.camera) {
        const targetRotX = (gyroOffset.y * Math.PI) / 180 * 0.15;
        const targetRotY = (-gyroOffset.x * Math.PI) / 180 * 0.15;
        s.camera.rotation.x += (targetRotX - s.camera.rotation.x) * 0.08;
        s.camera.rotation.y += (targetRotY - s.camera.rotation.y) * 0.08;
      }

      // 2. Votte-animasjoner (First Person)
      if (s.leftMitten && s.rightMitten) {
        const idleBob = Math.sin(time * 2.2) * 0.015;

        if (s.mittenAction === 'idle') {
          s.leftMitten.position.set(-0.62, -0.76 + idleBob, -1.3);
          s.rightMitten.position.set(0.62, -0.76 + idleBob, -1.3);
          s.leftMitten.rotation.set(-0.25, 0.35, -0.15);
          s.rightMitten.rotation.set(-0.25, -0.35, 0.15);
        } else if (s.mittenAction === 'wave') {
          // Venstre vott løfter seg opp og vinker 👋
          s.actionTime += dt * 3.2;
          const waveAngle = Math.sin(s.actionTime * 6) * 0.35;
          const lift = Math.min(1, Math.sin(Math.min(s.actionTime, Math.PI)));

          s.leftMitten.position.set(-0.45, -0.4 + lift * 0.15, -1.1);
          s.leftMitten.rotation.set(-0.1, 0.2, waveAngle);

          if (s.actionTime > Math.PI) {
            s.mittenAction = 'idle';
          }
        } else if (s.mittenAction === 'throw') {
          // Høyre vott trekker seg bak og slynger verktøyet fremover
          s.actionTime += dt * 4.5;
          const throwProgress = s.actionTime;

          if (throwProgress < 0.4) {
            // Tilbake-trekk
            s.rightMitten.position.set(0.68, -0.85, -1.1);
            s.rightMitten.rotation.set(0.2, -0.2, 0.3);
          } else if (throwProgress < 1.0) {
            // Fremsving
            s.rightMitten.position.set(0.3, -0.45, -1.5);
            s.rightMitten.rotation.set(-0.6, -0.5, 0.1);
          } else {
            s.mittenAction = 'idle';
          }
        } else if (s.mittenAction === 'scoop') {
          // Begge hender strekker seg frem mot bakken for å plukke opp
          s.actionTime += dt * 2.5;
          const scoopT = Math.sin(Math.min(s.actionTime, Math.PI));

          s.leftMitten.position.set(-0.25 - scoopT * 0.1, -0.75 - scoopT * 0.1, -1.6 - scoopT * 0.4);
          s.rightMitten.position.set(0.25 + scoopT * 0.1, -0.75 - scoopT * 0.1, -1.6 - scoopT * 0.4);
          s.leftMitten.rotation.set(-0.4, 0.7, -0.5);
          s.rightMitten.rotation.set(-0.4, -0.7, 0.5);

          if (s.actionTime > Math.PI) {
            s.mittenAction = 'idle';
          }
        }
      }

      // 3. Glad dyr-respons (Mikkel Rev & Nøtteliten)
      if (s.animalHappyTime > 0) {
        s.animalHappyTime -= dt;
        if (s.targetGroup && !s.isRopeCut) {
          // Hopp og sprett av glede
          const hop = Math.abs(Math.sin(s.animalHappyTime * 8)) * 0.22;
          s.targetGroup.position.y = -0.75 + hop;
          if (s.foxTail) {
            s.foxTail.rotation.z = Math.sin(time * 16) * 0.5; // logrer raskt!
          }
        }
      } else {
        // Normal tomgangslogring for dyrene
        if (s.foxTail) {
          s.foxTail.rotation.z = Math.sin(time * 3) * 0.18;
        }
      }

      // 4. Kastefysikk for aktive verktøy
      if (s.toolFlightProgress > 0 && s.toolFlightType) {
        s.toolFlightProgress += dt * 1.5;
        const t = Math.min(1, s.toolFlightProgress);

        if (s.toolFlightType === 'boomerang') {
          // Bumerangen slynges i en parabel-bue opp mot treet
          if (!s.inFlightTool && s.scene) {
            const b = createBoomerangMesh();
            s.scene.add(b);
            s.inFlightTool = b;
          }

          if (s.inFlightTool) {
            // 3D kurve: Starter i hånden (0.5, -0.6, -1.2), kurver høyre opp mot tauet (0, 0.9, -2.5)
            const p0 = new THREE.Vector3(0.5, -0.5, -1.2);
            const pControl = new THREE.Vector3(1.2, 1.2, -1.8);
            const pCut = new THREE.Vector3(0, 0.9, -2.5);

            const arcPos = new THREE.Vector3();
            if (t < 0.6) {
              const subT = t / 0.6;
              arcPos.lerpVectors(p0, pControl, subT);
            } else {
              const subT = (t - 0.6) / 0.4;
              arcPos.lerpVectors(pControl, pCut, subT);
            }

            s.inFlightTool.position.copy(arcPos);
            s.inFlightTool.rotation.z += 0.55; // Rask rotasjon

            // Kutt tauet i det bumerangen når treet
            if (t >= 0.75 && !s.isRopeCut) {
              s.isRopeCut = true;
              arAudio.playRopeCutSound();
              spawnParticles(new THREE.Vector3(0, 0.9, -2.5), 0xfbbf24, 18);

              // Skjul tauet
              if (s.hangingRope) {
                s.hangingRope.visible = false;
              }
            }

            if (t >= 1.0) {
              // Bumerangen forlater scenen etter kuttet
              s.scene?.remove(s.inFlightTool);
              s.inFlightTool = null;
              s.toolFlightProgress = 0;
            }
          }
        } else if (s.toolFlightType === 'lasso') {
          // Lasso-løkken unroller og slynges mot målet
          if (!s.inFlightTool && s.scene) {
            const lasso = createLassoMesh();
            s.scene.add(lasso);
            s.inFlightTool = lasso;
          }

          if (s.inFlightTool) {
            const startPos = new THREE.Vector3(0.5, -0.5, -1.2);
            const endPos = new THREE.Vector3(0, -0.3, -2.4);

            s.inFlightTool.position.lerpVectors(startPos, endPos, t);
            s.inFlightTool.scale.setScalar(0.4 + t * 0.8);
            s.inFlightTool.rotation.y = time * 8;

            if (t >= 1.0) {
              // Lasso strammer seg og sikrer fangsten!
              arAudio.playWhipSound();
              spawnParticles(endPos, 0xfde047, 16);

              if (s.chestLid) {
                s.chestLid.rotation.x = -Math.PI / 3; // Åpner kisten!
              }

              onCollect(activeDrop, 'lasso');
              s.scene?.remove(s.inFlightTool);
              s.inFlightTool = null;
              s.toolFlightProgress = 0;
            }
          }
        } else if (s.toolFlightType === 'solkast') {
          // Solkastet: Reflekterer dagslyset mot målet
          if (!s.sunBeam && s.scene) {
            const beamGeo = new THREE.CylinderGeometry(0.04, 0.35, 2.2, 12);
            const beamMat = new THREE.MeshBasicMaterial({
              color: 0xfef08a,
              transparent: true,
              opacity: 0.65,
            });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.rotation.x = Math.PI / 2.3;
            beam.position.set(0.1, -0.3, -1.7);
            s.scene.add(beam);
            s.sunBeam = beam;
          }

          if (t >= 0.85) {
            spawnParticles(new THREE.Vector3(0, -0.3, -2.4), 0xfffbeb, 20);
            onCollect(activeDrop, 'solkast');
            if (s.sunBeam) {
              s.scene?.remove(s.sunBeam);
              s.sunBeam = null;
            }
            s.toolFlightProgress = 0;
          }
        }
      }

      // 5. Tyngdekraft for kappet skatt (posen med gullmynter faller mot bakken!)
      if (s.isRopeCut && s.hangingTargetGroup && !s.hasLandedOnGround) {
        s.fallingTargetVelY -= 9.8 * dt; // Tyngdekraft
        s.fallingTargetPos.y += s.fallingTargetVelY * dt;

        // Bakkekollisjon ved y = -0.75
        if (s.fallingTargetPos.y <= -0.75) {
          s.fallingTargetPos.y = -0.75;
          if (Math.abs(s.fallingTargetVelY) > 1.2) {
            // Spretter i bakken
            s.fallingTargetVelY = -s.fallingTargetVelY * 0.38;
            arAudio.playCoinBounceSound();
            spawnParticles(new THREE.Vector3(0, -0.75, -2.5), 0xf59e0b, 10);
          } else {
            // Ligger stabilt på bakken
            s.hasLandedOnGround = true;
            s.fallingTargetVelY = 0;
            arAudio.playCoinBounceSound();

            // Vottene strekker seg frem automatisk for å plukke opp skatten inn i sekken!
            setTimeout(() => {
              triggerScoop();
            }, 300);
          }
        }

        s.hangingTargetGroup.position.y = s.fallingTargetPos.y - 0.9;
        if (s.groundDecal) {
          // Dekalet blir mørkere og skarpere når posen når bakken
          const groundDist = Math.max(0, s.fallingTargetPos.y - (-0.75));
          (s.groundDecal.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 0.45 - groundDist * 0.2);
        }
      }

      // 6. Oppdater partikler
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 4.0 * dt; // partikkel-gravitasjon

        const scale = Math.max(0.001, 1 - p.life / p.maxLife);
        p.mesh.scale.setScalar(scale);

        if (p.life >= p.maxLife) {
          s.scene?.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      if (s.renderer && s.scene && s.camera) {
        s.renderer.render(s.scene, s.camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(s.animFrameId);
      window.removeEventListener('resize', handleResize);
      if (s.renderer) {
        s.renderer.dispose();
      }
    };
  }, [gyroOffset, updateHeldToolMesh, onCollect, activeDrop, triggerScoop, spawnParticles]);

  // Håndter berøring / gester (Swipe up for å kaste, trykk på dyr for å vinke)
  const handlePointerDown = (e: React.PointerEvent) => {
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
    setTouchStartTime(performance.now());
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchStartY === null || touchStartX === null) return;

    const deltaY = e.clientY - touchStartY;
    const deltaX = e.clientX - touchStartX;
    const deltaTime = performance.now() - touchStartTime;

    // Sjekk om det er et sveip oppover (kastegest)
    if (deltaY < -40 && deltaTime < 600) {
      triggerThrow();
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    // Hvis det var et kort trykk/klikk: Sjekk om spilleren trykket på et dyr eller en skatt
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      const s = stateRef.current;
      if (s.hasLandedOnGround) {
        // Skatten ligger på bakken: Plukk opp
        triggerScoop();
      } else if (activeDrop.targetPlacement === 'ground' && (activeDrop.animalSpecies || activeDrop.id.includes('rev') || activeDrop.id.includes('ekorn'))) {
        // Dyret står på bakken: Venstre vott vinker 👋
        triggerWave();
      } else {
        // Ellers: Kast aktivt verktøy
        triggerThrow();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 z-10 touch-none pointer-events-auto flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
