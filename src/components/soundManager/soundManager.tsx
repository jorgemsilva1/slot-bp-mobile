import { Howl } from 'howler';
import React from 'preact/compat';
import { useEffect, useImperativeHandle, useRef, useState } from 'preact/hooks';

type SoundManagerProps = {
    src: string;
    volume: number;
    playing: boolean;
    loop?: boolean;
};

export const SoundManager = React.forwardRef(
    ({ src, volume, playing, loop = false }: SoundManagerProps, ref) => {
        const soundRef = useRef();
        const [isPlaying, setIsPlaying] = useState(false);

        const playSound = () => {
            soundRef.current.play();
            setIsPlaying(true);
        };

        const pauseSound = () => {
            soundRef.current.pause();
            setIsPlaying(false);
        };

        const toggleSound = () => {
            if (isPlaying) {
                pauseSound();
            } else {
                playSound();
            }
        };

        const setVolume = (newVolume) => {
            soundRef.current.volume(newVolume);
        };

        useEffect(() => {
            const initializeSound = () => {
                soundRef.current = new Howl({
                    src,
                    volume,
                    loop,
                    onend: () => setIsPlaying(false),
                });

                soundRef.current.once('load', () => {
                    // Now that the sound is loaded, you can start playing it.
                    // Note: This should be within a user gesture callback.
                });
            };

            initializeSound();

            return () => {
                soundRef.current.unload();
            };
        }, [src, volume, loop]);

        useEffect(() => {
            setIsPlaying(playing);
        }, [playing]);

        useImperativeHandle(ref, () => ({
            playSound,
            pauseSound,
            setVolume,
            toggleSound,
        }));

        return <></>;
    }
);
SoundManager.displayName = 'SoundManager';
