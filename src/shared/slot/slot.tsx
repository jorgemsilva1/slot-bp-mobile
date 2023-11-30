import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'preact/hooks';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { FaVolumeUp, FaVolumeOff } from 'react-icons/fa';
import styled from 'styled-components';
import { SlotConfigType, SlotReward } from '../../app';
import {
    arrayOfProbabilities,
    probabilityCalc,
    shouldBeTrue,
} from '../../helpers/functions';
import { SoundManager } from '../../components/soundManager/soundManager';
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi';

// BTNS
import PlayBtn from '../../assets/svg/play-btn.svg';
import UserBacanaBtn from '../../assets/svg/btn-user-bp.svg';
import NonUserBacanaBtn from '../../assets/svg/btn-user-non-bp.svg';
import RollBtn from '../../assets/svg/roll-btn.svg';
import { useConfigContext } from '../../config/configContext';

type SlotProps = {
    onWin: (wonindex: number) => any;
    onLose: () => any;
    fetchInitialData: any;
    awards: SlotReward[];
    config: SlotConfigType;
};

export type VariablesType = {
    icon_width: number;
    icon_height: number;
    icon_num: number;
    time_per_icon: number;
    indexes: [number, number, number];
};
export const Slot = ({
    config,
    onWin,
    awards,
    onLose,
    fetchInitialData,
}: SlotProps) => {
    const { config: _contextConfig, dispatch } = useConfigContext();
    const contextConfig = useRef({}).current;
    contextConfig.value = _contextConfig;
    const fsHandle = useFullScreenHandle();
    const myArr = useRef([]);
    const disabled = useRef(false);
    const [gameOver, setGameOver] = useState(false);
    const [clickedPlay, setClickedPlay] = useState(true);
    const [numberOfPlays, setNumberOfPlays] = useState(1);
    const reelsRef = useRef([]);

    const prizes = useRef([]);
    const probArr = useRef([]);
    // SOUNDS REF
    const [hasSound, setHasSound] = useState(false);
    const ambienceSoundRef = useRef(null);
    const clickSoundRef = useRef();
    const rollSoundRef = useRef();
    const winSoundRef = useRef();
    const lostSoundRef = useRef();

    const activateAmbienceSound = () => {
        if (ambienceSoundRef.current) {
            if (hasSound) {
                ambienceSoundRef.current.toggleSound();
                setHasSound((prevValue) => !prevValue);
            } else {
                setHasSound(true);

                ambienceSoundRef.current.playSound();
            }
        }
    };

    const handleReset = useCallback(() => {
        reelsRef.current
            .filter((el) => Boolean(el))
            .map((reel: HTMLElement) => {
                reel.style.transition = `none`;
                reel.style.backgroundPositionY = `0px`;
            });
    }, []);

    const handleRestart = useCallback(async () => {
        clickSoundRef.current.playSound();
        ambienceSoundRef.current.setVolume(0.2);
        await fetchInitialData();
        myArr.current = [];
        disabled.current = false;
        prizes.current = [];
        reelsRef.current = [];
        setGameOver(false);
        setNumberOfPlays(1);
    }, [fetchInitialData]);

    const endGame = useCallback(() => {
        disabled.current = false;
        prizes.current = [];
        ambienceSoundRef.current.setVolume(0.2);
        setGameOver(true);

        setTimeout(() => {
            handleRestart();
        }, 15000);
    }, [handleRestart]);

    /**
     * This functions controls the roll of the reels
     */
    const roll = useCallback(
        (reel: HTMLElement, offset = 0, chosen: number | null) => {
            // number of fruits animating
            let delta =
                (offset + config.icon_num * config.additional_rotations) *
                    config.icon_num +
                Math.round(Math.random() * config.icon_num);
            if (typeof chosen === 'number')
                delta =
                    (offset + config.icon_num * config.additional_rotations) *
                        config.icon_num +
                    chosen;

            const style = window.getComputedStyle(reel),
                backgroundPositionY = parseFloat(style['backgroundPositionY']),
                targetBackgroundPosition =
                    backgroundPositionY + delta * config.icon_height;

            return new Promise((resolve) => {
                const animationTime =
                    config.icon_num - 1 + delta * config.time_per_icon;
                reel.style.transition = `background-position-y ${animationTime}ms`;
                reel.style.backgroundPositionY = `${targetBackgroundPosition}px`;

                setTimeout(() => {
                    resolve(delta % config.icon_num); // returns the index of the item we got
                }, animationTime);
            });
        },
        [config]
    );

    const handleRoll = useCallback(async () => {
        disabled.current = true;
        const probability = probArr.current[myArr.current.length];

        rollSoundRef.current.playSound();

        const willAlwaysWin =
            contextConfig.value.win_percentage === 'auto'
                ? false
                : shouldBeTrue(probability);

        // let winningSymbolIndex = willAlwaysWin
        //     ? Math.floor(Math.random() * config.icon_num)
        //     : null;
        const item = probabilityCalc(awards, prizes.current);

        const winningSymbolIndex = willAlwaysWin ? item.index : null;

        const deltas = await Promise.all(
            reelsRef.current
                .filter((el) => Boolean(el))
                .map((reel, index) => {
                    return roll(reel, index, winningSymbolIndex);
                })
        );

        myArr.current = [
            ...myArr.current,
            winningSymbolIndex ? item.name : null,
        ];
        // console.table(myArr.current);

        // Check winning status and define rules
        if (deltas.every((value, _, arr) => arr[0] === value)) {
            onWin(deltas[0], contextConfig.value.user_type === 'bacana');
            winSoundRef.current.playSound();

            prizes.current = [...prizes.current, item.index];

            // if (prizes.current.length === 1) {
            //     // If first prize, add to the array and change probability to a quarter
            //     dispatch(
            //         setWinPercentage(
            //             contextConfig.value.user_type === 'bacana' ? 20 : 15
            //         )
            //     );
            // } else
            if (prizes.current.length === 2) {
                // If is second prize, finish the game
                endGame();
            }
        } else {
            onLose(contextConfig.value.user_type === 'bacana');
            lostSoundRef.current.playSound();
        }

        disabled.current = false;
        setNumberOfPlays((prevValue) =>
            typeof prevValue === 'number' ? prevValue - 1 : null
        );
    }, [
        contextConfig.value.win_percentage,
        contextConfig.value.user_type,
        awards,
        roll,
        onWin,
        endGame,
        onLose,
    ]);

    const handleClickUserType = useCallback(
        async (bool: boolean) => {
            clickSoundRef.current.playSound();
            ambienceSoundRef.current.setVolume(0.02);
            await fetchInitialData(bool);
            disabled.current = false;
        },
        [fetchInitialData]
    );

    const handlePlay = useCallback(() => {
        setClickedPlay(true);
        ambienceSoundRef.current.setVolume(0.04);
        clickSoundRef.current.playSound();
    }, []);

    useEffect(() => {
        window.document.addEventListener('keydown', async (event) => {
            if (event.key === '5' && awards?.length && !disabled.current) {
                handleReset();
                disabled.current = true;
                await handleRoll();
            }
        });
    }, [awards?.length, gameOver, handleReset, handleRoll]);

    const handleClickRoll = useCallback(async () => {
        if (awards?.length && !disabled.current) {
            handleReset();
            disabled.current = true;
            await handleRoll();
        }
    }, [awards?.length, handleReset, handleRoll]);

    useEffect(() => {
        if (contextConfig.value.num_of_plays) {
            setNumberOfPlays(contextConfig.value.num_of_plays);
            probArr.current = arrayOfProbabilities(
                contextConfig.value.num_of_plays
            );
        }
    }, [contextConfig.value.num_of_plays]);

    useEffect(() => {
        if (numberOfPlays === 0) {
            endGame();
        }
    }, [endGame, numberOfPlays]);

    const bg = useMemo(
        () => (!gameOver ? '/img/bg-one.png' : '/img/bg_go.png'),
        [gameOver]
    );

    return (
        <FullScreen handle={fsHandle}>
            {!gameOver ? (
                <Container bg="/img/bg-one.png">
                    {/* {!clickedPlay ? (
                        <button
                            style={{ position: 'absolute', bottom: 50 }}
                            onClick={() => {
                                setClickedPlay(true);
                                ambienceSoundRef.current.setVolume(0.04);
                                clickSoundRef.current.playSound();
                            }}
                        >
                            PLAY
                        </button>
                    ) : clickedPlay && typeof numberOfPlays !== 'number' ? (
                        <div
                            style={{
                                display: 'flex',
                                columnGap: 8,
                                position: 'absolute',
                                bottom: 50,
                            }}
                        >
                            <button onClick={() => handleClickUserType(true)}>
                                User Bacana
                            </button>
                            <button onClick={() => handleClickUserType(false)}>
                                Non-User Bacana
                            </button>
                        </div>
                    ) : (
                        // <p>Jogada: {numberOfPlays}</p>
                        <></>
                    )} */}
                    <SlotMachine _variables={config}>
                        {Array.from(Array(config.number_of_reels).keys()).map(
                            (index) => (
                                <span
                                    key={index}
                                    ref={(element) =>
                                        ((reelsRef.current as any)[index] =
                                            element)
                                    }
                                    className="reel"
                                ></span>
                            )
                        )}
                    </SlotMachine>
                    {prizes?.length > 0 ? (
                        // <p>Last Prize: {prizes[prizes.length - 1]}</p>
                        <></>
                    ) : (
                        <></>
                    )}
                </Container>
            ) : (
                <Container id="gameover-container" bg="/img/bg_go.png">
                    <ul id="prizes">
                        {myArr.current.map((item, index) => (
                            <li key={index} className={item ? 'prize' : ''}>
                                {index + 1}. {item ? item : 'Sem prémio'}
                            </li>
                        ))}
                    </ul>
                </Container>
            )}
            <div
                style={{
                    position: 'absolute',
                    top: 55,
                    right: 60,
                    display: 'flex',
                    columnGap: 4,
                }}
            >
                <AudioBtn onClick={activateAmbienceSound}>
                    {hasSound ? <FaVolumeUp /> : <FaVolumeOff />}
                </AudioBtn>
                <AudioBtn width="auto" onClick={handleRestart}>
                    <p>Restart</p>
                </AudioBtn>
                <AudioBtn
                    onClick={fsHandle.active ? fsHandle.exit : fsHandle.enter}
                >
                    {!fsHandle.active ? (
                        <BiFullscreen className="fs" />
                    ) : (
                        <BiExitFullscreen className="fs" />
                    )}
                </AudioBtn>

                {/* <AudioBtn width="auto" onClick={handleClickRoll}>
                    Roll
                </AudioBtn> */}
            </div>
            <SoundManager
                ref={ambienceSoundRef}
                src="audio/ambience.wav"
                loop
                volume={0.2}
                playing
            />
            <SoundManager
                ref={clickSoundRef}
                src="audio/click.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={rollSoundRef}
                src="audio/rollete.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={winSoundRef}
                src="audio/win.wav"
                volume={0.1}
                playing
            />
            <SoundManager
                ref={lostSoundRef}
                src="audio/lost.wav"
                volume={0.1}
                playing
            />
            {gameOver ? (
                <></>
            ) : (
                <BtnContainer>
                    {!clickedPlay ? (
                        <img
                            onClick={() => {
                                setClickedPlay(true);
                                ambienceSoundRef.current.setVolume(0.04);
                                clickSoundRef.current.playSound();
                            }}
                            src={PlayBtn}
                            alt="btn"
                        />
                    ) : clickedPlay && typeof numberOfPlays !== 'number' ? (
                        <>
                            <img
                                onClick={() => handleClickUserType(true)}
                                src={UserBacanaBtn}
                                alt="btn"
                            />

                            <img
                                onClick={() => handleClickUserType(false)}
                                src={NonUserBacanaBtn}
                                alt="btn"
                            />
                        </>
                    ) : (
                        <img
                            onClick={handleClickRoll}
                            src={RollBtn}
                            alt="btn"
                        />
                    )}
                </BtnContainer>
            )}
        </FullScreen>
    );
};

const Container = styled.main`
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    row-gap: 12px;

    background: ${({ bg }) => `url(${bg})`};

    #prizes {
        z-index: 9;
    }

    &#gameover-container {
        justify-content: flex-start;
        padding-top: 370px;

        * {
            color: #000;
            text-transform: uppercase;
        }

        ul {
            max-height: 200px;
            overflow: auto;
            position: relative;
            top: -48px;
            padding-left: 0;

            list-style: none;

            li {
                text-align: center;
                font-family: 'Futura';
                font-weight: bold;
                font-size: 16px;

                &.prize {
                    font-size: 36px !important;
                    color: #e45525;
                }
            }
        }
    }
`;
/*background-color: #242424;*/

const SlotMachine = styled.section<{ _variables: SlotConfigType }>`
    display: flex;
    justify-content: space-between;
    width: ${({ _variables }) =>
        `${_variables.icon_width * (_variables.number_of_reels * 1.04)}px`};
    height: ${({ _variables }) => `${_variables.icon_height * 3}px`};
    padding: ${({ _variables }) => `${_variables.icon_height * 0.05}px`};
    margin-top: 20vh;

    .reel {
        position: relative;
        display: inline-block;
        width: ${({ _variables }) => `${_variables.icon_width}px`};
        height: ${({ _variables }) => `${_variables.icon_height * 3}px`};
        border-radius: 2px;
        background-image: ${({ _variables }) => `url(${_variables.reelImg})`};
        background-repeat: repeat-y;
        background-position-y: 0;

        /** TEMP **/
        background-size: cover;
    }
`;

// const AudioBtn = styled.button`
//     width: ${({ width }) => width || '50px'};
//     height: 50px;
//     display: flex;
//     align-items: center;
//     justify-content: center;

//     svg {
//         transform: scale(2);
//     }
// `;

const AudioBtn = styled.button`
    position: relative;
    width: ${({ width }) => width || '50px'};
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    font-weight: bold;
    background: white;
    color: black;
    border-radius: 0;
    border: 4px solid black;
    font-weight: bold;

    .fs {
        transform: scale(8);
    }

    svg {
        transform: scale(4);
    }
`;

const BtnContainer = styled.div`
    position: absolute;
    bottom: 40px;
    right: 0;
    width: 217px;
    padding-right: 12px;
    height: 401px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    row-gap: 12px;
    pointer-events: none;

    img {
        pointer-events: all;
        width: 60%;
    }
`;

const Background = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ bg }) => `url('/img/bg_${bg}.png')`};
    background-position: 0 3vh;
`;
