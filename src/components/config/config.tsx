import styled from 'styled-components';
import { SlotConfigType } from '../../app';
import { FormInput } from './partials/formInput/formInput';
import { StateUpdater, useCallback } from 'preact/hooks';
import { Divider } from './partials/divider/divider';
import { configTheme } from '../../helpers/functions';

type ConfigProps = {
    config: SlotConfigType;
    setConfig: StateUpdater<SlotConfigType>;
};

export const Config = ({ config, setConfig }: ConfigProps) => {
    const handleChangeProps = useCallback((prop: string, value: any) => {
        setConfig((prev) => ({
            ...prev,
            [prop]: value,
        }));
    }, []);

    return (
        <Container>
            <h1>Slot Machine - Configuration</h1>
            {/* Animation Speed */}
            <Divider label="Settings" />
            <form>
                <FormInput
                    label="Number of reels"
                    input={
                        <input
                            type="number"
                            value={config.number_of_reels}
                            onChange={(e) => {
                                let value = parseInt(e.target.value);
                                value = value > 5 ? 5 : value <= 2 ? 2 : value;
                                handleChangeProps('number_of_reels', value);
                            }}
                        />
                    }
                />
                <FormInput
                    label="Animation speed"
                    input={
                        <input
                            type="number"
                            value={config.time_per_icon}
                            onChange={(e) => {
                                handleChangeProps(
                                    'time_per_icon',
                                    parseInt(e.target?.value) || 0
                                );
                            }}
                        />
                    }
                />
                <FormInput
                    label="Winning Chance (%)"
                    input={
                        <input
                            type="number"
                            value={
                                config.win_percentage === 'auto'
                                    ? 'auto'
                                    : config.win_percentage
                            }
                            onChange={(e) => {
                                handleChangeProps(
                                    'win_percentage',
                                    parseInt(e.target?.value) || 'auto'
                                );
                            }}
                            max={100}
                        />
                    }
                />
                <Divider label="Theme" />
                <FormInput
                    label="Icons"
                    input={
                        <select
                            defaultValue={config.theme}
                            onChange={(e) => {
                                configTheme(e.target?.value, setConfig);
                            }}
                        >
                            <option value="soccer">Soccer</option>
                            <option value="classic">Classic</option>
                        </select>
                    }
                />
            </form>
        </Container>
    );
};

const Container = styled.aside`
    position: absolute;
    top: 24px;
    right: 24px;
    box-sizing: border-box;
    padding: 0 12px 12px;
    border: 1px solid white;
    border-radius: 4px;

    h1 {
        font-size: 14px;
        margin: 12px 0 4px;
    }

    form {
        [data-el='form-input']:not(:last-child) {
            margin-bottom: 8px;
        }
    }
`;
