import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DiceRoll.css';


interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<PermissionState>;
}

import { DiceRollClaudeProps } from './types';

//const DiceRollClaude: React.FC = () => {
export function DiceRollClaude({ rollingDice = false, dice1 = null, dice2 = null }: DiceRollClaudeProps) {
  console.log(`DiceRollClaude: ${dice1} ,${dice2}`)
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const lastUpdate = useRef<number>(0);
  const lastX = useRef<number>(0);
  const lastY = useRef<number>(0);
  const lastZ = useRef<number>(0);
  const shakeStarted = useRef<boolean>(false);
  const shakeDirectionChanged = useRef<boolean>(false);
  const lastShakeTime = useRef<number>(0);


  const [rollingInterval, setRollingInterval] = useState<NodeJS.Timeout | null>(null);

  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const setDiceFace = useCallback((cube: HTMLElement, face: number) => {
    let xDeg: number, yDeg: number;
    switch(face) {
      case 1: xDeg = 0; yDeg = 0; break;
      case 2: xDeg = 0; yDeg = 180; break;
      case 3: xDeg = 0; yDeg = -90; break;
      case 4: xDeg = 0; yDeg = 90; break;
      case 5: xDeg = -90; yDeg = 0; break;
      case 6: xDeg = 90; yDeg = 0; break;
      default: console.log("Invalid face number"); return;
    }
    cube.style.transform = `rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  }, []);

  const randomRotate = useCallback((cube: HTMLElement) => {
    let xRand = getRandomInt(0, 360);
    let yRand = getRandomInt(0, 360);
    cube.style.transform = `rotateX(${xRand}deg) rotateY(${yRand}deg)`;
  }, []);

  const rollDice = useCallback((cube: HTMLElement, targetFace: number, duration: number) => {
    const interval = setInterval(() => randomRotate(cube), 300);
    setTimeout(() => {
      clearInterval(interval);
      setDiceFace(cube, targetFace);
    }, duration);
  }, [randomRotate, setDiceFace]);

  const rollBothDice = (() => {
    console.log(`rollBothDice: ${dice1} ,${dice2}`)
    let face1 = dice1;
    if (face1 === null) {      
      face1 = Math.floor(Math.random() * 6) + 1;
    }
    let face2 = dice2;
    if (face2 === null) {
      face2 = Math.floor(Math.random() * 6) + 1;
    }
    setLogMessages(prev => [...prev, `Rolling to faces: ${face1} and ${face2}`]);
    const cube1 = document.getElementById('cube1');
    const cube2 = document.getElementById('cube2');
    if (cube1 && cube2) {
      rollDice(cube1, face1, 600);
      rollDice(cube2, face2, 600);
    }
  });

  const deviceMotionHandler = useCallback((event: DeviceMotionEvent) => {
    const shakeThreshold = 1200;
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const currentTime = new Date().getTime();

    if (lastUpdate.current === 0) {
      lastUpdate.current = currentTime;
      lastX.current = acceleration.x || 0;
      lastY.current = acceleration.y || 0;
      lastZ.current = acceleration.z || 0;
      return;
    }

    const timeDifference = currentTime - lastUpdate.current;
    lastUpdate.current = currentTime;

    const deltaX = Math.abs((acceleration.x || 0) - lastX.current);
    const deltaY = Math.abs((acceleration.y || 0) - lastY.current);
    const deltaZ = Math.abs((acceleration.z || 0) - lastZ.current);

    const speed = (deltaX + deltaY + deltaZ) / timeDifference * 10000;

    if (speed > shakeThreshold) {
      setLogMessages(prev => [...prev, `Shake detected! Speed: ${speed}`]);
      
      if (!shakeStarted.current) {
        shakeStarted.current = true;
        lastShakeTime.current = currentTime;
      } else {
        const directionChange = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

        if ((directionChange > 0 && !shakeDirectionChanged.current) || (directionChange < 0 && shakeDirectionChanged.current)) {
          shakeDirectionChanged.current = !shakeDirectionChanged.current;

          if (shakeDirectionChanged.current && (currentTime - lastShakeTime.current) < 300) {
            setIsShaking(true);
            rollBothDice();

            shakeStarted.current = false;
            shakeDirectionChanged.current = false;

            setTimeout(() => {
              setIsShaking(false);
            }, 500);
          }
        }
      }
    } else if (currentTime - lastShakeTime.current > 300) {
      shakeStarted.current = false;
      shakeDirectionChanged.current = false;
    }

    lastX.current = acceleration.x || 0;
    lastY.current = acceleration.y || 0;
    lastZ.current = acceleration.z || 0;
  }, [rollBothDice]);

  const initializeMotionEvent = useCallback(() => {
    const handleMotion = () => {
      window.removeEventListener('devicemotion', handleMotion);
      setOverlayVisible(false);
    };

    // Use type assertion for the global DeviceMotionEvent
    const DeviceMotionEventWithPermission = DeviceMotionEvent as unknown as {
      prototype: DeviceMotionEvent;
      requestPermission?: () => Promise<PermissionState>;
    };

    if (typeof DeviceMotionEventWithPermission.requestPermission === 'function') {
      // iOS 13+ devices
      DeviceMotionEventWithPermission.requestPermission()
        .then((permissionState: PermissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', deviceMotionHandler);
            setOverlayVisible(false);
          } else {
            alert('Device Motion permission denied.');
            setOverlayVisible(false); // Still remove overlay even if permission denied
          }
        })
        .catch((error) => {
          console.error('Error requesting device motion permission:', error);
          setOverlayVisible(false); // Remove overlay if there's an error
        });
    } else {
      // Non-iOS 13+ devices or devices without devicemotion
      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('devicemotion', deviceMotionHandler);
      
      // Set a timeout to remove the overlay even if no devicemotion event is fired
      setTimeout(() => {
        setOverlayVisible(false);
      }, 1000); // Wait for 1 second before removing the overlay
    }
  }, [deviceMotionHandler]);

  const handleOverlayClick = useCallback(() => {
    initializeMotionEvent();
    setOverlayVisible(false); // Immediately hide the overlay on click
  }, [initializeMotionEvent]);

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', deviceMotionHandler);
    };
  }, [deviceMotionHandler]);


  const startRolling = () => {
    if (!rollingInterval) {
      const interval = setInterval(rollBothDice, 750); // Call rollBothDice every 200ms
      setRollingInterval(interval);
    }
  };
  
  const stopRolling = () => {
    if (rollingInterval) {
      clearInterval(rollingInterval);
      setRollingInterval(null);
    }
  };

  useEffect(() => {
    if (rollingDice) {
      startRolling();
    } else {
      stopRolling();
    }
  }, [rollingDice]);

  useEffect(() => { 
    console.log(`useEffect DiceRollClaude: ${dice1} ,${dice2}`)
    if (dice1 !== null && dice2 !== null) {
      rollBothDice();
    }
  }, [dice1, dice2]);


  return (
    <div className="dice-roll-container">
      {overlayVisible && (
        <div className="overlay" onClick={handleOverlayClick}>
          <div className="overlay-text">Touch</div>
        </div>
      )}      
      <div className="section container">
        <div id="dice1" className="dice">
          <div id="cube1" className="cube">
            {['front', 'back', 'right', 'left', 'top', 'bottom'].map((side, i) => (
              <div key={side} className={side}>
                {[...Array(i + 1)].map((_, j) => (
                  <span key={j} className={`dot dot${j + 1}`}></span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div id="dice2" className="dice">
          <div id="cube2" className="cube">
            {['front', 'back', 'right', 'left', 'top', 'bottom'].map((side, i) => (
              <div key={side} className={side}>
                {[...Array(i + 1)].map((_, j) => (
                  <span key={j} className={`dot dot${j + 1}`}></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="button" onMouseDown={startRolling} onMouseUp={stopRolling}>Roll Dice</button>
    </div>
  );
};  