import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  BERGEN_AR_DROPS,
  collectARDrop,
  hasCollectedDropToday,
  getDailyCoinPointsCollected,
} from '../engine/arDrops';
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
} from '../components/ar/arMeshes';
import { arAudio } from '../components/ar/arAudio';

// In-memory localStorage mock for node environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Clean Sol-Jakt AR — Three.js Meshes & Game Physics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('3D Modeller & Meshes', () => {
    it('oppretter Askeladden-turvotter med venstre og høyre orientering', () => {
      const leftMitten = createMitten(true);
      const rightMitten = createMitten(false);

      expect(leftMitten).toBeInstanceOf(THREE.Group);
      expect(rightMitten).toBeInstanceOf(THREE.Group);
      expect(leftMitten.children.length).toBeGreaterThan(3);
      expect(rightMitten.children.length).toBeGreaterThan(3);

      // Sjekk at rotasjon er speilet for venstre vs høyre
      expect(leftMitten.rotation.y).toBeGreaterThan(0);
      expect(rightMitten.rotation.y).toBeLessThan(0);
    });

    it('oppretter Mikkel Rev med bevegelig hale og hode', () => {
      const { group, tail, head } = createFox();
      expect(group).toBeInstanceOf(THREE.Group);
      expect(tail).toBeInstanceOf(THREE.Group);
      expect(head).toBeInstanceOf(THREE.Group);
      expect(group.children.length).toBeGreaterThan(4);
    });

    it('oppretter Nøtteliten Ekorn med hale og gyllen nøtt', () => {
      const { group, tail } = createSquirrel();
      expect(group).toBeInstanceOf(THREE.Group);
      expect(tail).toBeInstanceOf(THREE.Group);
      expect(group.children.length).toBeGreaterThan(3);
    });

    it('oppretter Skattekiste med åpningsbart lokk', () => {
      const { group, lid } = createChest();
      expect(group).toBeInstanceOf(THREE.Group);
      expect(lid).toBeInstanceOf(THREE.Group);
      expect(group.children.length).toBeGreaterThan(1);
    });

    it('oppretter høythengende mål i tau for treet', () => {
      const keyDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_gullnokkel')!;
      const pouchDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_solkrystall')!;

      const hangingKey = createHangingTarget(keyDrop);
      const hangingPouch = createHangingTarget(pouchDrop);

      expect(hangingKey.rope).toBeInstanceOf(THREE.Mesh);
      expect(hangingKey.target).toBeInstanceOf(THREE.Group);
      expect(hangingPouch.rope).toBeInstanceOf(THREE.Mesh);
      expect(hangingPouch.target).toBeInstanceOf(THREE.Group);
    });

    it('oppretter bakkedekal for myk kontaktskygge', () => {
      const decal = createGroundDecal();
      expect(decal).toBeInstanceOf(THREE.Mesh);
      expect(decal.rotation.x).toBeCloseTo(-Math.PI / 2);
    });

    it('oppretter 3D verktøy-mesh: Bumerang, Lasso, Solsteinspeil og Luks-mynt', () => {
      const boomerang = createBoomerangMesh();
      const lasso = createLassoMesh();
      const mirror = createSunMirrorMesh();
      const coin = createFloatingCoinMesh();

      expect(boomerang).toBeInstanceOf(THREE.Group);
      expect(lasso).toBeInstanceOf(THREE.Group);
      expect(mirror).toBeInstanceOf(THREE.Group);
      expect(coin).toBeInstanceOf(THREE.Group);
    });
  });

  describe('Placement & Tool Routing i BERGEN_AR_DROPS', () => {
    it('alle drops har spesifisert targetPlacement og recommendedTool', () => {
      BERGEN_AR_DROPS.forEach(drop => {
        expect(['ground', 'high_tree']).toContain(drop.targetPlacement);
        expect(['lasso', 'boomerang', 'solkast']).toContain(drop.recommendedTool);
      });
    });

    it('dyr og kister er forankret til bakken med lasso som verktøy', () => {
      const fox = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_rev')!;
      const squirrel = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_ekorn')!;
      const chest = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_skattekiste')!;

      expect(fox.targetPlacement).toBe('ground');
      expect(squirrel.targetPlacement).toBe('ground');
      expect(chest.targetPlacement).toBe('ground');

      expect(fox.recommendedTool).toBe('lasso');
      expect(squirrel.recommendedTool).toBe('lasso');
      expect(chest.recommendedTool).toBe('lasso');
    });

    it('nøkkel og myntpose henger i treet med bumerang som anbefalt verktøy', () => {
      const key = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_gullnokkel')!;
      const coinPouch = BERGEN_AR_DROPS.find(d => d.id === 'drop_korskirke_solkrystall')!;
      const ticket = BERGEN_AR_DROPS.find(d => d.id === 'drop_tinydome_summer_ticket')!;

      expect(key.targetPlacement).toBe('high_tree');
      expect(coinPouch.targetPlacement).toBe('high_tree');
      expect(ticket.targetPlacement).toBe('high_tree');

      expect(key.recommendedTool).toBe('boomerang');
      expect(coinPouch.recommendedTool).toBe('boomerang');
      expect(ticket.recommendedTool).toBe('boomerang');
    });
  });

  describe('Audio Engine Lyd-synthesizer', () => {
    it('kaller alle lydeffekter uten å kaste feil i headless/mock miljøer', () => {
      expect(() => arAudio.playWhipSound()).not.toThrow();
      expect(() => arAudio.playBoomerangWhoosh()).not.toThrow();
      expect(() => arAudio.playRopeCutSound()).not.toThrow();
      expect(() => arAudio.playCoinBounceSound()).not.toThrow();
      expect(() => arAudio.playAnimalHappySound()).not.toThrow();
      expect(() => arAudio.playFanfareSound()).not.toThrow();
      expect(() => arAudio.playScoopSound()).not.toThrow();
    });
  });

  describe('Loot & Innsamling', () => {
    it('samler drop og oppdaterer poeng og dagsfangst', () => {
      const coinDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_floyen_sving')!;
      const result = collectARDrop(coinDrop, undefined, undefined, true);

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(coinDrop.pointsValue);
      expect(hasCollectedDropToday(coinDrop.id)).toBe(true);
      expect(getDailyCoinPointsCollected()).toBe(coinDrop.pointsValue);
    });
  });
});
