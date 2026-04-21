import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

const PASSPORT_DRAG_RESISTANCE = 0.18;
const PASSPORT_SPIN_DAMPING = 0.91;
const PASSPORT_MAX_SPIN_VELOCITY = 18;
const PASSPORT_MAX_FRAME_DELTA = 10;
const PASSPORT_MIN_SPIN_VELOCITY = 0.12;
const PASSPORT_FRONT_BIAS = 0.009;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getNearestReadableAngle(value: number) {
  return Math.round(value / 180) * 180;
}

export function usePassportPreviewMotion() {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const rotationX = useRef(new Animated.Value(0)).current;
  const rotationY = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef({ x: 0, y: 0 }).current;
  const gestureStartRef = useRef({ x: 0, y: 0 }).current;
  const spinVelocityRef = useRef({ x: 0, y: 0 }).current;
  const momentumFrameRef = useRef<number | null>(null);
  const previewScale = useRef(new Animated.Value(1)).current;

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(() => {
    stopMomentum();

    const step = () => {
      const readableX = getNearestReadableAngle(rotationRef.x);
      const readableY = getNearestReadableAngle(rotationRef.y);

      spinVelocityRef.x += (readableX - rotationRef.x) * PASSPORT_FRONT_BIAS;
      spinVelocityRef.y += (readableY - rotationRef.y) * PASSPORT_FRONT_BIAS;
      spinVelocityRef.x *= PASSPORT_SPIN_DAMPING;
      spinVelocityRef.y *= PASSPORT_SPIN_DAMPING;

      if (
        Math.abs(spinVelocityRef.x) < PASSPORT_MIN_SPIN_VELOCITY &&
        Math.abs(spinVelocityRef.y) < PASSPORT_MIN_SPIN_VELOCITY
      ) {
        spinVelocityRef.x = 0;
        spinVelocityRef.y = 0;
        gestureStartRef.x = rotationRef.x;
        gestureStartRef.y = rotationRef.y;
        momentumFrameRef.current = null;
        return;
      }

      rotationRef.x += spinVelocityRef.x;
      rotationRef.y += spinVelocityRef.y;
      rotationX.setValue(rotationRef.x);
      rotationY.setValue(rotationRef.y);
      momentumFrameRef.current = requestAnimationFrame(step);
    };

    momentumFrameRef.current = requestAnimationFrame(step);
  }, [
    gestureStartRef,
    momentumFrameRef,
    rotationRef,
    rotationX,
    rotationY,
    spinVelocityRef,
    stopMomentum,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          stopMomentum();
          rotationX.stopAnimation();
          rotationY.stopAnimation();
          gestureStartRef.x = rotationRef.x;
          gestureStartRef.y = rotationRef.y;
          spinVelocityRef.x = 0;
          spinVelocityRef.y = 0;
          previewScale.stopAnimation();
          Animated.spring(previewScale, {
            toValue: 1.035,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: (_event, gestureState) => {
          const targetY = gestureStartRef.y + gestureState.dx * PASSPORT_DRAG_RESISTANCE;
          const targetX = gestureStartRef.x - gestureState.dy * PASSPORT_DRAG_RESISTANCE;
          const deltaX = clamp(
            targetX - rotationRef.x,
            -PASSPORT_MAX_FRAME_DELTA,
            PASSPORT_MAX_FRAME_DELTA,
          );
          const deltaY = clamp(
            targetY - rotationRef.y,
            -PASSPORT_MAX_FRAME_DELTA,
            PASSPORT_MAX_FRAME_DELTA,
          );
          const nextX = rotationRef.x + deltaX;
          const nextY = rotationRef.y + deltaY;

          rotationRef.x = nextX;
          rotationRef.y = nextY;
          spinVelocityRef.x = clamp(
            spinVelocityRef.x * 0.82 + deltaX * 0.72,
            -PASSPORT_MAX_SPIN_VELOCITY,
            PASSPORT_MAX_SPIN_VELOCITY,
          );
          spinVelocityRef.y = clamp(
            spinVelocityRef.y * 0.82 + deltaY * 0.72,
            -PASSPORT_MAX_SPIN_VELOCITY,
            PASSPORT_MAX_SPIN_VELOCITY,
          );
          rotationX.setValue(nextX);
          rotationY.setValue(nextY);
        },
        onPanResponderRelease: () => {
          gestureStartRef.x = rotationRef.x;
          gestureStartRef.y = rotationRef.y;
          startMomentum();
          Animated.spring(previewScale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          gestureStartRef.x = rotationRef.x;
          gestureStartRef.y = rotationRef.y;
          startMomentum();
          Animated.spring(previewScale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        },
      }),
    [
      gestureStartRef,
      previewScale,
      rotationRef,
      rotationX,
      rotationY,
      spinVelocityRef,
      startMomentum,
      stopMomentum,
    ],
  );

  const rotateY = rotationY.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });
  const rotateX = rotationX.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });

  const closePreview = useCallback(() => {
    stopMomentum();
    previewScale.setValue(1);
    setIsPreviewVisible(false);
  }, [previewScale, stopMomentum]);

  const openPreview = useCallback(() => {
    stopMomentum();
    rotationRef.x = 0;
    rotationRef.y = 0;
    gestureStartRef.x = 0;
    gestureStartRef.y = 0;
    spinVelocityRef.x = 0;
    spinVelocityRef.y = 0;
    rotationX.setValue(0);
    rotationY.setValue(0);
    previewScale.setValue(1);
    setIsPreviewVisible(true);
  }, [
    gestureStartRef,
    previewScale,
    rotationRef,
    rotationX,
    rotationY,
    spinVelocityRef,
    stopMomentum,
  ]);

  useEffect(
    () => () => {
      stopMomentum();
    },
    [stopMomentum],
  );

  return {
    closePreview,
    isPreviewVisible,
    openPreview,
    panHandlers: panResponder.panHandlers,
    rotateX,
    rotateY,
    scale: previewScale,
  };
}
