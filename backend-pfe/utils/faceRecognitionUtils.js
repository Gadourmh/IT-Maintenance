const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const path = require('path');
const tf = require('@tensorflow/tfjs-core');
require('@tensorflow/tfjs-backend-cpu'); // Importe le backend CPU

// Monkey-patching pour que face-api.js puisse utiliser les implémentations de Canvas en Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const loadFaceApiModels = async () => {
  // Chemin vers le dossier où vous stockerez les modèles de face-api.js sur le serveur.
  // Créez un nouveau dossier, par exemple, backend/face_models
  const MODEL_PATH = path.join(__dirname, '..', 'face_models'); // Assurez-vous que ce chemin est correct

  try {
    // AJOUTEZ CES DEUX LIGNES POUR INITIALISER LE BACKEND TFJS-NODE
   tf.setBackend('cpu');
    await tf.ready();
    console.log('✅ Backend TensorFlow.js pour Node.js initialisé !');

    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    console.log('✅ Modèles face-api.js chargés sur le serveur !');
  } catch (error) {
    console.error('❌ Erreur lors du chargement des modèles face-api.js sur le serveur:', error);
    process.exit(1); // Arrête le processus si les modèles ne peuvent pas être chargés
  }
};

module.exports = { faceapi, loadFaceApiModels };