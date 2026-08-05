import { Capacitor } from '@capacitor/core'

// Vrai uniquement dans la coquille Android (Capacitor), faux dans un navigateur.
// Sert d'aiguillage entre l'AdSense/CMP du web et l'AdMob natif : les deux ne
// doivent jamais tourner ensemble.
export const isNative = Capacitor.isNativePlatform()
