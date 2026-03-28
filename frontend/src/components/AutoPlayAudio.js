// AutoPlayAudio.js
import React, { useEffect, useRef,useState } from 'react';
import SERVER_IP from '../config';

const AutoPlayAudio = ({ src }) => {
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    // Función que solicita el audio desde el servidor
    const fetchAudio = async () => {
      try {
        const response = await fetch(`${SERVER_IP}/audio/${src}`);
        if (response.ok) {
          // Convertir la respuesta a un objeto Blob y generar una URL
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);

          if (audioRef.current) {
            audioRef.current.play();
          }
        } else {
          console.error('Error al obtener el archivo de audio');
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }
    };

    fetchAudio(); // Llama a la función para obtener el audio

  }, [src]); // Se ejecuta solo cuando cambia el `src`

  return (
    <div style={{ display: 'flex' , position: 'fixed' }}>
      {audioUrl && (
        <audio ref={audioRef} controls autoPlay>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default AutoPlayAudio;
