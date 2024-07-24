// src/components/SpeechToText.tsx
import React, { useState, useEffect, useRef } from 'react';
interface SpeechToTextProps {
  onTranscript: (transcript: string) => void;
  loading:boolean;
}
type webkitSpeechRecognition = /*unresolved*/ any
const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscript, loading}) => {
  const [isListening, setIsListening] = useState(false); // 页面可见的服务
  const [isServiceActive, setIsServiceActive] = useState(false) //接口的语音转文字服务
  const isListeningRef = useRef(isListening)
  const [lastIndex, setLastIndex] = useState(0) //起始点
  const [currentIndex, setCurrentIndex] = useState(0) //当前节点
  const lastIndexRef = useRef(lastIndex)
  const recognitionRef = useRef<webkitSpeechRecognition | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening; // 同步状态和引用
  }, [isListening]);

  useEffect(() => {
    lastIndexRef.current = lastIndex; // 同步状态和引用
  }, [lastIndex, isListening]);

  useEffect(() => {
    if (loading === true) {
      setLastIndex(currentIndex)
    }
    if (!isListening) {
      setLastIndex(currentIndex)
    }
  }, [loading, isListening]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      // recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event:any) => {
        let interim = '';
        let final = '';
        console.log(event.results)
        setCurrentIndex(event.results.length)
        !isListeningRef.current && setLastIndex(event.results.length)
        for (let i = lastIndexRef.current; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        if (interim && isListeningRef.current) {
          onTranscript(final + interim);
        }
      };
      recognition.onend = () => {
        console.log('Recognition ended');
        setIsListening(false); // 更新 isListening 状态
        setIsServiceActive(false)
        setLastIndex(0)
      };

      recognition.onerror = (event:any) => {
        console.error(`Error occurred in recognition: ${event.error}`);
      };
      recognitionRef.current = recognition;
    } else {
      alert('Web Speech API is not supported in this browser.');
    }
  }, [onTranscript]);

  const startListening = async() => {
      console.log('start');
      if (recognitionRef.current) {
      try {
        recognitionRef.current.continuous = true;
        !isServiceActive && recognitionRef.current.start();
        setIsListening(true);
        setIsServiceActive(true)
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const stopListening = async () => {
    console.log('abort');
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.stop();
      recognitionRef.current.abort();
      setIsListening(false);
    }
    try {
      const silenceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      silenceStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Error stopping microphone:', err);
    }
  };

  return (
    <div className="flex justify-center items-center mb-5">
      <button
        onClick={startListening}
        disabled={isListening}
        className="mx-2 w-32 h-12 text-lg bg-blue-500 text-white rounded-full focus:outline-none disabled:opacity-50"
      >
        开始说话
      </button>
      <button
        onClick={stopListening}
        disabled={!isListening}
        className="mx-2 w-32 h-12 text-lg bg-red-500 text-white rounded-full focus:outline-none disabled:opacity-50"
      >
        停止录音
      </button>
    </div>
  );
};

export default SpeechToText;
