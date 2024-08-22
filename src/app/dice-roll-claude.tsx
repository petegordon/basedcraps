import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DiceRoll.css';


interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<PermissionState>;
}

type DeviceMotionEventWithPermissionConstructor = {
  new(): DeviceMotionEventWithPermission;
  requestPermission?: () => Promise<PermissionState>;
};

//const DiceRollClaude: React.FC = () => {
export function DiceRollClaude(config: any) {
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
    const interval = setInterval(() => randomRotate(cube), 100);
    setTimeout(() => {
      clearInterval(interval);
      setDiceFace(cube, targetFace);
    }, duration);
  }, [randomRotate, setDiceFace]);

  const rollBothDice = useCallback(() => {
    const face1 = Math.floor(Math.random() * 6) + 1;
    const face2 = Math.floor(Math.random() * 6) + 1;
    setLogMessages(prev => [...prev, `Rolling to faces: ${face1} and ${face2}`]);
    const cube1 = document.getElementById('cube1');
    const cube2 = document.getElementById('cube2');
    if (cube1 && cube2) {
      rollDice(cube1, face1, 500);
      rollDice(cube2, face2, 500);
    }
  }, [rollDice]);

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
    const DeviceMotionEventWithPermission = 
      window.DeviceMotionEvent as unknown as DeviceMotionEventWithPermissionConstructor;
        

      if (typeof DeviceMotionEventWithPermission.requestPermission === 'function') {
        DeviceMotionEventWithPermission.requestPermission()
        .then((permissionState: PermissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', deviceMotionHandler);
          } else {
            alert('Device Motion permission denied.');
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', deviceMotionHandler);
    }
  }, [deviceMotionHandler]);

  const handleOverlayClick = useCallback(async () => {
    setOverlayVisible(false);
    await initializeMotionEvent();
  }, [initializeMotionEvent]);

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', deviceMotionHandler);
    };
  }, [deviceMotionHandler]);

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
      <div className="log-container">
        Log:
        {logMessages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </div>
  );
};