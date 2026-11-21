import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs'; // <-- NOUVELLE IMPORTATION : Importer TensorFlow.js

const FaceAuthScanner = ({ onFaceDetected, onError, onLoading }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [message, setMessage] = useState('');

  const MODEL_URL = '/models';

  useEffect(() => {
    const loadModelsAndInitTF = async () => { // <-- Changement de nom de fonction pour clarifier
      onLoading(true);
      setMessage('Initialisation et chargement des modèles de reconnaissance faciale...');

      // --- DÉBUT DE LA MODIFICATION CRUCIALE ---
      // 1. Initialiser le backend de TensorFlow.js
      try {
        await tf.setBackend('webgl');
        console.log('TensorFlow.js : Backend réglé sur WebGL (client).');
      } catch (e) {
        console.warn('Échec de l\'initialisation du backend WebGL, bascule sur WASM ou CPU (client).', e);
        try {
          await tf.setBackend('wasm');
          console.log('TensorFlow.js : Backend réglé sur WASM (client).');
        } catch (e2) {
          console.warn('WASM backend échoué, bascule sur CPU (client).', e2);
          await tf.setBackend('cpu');
          console.log('TensorFlow.js : Backend réglé sur CPU (client).');
        }
      }

      // 2. Attendre que TensorFlow.js soit entièrement prêt
      await tf.ready();
      console.log('TensorFlow.js est prêt côté client.');
      // --- FIN DE LA MODIFICATION CRUCIALE ---

      // Maintenant que le backend est prêt, nous pouvons charger les modèles Face-API.js
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setMessage('Modèles chargés. Démarrage de la caméra...');
        onLoading(false);
        startVideo();
      } catch (error) {
        console.error('Erreur lors du chargement des modèles Face-API:', error);
        setMessage('Erreur: Impossible de charger les modèles faciaux. Assurez-vous qu\'ils sont dans le dossier public/models.');
        onError('Impossible de charger les modèles faciaux.');
        onLoading(false);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
          setMessage('Caméra démarrée. Veuillez centrer votre visage.');
        })
        .catch(err => {
          console.error('Erreur d\'accès à la caméra:', err);
          setMessage('Erreur: Impossible d\'accéder à la caméra. Vérifiez les permissions du navigateur.');
          onError('Impossible d\'accéder à la caméra.');
        });
    };

    loadModelsAndInitTF(); // <-- Appeler la nouvelle fonction

    // Nettoyage lors du démontage du composant
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Exécuter une seule fois au montage

  const handleVideoPlay = () => {
    // S'assurer que les modèles sont chargés avant de commencer la détection
    if (!modelsLoaded) return;

    const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    setMessage('Détection du visage...');
    const interval = setInterval(async () => {
      if (videoRef.current.paused || videoRef.current.ended) {
        clearInterval(interval);
        return;
      }

      const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        setIsFaceDetected(true);
        setMessage('Visage détecté !');
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        onFaceDetected(detections.descriptor);
        clearInterval(interval); // Arrêter la détection après avoir trouvé un visage
      } else {
        setIsFaceDetected(false);
        setMessage('Aucun visage détecté. Veuillez vous positionner face à la caméra.');
        onFaceDetected(null);
      }
    }, 100);
  };

  return (
    <div className="face-scanner-container" style={{ textAlign: 'center' }}>
      <h3>Reconnaissance Faciale</h3>
      <div style={{ position: 'relative', width: 640, height: 480, margin: 'auto' }}>
        <video
          ref={videoRef}
          onPlay={handleVideoPlay}
          width="640"
          height="480"
          autoPlay
          muted
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>
      <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{message}</p>
      {!modelsLoaded && <p>Veuillez patienter pendant le chargement des modèles...</p>}
    </div>
  );
};

export default FaceAuthScanner;