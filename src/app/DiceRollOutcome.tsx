import React from 'react';
import { useSpring, animated } from 'react-spring';
import './DiceRollOutcome.css';

type EmojiProps = {
  outcome: string;
  emoji: string[];
  count: number;
};

const DiceRollOutcome = ({ outcome, emoji, count }: EmojiProps) => {
  // Generate animations for the number of emojis specified by 'count'
  const animations = Array.from({ length: count }, () => {
    const randomX = Math.random() * 100; // Random horizontal position between 0% and 100%

    return useSpring({
      from: { transform: `translateY(100vh) translateX(${randomX}vw)`, opacity: 1 },
      to: { transform: `translateY(-100vh) translateX(${randomX}vw)`, opacity: 0 },
      reset: true,
      config: { duration: 2000 },
    });
  });

  return (
    <>
      {outcome &&
        animations.map((animation, index) => (
          <animated.div
            key={index}
            style={{
              ...animation,
              position: 'fixed',
              bottom: 0,
              fontSize: '20rem',
              zIndex: 1000,
            }}
            className="emoji"
          >
            {emoji[index % emoji.length]}
          </animated.div>
        ))}
    </>
  );
};

export default DiceRollOutcome;
