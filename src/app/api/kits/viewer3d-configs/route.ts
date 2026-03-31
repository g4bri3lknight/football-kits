import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/viewer3d-configs - Restituisce le config 3D di tutti i kit che ce l'hanno
// Usato per confrontare con i preset e mostrare quali kit hanno già una config applicata
export async function GET() {
  try {
    const configs = await db.kitViewer3DConfig.findMany({
      select: {
        kitId: true,
        cameraInitialDistance: true,
        cameraFov: true,
        cameraMinDistance: true,
        cameraMaxDistance: true,
        cameraFreeRotation: true,
        rotationMinPolarAngle: true,
        rotationMaxPolarAngle: true,
        autoRotateEnabled: true,
        autoRotateSpeed: true,
        autoRotateResumeDelay: true,
        controlsEnablePan: true,
        controlsEnablePanHorizontal: true,
        controlsEnablePanVertical: true,
        controlsRotateSpeed: true,
        controlsZoomSpeed: true,
        controlsPanSpeed: true,
        controlsEnableDamping: true,
        controlsDampingFactor: true,
        modelTargetSize: true,
        lightingAmbientIntensity: true,
        lightingMainLightPositionX: true,
        lightingMainLightPositionY: true,
        lightingMainLightPositionZ: true,
        lightingMainLightIntensity: true,
        lightingSecondaryLightPositionX: true,
        lightingSecondaryLightPositionY: true,
        lightingSecondaryLightPositionZ: true,
        lightingSecondaryLightIntensity: true,
        shadowsEnabled: true,
        shadowsPositionX: true,
        shadowsPositionY: true,
        shadowsPositionZ: true,
        shadowsOpacity: true,
        shadowsScale: true,
        shadowsBlur: true,
        shadowsFar: true,
        shadowsResolution: true,
        effectsEnabled: true,
        effectsEnvMapIntensity: true,
        effectsRoughness: true,
        effectsMetalness: true,
        effectsToneMappingWhitePoint: true,
        effectsToneMappingMiddleGrey: true,
        effectsVignetteOffset: true,
        effectsVignetteDarkness: true,
        bloomEnabled: true,
        bloomIntensity: true,
        bloomLuminanceThreshold: true,
        bloomLuminanceSmoothing: true,
        aoEnabled: true,
        aoIntensity: true,
        aoDistance: true,
        aoFalloff: true,
        brightnessContrastEnabled: true,
        brightness: true,
        contrast: true,
        hueSaturationEnabled: true,
        hue: true,
        saturation: true,
        chromaticAberrationEnabled: true,
        chromaticAberrationOffset: true,
        depthOfFieldEnabled: true,
        depthOfFieldFocusDistance: true,
        depthOfFieldFocalLength: true,
        depthOfFieldBokehScale: true,
        tiltShiftEnabled: true,
        tiltShiftBlur: true,
        tiltShiftStart: true,
        tiltShiftEnd: true,
        noiseEnabled: true,
        noiseOpacity: true,
        dotScreenEnabled: true,
        dotScreenAngle: true,
        dotScreenScale: true,
        pixelationEnabled: true,
        pixelationGranularity: true,
        scanlineEnabled: true,
        scanlineDensity: true,
        scanlineOpacity: true,
        glitchEnabled: true,
        glitchDelay: true,
        glitchDuration: true,
        glitchStrength: true,
        backgroundColor: true,
      },
    });

    // Restituisce un oggetto { [kitId]: configFingerprint }
    // dove configFingerprint è una stringa JSON normalizzata per confronto rapido
    const result: Record<string, string> = {};
    for (const config of configs) {
      const { kitId, ...configValues } = config;
      result[kitId] = JSON.stringify(configValues);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching kit viewer3d configs:', error);
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
  }
}
